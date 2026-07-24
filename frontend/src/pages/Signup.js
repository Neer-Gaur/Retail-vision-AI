import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Store, Shield, Scan, Check, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

function normalizePhone(raw) {
  return String(raw || '').replace(/\D/g, '').slice(-10);
}

function validatePassword(pw) {
  // Rigorous but practical
  // - 10+ chars
  // - at least 1 uppercase, 1 lowercase, 1 number
  const s = String(pw || '');
  if (s.length < 10) return 'Password must be at least 10 characters.';
  if (!/[a-z]/.test(s)) return 'Password must include at least one lowercase letter.';
  if (!/[A-Z]/.test(s)) return 'Password must include at least one uppercase letter.';
  if (!/\d/.test(s)) return 'Password must include at least one number.';
  return null;
}

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form', 'success'
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    owner_name: '',
    shop_name: '',
    industry: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    admin_pin: '',
    accept_terms: false
  });

  const passwordHint = useMemo(() => validatePassword(formData.password), [formData.password]);

  const validateForm = () => {
    // Basic required checks
    if (!formData.owner_name.trim() || formData.owner_name.trim().length < 2) {
      toast.error('Owner name is required (min 2 characters)');
      return false;
    }

    if (!formData.shop_name.trim() || formData.shop_name.trim().length < 2) {
      toast.error('Shop name is required (min 2 characters)');
      return false;
    }

    if (!formData.industry.trim() || formData.industry.trim().length < 2) {
      toast.error('Industry is required (e.g., Fashion, Saree, Tiles)');
      return false;
    }

    const phoneDigits = normalizePhone(formData.phone);
    if (phoneDigits.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    const pwError = validatePassword(formData.password);
    if (pwError) {
      toast.error(pwError);
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return false;
    }

    // PIN check
    if (!/^\d{4}$/.test(formData.admin_pin)) {
      toast.error('Kiosk Exit PIN must be exactly 4 digits');
      return false;
    }

    if (!formData.accept_terms) {
      toast.error('Please accept the terms to continue');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const phoneDigits = normalizePhone(formData.phone);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      // Create shop entry
      const { error: shopError } = await supabase
        .from('shops')
        .insert([
          {
            owner_email: formData.email,
            shop_name: formData.shop_name.trim(),
            industry: formData.industry.trim(),
            admin_pin: formData.admin_pin,
            subscription_status: 'pro',
            owner_name: formData.owner_name.trim(),
            phone: phoneDigits
          }
        ]);

      if (shopError) throw shopError;

      setStep('success');
      setTimeout(() => navigate('/dashboard'), 2500);

      void authData;
    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black text-white selection:bg-red-500/30">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20 pointer-events-none" />

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md relative z-10"
            style={{ perspective: '1000px' }}
          >
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="mb-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <motion.div className="relative" whileHover={{ rotateY: 2, rotateX: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-3xl blur-xl opacity-30" />

              <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/30 border border-white/10 overflow-hidden">
                    <img src="/assets/logo.png" alt="RetailVision" className="w-full h-full object-cover" />
                  </div>
                </motion.div>

                <div className="text-center mb-8 mt-6">
                  <h1 className="text-3xl font-bold text-white mb-2">Create Your Shop</h1>
                  <p className="text-slate-400">Owner account + kiosk setup</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Owner Name */}
                  <div>
                    <Label htmlFor="owner_name" className="text-sm font-medium text-slate-300 mb-2 block">
                      Owner Name
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                      <Input
                        id="owner_name"
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                        placeholder="Neeraj"
                      />
                    </div>
                  </div>

                  {/* Shop Name */}
                  <div>
                    <Label htmlFor="shop_name" className="text-sm font-medium text-slate-300 mb-2 block">
                      Shop Name
                    </Label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                      <Input
                        id="shop_name"
                        value={formData.shop_name}
                        onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                        placeholder="My Saree Showroom"
                      />
                    </div>
                  </div>

                  {/* Industry */}
                  <div>
                    <Label htmlFor="industry" className="text-sm font-medium text-slate-300 mb-2 block">
                      Industry
                    </Label>
                    <Input
                      id="industry"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      required
                      className="h-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                      placeholder="Fashion / Saree / Tiles / Interior"
                    />
                    <p className="mt-2 text-xs text-slate-500">We use this to tailor prompts and inventory categories.</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-300 mb-2 block">
                      Phone
                    </Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                        placeholder="+91 98xxxxxx00"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-300 mb-2 block">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                        placeholder="owner@shop.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-slate-300 mb-2 block">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                        placeholder="Minimum 10 characters"
                      />
                    </div>
                    <p className={`mt-2 text-xs ${passwordHint ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {passwordHint || 'Strong password looks good.'}
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirm_password" className="text-sm font-medium text-slate-300 mb-2 block">
                      Confirm Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                      <Input
                        id="confirm_password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>

                  {/* Kiosk PIN */}
                  <div>
                    <Label htmlFor="admin_pin" className="text-sm font-medium text-slate-300 mb-2 block">
                      Kiosk Exit PIN (4 digits)
                    </Label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                      <Input
                        id="admin_pin"
                        type="text"
                        inputMode="numeric"
                        maxLength="4"
                        pattern="[0-9]{4}"
                        value={formData.admin_pin}
                        onChange={(e) => setFormData({ ...formData, admin_pin: e.target.value.replace(/\D/g, '') })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20 tracking-widest font-mono"
                        placeholder="Set PIN"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Used to exit kiosk and unlock dashboard.</p>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <input
                      id="accept_terms"
                      type="checkbox"
                      checked={formData.accept_terms}
                      onChange={(e) => setFormData({ ...formData, accept_terms: e.target.checked })}
                      className="mt-1"
                    />
                    <label htmlFor="accept_terms" className="text-sm text-slate-300">
                      I confirm this is a business signup and I agree to the platform terms.
                    </label>
                  </div>

                  {/* Submit */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-lg font-semibold shadow-lg shadow-red-500/20 border border-white/5 transition-all"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </motion.div>
                </form>

                <p className="text-center text-slate-400 mt-6">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')} className="text-red-400 font-semibold hover:text-red-300 transition-colors">
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-center relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative mx-auto mb-8"
            >
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-red-500 to-rose-500"
              />
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-red-500 to-rose-500"
              />

              <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/50 border border-white/10">
                <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-4xl font-bold text-white mb-4">
              Welcome aboard
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-xl text-slate-400 mb-8">
              Your shop has been created successfully
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center justify-center gap-2 text-red-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full"
              />
              <span>Redirecting to login...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
