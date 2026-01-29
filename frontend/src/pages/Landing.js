import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Eye, Sparkles, Zap, Shield, ArrowRight, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Lenis from '@studio-freight/lenis';

const reviews = [
  { name: 'Priya Sharma', role: 'Saree Boutique Owner', text: 'Increased customer engagement by 300%! The AI visualization is mind-blowing.', rating: 5 },
  { name: 'Rajesh Kumar', role: 'Tile Showroom', text: 'Our customers love seeing tiles on their walls before buying. Game changer!', rating: 5 },
  { name: 'Anita Desai', role: 'Fashion Store', text: 'The kiosk mode is perfect for our showroom. Customers spend more time exploring.', rating: 5 },
  { name: 'Vikram Patel', role: 'Retail Manager', text: 'Easy to manage inventory and track analytics. Best investment for our business.', rating: 5 },
  { name: 'Meera Reddy', role: 'Boutique Owner', text: 'The WhatsApp integration is brilliant. Customers share their try-ons instantly!', rating: 5 },
  { name: 'Arjun Singh', role: 'Showroom Director', text: 'Professional, modern, and exactly what we needed. Highly recommended!', rating: 5 }
];

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Visualization',
    description: 'Let customers see products on themselves with cutting-edge AI technology',
    gradient: 'from-slate-900 to-slate-700'
  },
  {
    icon: Zap,
    title: 'Kiosk Mode',
    description: 'Secure fullscreen experience designed for physical showrooms with PIN protection',
    gradient: 'from-slate-800 to-slate-600'
  },
  {
    icon: Shield,
    title: 'Multi-Tenant SaaS',
    description: 'Complete data isolation, dedicated dashboards, and analytics for each business',
    gradient: 'from-slate-700 to-slate-500'
  }
];

const stats = [
  { value: '500+', label: 'Showrooms' },
  { value: '50K+', label: 'Visualizations' },
  { value: '98%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' }
];

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'founder') {
      navigate('/founder');
    } else if (token && role === 'owner') {
      navigate('/dashboard');
    }

    return () => {
      lenis.destroy();
    };
  }, [navigate]);

  return (
    <div ref={containerRef} className="min-h-screen bg-white noise-bg overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass-light"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Eye className="w-8 h-8 text-black" />
            <span className="text-2xl font-bold tracking-tight">Retail-Vision AI</span>
          </motion.div>

          <div className="flex gap-4">
            <Button
              data-testid="nav-login-btn"
              onClick={() => navigate('/login')}
              variant="ghost"
              className="rounded-full"
            >
              Login
            </Button>
            <Button
              data-testid="nav-signup-btn"
              onClick={() => navigate('/signup')}
              className="btn-primary"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity, scale }}
        className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12"
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-900">
                The Future of Retail is Here
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-light tracking-tight mb-6 gradient-text">
              Transform Your
              <br />
              <span className="font-bold">Showroom Experience</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12">
              AI-powered visualization for Saree & Tile showrooms. Let customers see before they buy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                data-testid="hero-cta-btn"
                onClick={() => navigate('/signup')}
                className="btn-primary text-lg h-14 px-12"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary text-lg h-14 px-12"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-20"
          >
            <div className="bg-white rounded-3xl shadow-floating p-2 max-w-5xl mx-auto">
              <img
                src="https://images.unsplash.com/photo-1720247520862-7e4b14176fa8?auto=format&fit=crop&w=1600&q=80"
                alt="Showroom"
                className="w-full rounded-2xl"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
              Everything You <span className="font-bold">Need</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed for modern showrooms
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  data-testid={`feature-card-${index + 1}`}
                  className="bg-white rounded-2xl border border-slate-100 p-8 shadow-soft hover:shadow-floating transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
              How It <span className="font-bold">Works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Capture Photo', desc: 'Customer takes a photo at your kiosk with smart overlays' },
              { step: '02', title: 'Select Products', desc: 'Browse and select up to 3 items from your inventory' },
              { step: '03', title: 'See Results', desc: 'AI generates realistic visualizations in seconds' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-7xl font-bold text-slate-200 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
              Loved by <span className="font-bold">Thousands</span>
            </h2>
            <p className="text-xl text-slate-600">See what our customers say</p>
          </motion.div>
        </div>

        <div className="marquee">
          <div className="marquee-content">
            {[...reviews, ...reviews].map((review, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft min-w-[400px]"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-black text-black" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">"{review.text}"</p>
                <div>
                  <div className="font-semibold">{review.name}</div>
                  <div className="text-sm text-slate-500">{review.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-black text-white rounded-3xl p-12 md:p-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join hundreds of showrooms already using Retail-Vision AI
            </p>
            <Button
              data-testid="cta-signup-btn"
              onClick={() => navigate('/signup')}
              className="h-14 px-12 text-lg rounded-full bg-white text-black hover:bg-slate-100 hover:scale-105 transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" /> No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" /> 14-day free trial
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto text-center text-slate-600">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Eye className="w-6 h-6" />
            <span className="font-semibold text-black">Retail-Vision AI</span>
          </div>
          <p className="text-sm">
            © 2025 Retail-Vision AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
