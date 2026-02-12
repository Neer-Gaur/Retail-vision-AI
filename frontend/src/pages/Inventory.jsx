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

const PLAN_LIMITS = {
  trial: 3,
  starter: 50,
  pro: 200,
  super: 999999
};

export default function Inventory() {
  const navigate = useNavigate();
  const { shop, refreshShop } = useAuthStore();
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

  const isTiles = (shop?.industry || '').toLowerCase().includes('tile');
  const categories = isTiles ? TILE_CATEGORIES : FASHION_CATEGORIES;
  const planKey = String(shop?.subscription_status || 'trial').toLowerCase();
  const planLimit = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.trial;
  const isPlanLimitReached = inventory.length >= planLimit;

  useEffect(() => {
    const initializeInventory = async () => {
      if (!shop) {
        await refreshShop();
      }
      if (shop?.id) {
        await loadInventory();
      }
    };
    initializeInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const loadInventory = async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Inventory load error:', error);
        toast.error('Failed to load inventory: ' + error.message);
      } else {
        setInventory(data || []);
      }
    } catch (error) {
      console.error('Inventory exception:', error);
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
    if (isPlanLimitReached) {
      toast.error(`Inventory limit reached (${planLimit} items). Upgrade your plan to add more.`);
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
      price: item.price?.toString?.() ?? String(item.price ?? ''),
      stock_count: item.stock_count?.toString?.() ?? String(item.stock_count ?? ''),
      tags: item.tags?.join(', ') || '',
      image_url: item.image_url || ''
    });
    setImagePreview(item.image_url);
    setShowAddDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (parseFloat(formData.price) < 0) {
      toast.error('Price cannot be negative');
      return;
    }
    if (parseInt(formData.stock_count) < 0) {
      toast.error('Stock cannot be negative');
      return;
    }
    if (!editingItem && !imageFile && !formData.image_url) {
      toast.error('Product image is required');
      return;
    }

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

      let savedId = editingItem?.id;

      if (editingItem) {
        const { error } = await supabase.from('inventory').update(itemData).eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Item updated');
      } else {
        const { data: ins, error } = await supabase.from('inventory').insert([itemData]).select('id').single();
        if (error) throw error;
        savedId = ins?.id;
        toast.success('Item added');
      }

      // Kick off garment asset extraction (best-effort)
      try {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const resp = await fetch(`${BACKEND_URL}/api/product-assets/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_image_url: imageUrl, category: itemData.category })
        });

        if (resp.ok) {
          const out = await resp.json();
          if (out?.status === 'success' && out.cutout_image && savedId) {
            const { uploadBase64Image } = await import('../lib/supabase');
            const cutoutUrl = await uploadBase64Image(out.cutout_image, 'product_assets');
            const maskUrl = out.mask_image ? await uploadBase64Image(out.mask_image, 'product_assets') : null;

            await supabase
              .from('inventory')
              .update({ garment_cutout_url: cutoutUrl, garment_mask_url: maskUrl, assets_status: 'ready' })
              .eq('id', savedId)
              .eq('shop_id', shop.id);
          }
        }
      } catch (e) {
        console.warn('product asset extraction failed:', e);
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
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory</h1>
          <p className="text-slate-400 mt-1">Manage your products and stock levels</p>
        </div>
        <Button
          onClick={openAddDialog}
          className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 border border-white/5"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Plan Limit Warning */}
      {(planKey === 'trial' || planKey === 'starter') && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-200">{planKey === 'trial' ? 'Trial Mode' : 'Starter Plan'}: {inventory.length}/{planLimit} inventory items used</p>
            <p className="text-xs text-amber-300/70">Upgrade your plan to increase your inventory limit.</p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/dashboard/subscription')}
            className="rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30"
          >
            Upgrade
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full md:w-96 mb-6 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-300 transition-colors" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 rounded-xl bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      ) : filteredInventory.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed"
        >
          <PackageOpen className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">No Products Yet</h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Add your first product to start showcasing.</p>
          <Button
            onClick={openAddDialog}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white border border-white/5"
          >
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
              className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden group hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/5 transition-all"
            >
              <div className="aspect-square bg-black/30 flex items-center justify-center relative overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <Package className="w-16 h-16 text-slate-600" />
                )}

                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${
                  item.stock_count > 0
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-300 border-red-500/30'
                }`}>
                  {item.stock_count > 0 ? `${item.stock_count} in stock` : 'Out of stock'}
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => openEditDialog(item)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 text-white"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 text-red-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 truncate">{item.name}</h3>
                <p className="text-sm text-slate-400 mb-2">{item.category}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-red-300">₹{item.price?.toLocaleString?.('en-IN') ?? item.price}</p>
                  {item.tags?.length > 0 && (
                    <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-full border border-white/5">{item.tags[0]}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Product Photo</Label>
              <div
                onClick={() => document.getElementById('img-upload').click()}
                className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-red-500/60 hover:bg-white/5 transition-colors"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                        setFormData({ ...formData, image_url: '' });
                      }}
                      className="absolute top-2 right-2 w-9 h-9 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">Click to upload</p>
                  </>
                )}
              </div>
              <input id="img-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                placeholder="Product name"
              />
            </div>

            <div className="relative z-[300]">
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white z-[300]">
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="focus:bg-white/10">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock_count}
                  onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })}
                  required
                  className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Tags (comma separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                placeholder="silk, wedding, premium"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 h-12 rounded-xl border-white/10 text-slate-200 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-white/5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? 'Update' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
