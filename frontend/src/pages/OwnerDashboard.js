import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, LogOut, Plus, BarChart3, Package, Rocket, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { inventoryAPI, analyticsAPI, leadsAPI } from '@/services/api';
import { toast } from 'sonner';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const industry = localStorage.getItem('industry');
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
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
    <div className="min-h-screen bg-[#0F172A] text-white noise-bg">
      <nav className="border-b border-white/10 backdrop-blur-xl bg-black/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-[#F97316]" />
            <span className="text-2xl font-bold">Dashboard</span>
          </div>

          <div className="flex gap-4">
            <Button
              data-testid="launch-kiosk-btn"
              onClick={handleLaunchKiosk}
              className="btn-primary bg-[#F97316] hover:bg-[#F97316]/90"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch Kiosk
            </Button>
            <Button
              data-testid="owner-logout-btn"
              onClick={handleLogout}
              variant="ghost"
              className="hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="bg-white/5">
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold admin-heading">{itemLabel.toUpperCase()} INVENTORY</h2>
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
                <DialogContent className="bg-[#1E293B] border-white/10">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit' : 'Add'} {itemLabel}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitItem} className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        data-testid="item-name-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        data-testid="item-image-input"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        required
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        data-testid="item-category-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        className="bg-white/5 border-white/10"
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
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div>
                      <Label>Tags (comma separated)</Label>
                      <Input
                        data-testid="item-tags-input"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        required
                        className="bg-white/5 border-white/10"
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
                        className="bg-white/5 border-white/10"
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
                <div key={item.id} data-testid={`inventory-item-${item.id}`} className="glass-card rounded-2xl overflow-hidden">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{item.category}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold text-[#F97316]">${item.price}</span>
                      <span className={`text-sm ${item.stock > 0 ? 'text-[#00FF94]' : 'text-red-500'}`}>
                        Stock: {item.stock}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        data-testid={`edit-item-${item.id}`}
                        onClick={() => handleEdit(item)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        data-testid={`delete-item-${item.id}`}
                        onClick={() => handleDelete(item.id)}
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {inventory.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No items yet. Click "Add {itemLabel}" to get started.
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <h2 className="text-3xl font-bold admin-heading mb-6">ANALYTICS HUB</h2>
            
            {analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div data-testid="analytics-visualizations" className="glass-card p-6 rounded-2xl">
                    <p className="text-sm text-gray-400 mono-label mb-2">TOTAL VISUALIZATIONS</p>
                    <p className="text-4xl font-bold">{analytics.total_visualizations || 0}</p>
                  </div>
                  <div data-testid="analytics-leads" className="glass-card p-6 rounded-2xl">
                    <p className="text-sm text-gray-400 mono-label mb-2">CUSTOMER LEADS</p>
                    <p className="text-4xl font-bold">{analytics.total_leads || 0}</p>
                  </div>
                </div>

                <div data-testid="most-visualized-products" className="glass-card p-6 rounded-2xl">
                  <h3 className="text-2xl font-bold mb-4 admin-heading">MOST VISUALIZED PRODUCTS</h3>
                  <div className="space-y-4">
                    {analytics.most_visualized?.map((item, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{item.product.name}</h4>
                          <p className="text-sm text-gray-400">{item.product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#F97316]">{item.visualization_count}</p>
                          <p className="text-xs text-gray-400">visualizations</p>
                        </div>
                      </div>
                    ))}
                    {analytics.most_visualized?.length === 0 && (
                      <p className="text-gray-400 text-center py-4">No visualization data yet</p>
                    )}
                  </div>
                </div>

                <div data-testid="leads-list" className="glass-card p-6 rounded-2xl">
                  <h3 className="text-2xl font-bold mb-4 admin-heading">CUSTOMER LEADS</h3>
                  <div className="space-y-3">
                    {leads.map((lead) => (
                      <div key={lead.id} className="bg-white/5 rounded-xl p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">{lead.name}</p>
                            <p className="text-sm text-gray-400">{lead.whatsapp}</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <p className="text-gray-400 text-center py-4">No leads captured yet</p>
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