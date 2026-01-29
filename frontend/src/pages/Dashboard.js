import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, Users, Eye, TrendingUp, Plus, Edit2, Trash2, 
  LogOut, Monitor, X, Upload, Loader2, BarChart3, Clock,
  Sparkles, Search, Crown, PackageOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '../store/authStore';
import { supabase, uploadImage } from '../lib/supabase';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const FASHION_CATEGORIES = ['Saree', 'Suit', 'Lehenga', 'Jeans', 'Top', 'Dress', 'Kurti', 'Shirt', 'Blazer', 'Other'];
const TILE_CATEGORIES = ['Floor Tiles', 'Wall Tiles', 'Bathroom Tiles', 'Kitchen Tiles', 'Outdoor Tiles', 'Mosaic', 'Marble', 'Granite', 'Other'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { shop, signOut, user, refreshShop } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Inventory State
  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock_count: '',
    tags: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Analytics State
  const [leads, setLeads] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const categories = shop?.industry === 'fashion' ? FASHION_CATEGORIES : TILE_CATEGORIES;

  // Refresh shop data if not loaded
  useEffect(() => {
    if (user && !shop) {
      refreshShop();
    }
  }, [user, shop, refreshShop]);

  useEffect(() => {
    if (shop?.id) {
      loadInventory();
      loadAnalytics();
    }
  }, [shop?.id]);

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Load inventory error:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [leadsRes, vizRes] = await Promise.all([
        supabase.from('leads').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }),
        supabase.from('visualizations').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false })
      ]);
      
      setLeads(leadsRes.data || []);
      setVisualizations(vizRes.data || []);
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

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
    setFormData({
      name: '',
      category: '',
      price: '',
      stock_count: '',
      tags: '',
      image_url: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingItem(null);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      stock_count: item.stock_count.toString(),
      tags: item.tags?.join(', ') || '',
      image_url: item.image_url || ''
    });
    setImagePreview(item.image_url);
    setShowAddDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = formData.image_url;
      
      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'inventory-images');
      }

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
        const { error } = await supabase
          .from('inventory')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Item updated successfully');
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([itemData]);
        if (error) throw error;
        toast.success('Item added successfully');
      }

      setShowAddDialog(false);
      resetForm();
      loadInventory();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Item deleted');
      loadInventory();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Analytics calculations
  const getVisualizationsByDay = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(day => ({
      date: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
      count: visualizations.filter(v => v.created_at?.startsWith(day)).length
    }));
  };

  const getPeakHours = () => {
    const hourCounts = {};
    visualizations.forEach(v => {
      if (v.created_at) {
        const hour = new Date(v.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    return [...Array(24)].map((_, hour) => ({
      hour: `${hour}:00`,
      count: hourCounts[hour] || 0
    }));
  };

  const subscriptionColors = {
    trial: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    expired: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <motion.div 
                initial={{ scale: 0.9, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </motion.div>
              
              <div>
                {shop ? (
                  <>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-bold text-white"
                      data-testid="shop-name"
                    >
                      {shop.shop_name}
                    </motion.h1>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        shop.industry === 'fashion' 
                          ? 'bg-pink-500/20 text-pink-400' 
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {shop.industry === 'fashion' ? '👗 Fashion' : '🏠 Tiles'}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${subscriptionColors[shop.subscription_status] || subscriptionColors.trial}`}>
                        <Crown className="w-3 h-3" />
                        {shop.subscription_status?.charAt(0).toUpperCase() + shop.subscription_status?.slice(1) || 'Trial'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-7 w-48 bg-slate-700 rounded mb-2" />
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/kiosk')}
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                data-testid="launch-kiosk-btn"
                disabled={!shop}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Launch Kiosk
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Package, label: 'Total Products', value: inventory.length, color: 'violet' },
            { icon: Users, label: 'Total Leads', value: leads.length, color: 'blue' },
            { icon: Eye, label: 'Visualizations', value: visualizations.length, color: 'emerald' },
            { icon: TrendingUp, label: 'In Stock', value: inventory.filter(i => i.stock_count > 0).length, color: 'amber' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800 rounded-full p-1">
            <TabsTrigger value="inventory" className="rounded-full data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="leads" className="rounded-full data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400">
              <Users className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                  data-testid="search-input"
                />
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                data-testid="add-item-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {loadingInventory ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : filteredInventory.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800"
              >
                <PackageOpen className="w-20 h-20 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No Products Yet</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Start building your inventory by adding your first product
                </p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredInventory.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden group hover:border-violet-500/50 transition-colors"
                    data-testid={`inventory-item-${item.id}`}
                  >
                    <div className="aspect-square bg-slate-800/50 flex items-center justify-center relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain p-4"
                        />
                      ) : (
                        <Package className="w-16 h-16 text-slate-700" />
                      )}
                      
                      {/* Stock Badge */}
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                        item.stock_count > 0 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.stock_count > 0 ? `${item.stock_count} in stock` : 'Out of stock'}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => openEditDialog(item)}
                          className="w-8 h-8 rounded-full bg-slate-900/90 backdrop-blur flex items-center justify-center hover:bg-violet-600 text-white transition-colors"
                          data-testid={`edit-item-${item.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-full bg-slate-900/90 backdrop-blur flex items-center justify-center hover:bg-red-600 text-white transition-colors"
                          data-testid={`delete-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 truncate">{item.name}</h3>
                      <p className="text-sm text-slate-400 mb-2">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-violet-400">₹{item.price?.toLocaleString('en-IN')}</p>
                        {item.tags?.length > 0 && (
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
                            {item.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Visualizations Over Time */}
                <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-violet-400" />
                    Visualizations (Last 7 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={getVisualizationsByDay()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8b5cf6" 
                        fill="url(#colorViz)" 
                        name="Visualizations"
                      />
                      <defs>
                        <linearGradient id="colorViz" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Peak Hours */}
                <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-400" />
                    Peak Usage Hours
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={getPeakHours()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={3} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Usage" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
                <Users className="w-20 h-20 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No Leads Yet</h3>
                <p className="text-slate-400">Leads will appear here when customers use the kiosk</p>
              </div>
            ) : (
              <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-700">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold text-slate-300">Name</th>
                      <th className="text-left px-6 py-4 font-semibold text-slate-300">WhatsApp</th>
                      <th className="text-left px-6 py-4 font-semibold text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-medium text-white">{lead.customer_name}</td>
                        <td className="px-6 py-4">
                          <a 
                            href={`https://wa.me/${lead.whatsapp_number?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 hover:underline"
                          >
                            {lead.whatsapp_number}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowAddDialog(open);
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg" data-testid="add-item-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload */}
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Product Photo</Label>
              <div 
                onClick={() => document.getElementById('image-upload').click()}
                className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500 transition-colors bg-slate-800/30"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                        setFormData({ ...formData, image_url: '' });
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400">Click to upload photo</p>
                  </>
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-300 mb-2 block">
                Product Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12 rounded-xl bg-slate-800/50 border-slate-700 text-white"
                placeholder="Enter product name"
                data-testid="item-name-input"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="h-12 rounded-xl bg-slate-800/50 border-slate-700 text-white" data-testid="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-700">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-sm font-medium text-slate-300 mb-2 block">
                  Price (₹)
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-slate-800/50 border-slate-700 text-white"
                  placeholder="0.00"
                  data-testid="item-price-input"
                />
              </div>
              <div>
                <Label htmlFor="stock" className="text-sm font-medium text-slate-300 mb-2 block">
                  Stock Count
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_count}
                  onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-slate-800/50 border-slate-700 text-white"
                  placeholder="0"
                  data-testid="item-stock-input"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags" className="text-sm font-medium text-slate-300 mb-2 block">
                Tags (comma separated)
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="h-12 rounded-xl bg-slate-800/50 border-slate-700 text-white"
                placeholder="silk, wedding, premium"
                data-testid="item-tags-input"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 h-12 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                data-testid="submit-item-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
