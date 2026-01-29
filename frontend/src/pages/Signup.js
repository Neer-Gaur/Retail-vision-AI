import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Store, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const signUp = useAuthStore((state) => state.signUp);
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
      await signUp(formData.email, formData.password, {
        shop_name: formData.shop_name,
        industry: formData.industry,
        admin_pin: formData.admin_pin
      });
      toast.success('Account created! Check your email to verify.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 gradient-mesh opacity-40 -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-8 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Your Shop</h1>
            <p className="text-slate-600">Start your AI-powered journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Industry Type</Label>
              <RadioGroup 
                value={formData.industry} 
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="fashion" id="fashion" className="peer sr-only" />
                  <Label
                    htmlFor="fashion"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 cursor-pointer transition-all"
                  >
                    <Store className="w-6 h-6 mb-2" />
                    <span className="text-sm font-semibold">Fashion</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="tiles" id="tiles" className="peer sr-only" />
                  <Label
                    htmlFor="tiles"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-violet-600 peer-data-[state=checked]:bg-violet-50 cursor-pointer transition-all"
                  >
                    <Store className="w-6 h-6 mb-2" />
                    <span className="text-sm font-semibold">Tiles</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="shop_name" className="text-sm font-medium mb-2 block">
                Shop Name
              </Label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="shop_name"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  required
                  className="h-14 pl-12 rounded-xl bg-white border-slate-200"
                  placeholder="My Awesome Shop"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-14 pl-12 rounded-xl bg-white border-slate-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-14 pl-12 rounded-xl bg-white border-slate-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin_pin" className="text-sm font-medium mb-2 block">
                Kiosk Exit PIN (4 digits)
              </Label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="admin_pin"
                  type="text"
                  maxLength="4"
                  value={formData.admin_pin}
                  onChange={(e) => setFormData({ ...formData, admin_pin: e.target.value })}
                  required
                  className="h-14 pl-12 rounded-xl bg-white border-slate-200"
                  placeholder="1234"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg font-semibold"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-violet-600 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}