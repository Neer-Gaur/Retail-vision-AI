import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Check, Loader2, Share2, Eye, Upload, Filter, SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { inventoryAPI, leadsAPI, visualizationAPI, authAPI } from '@/services/api';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function KioskMode() {
  const navigate = useNavigate();
  const industry = localStorage.getItem('industry');
  const logoRef = useRef(null);
  const videoRef = useRef(null);
  const longPressTimer = useRef(null);
  const [longPressDuration, setLongPressDuration] = useState(0);
  const [stream, setStream] = useState(null);
  
  // States
  const [step, setStep] = useState('lead');
  const [leadData, setLeadData] = useState({ name: '', whatsapp: '' });
  const [leadId, setLeadId] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
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
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [maxPrice, setMaxPrice] = useState(1000);

  useEffect(() => {
    document.documentElement.requestFullscreen?.();
    loadInventory();
    
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [inventory, priceRange, selectedTags, sortBy]);

  const loadInventory = async () => {
    try {
      const data = await inventoryAPI.getAll(true);
      setInventory(data);
      
      // Calculate max price
      const max = Math.max(...data.map(item => item.price), 1000);
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

  const applyFiltersAndSort = () => {
    let filtered = [...inventory];

    // Price filter
    filtered = filtered.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );

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
    setSortBy('name');
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
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
    const dataUrl = canvas.toDataURL('image/jpeg');
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
      const response = await leadsAPI.create({
        ...leadData,
        photo_url: 'pending'
      });
      setLeadId(response.id);
      setStep('camera');
      toast.success('Welcome! Let\'s capture your photo');
    } catch (error) {
      toast.error('Failed to capture lead');
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
      const response = await visualizationAPI.create({
        lead_id: leadId,
        product_ids: selectedProducts.map(p => p.id),
        photo_url: photoUrl
      });
      setResults(response.results);
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
    setLeadData({ name: '', whatsapp: '' });
    setLeadId(null);
    setPhotoUrl(null);
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
      await authAPI.verifyPin(pin);
      document.exitFullscreen?.();
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid PIN');
      setPin('');
    }
  };

  const generateWhatsAppLink = () => {
    const message = encodeURIComponent(
      `Hi! I just tried products at the showroom. Check out my visualizations!`
    );
    return `https://wa.me/${leadData.whatsapp.replace(/\D/g, '')}?text=${message}`;
  };

  const overlayType = industry === 'fashion' ? 'silhouette' : 'grid';

  return (
    <div className="h-screen w-full overflow-hidden bg-white text-slate-900 relative">
      {/* Logo for Exit */}
      <motion.div
        ref={logoRef}
        onMouseDown={handleLogoMouseDown}
        onMouseUp={handleLogoMouseUp}
        onTouchStart={handleLogoMouseDown}
        onTouchEnd={handleLogoMouseUp}
        className="absolute top-6 left-6 z-50 cursor-pointer"
        data-testid="kiosk-logo"
      >
        <Eye className="w-10 h-10 text-black" />
        {longPressDuration > 0 && (
          <div className="absolute -bottom-2 left-0 w-10 h-1 bg-slate-200 rounded">
            <div
              className="h-full bg-black rounded transition-all"
              style={{ width: `${(longPressDuration / 5000) * 100}%` }}
            />
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'lead' && (
          <motion.div
            key="lead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white"
            data-testid="lead-capture-step"
          >
            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-floating p-8">
              <h1 className="text-4xl md:text-5xl font-light mb-2 text-center">
                Welcome to <span className="font-bold">Your Experience</span>
              </h1>
              <p className="text-slate-600 text-center mb-8">
                Let's start your visualization journey
              </p>

              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-slate-700 mb-2 block font-medium">Your Name</Label>
                  <Input
                    data-testid="lead-name-input"
                    id="name"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    required
                    className="h-14 rounded-xl border-slate-200 bg-slate-50 text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-slate-700 mb-2 block font-medium">WhatsApp Number</Label>
                  <Input
                    data-testid="lead-whatsapp-input"
                    id="whatsapp"
                    type="tel"
                    value={leadData.whatsapp}
                    onChange={(e) => setLeadData({ ...leadData, whatsapp: e.target.value })}
                    required
                    className="h-14 rounded-xl border-slate-200 bg-slate-50 text-lg"
                  />
                </div>

                <Button
                  data-testid="lead-submit-btn"
                  type="submit"
                  className="w-full h-14 rounded-xl bg-black text-white hover:bg-slate-800 text-lg font-semibold"
                >
                  Continue
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white"
            data-testid="camera-step"
          >
            <h2 className="text-4xl font-light mb-2">
              Capture Your <span className="font-bold">Photo</span>
            </h2>
            <p className="text-slate-600 mb-8 text-center max-w-xl">
              {industry === 'fashion' 
                ? 'Take a photo or upload from your device to see how products look on you'
                : 'Capture the space or upload an image to visualize tiles'}
            </p>

            {showCamera ? (
              <div className="relative w-full max-w-2xl aspect-[3/4] bg-black rounded-3xl overflow-hidden mb-8">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
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
                    className="rounded-full h-12 px-6 bg-white/20 backdrop-blur-xl text-white border border-white/30"
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
                  className="h-16 rounded-xl bg-black text-white hover:bg-slate-800 text-lg font-semibold"
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
                  className="h-16 rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200 text-lg font-semibold"
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

        {step === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full overflow-y-auto hide-scrollbar bg-gradient-to-br from-slate-50 to-white"
            data-testid="gallery-step"
          >
            <div className="max-w-7xl mx-auto p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-light">
                    Select <span className="font-bold">Products</span>
                  </h2>
                  <p className="text-slate-600 mt-2">
                    Choose up to 3 items ({selectedProducts.length}/3)
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    className="rounded-full h-12 px-6 border-slate-200"
                  >
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Filters
                  </Button>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] h-12 rounded-full border-slate-200">
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
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-100 p-6 mb-8"
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
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </Label>
                      <Slider
                        min={0}
                        max={maxPrice}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="mb-4"
                      />
                    </div>
                    
                    <div>
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
                                ? 'bg-black text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {filteredInventory.map((product) => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  return (
                    <motion.div
                      key={product.id}
                      data-testid={`product-${product.id}`}
                      onClick={() => toggleProductSelection(product)}
                      whileHover={{ y: -4 }}
                      className={`relative cursor-pointer rounded-2xl overflow-hidden bg-white border transition-all ${
                        isSelected ? 'ring-4 ring-black border-black shadow-floating' : 'border-slate-100 hover:border-slate-300 shadow-soft'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-white flex items-center justify-center border-b border-slate-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain p-3"
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{product.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{product.category}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold">${product.price}</p>
                          {product.tags && product.tags.length > 0 && (
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
                <div className="text-center py-12 text-slate-500">
                  No products match your filters. Try adjusting them.
                </div>
              )}

              <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
                <Button
                  data-testid="visualize-btn"
                  onClick={handleVisualize}
                  disabled={selectedProducts.length === 0}
                  className="h-16 px-12 rounded-full bg-black text-white hover:bg-slate-800 text-lg font-semibold shadow-floating"
                >
                  Visualize Now ({selectedProducts.length})
                </Button>
              </div>
            </div>
          </motion.div>
        )}

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
              <Loader2 className="w-20 h-20 animate-spin text-black mx-auto mb-6" />
              <h2 className="text-4xl font-light">
                Creating Your <span className="font-bold">Visualizations</span>
              </h2>
              <p className="text-slate-600 mt-4">This may take a few moments...</p>
            </div>
          </motion.div>
        )}

        {step === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full p-8 overflow-y-auto hide-scrollbar bg-gradient-to-br from-slate-50 to-white"
            data-testid="results-step"
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-light text-center mb-12">
                Your <span className="font-bold">Visualizations</span>
              </h2>

              <div className="space-y-8 mb-12">
                {results.map((result, index) => (
                  <div key={index} data-testid={`result-${index}`} className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6">
                    <h3 className="text-2xl font-semibold mb-6">{result.product_name}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-3 font-medium">Original Photo</p>
                        <img src={photoUrl} alt="Original" className="w-full rounded-2xl" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-3 font-medium">AI Visualization</p>
                        {result.result_image ? (
                          <img src={result.result_image} alt="Result" className="w-full rounded-2xl" />
                        ) : (
                          <div className="w-full aspect-square bg-red-50 rounded-2xl flex items-center justify-center border border-red-200">
                            <p className="text-red-600">Visualization failed</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-6 mb-12">
                <div data-testid="whatsapp-qr" className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
                  <QRCodeSVG value={generateWhatsAppLink()} size={200} />
                </div>
                <p className="text-slate-600 text-center font-medium">Scan to share via WhatsApp</p>

                <div className="flex gap-4">
                  <Button
                    data-testid="share-whatsapp-btn"
                    onClick={() => window.open(generateWhatsAppLink(), '_blank')}
                    className="h-14 px-8 rounded-full bg-black text-white hover:bg-slate-800 text-lg font-semibold"
                  >
                    <Share2 className="w-5 h-5 mr-3" />
                    Share to WhatsApp
                  </Button>

                  <Button
                    data-testid="try-again-btn"
                    onClick={handleRestart}
                    variant="outline"
                    className="h-14 px-8 rounded-full border-slate-200 hover:bg-slate-100 text-lg font-semibold"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="bg-white border-slate-200" data-testid="pin-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Enter Admin PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              data-testid="pin-input"
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-digit PIN"
              className="h-14 rounded-xl border-slate-200 text-center text-2xl tracking-widest"
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
                className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-slate-800"
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
