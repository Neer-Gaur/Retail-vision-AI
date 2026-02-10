import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Shield, ArrowRight, ChevronRight, ChevronLeft, Scan, Store, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/authStore';

// --- Assets & Data ---

const CAROUSEL_SLIDES = [
  {
    id: 1,
    title: "The Guesswork",
    desc: "Customers struggle to visualize how a saree or tile looks in real life.",
    video: "/assets/video1.mp4", 
    caption: "Before RetailVision"
  },
  {
    id: 2,
    title: "The Magic Mirror",
    desc: "AI instantly drapes the product on them or their room. Zero wait time.",
    video: "/assets/video2.mp4",
    caption: "The Kiosk Experience"
  },
  {
    id: 3,
    title: "The Conversion",
    desc: "Confidence soars. Sales happen. Customers share the look on WhatsApp.",
    video: "/assets/video3.mp4", 
    caption: "Result: Sold"
  }
];

const SHOWROOMS = [
  {
    name: "Kashvi Sarees",
    location: "Mumbai, Bandra",
    image: "/assets/showroom1.png"
  },
  {
    name: "Ceramic Studio",
    location: "Delhi, GK-2",
    image: "/assets/showroom2.png"
  },
  {
    name: "Vogue Ethnic",
    location: "Bangalore, Indiranagar",
    image: "/assets/showroom3.png"
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  // Auto-advance is handled by video onEnded
  
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/5 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="RetailVision Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold tracking-tight">RetailVision<span className="text-red-500">.</span></span>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => navigate('/login')} variant="ghost" className="text-white hover:bg-white/10 rounded-full hidden sm:flex">
              Login
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all hover:scale-105 text-sm sm:text-base px-4 sm:px-6"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen Retail Experience</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">Magic Mirror</span><br />
              for Your Store.
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Transform your saree or tile showroom into a futuristic experience. 
              Let customers virtually try before they buy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button onClick={() => navigate('/signup')} className="h-14 px-8 rounded-full bg-white text-black hover:bg-slate-200 text-lg font-semibold transition-all hover:scale-105 w-full sm:w-auto">
                Start Free Trial
              </Button>
              <Button onClick={() => document.getElementById('demo').scrollIntoView()} variant="outline" className="h-14 px-8 rounded-full border-slate-700 text-white hover:bg-white/10 text-lg w-full sm:w-auto">
                See it in Action
              </Button>
            </div>
          </motion.div>

          {/* 3D Kiosk Visual - VERTICAL FULL SCREEN (Hidden on mobile) */}
          <motion.div
            initial={{ opacity: 0, rotateY: 30, x: 50 }}
            animate={{ opacity: 1, rotateY: -10, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative hidden lg:block xl:block"
            style={{ perspective: '1200px' }}
          >
            {/* The Vertical Kiosk Container */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-[320px] h-[640px] mx-auto bg-black rounded-[2rem] border-[12px] border-zinc-900 shadow-2xl overflow-hidden transform-style-3d"
              style={{ boxShadow: '0 0 100px -20px rgba(220, 38, 38, 0.4)' }}
            >
              {/* Glossy Screen Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-30 opacity-50" />
              
              {/* Screen Content */}
              <div className="absolute inset-0 bg-zinc-950 flex flex-col">
                {/* Header Area */}
                <div className="h-16 bg-zinc-900 flex items-center justify-between px-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <img src="/assets/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                    <span className="font-bold text-white text-sm">RetailVision</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>

                {/* Main Visual Area */}
                <div className="flex-1 relative">
                  <img 
                    src="/assets/kiosk-screen.png" 
                    alt="Kiosk Mode" 
                    className="w-full h-full object-cover opacity-90"
                  />
                  
                  {/* Floating AR UI Elements */}
                  <div className="absolute bottom-8 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                        <img src="/assets/kiosk-thumb.png" className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-red-400 font-mono mb-1">ANALYZING FIT...</div>
                        <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-red-500"
                            animate={{ width: ["0%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kiosk Base Stand (Visual Hint) */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-24 h-10 bg-zinc-800 blur-md z-0" />
            </motion.div>

            {/* Floating Elements around Kiosk */}
            <motion.div 
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-32 -right-12 bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-red-500/30 shadow-xl z-40"
            >
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Render Time</div>
                  <div className="font-bold text-white">0.08s</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-40 -left-20 bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-red-500/30 shadow-xl z-40"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">AI Precision</div>
                  <div className="font-bold text-white">100% Match</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CAROUSEL SECTION */}
      <section id="demo" className="py-24 bg-zinc-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Magic <span className="text-red-500">Experience</span></h2>
            <p className="text-slate-400 text-lg">From hesitation to purchase in 3 steps.</p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="aspect-[16/9] relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-zinc-900">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <video 
                    key={CAROUSEL_SLIDES[currentSlide].video} // Force re-render on video change
                    src={CAROUSEL_SLIDES[currentSlide].video} 
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    onEnded={nextSlide}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-6 md:p-16">
                    <span className="text-red-500 font-mono text-xs md:text-sm tracking-widest uppercase mb-2 block">
                      {CAROUSEL_SLIDES[currentSlide].caption}
                    </span>
                    <h3 className="text-2xl md:text-6xl font-bold mb-2 md:mb-4">{CAROUSEL_SLIDES[currentSlide].title}</h3>
                    <p className="text-sm md:text-xl text-slate-300 max-w-2xl">{CAROUSEL_SLIDES[currentSlide].desc}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Controls */}
              <button 
                onClick={prevSlide}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/50 hover:bg-red-600 backdrop-blur-sm text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-black/50 hover:bg-red-600 backdrop-blur-sm text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>

              {/* Indicators */}
              <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 flex gap-2">
                {CAROUSEL_SLIDES.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 md:w-8 bg-red-500' : 'w-2 bg-white/30'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWROOMS SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Deployed at <span className="text-red-500">Modern Retailers</span></h2>
              <p className="text-slate-400">Leading the revolution in physical retail.</p>
            </div>
            <Button variant="link" className="text-white hover:text-red-400 hidden md:flex">View all partners <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {SHOWROOMS.map((store, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] cursor-pointer"
              >
                <img 
                  src={store.image} 
                  alt={store.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <div className="w-12 h-12 mb-4 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{store.name}</h3>
                  <div className="flex items-center text-slate-300 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                    Live in {store.location}
                  </div>
                </div>

                {/* Border Hover Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-red-500/50 rounded-2xl transition-colors duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-red-600 to-rose-700 rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-6xl font-bold mb-6">Ready to upgrade your showroom?</h2>
            <p className="text-lg md:text-xl text-red-100 mb-10 max-w-2xl mx-auto">
              Join the elite group of retailers transforming customer experience today.
            </p>
            <Button 
              onClick={() => navigate('/signup')}
              className="h-16 px-10 rounded-full bg-white text-red-600 hover:bg-slate-100 text-xl font-bold shadow-2xl w-full sm:w-auto"
            >
              Get RetailVision AI
            </Button>
            <p className="mt-6 text-sm text-red-200 opacity-80">No hardware required. Runs on any browser.</p>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-slate-600 text-sm bg-black border-t border-white/5">
        <p>© 2026 RetailVision AI. All rights reserved.</p>
      </footer>
    </div>
  );
}