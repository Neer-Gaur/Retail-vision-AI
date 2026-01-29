import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, LogOut, Users, Cpu, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tenantsAPI, analyticsAPI } from '@/services/api';
import { toast } from 'sonner';

export default function FounderDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantsData, analyticsData] = await Promise.all([
        tenantsAPI.getAll(),
        analyticsAPI.get()
      ]);
      setTenants(tenantsData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white noise-bg">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1762279389006-43963a0cee55?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG5lb24lMjBkYXRhJTIwZmxvdyUyMGRhcmt8ZW58MHx8fHwxNzY5Njk4OTk3fDA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover'
        }}
      />
      
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0, 122, 255, 0.15) 0%, transparent 50%)'
        }}
      />

      <div className="relative z-10">
        <nav className="border-b border-white/10 backdrop-blur-xl bg-black/40">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-[#007AFF]" />
              <span className="text-2xl font-bold">God View</span>
            </div>

            <Button
              data-testid="founder-logout-btn"
              onClick={handleLogout}
              variant="ghost"
              className="hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>

        <main className="max-w-[1600px] mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-2 admin-heading">
              OMNISCIENCE DASHBOARD
            </h1>
            <p className="text-gray-400">Monitor all tenants and system health</p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
              >
                <div data-testid="stat-card-tenants" className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#007AFF]/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mono-label">TOTAL TENANTS</p>
                      <p className="text-3xl font-bold">{analytics?.total_tenants || 0}</p>
                    </div>
                  </div>
                </div>

                <div data-testid="stat-card-tryons" className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#00FF94]/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-[#00FF94]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mono-label">TOTAL TRY-ONS</p>
                      <p className="text-3xl font-bold">{analytics?.total_tryons || 0}</p>
                    </div>
                  </div>
                </div>

                <div data-testid="stat-card-gpu" className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#007AFF]/20 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mono-label">GPU HEALTH</p>
                      <p className="text-2xl font-bold text-[#00FF94]">{analytics?.gpu_health || 'Operational'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                data-testid="tenants-list"
                className="glass-card rounded-2xl p-6"
              >
                <h2 className="text-2xl font-bold mb-6 admin-heading">TENANT LIST</h2>
                <div className="space-y-4">
                  {tenants.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No tenants yet</p>
                  ) : (
                    tenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        data-testid={`tenant-${tenant.id}`}
                        className="bg-white/5 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <h3 className="text-lg font-semibold">{tenant.shop_name}</h3>
                          <p className="text-sm text-gray-400">
                            Industry: <span className="capitalize">{tenant.industry}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mono-label">TENANT ID</p>
                          <p className="text-xs text-gray-400 font-mono">{tenant.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}