import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [industry, setIndustry] = useState('fashion');
  const [adminPin, setAdminPin] = useState('1234');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        email,
        password,
        role: 'owner',
        shop_name: shopName,
        industry: industry,
        admin_pin: adminPin
      };

      const response = await authAPI.signup(data);
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('tenant_id', response.tenant_id || '');
      localStorage.setItem('industry', response.industry || '');

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex items-center justify-center p-6 noise-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button
          data-testid="back-to-home-btn"
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-8 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft p-8">
          <div className="flex items-center gap-3 mb-8">
            <Eye className="w-8 h-8 text-black" />
            <h1 className="text-3xl font-bold">Create Your Account</h1>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <Label htmlFor="shopName" className="text-sm text-slate-700 mb-2 block font-medium">
                Shop Name
              </Label>
              <Input
                data-testid="signup-shopname-input"
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-black/5"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm text-slate-700 mb-2 block font-medium">
                Email
              </Label>
              <Input
                data-testid="signup-email-input"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-black/5"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-slate-700 mb-2 block font-medium">
                Password
              </Label>
              <Input
                data-testid="signup-password-input"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-black/5"
              />
            </div>

            <div>
              <Label className="text-sm text-slate-700 mb-3 block font-medium">Industry</Label>
              <RadioGroup value={industry} onValueChange={setIndustry} className="space-y-3">
                <div className="flex items-center space-x-3 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors">
                  <RadioGroupItem data-testid="industry-fashion" value="fashion" id="fashion" />
                  <Label htmlFor="fashion" className="cursor-pointer flex-1">Fashion</Label>
                </div>
                <div className="flex items-center space-x-3 bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors">
                  <RadioGroupItem data-testid="industry-tiles" value="tiles" id="tiles" />
                  <Label htmlFor="tiles" className="cursor-pointer flex-1">Tiles</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="adminPin" className="text-sm text-slate-700 mb-2 block font-medium">
                Kiosk Exit PIN (4 digits)
              </Label>
              <Input
                data-testid="signup-pin-input"
                id="adminPin"
                type="text"
                maxLength="4"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-black/5"
              />
            </div>

            <Button
              data-testid="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-slate-600 mt-6">
            Already have an account?{' '}
            <button
              data-testid="go-to-login-btn"
              onClick={() => navigate('/login')}
              className="text-black font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}