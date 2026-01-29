import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Eye, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'founder') {
      navigate('/founder');
    } else if (token && role === 'owner') {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden noise-bg">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1762279389006-43963a0cee55?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG5lb24lMjBkYXRhJTIwZmxvdyUyMGRhcmt8ZW58MHx8fHwxNzY5Njk4OTk3fDA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 122, 255, 0.15) 0%, transparent 50%)'
        }}
      />

      <div className="relative z-10">
        <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Eye className="w-8 h-8 text-[#007AFF]" />
            <span className="text-2xl font-bold tracking-tight">Retail-Vision AI</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            <Button
              data-testid="nav-login-btn"
              onClick={() => navigate('/login')}
              variant="ghost"
              className="hover:bg-white/10"
            >
              Login
            </Button>
            <Button
              data-testid="nav-signup-btn"
              onClick={() => navigate('/signup')}
              className="btn-primary"
            >
              Get Started
            </Button>
          </motion.div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 kiosk-heading">
              Transform Your Showroom
              <br />
              <span className="text-[#007AFF]">Into an AI Experience</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12">
              Multi-tenant SaaS for Saree & Tile showrooms. Let customers visualize products with AI-powered try-ons.
            </p>
            <Button
              data-testid="hero-cta-btn"
              onClick={() => navigate('/signup')}
              className="btn-primary text-lg h-14 px-12"
            >
              Start Your Journey
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-8 mt-24"
          >
            <div data-testid="feature-card-1" className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-[#007AFF]/20 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-[#007AFF]" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">AI Visualization</h3>
              <p className="text-gray-400">
                Industry-specific overlays and real-time AI try-ons for fashion and tiles.
              </p>
            </div>

            <div data-testid="feature-card-2" className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-[#00FF94]/20 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-[#00FF94]" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Kiosk Mode</h3>
              <p className="text-gray-400">
                Secure fullscreen experience with PIN-protected exit for physical showrooms.
              </p>
            </div>

            <div data-testid="feature-card-3" className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-[#007AFF]/20 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-[#007AFF]" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Multi-Tenant</h3>
              <p className="text-gray-400">
                Complete data isolation, inventory management, and analytics for each showroom.
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}