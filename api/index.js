// Vercel Serverless Functions için API wrapper
// Backend server.js'i serverless function olarak çalıştırır

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel'de uploads klasörü için /tmp kullan
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../server/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database path (Vercel'de /tmp kullan)
const dbPath = process.env.VERCEL 
  ? '/tmp/database.db' 
  : path.join(__dirname, '../server/database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      recipientName TEXT NOT NULL,
      recipientIban TEXT NOT NULL,
      investmentMethod TEXT NOT NULL,
      investmentAmount REAL NOT NULL,
      investmentDateTime TEXT NOT NULL,
      receiptFileName TEXT NOT NULL,
      receiptOriginalName TEXT NOT NULL,
      receiptMimeType TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      adminNote TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating tickets table:', err.message);
      } else {
        console.log('Tickets table ready');
      }
    });
  });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'));
    }
  }
});

// Static files serving (uploads)
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.get('/tickets', (req, res) => {
  const { status, search, userId } = req.query;
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];
  
  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (userId) {
    query += ' AND userId = ?';
    params.push(userId);
  }
  
  if (search) {
    query += ' AND (recipientName LIKE ? OR recipientIban LIKE ? OR investmentMethod LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY createdAt DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const tickets = rows.map(ticket => ({
      ...ticket,
      receiptUrl: `/api/uploads/${ticket.receiptFileName}`
    }));
    
    res.json(tickets);
  });
});

app.get('/tickets/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching ticket:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({
      ...row,
      receiptUrl: `/api/uploads/${row.receiptFileName}`
    });
  });
});

app.get('/tickets/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all('SELECT * FROM tickets WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching user tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const tickets = rows.map(ticket => ({
      ...ticket,
      receiptUrl: `/api/uploads/${ticket.receiptFileName}`
    }));
    
    res.json(tickets);
  });
});

app.post('/tickets', upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Receipt file is required' });
    }
    
    const {
      userId,
      recipientName,
      recipientIban,
      investmentMethod,
      investmentAmount,
      investmentDateTime
    } = req.body;
    
    if (!userId || !recipientName || !recipientIban || !investmentMethod || !investmentAmount || !investmentDateTime) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const ticket = {
      userId: userId.trim(),
      recipientName,
      recipientIban,
      investmentMethod,
      investmentAmount: parseFloat(investmentAmount),
      investmentDateTime,
      receiptFileName: req.file.filename,
      receiptOriginalName: req.file.originalname,
      receiptMimeType: req.file.mimetype,
      status: 'pending',
      adminNote: ''
    };
    
    db.run(
      `INSERT INTO tickets (userId, recipientName, recipientIban, investmentMethod, investmentAmount, investmentDateTime, receiptFileName, receiptOriginalName, receiptMimeType, status, adminNote)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket.userId,
        ticket.recipientName,
        ticket.recipientIban,
        ticket.investmentMethod,
        ticket.investmentAmount,
        ticket.investmentDateTime,
        ticket.receiptFileName,
        ticket.receiptOriginalName,
        ticket.receiptMimeType,
        ticket.status,
        ticket.adminNote
      ],
      function(err) {
        if (err) {
          console.error('Error creating ticket:', err);
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(500).json({ error: 'Database error' });
        }
        
        db.get('SELECT * FROM tickets WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.status(201).json({
            ...row,
            receiptUrl: `/api/uploads/${row.receiptFileName}`
          });
        });
      }
    );
  } catch (error) {
    console.error('Error processing ticket:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  
  const updates = [];
  const params = [];
  
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  
  if (adminNote !== undefined) {
    updates.push('adminNote = ?');
    params.push(adminNote);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  updates.push('updatedAt = CURRENT_TIMESTAMP');
  params.push(id);
  
  const query = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Error updating ticket:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        ...row,
        receiptUrl: `/api/uploads/${row.receiptFileName}`
      });
    });
  });
});

app.delete('/tickets/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT receiptFileName FROM tickets WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching ticket:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const filePath = path.join(uploadsDir, row.receiptFileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    db.run('DELETE FROM tickets WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting ticket:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ message: 'Ticket deleted successfully' });
    });
  });
});

// Vercel serverless function handler
// Tüm /api/* istekleri buraya yönlendirilir
module.exports = (req, res) => {
  // Path'i düzenle (/api/health -> /health)
  const originalUrl = req.url;
  const path = originalUrl.replace(/^\/api/, '') || '/';
  req.url = path;
  
  return app(req, res);
};

