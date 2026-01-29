import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Plus, Edit2, Trash2, Upload, X, Loader2, 
  Search, PackageOpen, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '../store/authStore';
import { supabase, uploadImage } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const FASHION_CATEGORIES = ['Saree', 'Suit', 'Lehenga', 'Jeans', 'Top', 'Dress', 'Kurti', 'Shirt', 'Blazer', 'Other'];
const TILE_CATEGORIES = ['Floor Tiles', 'Wall Tiles', 'Bathroom Tiles', 'Kitchen Tiles', 'Outdoor Tiles', 'Mosaic', 'Marble', 'Granite', 'Other'];

const TRIAL_LIMIT = 3;

export default function Inventory() {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', category: '', price: '', stock_count: '', tags: '', image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = shop?.industry === 'fashion' ? FASHION_CATEGORIES : TILE_CATEGORIES;
  const isTrialLimitReached = shop?.subscription_status === 'trial' && inventory.length >= TRIAL_LIMIT;

  useEffect(() => {
    if (shop?.id) loadInventory();
  }, [shop?.id]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
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

  const openAddDialog = () => {
    if (isTrialLimitReached) {
      toast.error('Trial limit reached! Upgrade to add more products.');
      navigate('/dashboard/subscription');
      return;
    }
    resetForm();
    setShowAddDialog(true);
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
        const { error } = await supabase.from('inventory').update(itemData).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Item updated!');
      } else {
        const { error } = await supabase.from('inventory').insert([itemData]);
        if (error) throw error;
        toast.success('Item added!');
      }

      setShowAddDialog(false);
      resetForm();
      loadInventory();
    } catch (error) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      toast.success('Item deleted');
      loadInventory();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 mt-1">Manage your products and stock levels</p>
        </div>
        <Button onClick={openAddDialog} className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Trial Limit Warning */}
      {shop?.subscription_status === 'trial' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Trial Mode: {inventory.length}/{TRIAL_LIMIT} products used
            </p>
            <p className="text-xs text-amber-600">Upgrade to add unlimited products</p>
          </div>
          <Button size="sm" onClick={() => navigate('/dashboard/subscription')} className="rounded-full bg-amber-600 hover:bg-amber-700 text-white">
            Upgrade Now
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative w-80 mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl border-slate-200"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : filteredInventory.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <PackageOpen className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No Products Yet</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Add your first product to start selling</p>
          <Button onClick={openAddDialog} className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add First Product
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredInventory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:border-violet-300 hover:shadow-lg transition-all"
            >
              <div className="aspect-square bg-slate-50 flex items-center justify-center relative">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain p-4" />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                  item.stock_count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.stock_count > 0 ? `${item.stock_count} in stock` : 'Out of stock'}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => openEditDialog(item)} className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-violet-50 text-violet-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1 truncate">{item.name}</h3>
                <p className="text-sm text-slate-500 mb-2">{item.category}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-violet-600">₹{item.price?.toLocaleString('en-IN')}</p>
                  {item.tags?.length > 0 && (
                    <span className="text-xs bg-violet-50 text-violet-600 px-2 py-1 rounded-full">{item.tags[0]}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm font-medium mb-2 block">Product Photo</Label>
              <div onClick={() => document.getElementById('img-upload').click()} className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setFormData({ ...formData, image_url: '' }); }} className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <><Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" /><p className="text-slate-500">Click to upload</p></>
                )}
              </div>
              <input id="img-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-12 rounded-xl" placeholder="Product name" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Price (₹)</Label>
                <Input type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="h-12 rounded-xl" placeholder="0" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Stock</Label>
                <Input type="number" min="0" value={formData.stock_count} onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })} required className="h-12 rounded-xl" placeholder="0" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Tags (comma separated)</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="h-12 rounded-xl" placeholder="silk, wedding, premium" />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1 h-12 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? 'Update' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
