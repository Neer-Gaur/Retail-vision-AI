import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/authStore';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Visualization',
    description: 'Revolutionary virtual try-on technology for fashion and tiles'
  },
  {
    icon: Zap,
    title: 'Smart Kiosk Mode',
    description: 'Secure fullscreen experience designed for physical showrooms'
  },
  {
    icon: Shield,
    title: 'Multi-Tenant Architecture',
    description: 'Complete data isolation with enterprise-grade security'
  }
];

const stats = [
  { value: '10K+', label: 'Visualizations' },
  { value: '500+', label: 'Showrooms' },
  { value: '98%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' }
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Fashion Boutique', text: 'Revolutionary! Customer engagement increased by 300%', rating: 5 },
  { name: 'Rajesh Kumar', role: 'Tile Showroom', text: 'Game changer for our business. Customers love it!', rating: 5 },
  { name: 'Anita Desai', role: 'Retail Manager', text: 'The best investment we made this year', rating: 5 }
];

export default function Landing() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Mesh Background */}
      <div className="fixed inset-0 gradient-mesh opacity-40 -z-10" />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">RetailVision AI</span>
          </motion.div>

          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/login')}
              variant="ghost"
              className="rounded-full"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6">
              <span className="px-6 py-3 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full text-sm font-semibold text-violet-900">
                ✨ The Future of Retail is Here
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8">
              Transform Your
              <br />
              <span className="text-gradient">Showroom Experience</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              AI-powered virtual try-on for fashion and tile showrooms. Let customers visualize products instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/signup')}
                size="lg"
                className="rounded-full h-14 px-8 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                variant="outline"
                className="rounded-full h-14 px-8 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="glass rounded-3xl p-4 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
                alt="Showroom"
                className="w-full rounded-2xl"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full blur-3xl opacity-60 animate-float" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: '2s' }} />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
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
                <div className="text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
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
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Everything You <span className="text-gradient">Need</span>
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
                  whileHover={{ y: -8 }}
                  className="glass rounded-3xl p-8 hover:shadow-2xl transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              Loved by <span className="text-gradient">Thousands</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-3xl p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </motion.div>
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
            viewport={{ once: true }}
            className="glass-dark rounded-3xl p-16 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 opacity-90" />
            <div className="relative z-10">
              <h2 className="text-5xl font-bold mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join hundreds of showrooms already using RetailVision AI
              </p>
              <Button
                onClick={() => navigate('/signup')}
                size="lg"
                className="rounded-full h-14 px-12 text-lg bg-white text-violet-600 hover:bg-slate-100"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> 14-day free trial
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto text-center text-slate-600">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900">RetailVision AI</span>
          </div>
          <p className="text-sm">© 2025 RetailVision AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}