import { create } from 'zustand';
import { supabase, getCurrentShop } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  shop: null,
  loading: true,
  
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const shop = await getCurrentShop();
        set({ user: session.user, shop, loading: false });
      } else {
        set({ user: null, shop: null, loading: false });
      }
    } catch (error) {
      console.error('Initialize error:', error);
      set({ user: null, shop: null, loading: false });
    }
  },
  
  refreshShop: async () => {
    try {
      const shop = await getCurrentShop();
      set({ shop });
      return shop;
    } catch (error) {
      console.error('Refresh shop error:', error);
      return null;
    }
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    const shop = await getCurrentShop();
    set({ user: data.user, shop });
    return { user: data.user, shop };
  },
  
  signUp: async (email, password, shopData) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) throw authError;
    
    // Create shop entry - only include columns that exist in your schema
    const { data: shopEntry, error: shopError } = await supabase
      .from('shops')
      .insert([{
        owner_email: email,
        shop_name: shopData.shop_name,
        industry: shopData.industry,
        admin_pin: shopData.admin_pin || '1234'
      }])
      .select()
      .single();
    
    if (shopError) throw shopError;
    
    set({ user: authData.user, shop: shopEntry });
    return { user: authData.user, shop: shopEntry };
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, shop: null });
  }
}));