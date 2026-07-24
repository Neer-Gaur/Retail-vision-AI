import { supabase } from './supabase';

// 1. Define your local AI backend URL
const AI_BACKEND_URL = 'http://localhost:8001';

// Inventory Functions (KEPT EXACTLY AS IS)
export const inventoryService = {
  async getAll(shopId) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async create(shopId, itemData, imageFile) {
    let image_url = '';
    
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${shopId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('inventory-images')
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(fileName);
      
      image_url = publicUrl;
    }

    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        shop_id: shopId,
        name: itemData.name,
        category: itemData.category,
        price: itemData.price,
        stock_count: itemData.stock_count,
        image_url,
        tags: itemData.tags || {},
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(itemId, itemData, imageFile) {
    const updates = {
      name: itemData.name,
      category: itemData.category,
      price: itemData.price,
      stock_count: itemData.stock_count,
      tags: itemData.tags || {}
    };

    if (imageFile) {
      const { data: item } = await supabase
        .from('inventory')
        .select('shop_id')
        .eq('id', itemId)
        .single();

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${item.shop_id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('inventory-images')
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(fileName);
      
      updates.image_url = publicUrl;
    }

    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(itemId) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', itemId);
    
    if (error) throw error;
  }
};

// Leads Functions (KEPT EXACTLY AS IS)
export const leadsService = {
  async getAll(shopId) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(shopId, leadData) {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        shop_id: shopId,
        customer_name: leadData.customer_name,
        whatsapp_number: leadData.whatsapp_number,
        email: leadData.email || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Visualizations Functions (UPDATED TO CALL LOCAL AI BACKEND)
export const visualizationsService = {
  async getAll(shopId) {
    const { data, error } = await supabase
      .from('visualizations')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * REWRITTEN: Now sends request to Python server at http://localhost:8001
   */
  async create(shopId, leadId, customerPhotoUrl, productUrls, productNames, industry) {
    try {
      const response = await fetch(`${AI_BACKEND_URL}/api/visualize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_photo_url: customerPhotoUrl,
          product_image_urls: productUrls,
          product_names: productNames,
          industry: industry
        }),
      });

      if (!response.ok) throw new Error('AI Backend Error');
      
      const aiResult = await response.json();
      
      // Save the result to Supabase so it shows in your history
      const { data, error } = await supabase
        .from('visualizations')
        .insert([{
          shop_id: shopId,
          lead_id: leadId,
          customer_photo_url: customerPhotoUrl,
          result_photo_url: aiResult.results[0].result_image || ''
        }])
        .select()
        .single();

      if (error) throw error;
      return { supabaseData: data, aiData: aiResult.results };

    } catch (err) {
      console.error("AI Visualization Failed:", err);
      throw err;
    }
  }
};

// Analytics Functions (KEPT EXACTLY AS IS)
export const analyticsService = {
  async getStats(shopId) {
    const [inventory, leads, visualizations] = await Promise.all([
      supabase.from('inventory').select('id, stock_count').eq('shop_id', shopId),
      supabase.from('leads').select('id').eq('shop_id', shopId),
      supabase.from('visualizations').select('id, items_compared, created_at').eq('shop_id', shopId)
    ]);

    const itemCounts = {};
    visualizations.data?.forEach(viz => {
      viz.items_compared?.forEach(itemId => {
        itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
      });
    });

    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topItemsDetails = await Promise.all(
      topItems.map(async ([itemId, count]) => {
        const { data } = await supabase
          .from('inventory')
          .select('*')
          .eq('id', itemId)
          .single();
        return { item: data, count };
      })
    );

    return {
      total_products: inventory.data?.length || 0,
      total_leads: leads.data?.length || 0,
      total_visualizations: visualizations.data?.length || 0,
      low_stock: inventory.data?.filter(item => item.stock_count <= 5 && item.stock_count > 0).length || 0,
      top_items: topItemsDetails
    };
  }
};