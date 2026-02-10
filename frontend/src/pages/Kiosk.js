import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, X, Check, Loader2, Share2, Upload, 
  SlidersHorizontal, ArrowUpDown, Sparkles, Eye, LogOut,
  Zap, Scan, Monitor, Maximize2
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

    if (!leadData.customer_name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    // Phone number validation (10 digits)
    const phoneDigits = leadData.whatsapp_number.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast.error('Please enter a valid 10-digit WhatsApp number');
      return;
    }

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

  // Client-side image preview generator (fallback when AI is unavailable)
  const generateClientSidePreview = async (customerPhotoUrl, productImageUrl) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const customerImg = new Image();
      customerImg.crossOrigin = 'anonymous';
      
      customerImg.onload = () => {
        // Set canvas size to customer image size
        canvas.width = customerImg.width;
        canvas.height = customerImg.height;
        
        // Draw customer photo as base
        ctx.drawImage(customerImg, 0, 0);
        
        // Load and overlay product image
        const productImg = new Image();
        productImg.crossOrigin = 'anonymous';
        
        productImg.onload = () => {
          // Calculate product overlay position (center-bottom, natural product size)
          const productWidth = canvas.width * 0.5;
          const productHeight = (productImg.height / productImg.width) * productWidth;
          const x = (canvas.width - productWidth) / 2;
          const y = canvas.height - productHeight - 20;
          
          // Apply semi-transparency for preview effect
          ctx.globalAlpha = 0.8;
          ctx.drawImage(productImg, x, y, productWidth, productHeight);
          
          // Convert to data URL - NO WATERMARK for clean look
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        
        productImg.onerror = () => reject(new Error('Failed to load product image'));
        productImg.src = productImageUrl;
      };
      
      customerImg.onerror = () => reject(new Error('Failed to load customer image'));
      customerImg.src = customerPhotoUrl;
    });
  };

  const handleVisualize = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    setVisualizing(true);
    setStep('visualize');

    try {
      // Immediately show the result screen with customer photo
      const initialResult = {
        product: selectedProduct,
        customer_photo: customerPhotoUrl,
        ai_image: null,
        status: 'processing',
        error: null
      };
      
      setResult(initialResult);
      setVisualizing(false);
      setStep('results');

      // Try AI first, fallback to client-side preview
      let visualizedImageUrl = null;
      let usePreviewMode = false;

      try {
        toast.info('Sending images to AI...');
        
        const BACKEND_URL = 'http://localhost:8001';
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

        if (response.ok) {
          const data = await response.json();
          const aiResult = data.results?.[0];

          if (aiResult?.result_image && aiResult.status === 'success') {
            toast.info('Saving AI result...');
            
            try {
              const { uploadBase64Image } = await import('../lib/supabase');
              visualizedImageUrl = await uploadBase64Image(aiResult.result_image, 'visualized_uploads');
              console.log('Visualization saved to:', visualizedImageUrl);
              toast.success('AI Visualization created!');
            } catch (uploadError) {
              console.error('Failed to upload visualization result:', uploadError);
              visualizedImageUrl = aiResult.result_image;
            }
          } else {
            throw new Error(aiResult?.error || 'AI generation failed');
          }
        } else {
          throw new Error('API request failed');
        }
      } catch (aiError) {
        console.log('AI failed, using preview mode:', aiError.message);
        toast.info('AI unavailable - Generating preview...');
        
        // Generate client-side preview
        try {
          const previewImage = await generateClientSidePreview(
            customerPhotoUrl,
            selectedProduct.image_url
          );
          visualizedImageUrl = previewImage;
          usePreviewMode = true;
          toast.success('Preview generated!');
        } catch (previewError) {
          console.error('Preview generation failed:', previewError);
          toast.warning('Using product preview');
        }
      }

      // Save visualization record to database
      await supabase
        .from('visualizations')
        .insert([{
          shop_id: shop.id,
          lead_id: leadId,
          input_photo_url: customerPhotoUrl,
          result_photo_url: visualizedImageUrl,
          items_compared: [selectedProduct.id]
        }]);

      // Update result with visualization
      setResult({
        product: selectedProduct,
        customer_photo: customerPhotoUrl,
        ai_image: visualizedImageUrl,
        status: visualizedImageUrl ? 'success' : 'failed',
        error: null,
        preview_mode: usePreviewMode
      });
      
    } catch (error) {
      console.error('Visualization error:', error);
      toast.error('Visualization failed. Please try again.');
      setResult({
        product: selectedProduct,
        customer_photo: customerPhotoUrl,
        ai_image: null,
        status: 'failed',
        error: error.message
      });
      setStep('results');
    } finally {
      setVisualizing(false);
    }
  };

  const handleRestart = () => {
    // Go back to gallery to select another product (keep customer photo and lead data)
    setStep('gallery');
    setSelectedProduct(null);
    setResult(null);
  };

  const handleExitSession = () => {
    // Confirm exit
    if (window.confirm('Exit kiosk session? This will clear all data.')) {
      // Clear everything and return to lead capture
      setStep('lead');
      setLeadData({ customer_name: '', whatsapp_number: '' });
      setLeadId(null);
      setCustomerPhotoUrl(null);
      setPhotoBase64(null);
      setSelectedProduct(null);
      setResult(null);
      resetFilters();
      toast.info('Session ended. Ready for new customer.');
    }
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
    <div className="h-screen w-full overflow-hidden bg-black text-white relative font-sans selection:bg-red-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-rose-900/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
      </div>

      {/* Logo for Exit (Admin) */}
      <motion.div
        ref={logoRef}
        onMouseDown={handleLogoMouseDown}
        onMouseUp={handleLogoMouseUp}
        onMouseLeave={handleLogoMouseUp}
        onTouchStart={handleLogoMouseDown}
        onTouchEnd={handleLogoMouseUp}
        className="absolute top-8 left-8 z-50 cursor-pointer select-none group"
        data-testid="kiosk-logo"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-transform">
          <Scan className="w-8 h-8 text-white" />
        </div>
        {longPressDuration > 0 && (
          <div className="absolute -bottom-4 left-0 w-14 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-100"
              style={{ width: `${(longPressDuration / 5000) * 100}%` }}
            />
          </div>
        )}
      </motion.div>

      {/* Exit Session Button (Customer) */}
      {step !== 'lead' && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleExitSession}
          className="absolute top-8 right-8 z-50 px-6 py-3 rounded-full bg-red-600/10 hover:bg-red-600 border border-red-500/30 flex items-center gap-3 backdrop-blur-md transition-all group"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-white" />
          <span className="text-red-400 font-semibold group-hover:text-white">Exit Session</span>
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        
        {/* STEP 1: Lead Capture */}
        {step === 'lead' && (
          <motion.div
            key="lead"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-full flex items-center justify-center p-8 relative z-10"
          >
            <div className="max-w-lg w-full">
              <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />
                
                <div className="text-center mb-10">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/30"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                    {shop?.shop_name}
                  </h1>
                  <p className="text-slate-400 text-lg">
                    Experience the Magic Mirror
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-base ml-1">Your Name</Label>
                    <Input
                      value={leadData.customer_name}
                      onChange={(e) => setLeadData({ ...leadData, customer_name: e.target.value })}
                      required
                      className="h-16 rounded-2xl bg-black/50 border-white/10 text-xl text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20 transition-all px-6"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-base ml-1">WhatsApp Number</Label>
                    <Input
                      type="tel"
                      value={leadData.whatsapp_number}
                      onChange={(e) => setLeadData({ ...leadData, whatsapp_number: e.target.value })}
                      required
                      className="h-16 rounded-2xl bg-black/50 border-white/10 text-xl text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20 transition-all px-6 font-mono"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-16 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xl font-bold shadow-lg shadow-red-600/20 mt-4 transition-all hover:scale-[1.02]"
                  >
                    Start Experience <ArrowUpDown className="ml-2 w-5 h-5 rotate-90" />
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
            className="h-full flex flex-col items-center justify-center p-8 relative z-10"
          >
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-10"
            >
              <h2 className="text-5xl font-bold text-white mb-4">Capture Your Look</h2>
              <p className="text-xl text-slate-400">
                {shop?.industry === 'fashion' 
                  ? 'Stand in front of the mirror for a perfect fit.'
                  : 'Capture the room to visualize new tiles.'}
              </p>
            </motion.div>

            {showCamera ? (
              <div className="relative w-full max-w-[600px] aspect-[3/4] bg-black rounded-[3rem] overflow-hidden border-8 border-zinc-800 shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                
                {/* Camera UI Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-8 right-8 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono text-red-500">LIVE</span>
                  </div>
                  
                  {/* Face Frame Guide */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[80%] h-[70%] border-2 border-white/20 rounded-[4rem] relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-white/30 rounded-full" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-32 h-1 bg-white/30 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 pointer-events-auto">
                  <button onClick={stopCamera} className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all">
                    <X className="w-8 h-8" />
                  </button>
                  <button
                    onClick={capturePhoto}
                    disabled={uploadingPhoto}
                    className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/10 transition-all group"
                  >
                    <div className="w-20 h-20 rounded-full bg-red-600 group-hover:scale-90 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 w-full max-w-md">
                <Button
                  onClick={startCamera}
                  disabled={uploadingPhoto}
                  className="h-24 rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 hover:scale-[1.02] transition-all text-white text-2xl font-bold shadow-2xl shadow-red-600/30 flex flex-col items-center justify-center gap-2"
                >
                  <Camera className="w-8 h-8" />
                  Open Camera
                </Button>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-black text-slate-500 uppercase tracking-widest font-semibold">Or upload</span>
                  </div>
                </div>

                <Button
                  onClick={() => document.getElementById('photo-upload').click()}
                  disabled={uploadingPhoto}
                  variant="outline"
                  className="h-20 rounded-3xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white text-xl"
                >
                  {uploadingPhoto ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Upload className="w-6 h-6 mr-3" />}
                  {uploadingPhoto ? 'Uploading...' : 'Upload from Device'}
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
            className="h-full overflow-y-auto hide-scrollbar relative z-10"
          >
            <div className="max-w-[1600px] mx-auto p-8 pt-24">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                <div>
                  <h2 className="text-5xl font-bold text-white mb-2">Select Style</h2>
                  <p className="text-slate-400 text-xl">Choose a product to visualize instantly.</p>
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="h-14 px-8 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 text-lg">
                    <SlidersHorizontal className="w-5 h-5 mr-3" /> Filters
                  </Button>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[200px] h-14 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 text-lg">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-10 overflow-hidden"
                  >
                    <div className="grid md:grid-cols-2 gap-10">
                      <div>
                        <Label className="text-slate-400 mb-6 block text-lg">
                          Price Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                        </Label>
                        <Slider 
                          min={0} max={maxPrice} step={100} value={priceRange} onValueChange={setPriceRange} 
                          className="py-4"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400 mb-4 block text-lg">Categories</Label>
                        <div className="flex flex-wrap gap-3">
                          {getAllCategories().map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                              className={`px-6 py-3 rounded-full text-base font-medium transition-all ${
                                selectedCategories.includes(cat) 
                                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mb-40">
                {filteredInventory.map((product) => (
                  <motion.div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative cursor-pointer rounded-[2rem] overflow-hidden bg-zinc-900/50 border-2 transition-all duration-300 ${
                      selectedProduct?.id === product.id 
                        ? 'border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)] scale-[1.02]' 
                        : 'border-white/5 hover:border-white/20 hover:shadow-2xl'
                    }`}
                  >
                    <div className="aspect-[4/5] relative p-6 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain drop-shadow-xl" />
                      ) : (
                        <Eye className="w-20 h-20 text-white/10" />
                      )}
                      
                      {selectedProduct?.id === product.id && (
                        <div className="absolute top-4 right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                          <Check className="w-7 h-7 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 bg-zinc-950/80 backdrop-blur-sm absolute bottom-0 inset-x-0 border-t border-white/5">
                      <h3 className="font-bold text-white text-lg truncate mb-1">{product.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">{product.category}</span>
                        <span className="text-red-400 font-bold text-xl">₹{product.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Floating Magic Button */}
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
                <Button
                  onClick={handleVisualize}
                  disabled={!selectedProduct}
                  className={`w-full h-20 rounded-full text-2xl font-bold transition-all shadow-2xl ${
                    selectedProduct 
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:scale-105 shadow-red-600/40' 
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className={`w-8 h-8 mr-3 ${selectedProduct ? 'animate-pulse' : ''}`} />
                  Visualize Now
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Visualizing (Loading) */}
        {step === 'visualize' && (
          <motion.div
            key="visualize"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center relative z-20"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-[100px] rounded-full" />
              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-4 border-white/10 border-t-red-500 mb-8"
                />
                <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">Processing Magic</h2>
                <p className="text-slate-400 text-xl animate-pulse">Analyzing fabric physics...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Results - Magic Mirror */}
        {step === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col relative z-10"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-8 z-30 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
              <div>
                <h2 className="text-4xl font-bold text-white mb-1">Your Look</h2>
                <p className="text-slate-300">{result.product.name}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRestart} variant="secondary" className="rounded-full h-12 px-6 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
                  Try Another
                </Button>
                <Button onClick={() => window.open(generateWhatsAppLink(), '_blank')} className="rounded-full h-12 px-6 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20">
                  <Share2 className="w-5 h-5 mr-2" /> Share
                </Button>
              </div>
            </div>

            {/* Split Screen View */}
            <div className="flex-1 grid md:grid-cols-2 h-full">
              {/* Original */}
              <div className="relative h-full border-r border-white/10 bg-black">
                <img src={result.customer_photo} className="w-full h-full object-cover opacity-60" />
                <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
                  <span className="text-slate-300 font-mono text-sm">ORIGINAL_INPUT</span>
                </div>
              </div>

              {/* AI Result */}
              <div className="relative h-full bg-black">
                {result.ai_image ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 1 }} 
                    className="w-full h-full relative"
                  >
                    <img src={result.ai_image} className="w-full h-full object-cover" />
                    
                    {/* Holographic Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Status Badge */}
                    <div className="absolute bottom-8 right-8 flex flex-col items-end gap-2">
                      <div className="bg-red-600/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg shadow-red-600/20 border border-red-500/50">
                        <span className="text-white font-bold tracking-widest text-sm flex items-center gap-2">
                          <Zap className="w-4 h-4 fill-white" /> AI ENHANCED
                        </span>
                      </div>
                      {result.preview_mode && (
                        <span className="text-xs text-amber-400 bg-black/50 px-2 py-1 rounded">Preview Mode</span>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col p-10 text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Generation Failed</h3>
                    <p className="text-slate-400">{result.error || "Could not generate visualization."}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Admin Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <Input
                type="password"
                maxLength="4"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-40 h-16 text-center text-4xl tracking-[0.5em] bg-black border-zinc-800 text-red-500 focus:border-red-500 rounded-xl"
                autoFocus
              />
            </div>
            <Button onClick={handlePinVerify} disabled={pin.length !== 4} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
              Unlock Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
