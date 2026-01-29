import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Users, Eye, TrendingUp, Plus, Edit2, Trash2, 
  LogOut, Monitor, X, Upload, Loader2, BarChart3, Clock,
  Sparkles, Search, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '../store/authStore';
import { inventoryAPI, leadsAPI, visualizationsAPI, uploadImage } from '../lib/supabase';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const FASHION_CATEGORIES = ['Saree', 'Suit', 'Lehenga', 'Jeans', 'Top', 'Dress', 'Kurti', 'Shirt', 'Blazer', 'Other'];
const TILE_CATEGORIES = ['Floor Tiles', 'Wall Tiles', 'Bathroom Tiles', 'Kitchen Tiles', 'Outdoor Tiles', 'Mosaic', 'Marble', 'Granite', 'Other'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { shop, signOut, refreshShop, user } = useAuthStore();
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
      const data = await inventoryAPI.getAll(shop.id);
      setInventory(data);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [leadsData, vizData] = await Promise.all([
        leadsAPI.getAll(shop.id),
        visualizationsAPI.getAll(shop.id)
      ]);
      setLeads(leadsData);
      setVisualizations(vizData);
    } catch (error) {
      toast.error('Failed to load analytics');
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
      image_url: item.image_url
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
        await inventoryAPI.update(editingItem.id, itemData);
        toast.success('Item updated successfully');
      } else {
        await inventoryAPI.create(itemData);
        toast.success('Item added successfully');
      }

      setShowAddDialog(false);
      resetForm();
      loadInventory();
    } catch (error) {
      toast.error(error.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await inventoryAPI.delete(id);
      toast.success('Item deleted');
      loadInventory();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getTopProducts = () => {
    const productCounts = {};
    visualizations.forEach(v => {
      const items = v.items_compared || [];
      items.forEach(itemId => {
        productCounts[itemId] = (productCounts[itemId] || 0) + 1;
      });
    });

    return Object.entries(productCounts)
      .map(([id, count]) => {
        const item = inventory.find(i => i.id === id);
        return { name: item?.name || 'Unknown', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
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

  const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <motion.div 
                initial={{ scale: 0.9, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                {shop && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                )}
              </motion.div>
              <div>
                {shop ? (
                  <>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-bold bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent"
                      data-testid="shop-name"
                    >
                      {shop.shop_name}
                    </motion.h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        shop.industry === 'fashion' 
                          ? 'bg-pink-100 text-pink-700' 
                          : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {shop.industry === 'fashion' ? '👗 Fashion' : '🏠 Tiles'}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">{shop.owner_email}</span>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/kiosk')}
                className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                data-testid="launch-kiosk-btn"
                disabled={!shop}
              >
                <Monitor className="w-4 h-4 mr-2" />
                Launch Kiosk
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="rounded-full"
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Products</p>
                <p className="text-3xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Leads</p>
                <p className="text-3xl font-bold">{leads.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Visualizations</p>
                <p className="text-3xl font-bold">{visualizations.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">In Stock</p>
                <p className="text-3xl font-bold">{inventory.filter(i => i.stock_count > 0).length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass rounded-full p-1">
            <TabsTrigger value="inventory" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="leads" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Users className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl"
                  data-testid="search-input"
                />
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setShowAddDialog(true);
                }}
                className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                data-testid="add-item-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {loadingInventory ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No products yet</h3>
                <p className="text-slate-600 mb-6">Add your first product to get started</p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredInventory.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl overflow-hidden group"
                    data-testid={`inventory-item-${item.id}`}
                  >
                    <div className="aspect-square bg-white flex items-center justify-center relative">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain p-4"
                        />
                      ) : (
                        <Package className="w-16 h-16 text-slate-300" />
                      )}
                      
                      {/* Stock Badge */}
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                        item.stock_count > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.stock_count > 0 ? `${item.stock_count} in stock` : 'Out of stock'}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => openEditDialog(item)}
                          className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50"
                          data-testid={`edit-item-${item.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 text-red-600"
                          data-testid={`delete-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 truncate">{item.name}</h3>
                      <p className="text-sm text-slate-600 mb-2">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-violet-600">₹{item.price}</p>
                        {item.tags?.length > 0 && (
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
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
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Visualizations Over Time */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-violet-600" />
                    Visualizations (Last 7 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={getVisualizationsByDay()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
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

                {/* Top Products */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    Most Visualized Products
                  </h3>
                  {getTopProducts().length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={getTopProducts()} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Views" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-slate-500">
                      No visualization data yet
                    </div>
                  )}
                </div>

                {/* Peak Hours */}
                <div className="glass rounded-2xl p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-600" />
                    Peak Usage Hours
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={getPeakHours()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={2} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip />
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
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No leads yet</h3>
                <p className="text-slate-600">Leads will appear here when customers use the kiosk</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left px-6 py-4 font-semibold text-slate-700">WhatsApp</th>
                      <th className="text-left px-6 py-4 font-semibold text-slate-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium">{lead.customer_name}</td>
                        <td className="px-6 py-4">
                          <a 
                            href={`https://wa.me/${lead.whatsapp_number?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 hover:underline"
                          >
                            {lead.whatsapp_number}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
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
        <DialogContent className="max-w-lg" data-testid="add-item-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Product Image</Label>
              <div 
                onClick={() => document.getElementById('image-upload').click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 transition-colors"
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
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">Click to upload image</p>
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
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                Product Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12 rounded-xl"
                placeholder="Enter product name"
                data-testid="item-name-input"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="h-12 rounded-xl" data-testid="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-sm font-medium mb-2 block">
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
                  className="h-12 rounded-xl"
                  placeholder="0.00"
                  data-testid="item-price-input"
                />
              </div>
              <div>
                <Label htmlFor="stock" className="text-sm font-medium mb-2 block">
                  Stock Count
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock_count}
                  onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })}
                  required
                  className="h-12 rounded-xl"
                  placeholder="0"
                  data-testid="item-stock-input"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags" className="text-sm font-medium mb-2 block">
                Tags (comma separated)
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="h-12 rounded-xl"
                placeholder="silk, wedding, premium"
                data-testid="item-tags-input"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
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
