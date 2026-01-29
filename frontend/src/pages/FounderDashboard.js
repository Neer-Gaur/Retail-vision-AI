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
    <div className="min-h-screen bg-slate-50 text-slate-900 noise-bg">
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-black" />
            <span className="text-2xl font-bold">God View</span>
          </div>

          <Button
            data-testid="founder-logout-btn"
            onClick={handleLogout}
            variant="ghost"
            className="rounded-full"
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
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-2">
            Omniscience <span className="font-bold">Dashboard</span>
          </h1>
          <p className="text-slate-600">Monitor all tenants and system health</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading...</div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div data-testid="stat-card-tenants" className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">TOTAL TENANTS</p>
                    <p className="text-3xl font-bold">{analytics?.total_tenants || 0}</p>
                  </div>
                </div>
              </div>

              <div data-testid="stat-card-tryons" className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">TOTAL TRY-ONS</p>
                    <p className="text-3xl font-bold">{analytics?.total_tryons || 0}</p>
                  </div>
                </div>
              </div>

              <div data-testid="stat-card-gpu" className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium">GPU HEALTH</p>
                    <p className="text-2xl font-bold text-green-600">{analytics?.gpu_health || 'Operational'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              data-testid="tenants-list"
              className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6"
            >
              <h2 className="text-2xl font-bold mb-6">Tenant List</h2>
              <div className="space-y-4">
                {tenants.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No tenants yet</p>
                ) : (
                  tenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      data-testid={`tenant-${tenant.id}`}
                      className="bg-slate-50 rounded-xl p-4 flex justify-between items-center hover:bg-slate-100 transition-colors border border-slate-100"
                    >
                      <div>
                        <h3 className="text-lg font-semibold">{tenant.shop_name}</h3>
                        <p className="text-sm text-slate-600">
                          Industry: <span className="capitalize font-medium">{tenant.industry}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-mono">TENANT ID</p>
                        <p className="text-xs text-slate-600 font-mono">{tenant.id.slice(0, 8)}...</p>
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
  );
}