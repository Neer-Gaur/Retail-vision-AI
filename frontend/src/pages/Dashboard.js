import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const { shop, signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="glass rounded-3xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold">{shop?.shop_name}</h1>
              <p className="text-slate-600 capitalize">{shop?.industry} Store Dashboard</p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/kiosk')}
                className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
              >
                Launch Kiosk
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="rounded-full"
              >
                Logout
              </Button>
            </div>
          </div>

          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Dashboard Coming Soon!</h2>
            <p className="text-slate-600 mb-8">
              Your complete inventory management, analytics, and customer insights dashboard
            </p>
            <Button
              onClick={() => navigate('/kiosk')}
              size="lg"
              className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              Go to Kiosk Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}