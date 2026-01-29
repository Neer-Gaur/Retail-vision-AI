import { create } from 'zustand';
import { supabase, getCurrentShop } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  shop: null,
  loading: true,
  
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const shop = await getCurrentShop();
      set({ user: session.user, shop, loading: false });
    } else {
      set({ user: null, shop: null, loading: false });
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
    
    // Create shop entry
    const { data: shopEntry, error: shopError } = await supabase
      .from('shops')
      .insert([{
        owner_email: email,
        shop_name: shopData.shop_name,
        industry: shopData.industry,
        admin_pin: shopData.admin_pin || '1234',
        logo_url: '',
        brand_color: shopData.industry === 'fashion' ? '#FF6B6B' : '#4ECDC4',
        subscription_status: 'trial'
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