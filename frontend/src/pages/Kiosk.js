import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, X, Check, Loader2, Share2, Eye, Upload, 
  SlidersHorizontal, ArrowUpDown, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAuthStore } from '../store/authStore';
import { 
  inventoryAPI, leadsAPI, visualizationsAPI, shopAPI, 
  uploadBase64Image 
} from '../lib/supabase';
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
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [visualizing, setVisualizing] = useState(false);
  const [results, setResults] = useState(null);
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
      const data = await inventoryAPI.getAll(shop.id, true); // kiosk mode = true (only in-stock items)
      setInventory(data);
      
      // Calculate max price
      const max = Math.max(...data.map(item => item.price), 100000);
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

    // Price filter
    filtered = filtered.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item =>
        selectedCategories.includes(item.category)
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags?.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
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

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoBase64(dataUrl);
    setPhotoUrl(dataUrl);
    stopCamera();
    setStep('gallery');
    toast.success('Photo captured! Select products to try');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
      setPhotoUrl(reader.result);
      setStep('gallery');
      setUploadingPhoto(false);
      toast.success('Photo uploaded! Select products to try');
    };
    reader.readAsDataURL(file);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      const lead = await leadsAPI.create({
        shop_id: shop.id,
        customer_name: leadData.customer_name,
        whatsapp_number: leadData.whatsapp_number
      });
      setLeadId(lead.id);
      setStep('camera');
      toast.success('Welcome! Let\'s capture your photo');
    } catch (error) {
      toast.error('Failed to save your information');
    }
  };

  const toggleProductSelection = (product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product]);
    } else {
      toast.error('Maximum 3 products can be selected');
    }
  };

  const handleVisualize = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    setVisualizing(true);
    setStep('visualize');

    try {
      // Upload the customer photo to Supabase storage
      let uploadedPhotoUrl = photoUrl;
      if (photoBase64) {
        uploadedPhotoUrl = await uploadBase64Image(photoBase64, 'customer-uploads');
      }

      // Call AI visualization API
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/visualize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_photo_url: uploadedPhotoUrl,
          product_image_urls: selectedProducts.map(p => p.image_url),
          product_names: selectedProducts.map(p => p.name),
          industry: shop?.industry || 'fashion'
        })
      });

      let aiResults = [];
      
      if (response.ok) {
        const data = await response.json();
        aiResults = data.results || [];
      } else {
        // Fallback to showing product images if AI fails
        aiResults = selectedProducts.map(product => ({
          product_name: product.name,
          product_image: product.image_url,
          result_image: null,
          status: 'failed',
          error: 'AI service unavailable'
        }));
      }

      // Save visualization record
      await visualizationsAPI.create({
        shop_id: shop.id,
        lead_id: leadId,
        input_photo_url: uploadedPhotoUrl,
        result_photo_url: aiResults[0]?.result_image || null,
        items_compared: selectedProducts.map(p => p.id)
      });

      setResults(aiResults);
      setStep('results');
    } catch (error) {
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
    setPhotoUrl(null);
    setPhotoBase64(null);
    setSelectedProducts([]);
    setResults(null);
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
    try {
      const isValid = await shopAPI.verifyPin(shop.id, pin);
      if (isValid) {
        document.exitFullscreen?.();
        navigate('/dashboard');
      } else {
        toast.error('Invalid PIN');
        setPin('');
      }
    } catch (error) {
      toast.error('Verification failed');
      setPin('');
    }
  };

  const generateWhatsAppLink = () => {
    const message = encodeURIComponent(
      `Hi! I just tried products at ${shop?.shop_name}. Check out my visualizations!`
    );
    return `https://wa.me/${leadData.whatsapp_number?.replace(/\D/g, '')}?text=${message}`;
  };

  const overlayType = shop?.industry === 'fashion' ? 'silhouette' : 'grid';

  return (
    <div className="h-screen w-full overflow-hidden bg-white text-slate-900 relative">
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
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        {longPressDuration > 0 && (
          <div className="absolute -bottom-2 left-0 w-12 h-1 bg-slate-200 rounded overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded transition-all"
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
            className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white"
            data-testid="lead-capture-step"
          >
            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome to {shop?.shop_name}
                </h1>
                <p className="text-slate-600">
                  Enter your details to start your visualization journey
                </p>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-slate-700 mb-2 block font-medium">
                    Your Name
                  </Label>
                  <Input
                    data-testid="lead-name-input"
                    id="name"
                    value={leadData.customer_name}
                    onChange={(e) => setLeadData({ ...leadData, customer_name: e.target.value })}
                    required
                    className="h-14 rounded-xl border-slate-200 bg-slate-50 text-lg"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-slate-700 mb-2 block font-medium">
                    WhatsApp Number
                  </Label>
                  <Input
                    data-testid="lead-whatsapp-input"
                    id="whatsapp"
                    type="tel"
                    value={leadData.whatsapp_number}
                    onChange={(e) => setLeadData({ ...leadData, whatsapp_number: e.target.value })}
                    required
                    className="h-14 rounded-xl border-slate-200 bg-slate-50 text-lg"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <Button
                  data-testid="lead-submit-btn"
                  type="submit"
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg font-semibold"
                >
                  Continue
                </Button>
              </form>
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
            className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white"
            data-testid="camera-step"
          >
            <h2 className="text-4xl font-bold mb-2 text-center">
              Capture Your Photo
            </h2>
            <p className="text-slate-600 mb-8 text-center max-w-xl">
              {shop?.industry === 'fashion' 
                ? 'Take a photo or upload from your device to see how products look on you'
                : 'Capture the space or upload an image to visualize tiles'}
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
                      <path d="M 60 280 L 80 380 L 70 400 L 50 400 L 40 380 Z" />
                      <path d="M 140 280 L 120 380 L 130 400 L 150 400 L 160 380 Z" />
                    </svg>
                  </div>
                )}
                {overlayType === 'grid' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full opacity-30" viewBox="0 0 400 400">
                      {[...Array(10)].map((_, i) => (
                        <React.Fragment key={i}>
                          <line x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="white" strokeWidth="1" />
                          <line x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="white" strokeWidth="1" />
                        </React.Fragment>
                      ))}
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="rounded-full h-12 px-6 bg-white/20 backdrop-blur-xl text-white border-white/30"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={capturePhoto}
                    className="rounded-full h-12 px-8 bg-white text-black hover:bg-slate-100"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Capture
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full max-w-md">
                <Button
                  data-testid="camera-trigger-btn"
                  onClick={startCamera}
                  disabled={uploadingPhoto}
                  className="h-16 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg font-semibold"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Open Camera
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => document.getElementById('photo-upload').click()}
                  disabled={uploadingPhoto}
                  variant="outline"
                  className="h-16 rounded-xl text-lg font-semibold"
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mr-3" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
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
            className="h-full overflow-y-auto hide-scrollbar bg-gradient-to-br from-slate-50 to-white"
            data-testid="gallery-step"
          >
            <div className="max-w-7xl mx-auto p-8 pt-20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-4xl font-bold">
                    Select Products
                  </h2>
                  <p className="text-slate-600 mt-2">
                    Choose up to 3 items to visualize ({selectedProducts.length}/3)
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="rounded-full h-12 px-6"
                  >
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Filters
                  </Button>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] h-12 rounded-full">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
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
                    className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">Filters</h3>
                      <Button onClick={resetFilters} variant="ghost" className="text-sm">
                        Reset All
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium mb-4 block">
                          Price Range: ₹{priceRange[0].toLocaleString('en-IN')} - ₹{priceRange[1].toLocaleString('en-IN')}
                        </Label>
                        <Slider
                          min={0}
                          max={maxPrice}
                          step={100}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="mb-4"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium mb-4 block">Categories</Label>
                        <div className="flex flex-wrap gap-2">
                          {getAllCategories().map(category => (
                            <button
                              key={category}
                              onClick={() => {
                                if (selectedCategories.includes(category)) {
                                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                                } else {
                                  setSelectedCategories([...selectedCategories, category]);
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedCategories.includes(category)
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {getAllTags().length > 0 && (
                      <div className="mt-6">
                        <Label className="text-sm font-medium mb-4 block">Tags/Materials</Label>
                        <div className="flex flex-wrap gap-2">
                          {getAllTags().map(tag => (
                            <button
                              key={tag}
                              onClick={() => {
                                if (selectedTags.includes(tag)) {
                                  setSelectedTags(selectedTags.filter(t => t !== tag));
                                } else {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedTags.includes(tag)
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-32">
                {filteredInventory.map((product) => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  return (
                    <motion.div
                      key={product.id}
                      data-testid={`product-${product.id}`}
                      onClick={() => toggleProductSelection(product)}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative cursor-pointer rounded-2xl overflow-hidden bg-white border-2 transition-all ${
                        isSelected 
                          ? 'border-violet-600 shadow-xl ring-4 ring-violet-100' 
                          : 'border-slate-100 hover:border-slate-300 shadow-md'
                      }`}
                    >
                      <div className="aspect-square bg-slate-50 flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="max-w-full max-h-full object-contain p-4"
                          />
                        ) : (
                          <Eye className="w-16 h-16 text-slate-300" />
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{product.category}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-violet-600">₹{product.price.toLocaleString('en-IN')}</p>
                          {product.tags?.length > 0 && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                              {product.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-xl">No products match your filters.</p>
                  <Button onClick={resetFilters} variant="link" className="mt-2">
                    Reset filters
                  </Button>
                </div>
              )}

              {/* Floating Action Button */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
                <Button
                  data-testid="visualize-btn"
                  onClick={handleVisualize}
                  disabled={selectedProducts.length === 0}
                  className="h-16 px-12 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg font-semibold shadow-2xl"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Visualize Now ({selectedProducts.length})
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
            className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-white"
            data-testid="visualizing-step"
          >
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mx-auto">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-violet-200 mx-auto animate-ping" />
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Creating Your Visualizations
              </h2>
              <p className="text-slate-600 text-lg">This may take a few moments...</p>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Results */}
        {step === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full p-8 pt-20 overflow-y-auto hide-scrollbar bg-gradient-to-br from-slate-50 to-white"
            data-testid="results-step"
          >
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-2">
                  Your Visualizations
                </h2>
                <p className="text-slate-600">
                  See how the selected products look on you
                </p>
              </div>

              <div className="space-y-8 mb-12">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    data-testid={`result-${index}`} 
                    className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6"
                  >
                    <h3 className="text-2xl font-semibold mb-6">{result.product_name}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-3 font-medium">Original Photo</p>
                        <div className="rounded-2xl overflow-hidden bg-slate-50">
                          <img src={photoUrl} alt="Original" className="w-full object-contain" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-3 font-medium">Product</p>
                        <div className="rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center aspect-square">
                          {result.product_image ? (
                            <img src={result.product_image} alt="Product" className="max-w-full max-h-full object-contain p-4" />
                          ) : (
                            <div className="text-center p-8">
                              <Sparkles className="w-16 h-16 text-violet-300 mx-auto mb-4" />
                              <p className="text-slate-500">AI Visualization Coming Soon</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Share Section */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
                <h3 className="text-2xl font-semibold mb-6">Share Your Experience</h3>
                
                <div className="flex flex-col items-center gap-6">
                  <div data-testid="whatsapp-qr" className="bg-slate-50 p-6 rounded-2xl">
                    <QRCodeSVG value={generateWhatsAppLink()} size={180} />
                  </div>
                  <p className="text-slate-600">Scan to share via WhatsApp</p>

                  <div className="flex gap-4">
                    <Button
                      data-testid="share-whatsapp-btn"
                      onClick={() => window.open(generateWhatsAppLink(), '_blank')}
                      className="h-14 px-8 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg font-semibold"
                    >
                      <Share2 className="w-5 h-5 mr-3" />
                      Share to WhatsApp
                    </Button>

                    <Button
                      data-testid="try-again-btn"
                      onClick={handleRestart}
                      variant="outline"
                      className="h-14 px-8 rounded-full text-lg font-semibold"
                    >
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
        <DialogContent className="bg-white" data-testid="pin-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Enter Admin PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              data-testid="pin-input"
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit PIN"
              className="h-14 rounded-xl text-center text-2xl tracking-widest"
            />
            <div className="flex gap-4">
              <Button
                data-testid="pin-cancel-btn"
                onClick={() => {
                  setShowPinDialog(false);
                  setPin('');
                }}
                variant="outline"
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                data-testid="pin-verify-btn"
                onClick={handlePinVerify}
                disabled={pin.length !== 4}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
