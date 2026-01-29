import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, X, Check, Loader2, Share2, Upload, 
  SlidersHorizontal, ArrowUpDown, Sparkles, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuthStore } from '../store/authStore';
import { supabase, uploadBase64Image } from '../lib/supabase';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function Kiosk() {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const logoRef = useRef(null);
  const videoRef = useRef(null);
  const longPressTimer = useRef(null);
  const [longPressDuration, setLongPressDuration] = useState(0);
  const [stream, setStream] = useState(null);
  
  // States
  const [step, setStep] = useState('lead');
  const [leadData, setLeadData] = useState({ customer_name: '', whatsapp_number: '' });
  const [leadId, setLeadId] = useState(null);
  const [customerPhotoUrl, setCustomerPhotoUrl] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [visualizing, setVisualizing] = useState(false);
  const [result, setResult] = useState(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Filter & Sort States
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [maxPrice, setMaxPrice] = useState(100000);

  useEffect(() => {
    document.documentElement.requestFullscreen?.();
    if (shop?.id) {
      loadInventory();
    }
    
    return () => {
      stopCamera();
    };
  }, [shop?.id]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [inventory, priceRange, selectedTags, selectedCategories, sortBy]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('shop_id', shop.id)
        .gt('stock_count', 0) // Only in-stock items
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInventory(data || []);
      
      // Calculate max price
      const max = Math.max(...(data || []).map(item => item.price), 100000);
      setMaxPrice(max);
      setPriceRange([0, max]);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const getAllTags = () => {
    const tags = new Set();
    inventory.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const getAllCategories = () => {
    const categories = new Set();
    inventory.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...inventory];

    filtered = filtered.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item =>
        selectedCategories.includes(item.category)
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags?.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    setFilteredInventory(filtered);
  };

  const resetFilters = () => {
    setPriceRange([0, maxPrice]);
    setSelectedTags([]);
    setSelectedCategories([]);
    setSortBy('name');
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoBase64(dataUrl);
    stopCamera();
    
    // Upload to Supabase
    setUploadingPhoto(true);
    try {
      const uploadedUrl = await uploadBase64Image(dataUrl, 'customer-uploads');
      setCustomerPhotoUrl(uploadedUrl);
      setStep('gallery');
      toast.success('Photo captured! Select a product to try');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      setPhotoBase64(reader.result);
      try {
        const uploadedUrl = await uploadBase64Image(reader.result, 'customer-uploads');
        setCustomerPhotoUrl(uploadedUrl);
        setStep('gallery');
        toast.success('Photo uploaded! Select a product to try');
      } catch (error) {
        toast.error('Failed to upload photo');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          shop_id: shop.id,
          customer_name: leadData.customer_name,
          whatsapp_number: leadData.whatsapp_number
        }])
        .select()
        .single();
      
      if (error) throw error;
      setLeadId(data.id);
      setStep('camera');
      toast.success('Welcome! Let\'s capture your photo');
    } catch (error) {
      toast.error('Failed to save your information');
    }
  };

  const handleVisualize = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    setVisualizing(true);
    setStep('visualize');

    try {
      // Call backend AI visualization API
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/visualize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_photo_url: customerPhotoUrl,
          product_image_urls: [selectedProduct.image_url],
          product_names: [selectedProduct.name],
          industry: shop?.industry || 'fashion'
        })
      });

      let aiResult = null;
      let resultImageUrl = null;
      
      if (response.ok) {
        const data = await response.json();
        aiResult = data.results?.[0] || null;
        
        // If AI generated an image, upload it to Supabase storage
        if (aiResult?.result_image && aiResult.status === 'success') {
          try {
            const { uploadBase64Image } = await import('../lib/supabase');
            resultImageUrl = await uploadBase64Image(aiResult.result_image, 'customer-uploads');
          } catch (uploadError) {
            console.error('Failed to upload result image:', uploadError);
            // Still use the base64 image if upload fails
            resultImageUrl = aiResult.result_image;
          }
        }
      }

      // Save visualization record with correct column names
      await supabase
        .from('visualizations')
        .insert([{
          shop_id: shop.id,
          lead_id: leadId,
          input_photo_url: customerPhotoUrl,
          result_photo_url: resultImageUrl || null,
          items_compared: [selectedProduct.id]
        }]);

      setResult({
        product: selectedProduct,
        ai_image: resultImageUrl || aiResult?.result_image || null,
        status: aiResult?.status || 'failed',
        error: aiResult?.error || null
      });
      setStep('results');
    } catch (error) {
      console.error('Visualization error:', error);
      toast.error('Visualization failed. Please try again.');
      setStep('gallery');
    } finally {
      setVisualizing(false);
    }
  };

  const handleRestart = () => {
    setStep('lead');
    setLeadData({ customer_name: '', whatsapp_number: '' });
    setLeadId(null);
    setCustomerPhotoUrl(null);
    setPhotoBase64(null);
    setSelectedProduct(null);
    setResult(null);
    resetFilters();
  };

  const handleLogoMouseDown = () => {
    longPressTimer.current = setInterval(() => {
      setLongPressDuration(prev => {
        const newDuration = prev + 100;
        if (newDuration >= 5000) {
          clearInterval(longPressTimer.current);
          setShowPinDialog(true);
          return 0;
        }
        return newDuration;
      });
    }, 100);
  };

  const handleLogoMouseUp = () => {
    clearInterval(longPressTimer.current);
    setLongPressDuration(0);
  };

  const handlePinVerify = async () => {
    if (pin === shop?.admin_pin) {
      document.exitFullscreen?.();
      navigate('/dashboard');
    } else {
      toast.error('Invalid PIN');
      setPin('');
    }
  };

  const generateWhatsAppLink = () => {
    const message = encodeURIComponent(
      `Hi! I just tried ${selectedProduct?.name} at ${shop?.shop_name}. Check it out!`
    );
    return `https://wa.me/${leadData.whatsapp_number?.replace(/\D/g, '')}?text=${message}`;
  };

  const overlayType = shop?.industry === 'fashion' ? 'silhouette' : 'grid';

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
      {/* Logo for Exit */}
      <motion.div
        ref={logoRef}
        onMouseDown={handleLogoMouseDown}
        onMouseUp={handleLogoMouseUp}
        onMouseLeave={handleLogoMouseUp}
        onTouchStart={handleLogoMouseDown}
        onTouchEnd={handleLogoMouseUp}
        className="absolute top-6 left-6 z-50 cursor-pointer select-none"
        data-testid="kiosk-logo"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        {longPressDuration > 0 && (
          <div className="absolute -bottom-2 left-0 w-12 h-1 bg-slate-200 rounded overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded transition-all"
              style={{ width: `${(longPressDuration / 5000) * 100}%` }}
            />
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Lead Capture */}
        {step === 'lead' && (
          <motion.div
            key="lead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex items-center justify-center p-8"
            data-testid="lead-capture-step"
          >
            <div className="max-w-md w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-3xl blur-xl opacity-30" />
              <div className="relative bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Welcome to {shop?.shop_name}
                  </h1>
                  <p className="text-slate-500">
                    Enter your details to start
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-5">
                  <div>
                    <Label className="text-slate-700 mb-2 block">Your Name</Label>
                    <Input
                      data-testid="lead-name-input"
                      value={leadData.customer_name}
                      onChange={(e) => setLeadData({ ...leadData, customer_name: e.target.value })}
                      required
                      className="h-14 rounded-xl border-slate-200 text-lg"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2 block">WhatsApp Number</Label>
                    <Input
                      data-testid="lead-whatsapp-input"
                      type="tel"
                      value={leadData.whatsapp_number}
                      onChange={(e) => setLeadData({ ...leadData, whatsapp_number: e.target.value })}
                      required
                      className="h-14 rounded-xl border-slate-200 text-lg"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <Button
                    data-testid="lead-submit-btn"
                    type="submit"
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg font-semibold shadow-lg shadow-violet-200"
                  >
                    Continue
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Camera */}
        {step === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8"
            data-testid="camera-step"
          >
            <h2 className="text-4xl font-bold mb-2 text-center">Capture Your Photo</h2>
            <p className="text-slate-400 mb-8 text-center max-w-xl">
              {shop?.industry === 'fashion' 
                ? 'Take a photo to see how products look on you'
                : 'Capture the space to visualize tiles'}
            </p>

            {showCamera ? (
              <div className="relative w-full max-w-2xl aspect-[3/4] bg-black rounded-3xl overflow-hidden mb-8">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {overlayType === 'silhouette' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-1/2 h-5/6 opacity-30" viewBox="0 0 200 400" fill="white">
                      <ellipse cx="100" cy="80" rx="50" ry="60" />
                      <rect x="60" y="130" width="80" height="150" rx="10" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                  <Button onClick={stopCamera} variant="outline" className="rounded-full h-12 px-6 bg-white/10 border-white/20 text-white">
                    Cancel
                  </Button>
                  <Button
                    onClick={capturePhoto}
                    disabled={uploadingPhoto}
                    className="rounded-full h-12 px-8 bg-white text-black hover:bg-slate-200"
                  >
                    {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Camera className="w-5 h-5 mr-2" /> Capture</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full max-w-md">
                <Button
                  onClick={startCamera}
                  disabled={uploadingPhoto}
                  className="h-16 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg font-semibold"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Open Camera
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-950 text-slate-500">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => document.getElementById('photo-upload').click()}
                  disabled={uploadingPhoto}
                  variant="outline"
                  className="h-16 rounded-xl border-slate-700 text-white text-lg"
                >
                  {uploadingPhoto ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Upload className="w-6 h-6 mr-3" />}
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <input id="photo-upload" type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3: Gallery */}
        {step === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-y-auto hide-scrollbar"
            data-testid="gallery-step"
          >
            <div className="max-w-7xl mx-auto p-8 pt-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white">Select a Product</h2>
                  <p className="text-slate-300 mt-2">Choose one item to visualize</p>
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="rounded-full h-12 px-6 border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700">
                    <SlidersHorizontal className="w-5 h-5 mr-2" /> Filters
                  </Button>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] h-12 rounded-full border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="name" className="text-white hover:bg-slate-700">Name</SelectItem>
                      <SelectItem value="price-low" className="text-white hover:bg-slate-700">Price: Low to High</SelectItem>
                      <SelectItem value="price-high" className="text-white hover:bg-slate-700">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-8 overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">Filters</h3>
                      <Button onClick={resetFilters} variant="ghost" className="text-sm text-slate-300 hover:text-white">Reset All</Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm text-slate-300 mb-4 block">
                          Price: ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
                        </Label>
                        <Slider min={0} max={maxPrice} step={100} value={priceRange} onValueChange={setPriceRange} />
                      </div>
                      
                      <div>
                        <Label className="text-sm text-slate-300 mb-4 block">Categories</Label>
                        <div className="flex flex-wrap gap-2">
                          {getAllCategories().map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategories(prev => 
                                prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                              )}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedCategories.includes(cat) ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-32">
                {filteredInventory.map((product) => (
                  <motion.div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative cursor-pointer rounded-2xl overflow-hidden bg-slate-800/80 backdrop-blur-sm border-2 transition-all ${
                      selectedProduct?.id === product.id 
                        ? 'border-violet-500 ring-4 ring-violet-500/30 shadow-xl shadow-violet-500/20' 
                        : 'border-slate-700 hover:border-slate-600 hover:shadow-lg'
                    }`}
                  >
                    <div className="aspect-square bg-white/5 flex items-center justify-center">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain p-4" />
                      ) : (
                        <Eye className="w-16 h-16 text-slate-600" />
                      )}
                    </div>
                    {selectedProduct?.id === product.id && (
                      <div className="absolute top-4 right-4 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="p-4 bg-slate-900/50">
                      <h3 className="font-semibold text-white truncate">{product.name}</h3>
                      <p className="text-sm text-slate-300 mb-2">{product.category}</p>
                      <p className="text-lg font-bold text-violet-400">₹{product.price?.toLocaleString('en-IN')}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                  <p className="text-xl">No products available</p>
                </div>
              )}

              {/* Floating Action Button */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <Button
                  onClick={handleVisualize}
                  disabled={!selectedProduct}
                  className="h-16 px-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg font-semibold shadow-2xl shadow-violet-500/30"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Visualize Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Visualizing */}
        {step === 'visualize' && (
          <motion.div
            key="visualize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-4 border-violet-500/30 border-t-violet-500 mx-auto mb-8"
              />
              <h2 className="text-4xl font-bold mb-4">Creating Your Visualization</h2>
              <p className="text-slate-400 text-lg">AI is working its magic...</p>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Results */}
        {step === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full p-8 pt-20 overflow-y-auto hide-scrollbar"
          >
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-2">Your Visualization</h2>
                <p className="text-slate-400">See how {result.product.name} looks on you</p>
              </div>

              <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold">{result.product.name}</h3>
                  {result.ai_image && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">AI Generated</span>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-400 mb-3">Your Photo</p>
                    <div className="rounded-2xl overflow-hidden bg-slate-800 aspect-[3/4]">
                      <img src={customerPhotoUrl} alt="You" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-3">{result.ai_image ? 'AI Visualization' : 'Product'}</p>
                    <div className="rounded-2xl overflow-hidden bg-slate-800 aspect-[3/4] flex items-center justify-center">
                      {result.ai_image ? (
                        <img src={result.ai_image} alt="Result" className="w-full h-full object-cover" />
                      ) : (
                        <img src={result.product.image_url} alt="Product" className="max-w-full max-h-full object-contain p-4" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Share */}
              <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 text-center">
                <h3 className="text-2xl font-semibold mb-6">Share Your Experience</h3>
                
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG value={generateWhatsAppLink()} size={160} />
                  </div>
                  <p className="text-slate-400">Scan to share via WhatsApp</p>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => window.open(generateWhatsAppLink(), '_blank')}
                      className="h-14 px-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg font-semibold"
                    >
                      <Share2 className="w-5 h-5 mr-3" /> Share to WhatsApp
                    </Button>
                    <Button onClick={handleRestart} variant="outline" className="h-14 px-8 rounded-full border-slate-700 text-white text-lg">
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Enter Admin PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit PIN"
              className="h-14 rounded-xl bg-slate-800 border-slate-700 text-center text-2xl tracking-widest text-white"
            />
            <div className="flex gap-4">
              <Button onClick={() => { setShowPinDialog(false); setPin(''); }} variant="outline" className="flex-1 h-12 rounded-xl border-slate-700 text-white">
                Cancel
              </Button>
              <Button onClick={handlePinVerify} disabled={pin.length !== 4} className="flex-1 h-12 rounded-xl bg-violet-600 text-white">
                Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
