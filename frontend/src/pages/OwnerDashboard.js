import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, LogOut, Plus, BarChart3, Package, Rocket, Edit2, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { inventoryAPI, analyticsAPI, leadsAPI } from '@/services/api';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

  const itemLabel = industry === 'fashion' ? 'Saree' : 'Tile';

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
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 rounded-full p-1">
            <TabsTrigger value="inventory" data-testid="tab-inventory" className="rounded-full">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics" className="rounded-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-light">
                {itemLabel} <span className="font-bold">Inventory</span>
              </h2>
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
                    Add {itemLabel}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-slate-200">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{editingItem ? 'Edit' : 'Add'} {itemLabel}</DialogTitle>
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
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => document.getElementById('image-upload').click()}
                            disabled={uploadingImage}
                            className="btn-secondary flex-1"
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
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
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
                      <Input
                        data-testid="item-category-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        className="h-12 rounded-xl border-slate-200 bg-slate-50"
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
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
                      <Label>Tags (comma separated)</Label>
                      <Input
                        data-testid="item-tags-input"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
                    <Button data-testid="submit-item-btn" type="submit" className="btn-primary w-full">
                      {editingItem ? 'Update' : 'Add'} {itemLabel}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div data-testid="inventory-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => (
                <motion.div 
                  key={item.id} 
                  data-testid={`inventory-item-${item.id}`} 
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-soft hover:shadow-floating transition-all"
                >
                  <div className="h-48 overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                    <p className="text-sm text-slate-600 mb-2">{item.category}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold">${item.price}</span>
                      <span className={`text-sm font-medium ${item.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
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

            {inventory.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No items yet. Click "Add {itemLabel}" to get started.
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <h2 className="text-3xl font-light mb-6">
              Analytics <span className="font-bold">Hub</span>
            </h2>
            
            {analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div data-testid="analytics-visualizations" className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                    <p className="text-sm text-slate-500 font-medium mb-2">TOTAL VISUALIZATIONS</p>
                    <p className="text-4xl font-bold">{analytics.total_visualizations || 0}</p>
                  </div>
                  <div data-testid="analytics-leads" className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                    <p className="text-sm text-slate-500 font-medium mb-2">CUSTOMER LEADS</p>
                    <p className="text-4xl font-bold">{analytics.total_leads || 0}</p>
                  </div>
                </div>

                <div data-testid="most-visualized-products" className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                  <h3 className="text-2xl font-bold mb-4">Most Visualized Products</h3>
                  <div className="space-y-4">
                    {analytics.most_visualized?.map((item, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-100">
                        <div>
                          <h4 className="font-semibold">{item.product.name}</h4>
                          <p className="text-sm text-slate-600">{item.product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{item.visualization_count}</p>
                          <p className="text-xs text-slate-500">visualizations</p>
                        </div>
                      </div>
                    ))}
                    {analytics.most_visualized?.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No visualization data yet</p>
                    )}
                  </div>
                </div>

                <div data-testid="leads-list" className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                  <h3 className="text-2xl font-bold mb-4">Customer Leads</h3>
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div key={lead.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">{lead.name}</p>
                            <p className="text-sm text-slate-600">{lead.whatsapp}</p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No leads captured yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
