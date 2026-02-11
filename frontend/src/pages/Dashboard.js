import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Users, Eye, TrendingUp, Plus, Edit2, Trash2, 
  LogOut, Monitor, X, Upload, Loader2, BarChart3, Clock,
  Sparkles, Search, Crown, PackageOpen, LayoutGrid, List,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '../store/authStore';
import { supabase, uploadImage } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

// --- Constants & Data ---
const FASHION_CATEGORIES = ['Saree', 'Suit', 'Lehenga', 'Jeans', 'Top', 'Dress', 'Kurti', 'Shirt', 'Blazer', 'Other'];
const TILE_CATEGORIES = ['Floor Tiles', 'Wall Tiles', 'Bathroom Tiles', 'Kitchen Tiles', 'Outdoor Tiles', 'Mosaic', 'Marble', 'Granite', 'Other'];

const COLORS = ['#8b5cf6', '#ec4899', '#f43f5e', '#a855f7', '#6366f1'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { shop, signOut, user, refreshShop } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'inventory', 'leads'
  
  // Data State
  const [inventory, setInventory] = useState([]);
  const [leads, setLeads] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Inventory UI State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', category: '', price: '', stock_count: '', tags: '', image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Initialization ---
  useEffect(() => {
    if (user && !shop) refreshShop();
  }, [user, shop, refreshShop]);

  useEffect(() => {
    if (shop?.id) loadData();
  }, [shop?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, leadsRes, vizRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
        supabase.from('leads').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
        supabase.from('visualizations').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false })
      ]);
      
      setInventory(invRes.data || []);
      setLeads(leadsRes.data || []);
      setVisualizations(vizRes.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', price: '', stock_count: '', tags: '', image_url: '' });
    setImageFile(null);
    setImagePreview(null);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = formData.image_url;
      if (imageFile) imageUrl = await uploadImage(imageFile, 'inventory-images');

      const itemData = {
        shop_id: shop.id,
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock_count: parseInt(formData.stock_count),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        image_url: imageUrl
      };

      if (editingItem) {
        await supabase.from('inventory').update(itemData).eq('id', editingItem.id);
        toast.success('Product updated');
      } else {
        await supabase.from('inventory').insert([itemData]);
        toast.success('Product added');
      }
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await supabase.from('inventory').delete().eq('id', id);
      toast.success('Product deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // --- Analytics Logic ---
  const getVisualizationTrend = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: visualizations.filter(v => v.created_at.startsWith(date)).length
    }));
  };

  const getCategoryDistribution = () => {
    const counts = {};
    inventory.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] })).sort((a,b) => b.value - a.value).slice(0, 5);
  };

  const getRecentActivity = () => {
    // Combine leads and visualizations into a single timeline
    const activity = [
      ...leads.map(l => ({ type: 'lead', date: new Date(l.created_at), data: l })),
      ...visualizations.map(v => ({ type: 'viz', date: new Date(v.created_at), data: v }))
    ].sort((a,b) => b.date - a.date).slice(0, 5);
    return activity;
  };

  // --- Render Components ---
  
  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-gradient-to-r from-red-600/20 to-rose-600/20 text-red-400 border border-red-500/30' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const StatCard = ({ title, value, trend, icon: Icon, color }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-[100px] transition-all group-hover:scale-110`} />
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className={`flex items-center ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-slate-500">vs last month</span>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30 flex">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-900/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/50 backdrop-blur-xl p-6 hidden md:flex flex-col z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-cover" />
          <div>
            <h1 className="font-bold text-lg tracking-tight">RetailVision<span className="text-red-500">.</span></h1>
            <p className="text-xs text-slate-500">Store Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem id="overview" icon={LayoutGrid} label="Overview" />
          <SidebarItem id="inventory" icon={Package} label="Inventory" />
          <SidebarItem id="leads" icon={Users} label="Customer Leads" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="bg-slate-900/50 rounded-xl p-4 mb-4 border border-white/5">
            <p className="text-xs text-slate-400 mb-2">Subscription</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white capitalize">{shop?.subscription_status || 'Trial'}</span>
              <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5">
            <LogOut className="w-4 h-4 mr-3" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative z-10">
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/kiosk')}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
            >
              <Monitor className="w-4 h-4 mr-2" /> Launch Kiosk
            </Button>
          </div>
        </header>

        <div className="p-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Total Visualizations" 
                  value={visualizations.length} 
                  trend={12} 
                  icon={Eye} 
                  color="violet" 
                />
                <StatCard 
                  title="Active Leads" 
                  value={leads.length} 
                  trend={8} 
                  icon={Users} 
                  color="blue" 
                />
                <StatCard 
                  title="Inventory Items" 
                  value={inventory.length} 
                  trend={inventory.length > 0 ? 5 : 0} 
                  icon={Package} 
                  color="emerald" 
                />
                <StatCard 
                  title="Engagement Rate" 
                  value={`${leads.length > 0 ? Math.round((visualizations.length / leads.length) * 100) : 0}%`} 
                  trend={-2} 
                  icon={Activity} 
                  color="rose" 
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-6">Traffic Overview</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getVisualizationTrend()}>
                        <defs>
                          <linearGradient id="colorViz" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#ef4444' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorViz)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Recent Activity Feed */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-6">Live Activity</h3>
                  <div className="space-y-6">
                    {getRecentActivity().length === 0 ? (
                      <div className="text-center text-slate-500 py-10">No activity yet</div>
                    ) : (
                      getRecentActivity().map((item, i) => (
                        <div key={i} className="flex gap-4 items-start relative">
                          {i !== getRecentActivity().length - 1 && (
                            <div className="absolute left-2.5 top-8 bottom-[-24px] w-0.5 bg-slate-800" />
                          )}
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 border-2 ${
                            item.type === 'lead' ? 'border-blue-500 bg-blue-500/20' : 'border-red-500 bg-red-500/20'
                          }`} />
                          <div>
                            <p className="text-sm text-slate-200">
                              {item.type === 'lead' ? (
                                <>New customer <span className="font-bold">{item.data.customer_name}</span> joined</>
                              ) : (
                                <>Visualization created via <span className="font-bold">Kiosk</span></>
                              )}
                            </p>
                            <span className="text-xs text-slate-500">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Category Breakdown */}
              <div className="grid lg:grid-cols-2 gap-8">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-6">Popular Categories</h3>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoryDistribution()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getCategoryDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Inventory Health Alert */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-32 bg-red-600/5 rounded-full blur-3xl" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-lg font-semibold text-white">Inventory Health</h3>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-sm text-slate-300">Low Stock Items</span>
                      </div>
                      <span className="font-bold text-white">{inventory.filter(i => i.stock_count < 5).length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm text-slate-300">In Stock</span>
                      </div>
                      <span className="font-bold text-white">{inventory.filter(i => i.stock_count >= 5).length}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setActiveTab('inventory')}
                    className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  >
                    Manage Stock
                  </Button>
                </motion.div>
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-slate-900/50 border-slate-700 text-white focus:border-red-500 focus:ring-red-500/20 transition-all"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                  <Button
                    onClick={() => { resetForm(); setShowAddDialog(true); }}
                    className="flex-1 md:flex-none rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
              </div>

              {inventory.length === 0 ? (
                <div className="text-center py-32 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PackageOpen className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Inventory Empty</h3>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">Your digital showroom is looking a bit empty.</p>
                  <Button onClick={() => setShowAddDialog(true)} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                    Add First Product
                  </Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all hover:shadow-xl hover:shadow-red-500/10"
                    >
                      <div className="aspect-square bg-white/5 relative overflow-hidden">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute top-3 left-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.stock_count > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {item.stock_count} Left
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => { setEditingItem(item); setFormData(item); setImagePreview(item.image_url); setShowAddDialog(true); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-md transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-white truncate mb-1">{item.name}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">{item.category}</span>
                          <span className="text-red-400 font-bold">₹{item.price}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-medium">Product</th>
                        <th className="px-6 py-4 font-medium">Category</th>
                        <th className="px-6 py-4 font-medium">Stock</th>
                        <th className="px-6 py-4 font-medium">Price</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden">
                              <img src={item.image_url} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium text-white">{item.name}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{item.category}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stock_count > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {item.stock_count}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white font-mono">₹{item.price}</td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingItem(item); setFormData(item); setShowAddDialog(true); }}>Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LEADS TAB */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 p-6 rounded-2xl">
                  <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Customers</h3>
                  <p className="text-4xl font-bold text-white">{leads.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 p-6 rounded-2xl">
                  <h3 className="text-green-400 text-sm font-semibold uppercase tracking-wider mb-1">Conversion Potential</h3>
                  <p className="text-4xl font-bold text-white">High</p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Customer Name</th>
                      <th className="px-6 py-4 font-medium">Contact</th>
                      <th className="px-6 py-4 font-medium">First Visit</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                              {lead.customer_name[0]}
                            </div>
                            {lead.customer_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono">{lead.whatsapp_number}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{new Date(lead.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <a 
                            href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors text-sm font-medium"
                          >
                            Chat on WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingItem ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-400 mb-1.5 block">Product Photo</Label>
                <div 
                  onClick={() => document.getElementById('img-upload').click()}
                  className="border-2 border-dashed border-slate-700 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-white/5 transition-all relative overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs text-slate-500">Click to upload</span>
                    </>
                  )}
                </div>
                <input id="img-upload" type="file" onChange={handleImageChange} className="hidden" />
              </div>
              
              <div className="col-span-2">
                <Label>Product Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-950 border-slate-800 focus:border-red-500" />
              </div>

              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-slate-950 border-slate-800 focus:border-red-500" />
              </div>

              <div>
                <Label>Stock</Label>
                <Input type="number" value={formData.stock_count} onChange={e => setFormData({...formData, stock_count: e.target.value})} className="bg-slate-950 border-slate-800 focus:border-red-500" />
              </div>

              <div className="col-span-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {(((shop?.industry || '').toLowerCase().includes('tile')) ? TILE_CATEGORIES : FASHION_CATEGORIES).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white mt-4">
              {submitting ? 'Saving...' : 'Save Product'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}