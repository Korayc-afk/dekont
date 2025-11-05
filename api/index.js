// Vercel Serverless Functions için API
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Vercel'de uploads klasörü için /tmp kullan
const uploadsDir = (process.env.VERCEL || process.env.NOW) ? '/tmp/uploads' : path.join(__dirname, '../server/uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error('Error creating uploads directory:', err);
}

// Database path (Vercel'de /tmp kullan)
const dbPath = (process.env.VERCEL || process.env.NOW)
  ? '/tmp/database.db' 
  : path.join(__dirname, '../server/database.db');

// Database connection - lazy initialization
let db = null;

const getDatabase = () => {
  if (!db) {
    try {
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Database connection error:', err.message);
          throw err;
        } else {
          console.log('Connected to SQLite database:', dbPath);
          initializeDatabase();
        }
      });
    } catch (error) {
      console.error('Failed to create database connection:', error);
      throw error;
    }
  }
  return db;
};

// Initialize database tables
function initializeDatabase() {
  const database = getDatabase();
  database.serialize(() => {
    database.run(`CREATE TABLE IF NOT EXISTS tickets (
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
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Error serving file' });
  }
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', vercel: !!process.env.VERCEL });
});

app.get('/tickets', (req, res) => {
  try {
    const { status, search, userId } = req.query;
    const database = getDatabase();
    
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
    
    database.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching tickets:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      const tickets = rows.map(ticket => ({
        ...ticket,
        receiptUrl: `/api/uploads/${ticket.receiptFileName}`
      }));
      
      res.json(tickets);
    });
  } catch (error) {
    console.error('Error in /tickets:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/tickets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const database = getDatabase();
    
    database.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching ticket:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      res.json({
        ...row,
        receiptUrl: `/api/uploads/${row.receiptFileName}`
      });
    });
  } catch (error) {
    console.error('Error in /tickets/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/tickets/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const database = getDatabase();
    
    database.all('SELECT * FROM tickets WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching user tickets:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      const tickets = rows.map(ticket => ({
        ...ticket,
        receiptUrl: `/api/uploads/${ticket.receiptFileName}`
      }));
      
      res.json(tickets);
    });
  } catch (error) {
    console.error('Error in /tickets/user/:userId:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
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
    
    const database = getDatabase();
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
    
    database.run(
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
          return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        database.get('SELECT * FROM tickets WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
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
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.patch('/tickets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const database = getDatabase();
    
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
    
    database.run(query, params, function(err) {
      if (err) {
        console.error('Error updating ticket:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      database.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        res.json({
          ...row,
          receiptUrl: `/api/uploads/${row.receiptFileName}`
        });
      });
    });
  } catch (error) {
    console.error('Error in PATCH /tickets/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/tickets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const database = getDatabase();
    
    database.get('SELECT receiptFileName FROM tickets WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching ticket:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      const filePath = path.join(uploadsDir, row.receiptFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      database.run('DELETE FROM tickets WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting ticket:', err);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        res.json({ message: 'Ticket deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Error in DELETE /tickets/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
  }
  console.error('Unhandled error:', error);
  res.status(500).json({ error: error.message || 'Server error' });
});

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Path'i düzenle (/api/health -> /health)
    const originalUrl = req.url;
    const pathToUse = originalUrl.replace(/^\/api/, '') || '/';
    req.url = pathToUse;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message, stack: error.stack });
  }
};
