// Vercel Serverless Functions için API - Supabase ile (ES Modules)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Vercel serverless functions için body parser'ı sadece JSON/URL-encoded için kullan
// Multipart/form-data için multer kullanılacak, bu yüzden body parser'ı devre dışı bırak
app.use((req, res, next) => {
  // Multipart/form-data ise body parser'ı atla
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  // Diğer istekler için body parser kullan
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
  // Multipart/form-data ise body parser'ı atla
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    return next();
  }
  // Diğer istekler için body parser kullan
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// Supabase initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase initialized successfully');
  } catch (error) {
    console.error('❌ Supabase initialization error:', error);
  }
} else {
  console.warn('⚠️ Supabase credentials not found. URL:', !!supabaseUrl, 'Key:', !!supabaseServiceKey);
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

  // Bucket adı - önce küçük harf, sonra büyük harf dene
  const bucketNames = ['receipts', 'RECEIPTS', 'Receipts'];
  
  try {
    // Service role key ile listBuckets() bazen boş döner, bu yüzden direkt upload deniyoruz
    let uploadError = null;
    let lastError = null;
    
    // Her bucket adını dene (küçük harf, büyük harf, title case)
    for (const bucketName of bucketNames) {
      try {
        console.log(`📤 Attempting upload to bucket: "${bucketName}"`);
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filename, file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            upsert: false
          });

        if (!error) {
          console.log(`✅ File uploaded successfully to "${bucketName}": ${data.path}`);
          
          // Public URL al
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filename);

          return urlData.publicUrl;
        }
        
        lastError = error;
        console.warn(`⚠️ Upload to "${bucketName}" failed:`, error.message);
        
        // Eğer "not found" hatası değilse, diğer bucket'ları deneme
        if (!error.message?.includes('not found') && !error.message?.includes('does not exist') && !error.message?.includes('Bucket not found')) {
          throw error;
        }
      } catch (err) {
        lastError = err;
        uploadError = err;
        // "not found" hatası değilse, dur
        if (!err.message?.includes('not found') && !err.message?.includes('does not exist') && !err.message?.includes('Bucket not found')) {
          throw err;
        }
      }
    }
    
    // Tüm bucket adları denendi ama başarısız oldu
      throw new Error(`Storage bucket not found. Tried: ${bucketNames.join(', ')}. Error: ${lastError?.message || 'Unknown error'}. Please create a bucket named "receipts" (case-insensitive) in Supabase Dashboard → Storage.`);
  } catch (error) {
    console.error('Upload function error:', error);
    throw error;
  }
}

// Helper: Delete file from Supabase Storage
async function deleteFromSupabase(filename) {
  if (!supabase) {
    return;
  }

  const bucketNames = ['receipts', 'RECEIPTS', 'Receipts'];
  
  // Path'den filename çıkar (receipts/xxx.jpg -> xxx.jpg)
  const filePath = filename.includes('/') ? filename.split('/').pop() : filename;

  // Her bucket adını dene
  for (const bucketName of bucketNames) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      
      if (!error) {
        console.log(`✅ File deleted from "${bucketName}"`);
        return;
      }
    } catch (err) {
      // Devam et, diğer bucket'ı dene
    }
  }
}

// Routes
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    message: 'Server is running',
    supabase: !!supabase,
    timestamp: new Date().toISOString()
  };
  
  if (!supabase) {
    health.warning = 'Supabase not configured. Check environment variables.';
    health.env_check = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };
  }
  
  res.json(health);
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

app.post('/tickets', (req, res, next) => {
  console.log('📥 POST /tickets route handler called');
  console.log('Request body keys:', Object.keys(req.body || {}));
  console.log('Request files:', req.files);
  console.log('Content-Type:', req.headers['content-type']);
  next();
}, upload.single('receipt'), async (req, res) => {
  try {
    console.log('📥 POST /tickets request received (after multer)');
    console.log('File received:', req.file ? 'YES' : 'NO');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({ 
        error: 'Supabase not configured',
        hint: 'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
      });
    }

    if (!req.file) {
      console.error('❌ No file uploaded');
      console.error('Request body:', req.body);
      console.error('Request files:', req.files);
      return res.status(400).json({ error: 'Receipt file is required' });
    }
    
    console.log('📄 File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

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
      console.log('📤 Uploading file to Supabase Storage...');
      receiptUrl = await uploadToSupabase(req.file, filename);
      console.log('✅ File uploaded successfully:', receiptUrl);
    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError);
      console.error('Upload error details:', {
        message: uploadError.message,
        code: uploadError.code,
        error: uploadError,
        stack: uploadError.stack
      });
      
      // Daha detaylı hata mesajı
      let errorMessage = uploadError.message || 'File upload failed';
      let hint = 'Check if Storage bucket "receipts" exists and is public';
      
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist')) {
        errorMessage = `Storage bucket "receipts" not found. Please create it in Supabase Dashboard → Storage.`;
        hint = 'Create a bucket named "receipts" and make it public';
      }
      
      return res.status(500).json({ 
        error: 'File upload failed', 
        details: errorMessage,
        hint: hint,
        code: uploadError.code
      });
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

    console.log('💾 Saving ticket to database...');
    console.log('Ticket data:', JSON.stringify(ticketData, null, 2));
    
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) {
      // Upload başarılı ama DB hatası - dosyayı sil
      console.error('❌ Database error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      try {
        await deleteFromSupabase(filename);
        console.log('🗑️ Deleted uploaded file due to DB error');
      } catch (delError) {
        console.error('Error deleting file after DB error:', delError);
      }
      
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code,
        hint: error.hint || 'Check if table "tickets" exists and RLS policies are correct'
      });
    }

    console.log('✅ Ticket created successfully:', data.id);

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

// Error handling middleware - Multer hatalarını yakala
app.use((error, req, res, next) => {
  console.error('❌ Express error middleware triggered:', error);
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  
  if (error instanceof multer.MulterError) {
    console.error('Multer error code:', error.code);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
    return res.status(400).json({ error: `Multer error: ${error.message}`, code: error.code });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: error.message || 'Server error' });
});

// Vercel serverless function handler
const handler = async (req, res) => {
  try {
    // İlk log - istek geldi
    console.log(`🔵 [${req.method}] ${req.url} - Request received`);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Path'i düzenle (/api/health -> /health)
    const originalUrl = req.url;
    const pathToUse = originalUrl.replace(/^\/api/, '') || '/';
    req.url = pathToUse;
    
    console.log(`🔄 Path transformed: ${originalUrl} -> ${pathToUse}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // OPTIONS request
    if (req.method === 'OPTIONS') {
      console.log('✅ OPTIONS request handled');
      return res.status(200).end();
    }
    
    // Supabase kontrolü
    if (!supabase && pathToUse !== '/health') {
      console.error('❌ Supabase not initialized. URL:', supabaseUrl ? 'SET' : 'MISSING', 'Key:', supabaseServiceKey ? 'SET' : 'MISSING');
    }
    
    // Express app'e yönlendir
    console.log(`➡️ Forwarding to Express app: ${req.method} ${pathToUse}`);
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default handler;
