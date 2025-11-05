const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - uploads klasörünü serve et
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Database initialization
const dbPath = path.join(__dirname, 'database.db');
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
    // Tickets table
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

// Multer configuration for file uploads
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
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'));
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Get all tickets
app.get('/api/tickets', (req, res) => {
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
    
    // Add file URLs
    const tickets = rows.map(ticket => ({
      ...ticket,
      receiptUrl: `/uploads/${ticket.receiptFileName}`
    }));
    
    res.json(tickets);
  });
});

// Get ticket by ID
app.get('/api/tickets/:id', (req, res) => {
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
      receiptUrl: `/uploads/${row.receiptFileName}`
    });
  });
});

// Get tickets by userId
app.get('/api/tickets/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all('SELECT * FROM tickets WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching user tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const tickets = rows.map(ticket => ({
      ...ticket,
      receiptUrl: `/uploads/${ticket.receiptFileName}`
    }));
    
    res.json(tickets);
  });
});

// Create new ticket
app.post('/api/tickets', upload.single('receipt'), (req, res) => {
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
    
    // Validation
    if (!userId || !recipientName || !recipientIban || !investmentMethod || !investmentAmount || !investmentDateTime) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
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
          // Delete uploaded file if database insert fails
          fs.unlinkSync(req.file.path);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Fetch the created ticket
        db.get('SELECT * FROM tickets WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.status(201).json({
            ...row,
            receiptUrl: `/uploads/${row.receiptFileName}`
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

// Update ticket status and note
app.patch('/api/tickets/:id', (req, res) => {
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
    
    // Fetch updated ticket
    db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        ...row,
        receiptUrl: `/uploads/${row.receiptFileName}`
      });
    });
  });
});

// Delete ticket
app.delete('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  
  // First get the ticket to find the file
  db.get('SELECT receiptFileName FROM tickets WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching ticket:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Delete the file
    const filePath = path.join(uploadsDir, row.receiptFileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    db.run('DELETE FROM tickets WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting ticket:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ message: 'Ticket deleted successfully' });
    });
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
  }
  res.status(500).json({ error: error.message || 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

