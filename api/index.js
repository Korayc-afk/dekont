// Vercel Serverless Functions için API - Supabase ile
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const FormData = require('form-data');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('Supabase initialized');
} else {
  console.warn('Supabase credentials not found. API will not work properly.');
}

// Multer configuration - memory storage (Supabase'e yüklenecek)
const upload = multer({
  storage: multer.memoryStorage(),
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

// Helper: Upload file to Supabase Storage
async function uploadToSupabase(file, filename) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const bucketName = 'receipts';
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filename, file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Storage error: ${error.message}`);
  }

  // Public URL al
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

// Helper: Delete file from Supabase Storage
async function deleteFromSupabase(filename) {
  if (!supabase) {
    return;
  }

  const bucketName = 'receipts';
  
  // Path'den filename çıkar (receipts/xxx.jpg -> xxx.jpg)
  const filePath = filename.includes('/') ? filename.split('/').pop() : filename;

  await supabase.storage
    .from(bucketName)
    .remove([filePath]);
}

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    supabase: !!supabase
  });
});

app.get('/tickets', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { status, search, userId } = req.query;
    
    let query = supabase.from('tickets').select('*');

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('userId', userId);
    }

    if (search) {
      query = query.or(`recipientName.ilike.%${search}%,recipientIban.ilike.%${search}%,investmentMethod.ilike.%${search}%`);
    }

    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in /tickets:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/tickets/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      console.error('Error fetching ticket:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in /tickets/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/tickets/user/:userId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { userId } = req.params;

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching user tickets:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in /tickets/user/:userId:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/tickets', upload.single('receipt'), async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

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
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Dosyayı Supabase Storage'a yükle
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = req.file.originalname.split('.').pop();
    const filename = `receipt-${uniqueSuffix}.${ext}`;

    let receiptUrl = '';
    try {
      receiptUrl = await uploadToSupabase(req.file, filename);
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'File upload failed', details: uploadError.message });
    }

    // Database'e kaydet
    const ticketData = {
      userId: userId.trim(),
      recipientName,
      recipientIban,
      investmentMethod,
      investmentAmount: parseFloat(investmentAmount),
      investmentDateTime,
      receiptFileName: filename,
      receiptOriginalName: req.file.originalname,
      receiptMimeType: req.file.mimetype,
      receiptUrl: receiptUrl,
      status: 'pending',
      adminNote: ''
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) {
      // Upload başarılı ama DB hatası - dosyayı sil
      await deleteFromSupabase(filename);
      console.error('Error creating ticket:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error processing ticket:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.patch('/tickets/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;
    const { status, adminNote } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (adminNote !== undefined) updates.adminNote = adminNote;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error in PATCH /tickets/:id:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/tickets/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { id } = req.params;

    // Önce ticket'ı bul
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('receiptFileName')
      .eq('id', id)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Dosyayı sil
    if (ticket.receiptFileName) {
      await deleteFromSupabase(ticket.receiptFileName);
    }

    // Database'den sil
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ticket:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json({ message: 'Ticket deleted successfully' });
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
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
