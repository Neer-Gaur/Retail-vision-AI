import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Store, Shield, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form', 'success'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    shop_name: '',
    industry: 'fashion',
    admin_pin: '1234'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });
      
      if (authError) throw authError;

      // Create shop entry
      const { error: shopError } = await supabase
        .from('shops')
        .insert([{
          owner_email: formData.email,
          shop_name: formData.shop_name,
          industry: formData.industry,
          admin_pin: formData.admin_pin,
          subscription_status: 'trial'
        }]);
      
      if (shopError) throw shopError;

      // Show success animation
      setStep('success');
      
      // Redirect to login after animation
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md relative z-10"
            style={{ perspective: '1000px' }}
          >
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="mb-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <motion.div 
              className="relative"
              whileHover={{ rotateY: 2, rotateX: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Card Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 rounded-3xl blur-xl opacity-50" />
              
              {/* Main Card */}
              <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                {/* Floating Icon */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/50">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                <div className="text-center mb-8 mt-6">
                  <h1 className="text-3xl font-bold text-white mb-2">Create Your Shop</h1>
                  <p className="text-slate-400">Start your AI-powered retail journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Industry Selection */}
                  <div>
                    <Label className="text-sm font-medium text-slate-300 mb-3 block">Industry Type</Label>
                    <RadioGroup 
                      value={formData.industry} 
                      onValueChange={(value) => setFormData({ ...formData, industry: value })}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="fashion" id="fashion" className="peer sr-only" />
                        <Label
                          htmlFor="fashion"
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 peer-data-[state=checked]:border-violet-500 peer-data-[state=checked]:bg-violet-500/20 cursor-pointer transition-all"
                        >
                          <span className="text-2xl mb-2">👗</span>
                          <span className="text-sm font-semibold text-white">Fashion</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="tiles" id="tiles" className="peer sr-only" />
                        <Label
                          htmlFor="tiles"
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 peer-data-[state=checked]:border-violet-500 peer-data-[state=checked]:bg-violet-500/20 cursor-pointer transition-all"
                        >
                          <span className="text-2xl mb-2">🏠</span>
                          <span className="text-sm font-semibold text-white">Tiles</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Shop Name */}
                  <div>
                    <Label htmlFor="shop_name" className="text-sm font-medium text-slate-300 mb-2 block">
                      Shop Name
                    </Label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                      <Input
                        id="shop_name"
                        value={formData.shop_name}
                        onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                        placeholder="My Awesome Shop"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-300 mb-2 block">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-slate-300 mb-2 block">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Kiosk PIN */}
                  <div>
                    <Label htmlFor="admin_pin" className="text-sm font-medium text-slate-300 mb-2 block">
                      Kiosk Exit PIN (4 digits)
                    </Label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                      <Input
                        id="admin_pin"
                        type="text"
                        maxLength="4"
                        pattern="[0-9]{4}"
                        value={formData.admin_pin}
                        onChange={(e) => setFormData({ ...formData, admin_pin: e.target.value.replace(/\D/g, '') })}
                        required
                        className="h-12 pl-12 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 tracking-widest"
                        placeholder="1234"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-lg font-semibold shadow-lg shadow-violet-500/25 transition-all"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
                  <button
                    onClick={() => navigate('/login')}
                    className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative z-10"
          >
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative mx-auto mb-8"
            >
              {/* Ripple Effects */}
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              />
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              />
              
              {/* Check Icon */}
              <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/50">
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold text-white mb-4"
            >
              Welcome Aboard! 🎉
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-slate-400 mb-8"
            >
              Your shop has been created successfully
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-2 text-violet-400"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full"
              />
              <span>Redirecting to login...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
