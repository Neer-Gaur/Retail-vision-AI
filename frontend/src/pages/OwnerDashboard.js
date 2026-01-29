import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, LogOut, Plus, BarChart3, Package, Rocket, Edit2, Trash2, Upload, Loader2, TrendingUp, TrendingDown, AlertTriangle, Users, ShoppingCart, Clock, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { inventoryAPI, analyticsAPI, leadsAPI } from '@/services/api';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const COLORS = ['#0A0A0A', '#475569', '#64748B', '#94A3B8', '#CBD5E1'];

const FASHION_CATEGORIES = [
  'Saree',
  'Suit',
  'Lehenga',
  'Kurti',
  'Dress',
  'Jeans',
  'Top',
  'Shirt',
  'T-Shirt',
  'Jacket',
  'Ethnic Wear',
  'Western Wear',
  'Party Wear',
  'Casual Wear',
  'Other'
];

const TILES_CATEGORIES = [
  'Floor Tiles',
  'Wall Tiles',
  'Bathroom Tiles',
  'Kitchen Tiles',
  'Outdoor Tiles',
  'Ceramic Tiles',
  'Porcelain Tiles',
  'Marble Tiles',
  'Granite Tiles',
  'Mosaic Tiles',
  'Vitrified Tiles',
  'Other'
];

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const industry = localStorage.getItem('industry');
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    category: '',
    price: '',
    tags: '',
    stock: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inventoryData, analyticsData, leadsData] = await Promise.all([
        inventoryAPI.getAll(),
        analyticsAPI.get(),
        leadsAPI.getAll()
      ]);
      setInventory(inventoryData);
      setAnalytics(analyticsData);
      setLeads(leadsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleLaunchKiosk = () => {
    navigate('/kiosk');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/upload-image`, formDataUpload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFormData({ ...formData, image: response.data.image_url });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        tags: formData.tags.split(',').map(t => t.trim())
      };

      if (editingItem) {
        await inventoryAPI.update(editingItem.id, data);
        toast.success('Item updated successfully');
      } else {
        await inventoryAPI.create(data);
        toast.success('Item added successfully');
      }

      setShowAddDialog(false);
      setEditingItem(null);
      setFormData({ name: '', image: '', category: '', price: '', tags: '', stock: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      image: item.image,
      category: item.category,
      price: item.price.toString(),
      tags: item.tags.join(', '),
      stock: item.stock.toString()
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await inventoryAPI.delete(id);
      toast.success('Item deleted successfully');
      loadData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const categories = industry === 'fashion' ? FASHION_CATEGORIES : TILES_CATEGORIES;
  const itemLabel = industry === 'fashion' ? 'Product' : 'Tile';

  // Prepare chart data
  const dailyData = analytics ? Object.keys(analytics.daily_visualizations || {}).map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visualizations: analytics.daily_visualizations[date] || 0,
    leads: analytics.daily_leads[date] || 0
  })) : [];

  const categoryData = analytics ? Object.keys(analytics.category_performance || {}).map(cat => ({
    name: cat,
    items: analytics.category_performance[cat].total_items,
    visualizations: analytics.category_performance[cat].visualizations
  })) : [];

  const peakHoursData = analytics ? analytics.peak_hours?.map(([hour, count]) => ({
    hour: `${hour}:00`,
    count
  })) : [];

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 noise-bg">
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-black" />
            <span className="text-2xl font-bold">Dashboard</span>
          </div>

          <div className="flex gap-4">
            <Button
              data-testid="launch-kiosk-btn"
              onClick={handleLaunchKiosk}
              className="btn-primary"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch Kiosk
            </Button>
            <Button
              data-testid="owner-logout-btn"
              onClick={handleLogout}
              variant="ghost"
              className="rounded-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 rounded-full p-1">
            <TabsTrigger value="overview" className="rounded-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="inventory" data-testid="tab-inventory" className="rounded-full">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics" className="rounded-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500 font-medium">Total Products</p>
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-3xl font-bold">{analytics?.total_products || 0}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500 font-medium">Visualizations</p>
                    <ShoppingCart className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-3xl font-bold">{analytics?.total_visualizations || 0}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500 font-medium">Customer Leads</p>
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-3xl font-bold">{analytics?.total_leads || 0}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-500 font-medium">Conversion Rate</p>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold">{analytics?.conversion_rate || 0}%</p>
                </motion.div>
              </div>

              {/* Low Stock Alert */}
              {analytics?.low_stock_items && analytics.low_stock_items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-200 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <h3 className="text-xl font-bold text-orange-900">Low Stock Alert</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analytics.low_stock_items.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4 border border-orange-100">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-slate-600">{item.category}</p>
                        <p className="text-orange-600 font-bold mt-2">Only {item.stock} left!</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                  <h3 className="text-xl font-bold mb-4">Top Performing Products</h3>
                  <div className="space-y-3">
                    {analytics?.most_visualized?.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-semibold">{item.product.name}</p>
                          <p className="text-sm text-slate-500">{item.product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{item.visualization_count}</p>
                          <p className="text-xs text-slate-500">views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Leads</h3>
                  <div className="space-y-3">
                    {leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-semibold">{lead.name}</p>
                          <p className="text-sm text-slate-500">{lead.whatsapp}</p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 rounded-xl border-slate-200 bg-white"
                    />
                  </div>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button
                      data-testid="add-item-btn"
                      className="btn-primary"
                      onClick={() => {
                        setEditingItem(null);
                        setFormData({ name: '', image: '', category: '', price: '', tags: '', stock: '' });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-slate-200 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">{editingItem ? 'Edit' : 'Add'} Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitItem} className="space-y-4">
                      <div>
                        <Label className="text-slate-700 font-medium">Product Image</Label>
                        <div className="mt-2">
                          {formData.image && (
                            <div className="mb-3 relative">
                              <img src={formData.image} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                            </div>
                          )}
                          <Button
                            type="button"
                            onClick={() => document.getElementById('image-upload').click()}
                            disabled={uploadingImage}
                            className="btn-secondary w-full"
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Image
                              </>
                            )}
                          </Button>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            data-testid="item-name-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="h-12 rounded-xl border-slate-200 bg-slate-50"
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                          >
                            <SelectTrigger data-testid="item-category-input" className="h-12 rounded-xl border-slate-200 bg-slate-50">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Price ($)</Label>
                          <Input
                            data-testid="item-price-input"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                            className="h-12 rounded-xl border-slate-200 bg-slate-50"
                          />
                        </div>
                        <div>
                          <Label>Stock Count</Label>
                          <Input
                            data-testid="item-stock-input"
                            type="number"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                            className="h-12 rounded-xl border-slate-200 bg-slate-50"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Tags (comma separated)</Label>
                        <Input
                          data-testid="item-tags-input"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          placeholder="e.g. silk, traditional, wedding"
                          required
                          className="h-12 rounded-xl border-slate-200 bg-slate-50"
                        />
                      </div>
                      <Button data-testid="submit-item-btn" type="submit" className="btn-primary w-full">
                        {editingItem ? 'Update' : 'Add'} Item
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div data-testid="inventory-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInventory.map((item) => (
                  <motion.div 
                    key={item.id} 
                    data-testid={`inventory-item-${item.id}`} 
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-soft hover:shadow-floating transition-all"
                  >
                    <div className="h-48 bg-white flex items-center justify-center border-b border-slate-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain p-2"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                      <p className="text-sm text-slate-600 mb-2">{item.category}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags?.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold">${item.price}</span>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${item.stock > 5 ? 'bg-green-100 text-green-700' : item.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          Stock: {item.stock}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          data-testid={`edit-item-${item.id}`}
                          onClick={() => handleEdit(item)}
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          data-testid={`delete-item-${item.id}`}
                          onClick={() => handleDelete(item.id)}
                          size="sm"
                          variant="destructive"
                          className="flex-1 rounded-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  {searchQuery ? 'No items match your search.' : 'No items yet. Click "Add Item" to get started.'}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-3xl font-light">
                Analytics <span className="font-bold">Dashboard</span>
              </h2>
              
              {analytics && (
                <>
                  {/* Daily Trends */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                    <h3 className="text-xl font-bold mb-6">7-Day Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="visualizations" stroke="#0A0A0A" strokeWidth={2} name="Visualizations" />
                        <Line type="monotone" dataKey="leads" stroke="#64748B" strokeWidth={2} name="Leads" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category & Peak Hours */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                      <h3 className="text-xl font-bold mb-6">Category Performance</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="visualizations" fill="#0A0A0A" name="Visualizations" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                      <h3 className="text-xl font-bold mb-6">Peak Hours</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={peakHoursData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.hour}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {peakHoursData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Breakdown Table */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                    <h3 className="text-xl font-bold mb-6">Detailed Category Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold">Category</th>
                            <th className="text-right py-3 px-4 font-semibold">Items</th>
                            <th className="text-right py-3 px-4 font-semibold">Total Stock</th>
                            <th className="text-right py-3 px-4 font-semibold">Visualizations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(analytics.category_performance || {}).map((cat, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium">{cat}</td>
                              <td className="text-right py-3 px-4">{analytics.category_performance[cat].total_items}</td>
                              <td className="text-right py-3 px-4">{analytics.category_performance[cat].total_stock}</td>
                              <td className="text-right py-3 px-4 font-bold">{analytics.category_performance[cat].visualizations}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Business Insights */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-4">Business Insights</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-slate-300 mb-2">Conversion Rate</p>
                        <p className="text-3xl font-bold">{analytics.conversion_rate}%</p>
                        <p className="text-sm text-slate-400 mt-2">
                          {analytics.conversion_rate > 50 ? '🎉 Excellent! Above average' : 'Room for improvement'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-300 mb-2">Out of Stock</p>
                        <p className="text-3xl font-bold">{analytics.out_of_stock_count}</p>
                        <p className="text-sm text-slate-400 mt-2">
                          {analytics.out_of_stock_count > 0 ? '⚠️ Restock needed' : '✅ All stocked'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-300 mb-2">Busiest Hour</p>
                        <p className="text-3xl font-bold">{peakHoursData[0]?.hour || 'N/A'}</p>
                        <p className="text-sm text-slate-400 mt-2">Peak customer activity</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
