import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, Users, Eye, TrendingUp, ArrowRight, Plus,
  ShoppingBag, Sparkles, Target, Clock, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { shop } = useAuthStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalLeads: 0,
    totalVisualizations: 0,
    inStock: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shop?.id) loadDashboardData();
  }, [shop?.id]);

  const loadDashboardData = async () => {
    try {
      const [inventoryRes, leadsRes, vizRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('shop_id', shop.id),
        supabase.from('leads').select('*').eq('shop_id', shop.id),
        supabase.from('visualizations').select('*').eq('shop_id', shop.id)
      ]);

      const inventory = inventoryRes.data || [];
      const leads = leadsRes.data || [];
      const visualizations = vizRes.data || [];

      setStats({
        totalProducts: inventory.length,
        totalLeads: leads.length,
        totalVisualizations: visualizations.length,
        inStock: inventory.filter(i => i.stock_count > 0).length
      });

      // Chart data - last 7 days
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          visualizations: visualizations.filter(v => v.created_at?.startsWith(dateStr)).length,
          leads: leads.filter(l => l.created_at?.startsWith(dateStr)).length
        };
      });
      setChartData(last7Days);

      // Recent activity
      const allActivity = [
        ...leads.map(l => ({ type: 'lead', name: l.customer_name, time: l.created_at })),
        ...visualizations.map(v => ({ type: 'visualization', time: v.created_at }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
      setRecentActivity(allActivity);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Package, label: 'Total Products', value: stats.totalProducts, color: 'violet', link: '/dashboard/inventory' },
    { icon: Users, label: 'Total Leads', value: stats.totalLeads, color: 'blue', link: '/dashboard/leads' },
    { icon: Eye, label: 'Visualizations', value: stats.totalVisualizations, color: 'emerald', link: '/dashboard/analytics' },
    { icon: ShoppingBag, label: 'In Stock', value: stats.inStock, color: 'amber', link: '/dashboard/inventory' }
  ];

  const colorMap = {
    violet: { bg: 'bg-violet-100', text: 'text-violet-600', icon: 'text-violet-500' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-500' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-500' }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back! 👋</h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(stat.link)}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${colorMap[stat.color].bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${colorMap[stat.color].icon}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Activity Overview</h3>
              <p className="text-sm text-slate-500">Last 7 days performance</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/analytics')} className="rounded-full">
              View Details
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="vizGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="visualizations" stroke="#8b5cf6" fill="url(#vizGradient)" strokeWidth={2} name="Visualizations" />
              <Area type="monotone" dataKey="leads" stroke="#3b82f6" fill="url(#leadGradient)" strokeWidth={2} name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dashboard/inventory')} 
                className="w-full justify-start rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 border-0"
              >
                <Plus className="w-4 h-4 mr-2" /> Add New Product
              </Button>
              <Button 
                onClick={() => navigate('/kiosk')} 
                className="w-full justify-start rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border-0"
              >
                <Monitor className="w-4 h-4 mr-2" /> Launch Kiosk Mode
              </Button>
              <Button 
                onClick={() => navigate('/dashboard/analytics')} 
                variant="outline"
                className="w-full justify-start rounded-xl"
              >
                <Target className="w-4 h-4 mr-2" /> View Analytics
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'lead' ? 'bg-blue-100' : 'bg-violet-100'
                    }`}>
                      {activity.type === 'lead' ? (
                        <Users className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-violet-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {activity.type === 'lead' ? `New lead: ${activity.name}` : 'New visualization'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
