import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnhcnqtimkyrxueuylnm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuaGNucXRpbWt5cnh1ZXV5bG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDYyNDcsImV4cCI6MjA4NTI4MjI0N30.2MtG87qR50arXpDXIwWxid_XHWNAa8ydlJpHArDSuhs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current shop
export const getCurrentShop = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('owner_email', user.email)
    .single();
  
  return shop;
};

// Upload image to storage
export const uploadImage = async (file, bucket = 'inventory-images') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
};

// Upload base64 image to storage
export const uploadBase64Image = async (base64Data, bucket = 'customer-uploads') => {
  const base64Content = base64Data.split(',')[1];
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });
  
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: 'image/jpeg'
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
};

// ========== INVENTORY API ==========
export const inventoryAPI = {
  getAll: async (shopId, kioskMode = false) => {
    let query = supabase
      .from('inventory')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    
    // In kiosk mode, only show items with stock > 0
    if (kioskMode) {
      query = query.gt('stock_count', 0);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  
  create: async (item) => {
    const { data, error } = await supabase
      .from('inventory')
      .insert([item])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ========== LEADS API ==========
export const leadsAPI = {
  create: async (lead) => {
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getAll: async (shopId) => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};

// ========== VISUALIZATIONS API ==========
export const visualizationsAPI = {
  create: async (visualization) => {
    const { data, error } = await supabase
      .from('visualizations')
      .insert([visualization])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getAll: async (shopId) => {
    const { data, error } = await supabase
      .from('visualizations')
      .select('*, leads(customer_name, whatsapp_number)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  getStats: async (shopId) => {
    const { data, error } = await supabase
      .from('visualizations')
      .select('id, created_at, items_compared')
      .eq('shop_id', shopId);
    
    if (error) throw error;
    return data || [];
  }
};

// ========== SHOP API ==========
export const shopAPI = {
  verifyPin: async (shopId, pin) => {
    const { data, error } = await supabase
      .from('shops')
      .select('admin_pin')
      .eq('id', shopId)
      .single();
    
    if (error) throw error;
    return data.admin_pin === pin;
  },
  
  updatePin: async (shopId, newPin) => {
    const { error } = await supabase
      .from('shops')
      .update({ admin_pin: newPin })
      .eq('id', shopId);
    
    if (error) throw error;
  }
};
