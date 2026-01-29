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

// Helper to upload image
export const uploadImage = async (file, bucket = 'product-images') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
};