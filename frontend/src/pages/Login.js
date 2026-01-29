import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('tenant_id', response.tenant_id || '');
      localStorage.setItem('industry', response.industry || '');

      toast.success('Login successful!');

      if (response.role === 'founder') {
        navigate('/founder');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
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
            <h1 className="text-3xl font-bold kiosk-heading">Login</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm text-gray-400 mb-2 block">
                Email
              </Label>
              <Input
                data-testid="login-email-input"
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
                data-testid="login-password-input"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-white/5 border-white/10 focus:border-primary"
              />
            </div>

            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Don't have an account?{' '}
            <button
              data-testid="go-to-signup-btn"
              onClick={() => navigate('/signup')}
              className="text-[#007AFF] hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}