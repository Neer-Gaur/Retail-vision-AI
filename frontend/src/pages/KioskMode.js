import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Check, Loader2, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { inventoryAPI, leadsAPI, visualizationAPI, authAPI } from '@/services/api';
import { toast } from 'sonner';
import QRCode from 'qrcode.react';

export default function KioskMode() {
  const navigate = useNavigate();
  const industry = localStorage.getItem('industry');
  const logoRef = useRef(null);
  const longPressTimer = useRef(null);
  const [longPressDuration, setLongPressDuration] = useState(0);
  
  // States
  const [step, setStep] = useState('lead'); // lead, camera, gallery, visualize, results
  const [leadData, setLeadData] = useState({ name: '', whatsapp: '' });
  const [leadId, setLeadId] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [visualizing, setVisualizing] = useState(false);
  const [results, setResults] = useState(null);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    document.documentElement.requestFullscreen?.();
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await inventoryAPI.getAll(true);
      setInventory(data);
    } catch (error) {
      toast.error('Failed to load products');
    }
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

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    
    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result);
      setStep('gallery');
      setUploadingPhoto(false);
      toast.success('Photo captured! Select products to try');
    };
    reader.readAsDataURL(file);
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

  const itemLabel = industry === 'fashion' ? 'Saree' : 'Tile';
  const overlayType = industry === 'fashion' ? 'silhouette' : 'grid';

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0F0518] text-white relative">
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
        <Eye className="w-10 h-10 text-[#FFD700]" />
        {longPressDuration > 0 && (
          <div className="absolute -bottom-2 left-0 w-10 h-1 bg-white/20 rounded">
            <div
              className="h-full bg-[#FFD700] rounded transition-all"
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
            className="h-full flex items-center justify-center p-8"
            data-testid="lead-capture-step"
          >
            <div className="max-w-md w-full glass-card p-8 rounded-3xl">
              <h1 className="text-4xl md:text-5xl font-medium mb-4 kiosk-heading text-center">
                Welcome
              </h1>
              <p className="text-gray-400 text-center mb-8">
                Let's start your {itemLabel} visualization journey
              </p>

              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-gray-300 mb-2 block">Your Name</Label>
                  <Input
                    data-testid="lead-name-input"
                    id="name"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    required
                    className="h-14 bg-white/5 border-white/10 text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-gray-300 mb-2 block">WhatsApp Number</Label>
                  <Input
                    data-testid="lead-whatsapp-input"
                    id="whatsapp"
                    type="tel"
                    value={leadData.whatsapp}
                    onChange={(e) => setLeadData({ ...leadData, whatsapp: e.target.value })}
                    required
                    className="h-14 bg-white/5 border-white/10 text-lg"
                  />
                </div>

                <Button
                  data-testid="lead-submit-btn"
                  type="submit"
                  className="btn-kiosk"
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
            className="h-full flex flex-col items-center justify-center p-8"
            data-testid="camera-step"
          >
            <h2 className="text-4xl font-medium mb-4 kiosk-heading">Capture Your Photo</h2>
            <p className="text-gray-400 mb-8">
              {industry === 'fashion' 
                ? 'Stand in front of the camera. We\'ll show a silhouette overlay'
                : 'Capture the floor/wall area. We\'ll show a perspective grid'}
            </p>

            <div className="relative w-full max-w-2xl aspect-[3/4] bg-black/50 rounded-3xl overflow-hidden mb-8">
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

              <input
                data-testid="photo-capture-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingPhoto}
              />
              
              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <Loader2 className="w-12 h-12 animate-spin text-[#FFD700]" />
                </div>
              )}
            </div>

            <Button
              data-testid="camera-trigger-btn"
              onClick={() => document.querySelector('[data-testid="photo-capture-input"]')?.click()}
              className="btn-kiosk"
              disabled={uploadingPhoto}
            >
              <Camera className="w-6 h-6 mr-3" />
              {uploadingPhoto ? 'Processing...' : 'Take Photo'}
            </Button>
          </motion.div>
        )}

        {step === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full p-8 overflow-y-auto hide-scrollbar"
            data-testid="gallery-step"
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-medium mb-2 kiosk-heading">Select Products</h2>
              <p className="text-gray-400 mb-8">Choose up to 3 {itemLabel}s to visualize ({selectedProducts.length}/3)</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                {inventory.map((product) => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  return (
                    <motion.div
                      key={product.id}
                      data-testid={`product-${product.id}`}
                      onClick={() => toggleProductSelection(product)}
                      whileHover={{ scale: 1.05 }}
                      className={`relative cursor-pointer rounded-2xl overflow-hidden ${
                        isSelected ? 'ring-4 ring-[#FFD700]' : ''
                      }`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full aspect-square object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-black" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-300">${product.price}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                <Button
                  data-testid="visualize-btn"
                  onClick={handleVisualize}
                  disabled={selectedProducts.length === 0}
                  className="btn-kiosk max-w-md"
                >
                  Visualize Now
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
            className="h-full flex items-center justify-center"
            data-testid="visualizing-step"
          >
            <div className="text-center">
              <Loader2 className="w-20 h-20 animate-spin text-[#FFD700] mx-auto mb-6" />
              <h2 className="text-4xl font-medium kiosk-heading">Creating Your Visualizations</h2>
              <p className="text-gray-400 mt-4">This may take a few moments...</p>
            </div>
          </motion.div>
        )}

        {step === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full p-8 overflow-y-auto hide-scrollbar"
            data-testid="results-step"
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-medium mb-8 kiosk-heading text-center">Your Visualizations</h2>

              <div className="space-y-8 mb-8">
                {results.map((result, index) => (
                  <div key={index} data-testid={`result-${index}`} className="glass-card p-6 rounded-3xl">
                    <h3 className="text-2xl font-semibold mb-4">{result.product_name}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Original Photo</p>
                        <img src={photoUrl} alt="Original" className="w-full rounded-xl" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-2">AI Visualization</p>
                        {result.result_image ? (
                          <img src={result.result_image} alt="Result" className="w-full rounded-xl" />
                        ) : (
                          <div className="w-full aspect-square bg-red-500/10 rounded-xl flex items-center justify-center">
                            <p className="text-red-400">Visualization failed</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4 mb-8">
                <div data-testid="whatsapp-qr" className="bg-white p-4 rounded-xl">
                  <QRCode value={generateWhatsAppLink()} size={200} />
                </div>
                <p className="text-gray-400 text-center">Scan to share via WhatsApp</p>

                <Button
                  data-testid="share-whatsapp-btn"
                  onClick={() => window.open(generateWhatsAppLink(), '_blank')}
                  className="btn-kiosk max-w-md"
                >
                  <Share2 className="w-6 h-6 mr-3" />
                  Share to WhatsApp
                </Button>

                <Button
                  data-testid="try-again-btn"
                  onClick={handleRestart}
                  variant="outline"
                  className="max-w-md w-full h-14 border-white/20 hover:bg-white/10"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="bg-[#1A0B2E] border-white/10" data-testid="pin-dialog">
          <DialogHeader>
            <DialogTitle>Enter Admin PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              data-testid="pin-input"
              type="password"
              maxLength="4"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4-digit PIN"
              className="h-14 bg-white/5 border-white/10 text-center text-2xl tracking-widest"
            />
            <div className="flex gap-4">
              <Button
                data-testid="pin-cancel-btn"
                onClick={() => {
                  setShowPinDialog(false);
                  setPin('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                data-testid="pin-verify-btn"
                onClick={handlePinVerify}
                className="flex-1 btn-primary"
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
