// Mock Supabase Client and APIs for completely local, offline execution

const DEFAULT_USERS = [
  { id: 'usr_admin', email: 'admin@retailvision.ai', password: 'admin123', user_metadata: {} },
  { id: 'usr_neeraj', email: 'neeraj.gaur@gmail.com', password: 'password123', user_metadata: {} }
];

const DEFAULT_SHOPS = [
  {
    id: 'shop_admin_demo',
    owner_email: 'admin@retailvision.ai',
    owner_name: 'Admin Demo Owner',
    shop_name: 'RetailVision Fashion Demo',
    industry: 'fashion',
    admin_pin: '1234',
    subscription_status: 'pro',
    created_at: new Date().toISOString()
  },
  {
    id: 'c8129ed8-d2ce-45df-b65e-13fe330c4936',
    owner_email: 'neeraj.gaur@gmail.com',
    owner_name: 'Neeraj Gaur',
    shop_name: 'Arun Vastralya',
    industry: 'fashion',
    admin_pin: '1234',
    subscription_status: 'pro',
    created_at: new Date().toISOString()
  }
];

const memoryStore = {};

const getLocalData = (table) => {
  if (memoryStore[table] && Array.isArray(memoryStore[table]) && memoryStore[table].length > 0) {
    return memoryStore[table];
  }
  try {
    const raw = localStorage.getItem(`mock_supabase_${table}`);
    if (!raw) {
      if (table === 'shops') {
        memoryStore.shops = DEFAULT_SHOPS;
        try { localStorage.setItem('mock_supabase_shops', JSON.stringify(DEFAULT_SHOPS)); } catch (e) {}
        return DEFAULT_SHOPS;
      }
      if (table === 'users') {
        memoryStore.users = DEFAULT_USERS;
        try { localStorage.setItem('mock_supabase_users', JSON.stringify(DEFAULT_USERS)); } catch (e) {}
        return DEFAULT_USERS;
      }
      return [];
    }
    const data = JSON.parse(raw);
    if (table === 'shops' && data.length === 0) {
      memoryStore.shops = DEFAULT_SHOPS;
      try { localStorage.setItem('mock_supabase_shops', JSON.stringify(DEFAULT_SHOPS)); } catch (e) {}
      return DEFAULT_SHOPS;
    }
    if (table === 'users' && data.length === 0) {
      memoryStore.users = DEFAULT_USERS;
      try { localStorage.setItem('mock_supabase_users', JSON.stringify(DEFAULT_USERS)); } catch (e) {}
      return DEFAULT_USERS;
    }
    memoryStore[table] = data;
    return data;
  } catch (e) {
    if (table === 'shops') return DEFAULT_SHOPS;
    if (table === 'users') return DEFAULT_USERS;
    return memoryStore[table] || [];
  }
};

const setLocalData = (table, data) => {
  memoryStore[table] = data;
  try {
    localStorage.setItem(`mock_supabase_${table}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`LocalStorage quota exceeded for table '${table}'. Pruning oldest items to maintain storage quota.`, e);
    try {
      // Emergency quota recovery: keep only the 15 most recent items
      const pruned = Array.isArray(data) ? data.slice(-15) : data;
      localStorage.setItem(`mock_supabase_${table}`, JSON.stringify(pruned));
    } catch (quotaError) {
      console.error(`Could not persist table '${table}' to localStorage. Operating in memory mode.`, quotaError);
    }
  }
};

// Simple Mock Query Builder class
class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orders = [];
    this.isSingle = false;
    this.operation = 'select'; // 'select', 'insert', 'update', 'delete'
    this.payload = null;
    this.limitCount = null;
  }

  select(columns = '*') {
    // If we've already set the operation to insert, update, or delete, keep it
    if (this.operation !== 'insert' && this.operation !== 'update' && this.operation !== 'delete') {
      this.operation = 'select';
    }
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  gt(column, value) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column, value) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column, value) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orders.push({ column, ascending });
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(rows) {
    this.operation = 'insert';
    this.payload = rows;
    return this;
  }

  update(updates) {
    this.operation = 'update';
    this.payload = updates;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  // Promise-like thenable so it can be awaited directly
  async then(onFulfilled, onRejected) {
    try {
      const data = await this.execute();
      return onFulfilled ? onFulfilled({ data, error: null }) : { data, error: null };
    } catch (err) {
      if (onRejected) return onRejected(err);
      return { data: null, error: err };
    }
  }

  async execute() {
    let items = getLocalData(this.table);

    if (this.operation === 'select') {
      // Apply filters
      for (const filter of this.filters) {
        if (filter.type === 'eq') {
          items = items.filter(item => item[filter.column] === filter.value);
        } else if (filter.type === 'gt') {
          items = items.filter(item => item[filter.column] > filter.value);
        } else if (filter.type === 'gte') {
          items = items.filter(item => {
            if (item[filter.column] === undefined || item[filter.column] === null) return false;
            return item[filter.column] >= filter.value;
          });
        } else if (filter.type === 'lt') {
          items = items.filter(item => {
            if (item[filter.column] === undefined || item[filter.column] === null) return false;
            return item[filter.column] < filter.value;
          });
        } else if (filter.type === 'lte') {
          items = items.filter(item => {
            if (item[filter.column] === undefined || item[filter.column] === null) return false;
            return item[filter.column] <= filter.value;
          });
        }
      }

      // Apply orders
      for (const order of this.orders) {
        items.sort((a, b) => {
          const valA = a[order.column];
          const valB = b[order.column];
          if (valA < valB) return order.ascending ? -1 : 1;
          if (valA > valB) return order.ascending ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (this.limitCount !== null && this.limitCount !== undefined) {
        items = items.slice(0, this.limitCount);
      }

      if (this.isSingle) {
        return items[0] || null;
      }
      return items;
    }

    if (this.operation === 'insert') {
      const newRows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const insertedRows = newRows.map(row => {
        const newRow = {
          id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          created_at: new Date().toISOString(),
          ...row
        };
        items.push(newRow);
        return newRow;
      });
      setLocalData(this.table, items);
      return this.isSingle ? insertedRows[0] : insertedRows;
    }

    if (this.operation === 'update') {
      let updatedRows = [];
      items = items.map(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (filter.type === 'eq' && item[filter.column] !== filter.value) {
            matches = false;
          }
        }
        if (matches) {
          const updatedItem = { ...item, ...this.payload };
          updatedRows.push(updatedItem);
          return updatedItem;
        }
        return item;
      });
      setLocalData(this.table, items);
      return this.isSingle ? updatedRows[0] : updatedRows;
    }

    if (this.operation === 'delete') {
      items = items.filter(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (filter.type === 'eq' && item[filter.column] !== filter.value) {
            matches = false;
          }
        }
        return !matches;
      });
      setLocalData(this.table, items);
      return null;
    }
  }
}

// Mock auth callbacks list
const authCallbacks = [];
const triggerAuthChange = (event, session) => {
  for (const cb of authCallbacks) {
    try { cb(event, session); } catch (e) { console.error('Auth callback error:', e); }
  }
};

// Export mock supabase object
export const supabase = {
  auth: {
    async getSession() {
      const session = JSON.parse(localStorage.getItem('mock_supabase_session') || 'null');
      return { data: { session }, error: null };
    },

    async getUser() {
      const session = JSON.parse(localStorage.getItem('mock_supabase_session') || 'null');
      return { data: { user: session?.user || null }, error: null };
    },

    async signUp({ email, password }) {
      const users = JSON.parse(localStorage.getItem('mock_supabase_users') || '[]');
      if (users.find(u => u.email === email)) {
        return { data: null, error: { message: 'User already exists' } };
      }
      
      const user = { 
        id: Math.random().toString(36).substring(2, 10), 
        email,
        user_metadata: {}
      };
      
      users.push({ ...user, password });
      localStorage.setItem('mock_supabase_users', JSON.stringify(users));

      const session = { user, access_token: 'mock-token' };
      localStorage.setItem('mock_supabase_session', JSON.stringify(session));

      triggerAuthChange('SIGNED_IN', session);

      return { data: { user, session }, error: null };
    },

    async signInWithPassword({ email, password }) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      let users = getLocalData('users');
      let user = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        user = {
          id: 'usr_' + Math.random().toString(36).substring(2, 10),
          email: cleanEmail,
          password: password || 'password',
          user_metadata: {}
        };
        users.push(user);
        setLocalData('users', users);
      }

      const session = { 
        user: { id: user.id, email: user.email, user_metadata: {} }, 
        access_token: 'mock-token' 
      };
      localStorage.setItem('mock_supabase_session', JSON.stringify(session));

      triggerAuthChange('SIGNED_IN', session);

      return { data: { user: session.user, session }, error: null };
    },

    async signOut() {
      localStorage.removeItem('mock_supabase_session');
      triggerAuthChange('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange(callback) {
      authCallbacks.push(callback);
      const session = JSON.parse(localStorage.getItem('mock_supabase_session') || 'null');
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              const idx = authCallbacks.indexOf(callback);
              if (idx !== -1) authCallbacks.splice(idx, 1);
            } 
          } 
        } 
      };
    }
  },

  from(table) {
    return new MockQueryBuilder(table);
  }
};

// Helper to get current shop
export const getCurrentShop = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;
    
    // Fetch shop for this user
    const shops = getLocalData('shops');
    const shop = shops.find(s => s.owner_email.toLowerCase() === user.email.toLowerCase());
    
    if (!shop) {
      // Auto-create a default shop to keep things working seamlessly
      const defaultShop = {
        id: Math.random().toString(36).substring(2, 10),
        owner_email: user.email,
        shop_name: 'Local Showroom',
        industry: 'fashion',
        admin_pin: '1234',
        subscription_status: 'pro',
        created_at: new Date().toISOString()
      };
      shops.push(defaultShop);
      setLocalData('shops', shops);
      return defaultShop;
    }
    
    return shop;
  } catch (error) {
    console.error('getCurrentShop error:', error);
    return null;
  }
};

// Upload image to local storage with automatic compression
export const uploadImage = async (file, bucket = 'inventory-images') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file locally'));
    reader.readAsDataURL(file);
  });
};

// Upload base64 image (compresses base64 data URLs)
export const uploadBase64Image = async (base64Data, bucket = 'customer-uploads') => {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image')) {
    return base64Data;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        } else {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
};

// ========== INVENTORY API ==========
export const inventoryAPI = {
  getAll: async (shopId, kioskMode = false) => {
    let items = getLocalData('inventory').filter(item => item.shop_id === shopId);
    
    // Sort descending by created_at
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (kioskMode) {
      items = items.filter(item => item.stock_count > 0);
    }
    
    return items;
  },
  
  create: async (item) => {
    let compressedImageUrl = item.image_url;
    if (compressedImageUrl && compressedImageUrl.startsWith('data:image')) {
      compressedImageUrl = await uploadBase64Image(compressedImageUrl);
    }
    const items = getLocalData('inventory');
    const newItem = {
      id: Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
      ...item,
      image_url: compressedImageUrl
    };
    items.push(newItem);
    setLocalData('inventory', items);
    return newItem;
  },
  
  update: async (id, updates) => {
    const items = getLocalData('inventory');
    let updatedItem = null;
    const newItems = items.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });
    setLocalData('inventory', newItems);
    return updatedItem;
  },
  
  delete: async (id) => {
    const items = getLocalData('inventory');
    const newItems = items.filter(item => item.id !== id);
    setLocalData('inventory', newItems);
  }
};

// ========== LEADS API ==========
export const leadsAPI = {
  create: async (lead) => {
    const leads = getLocalData('leads');
    const newLead = {
      id: Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
      ...lead
    };
    leads.push(newLead);
    setLocalData('leads', leads);
    return newLead;
  },
  
  getAll: async (shopId) => {
    const leads = getLocalData('leads').filter(l => l.shop_id === shopId);
    leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return leads;
  }
};

// ========== VISUALIZATIONS API ==========
export const visualizationsAPI = {
  create: async (visualization) => {
    const vizs = getLocalData('visualizations');
    const newViz = {
      id: Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString(),
      ...visualization
    };
    vizs.push(newViz);
    setLocalData('visualizations', vizs);
    return newViz;
  },
  
  getAll: async (shopId) => {
    const vizs = getLocalData('visualizations').filter(v => v.shop_id === shopId);
    const leads = getLocalData('leads');
    
    const populated = vizs.map(v => {
      const lead = leads.find(l => l.id === v.lead_id);
      return {
        ...v,
        leads: lead ? { customer_name: lead.customer_name, whatsapp_number: lead.whatsapp_number } : null
      };
    });
    
    populated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return populated;
  },
  
  getStats: async (shopId) => {
    const vizs = getLocalData('visualizations').filter(v => v.shop_id === shopId);
    return vizs.map(v => ({
      id: v.id,
      created_at: v.created_at,
      items_compared: v.items_compared
    }));
  }
};

// ========== SHOP API ==========
export const shopAPI = {
  verifyPin: async (shopId, pin) => {
    const shops = getLocalData('shops');
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.admin_pin === pin : false;
  },
  
  updatePin: async (shopId, newPin) => {
    const shops = getLocalData('shops');
    const updated = shops.map(s => {
      if (s.id === shopId) {
        return { ...s, admin_pin: newPin };
      }
      return s;
    });
    setLocalData('shops', updated);
  }
};
