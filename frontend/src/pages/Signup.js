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
  const [role, setRole] = useState('owner');
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
        role
      };

      if (role === 'owner') {
        data.shop_name = shopName;
        data.industry = industry;
        data.admin_pin = adminPin;
      }

      const response = await authAPI.signup(data);
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('tenant_id', response.tenant_id || '');
      localStorage.setItem('industry', response.industry || '');

      toast.success('Signup successful!');

      if (response.role === 'founder') {
        navigate('/founder');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 noise-bg">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 122, 255, 0.15) 0%, transparent 50%)'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <Button
          data-testid="back-to-home-btn"
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-8 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="glass-card p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Eye className="w-8 h-8 text-[#007AFF]" />
            <h1 className="text-3xl font-bold kiosk-heading">Sign Up</h1>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <Label className="text-sm text-gray-400 mb-3 block">Account Type</Label>
              <RadioGroup value={role} onValueChange={setRole}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem data-testid="role-owner" value="owner" id="owner" />
                  <Label htmlFor="owner" className="cursor-pointer">Shop Owner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem data-testid="role-founder" value="founder" id="founder" />
                  <Label htmlFor="founder" className="cursor-pointer">Founder (God View)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm text-gray-400 mb-2 block">
                Email
              </Label>
              <Input
                data-testid="signup-email-input"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/10 focus:border-primary"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-gray-400 mb-2 block">
                Password
              </Label>
              <Input
                data-testid="signup-password-input"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/10 focus:border-primary"
              />
            </div>

            {role === 'owner' && (
              <>
                <div>
                  <Label htmlFor="shopName" className="text-sm text-gray-400 mb-2 block">
                    Shop Name
                  </Label>
                  <Input
                    data-testid="signup-shopname-input"
                    id="shopName"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    className="h-12 bg-white/5 border-white/10 focus:border-primary"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-400 mb-3 block">Industry</Label>
                  <RadioGroup value={industry} onValueChange={setIndustry}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem data-testid="industry-fashion" value="fashion" id="fashion" />
                      <Label htmlFor="fashion" className="cursor-pointer">Fashion (Sarees)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem data-testid="industry-tiles" value="tiles" id="tiles" />
                      <Label htmlFor="tiles" className="cursor-pointer">Tiles</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="adminPin" className="text-sm text-gray-400 mb-2 block">
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
                    className="h-12 bg-white/5 border-white/10 focus:border-primary"
                  />
                </div>
              </>
            )}

            <Button
              data-testid="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{' '}
            <button
              data-testid="go-to-login-btn"
              onClick={() => navigate('/login')}
              className="text-[#007AFF] hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}