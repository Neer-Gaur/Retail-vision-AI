import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Users, TrendingUp, Clock, Target, BarChart3,
  ArrowUpRight, ArrowDownRight, Package, Calendar
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function Analytics() {
  const { shop } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [leads, setLeads] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (shop?.id) loadData();
  }, [shop?.id]);

  const loadData = async () => {
    try {
      const [invRes, leadRes, vizRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('shop_id', shop.id),
        supabase.from('leads').select('*').eq('shop_id', shop.id),
        supabase.from('visualizations').select('*, inventory(name, price)').eq('shop_id', shop.id)
      ]);
      setInventory(invRes.data || []);
      setLeads(leadRes.data || []);
      setVisualizations(vizRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalViews = visualizations.length;
  const totalLeads = leads.length;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : 0;
  const avgViewsPerDay = (totalViews / 7).toFixed(1);

  // Most viewed products
  const productViews = {};
  visualizations.forEach(v => {
    if (v.product_id) {
      productViews[v.product_id] = (productViews[v.product_id] || 0) + 1;
    }
  });
  const topProducts = Object.entries(productViews)
    .map(([id, views]) => {
      const product = inventory.find(p => p.id === id);
      return { name: product?.name || 'Unknown', views, price: product?.price || 0 };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Daily data
  const getDailyData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return [...Array(days)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        visualizations: visualizations.filter(v => v.created_at?.startsWith(dateStr)).length,
        leads: leads.filter(l => l.created_at?.startsWith(dateStr)).length
      };
    });
  };

  // Hourly distribution
  const getHourlyData = () => {
    const hours = Array(24).fill(0);
    visualizations.forEach(v => {
      if (v.created_at) {
        const hour = new Date(v.created_at).getHours();
        hours[hour]++;
      }
    });
    return hours.map((count, hour) => ({
      hour: `${hour}:00`,
      count
    }));
  };

  // Category distribution
  const getCategoryData = () => {
    const cats = {};
    visualizations.forEach(v => {
      const product = inventory.find(p => p.id === v.product_id);
      if (product?.category) {
        cats[product.category] = (cats[product.category] || 0) + 1;
      }
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  const StatCard = ({ icon: Icon, label, value, change, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Track your store's performance and insights</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Eye} label="Total Visualizations" value={totalViews} color="violet" />
        <StatCard icon={Users} label="Total Leads" value={totalLeads} color="blue" />
        <StatCard icon={Target} label="Conversion Rate" value={`${conversionRate}%`} color="emerald" />
        <StatCard icon={TrendingUp} label="Avg. Views/Day" value={avgViewsPerDay} color="amber" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Performance Trend</h3>
          <p className="text-sm text-slate-500 mb-6">Visualizations and leads over time</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={getDailyData()}>
              <defs>
                <linearGradient id="vizGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="visualizations" stroke="#8b5cf6" fill="url(#vizGrad)" strokeWidth={2} name="Visualizations" />
              <Area type="monotone" dataKey="leads" stroke="#3b82f6" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Peak Usage Hours</h3>
          <p className="text-sm text-slate-500 mb-6">When customers visit most</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={getHourlyData()}>
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} interval={3} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Most Viewed Products</h3>
          <p className="text-sm text-slate-500 mb-6">Products with highest visualization count</p>
          {topProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No visualization data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-sm text-slate-500">₹{product.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{product.views}</p>
                    <p className="text-xs text-slate-500">views</p>
                  </div>
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                      style={{ width: `${(product.views / (topProducts[0]?.views || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Category Interest</h3>
          <p className="text-sm text-slate-500 mb-6">Views by product category</p>
          {getCategoryData().length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {getCategoryData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 space-y-2">
            {getCategoryData().slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-slate-600 flex-1 truncate">{cat.name}</span>
                <span className="font-medium text-slate-900">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
