// Supabase Service - Database ve Storage işlemleri
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Using SQLite fallback.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const supabaseService = {
  // Tickets CRUD operations
  async getAllTickets(filters = {}) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    let query = supabase.from('tickets').select('*');

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.userId) {
      query = query.eq('userId', filters.userId);
    }

    if (filters.search) {
      query = query.or(`recipientName.ilike.%${filters.search}%,recipientIban.ilike.%${filters.search}%,investmentMethod.ilike.%${filters.search}%`);
    }

    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  },

  async getTicketById(id) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  },

  async getTicketsByUserId(userId) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  },

  async createTicket(ticketData) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  },

  async updateTicket(id, updates) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    updates.updatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  },

  async deleteTicket(id) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  },

  // Storage operations
  async uploadFile(file, filename) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const bucketName = 'receipts';
    const fileBuffer = Buffer.from(file);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      throw new Error(`Storage error: ${error.message}`);
    }

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return {
      path: data.path,
      url: urlData.publicUrl
    };
  },

  async deleteFile(filename) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const bucketName = 'receipts';

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filename]);

    if (error) {
      throw new Error(`Storage error: ${error.message}`);
    }

    return true;
  },

  async getFileUrl(filename) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const bucketName = 'receipts';

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return data.publicUrl;
  }
};

module.exports = supabaseService;

