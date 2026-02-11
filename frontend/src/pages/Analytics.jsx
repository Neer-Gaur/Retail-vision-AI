import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Clock,
  Eye,
  Flame,
  Layers,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const RANGE = {
  '7d': 7,
  '30d': 30,
  '90d': 90
};

const COLORS = {
  red: '#ef4444',
  blue: '#3b82f6',
  amber: '#f59e0b',
  emerald: '#10b981',
  violet: '#a855f7'
};

function startOfDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function Analytics() {
  const { shop, refreshShop } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState('7d');

  const [inventory, setInventory] = useState([]);
  const [leads, setLeads] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const run = async () => {
      if (!shop) await refreshShop();
      if (shop?.id) await loadAll();
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id, timeRange]);

  const loadAll = async () => {
    if (!shop?.id) return;

    setLoading(true);
    try {
      const days = RANGE[timeRange] || 7;
      const since = startOfDaysAgo(days);

      const [invRes, leadsRes, vizRes, sesRes, evRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('shop_id', shop.id),
        supabase.from('leads').select('*').eq('shop_id', shop.id).gte('created_at', since).order('created_at', { ascending: false }).limit(2000),
        supabase.from('visualizations').select('*').eq('shop_id', shop.id).gte('created_at', since).order('created_at', { ascending: false }).limit(5000),
        supabase.from('kiosk_sessions').select('*').eq('shop_id', shop.id).gte('started_at', since).order('started_at', { ascending: false }).limit(5000),
        supabase.from('kiosk_events').select('*').eq('shop_id', shop.id).gte('created_at', since).order('created_at', { ascending: false }).limit(20000)
      ]);

      setInventory(invRes.data || []);
      setLeads(leadsRes.data || []);
      setVisualizations(vizRes.data || []);
      setSessions(sesRes.data || []);
      setEvents(evRes.data || []);
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const derived = useMemo(() => {
    const days = RANGE[timeRange] || 7;

    const totalViews = visualizations.length;
    const totalLeads = leads.length;
    const conversionRate = totalViews > 0 ? Math.round((totalLeads / totalViews) * 100) : 0;

    // Daily trend
    const daily = [...Array(days)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];

      const evDay = events.filter(e => (e.created_at || '').startsWith(key));
      const aiOk = evDay.filter(e => e.event_type === 'visualize_success' && (e.meta?.mode === 'ai' || e.meta?.mode === undefined)).length;
      const aiFail = evDay.filter(e => e.event_type === 'visualize_failed').length;
      const shares = evDay.filter(e => e.event_type === 'share_clicked').length;

      return {
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads: leads.filter(l => (l.created_at || '').startsWith(key)).length,
        viz: visualizations.filter(v => (v.created_at || '').startsWith(key)).length,
        sessions: sessions.filter(s => (s.started_at || '').startsWith(key)).length,
        ai_success: aiOk,
        ai_failed: aiFail,
        shares
      };
    });

    // Funnel counts (distinct sessions)
    const steps = {
      lead_submitted: new Set(),
      photo_uploaded: new Set(),
      product_selected: new Set(),
      visualize_clicked: new Set(),
      share_clicked: new Set()
    };
    events.forEach(e => {
      if (steps[e.event_type] && e.session_id) steps[e.event_type].add(e.session_id);
    });
    const funnel = [
      { step: 'Lead', key: 'lead_submitted' },
      { step: 'Photo', key: 'photo_uploaded' },
      { step: 'Select', key: 'product_selected' },
      { step: 'Visualize', key: 'visualize_clicked' },
      { step: 'Share', key: 'share_clicked' }
    ].map(s => ({ step: s.step, count: steps[s.key].size }));

    // Peak hours heat (0-23)
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    const src = sessions.length
      ? sessions.map(s => s.started_at)
      : visualizations.map(v => v.created_at);
    src.forEach(ts => {
      if (!ts) return;
      const h = new Date(ts).getHours();
      hourly[h].count += 1;
    });

    const peak = [...hourly].sort((a, b) => b.count - a.count)[0];

    // Top products by interest (events)
    const interest = new Map();
    events.forEach(e => {
      const pid = e.product_id || e.meta?.product_id;
      if (!pid) return;
      if (e.event_type === 'product_selected' || e.event_type === 'visualize_clicked' || e.event_type === 'share_clicked') {
        interest.set(pid, (interest.get(pid) || 0) + (e.event_type === 'share_clicked' ? 3 : e.event_type === 'visualize_clicked' ? 2 : 1));
      }
    });
    const topProducts = Array.from(interest.entries())
      .map(([product_id, score]) => {
        const p = inventory.find(x => x.id === product_id);
        return { product_id, name: p?.name || 'Unknown', category: p?.category || '—', score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // AI trend for chart
    const aiTrend = daily.map(d => ({ day: d.day, success: d.ai_success, failed: d.ai_failed }));

    const shareRate = totalViews > 0 ? Math.round((events.filter(e => e.event_type === 'share_clicked').length / totalViews) * 100) : 0;

    return {
      totalViews,
      totalLeads,
      conversionRate,
      shareRate,
      peakHour: peak ? `${peak.hour}:00` : '—',
      daily,
      funnel,
      hourly,
      topProducts,
      aiTrend
    };
  }, [events, inventory, leads, sessions, timeRange, visualizations]);

  const emptyEvents = events.length === 0;

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Drilldowns for funnel, peak hours, and product interest.</p>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(RANGE).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                timeRange === r
                  ? 'bg-red-600/15 text-red-200 border-red-500/30'
                  : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-semibold">Visualizations</div>
              <div className="mt-1 text-3xl font-bold text-white">{derived.totalViews}</div>
              <div className="mt-3 flex items-center gap-2 text-slate-400 text-sm"><Eye className="w-4 h-4" /> Total</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-semibold">Leads</div>
              <div className="mt-1 text-3xl font-bold text-white">{derived.totalLeads}</div>
              <div className="mt-3 flex items-center gap-2 text-slate-400 text-sm"><Users className="w-4 h-4" /> Captured</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-semibold">Conversion</div>
              <div className="mt-1 text-3xl font-bold text-white">{derived.conversionRate}%</div>
              <div className="mt-3 flex items-center gap-2 text-slate-400 text-sm"><Target className="w-4 h-4" /> Leads / Viz</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="text-xs text-slate-400 font-semibold">Peak Hour</div>
              <div className="mt-1 text-3xl font-bold text-white">{derived.peakHour}</div>
              <div className="mt-3 flex items-center gap-2 text-slate-400 text-sm"><Flame className="w-4 h-4" /> Highest traffic</div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Trend */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-semibold text-white">Trend</div>
                  <div className="text-sm text-slate-400">Sessions, leads, visualizations</div>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-500" />
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={derived.daily}>
                    <defs>
                      <linearGradient id="a_viz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={COLORS.red} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="a_leads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #334155', borderRadius: 12 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Area type="monotone" dataKey="sessions" stroke={COLORS.violet} fillOpacity={0} strokeWidth={2} name="Sessions" />
                    <Area type="monotone" dataKey="leads" stroke={COLORS.blue} fill="url(#a_leads)" strokeWidth={2} name="Leads" />
                    <Area type="monotone" dataKey="viz" stroke={COLORS.red} fill="url(#a_viz)" strokeWidth={2.5} name="Visualizations" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funnel */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-semibold text-white">Funnel</div>
                  <div className="text-sm text-slate-400">Distinct sessions per step</div>
                </div>
                <Layers className="w-5 h-5 text-slate-500" />
              </div>

              {emptyEvents ? (
                <div className="text-sm text-slate-500">Funnel will populate once kiosk event logging is active.</div>
              ) : (
                <div className="space-y-3">
                  {derived.funnel.map((f) => {
                    const max = Math.max(...derived.funnel.map(x => x.count), 1);
                    const w = clamp(Math.round((f.count / max) * 100), 6, 100);
                    return (
                      <div key={f.step} className="bg-white/5 border border-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-200 font-semibold">{f.step}</div>
                          <div className="text-sm text-white font-bold">{f.count}</div>
                        </div>
                        <div className="mt-2 h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-gradient-to-r from-red-500 to-rose-500" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Secondary grid */}
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            {/* Peak hours heatmap */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-semibold text-white">Peak Hours</div>
                  <div className="text-sm text-slate-400">Traffic by hour</div>
                </div>
                <Clock className="w-5 h-5 text-slate-500" />
              </div>

              {derived.hourly.every(h => h.count === 0) ? (
                <div className="text-sm text-slate-500">No activity yet in this range.</div>
              ) : (
                <div className="grid grid-cols-12 gap-2">
                  {derived.hourly.map((h) => {
                    const max = Math.max(...derived.hourly.map(x => x.count), 1);
                    const intensity = h.count / max;
                    const bg = `rgba(239,68,68,${0.12 + intensity * 0.55})`;
                    return (
                      <div
                        key={h.hour}
                        title={`${h.hour}:00 — ${h.count}`}
                        className="rounded-lg border border-white/10"
                        style={{ background: bg, height: 28 }}
                      />
                    );
                  })}
                </div>
              )}
              <div className="mt-3 text-xs text-slate-500">Left→right: 0:00 to 23:00</div>
            </div>

            {/* Top products by interest */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-semibold text-white">Top Products (Interest)</div>
                  <div className="text-sm text-slate-400">Based on select + visualize + share</div>
                </div>
                <Activity className="w-5 h-5 text-slate-500" />
              </div>

              {emptyEvents ? (
                <div className="text-sm text-slate-500">This will populate once kiosk event logging is active.</div>
              ) : derived.topProducts.length === 0 ? (
                <div className="text-sm text-slate-500">No product events found for this range.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {derived.topProducts.map((p) => (
                    <div key={p.product_id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <div className="text-white font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 truncate mt-1">{p.category}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/30">Score</div>
                        <div className="text-white font-bold">{p.score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI success/fail trend */}
          <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-lg font-semibold text-white">AI Success / Fail Trend</div>
                <div className="text-sm text-slate-400">From kiosk_events visualize_success / visualize_failed</div>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-500" />
            </div>

            {emptyEvents ? (
              <div className="text-sm text-slate-500">This chart will populate after event logging is wired.</div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.aiTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #334155', borderRadius: 12 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Bar dataKey="success" fill={COLORS.emerald} radius={[6, 6, 0, 0]} name="Success" />
                    <Bar dataKey="failed" fill={COLORS.red} radius={[6, 6, 0, 0]} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-6 text-xs text-slate-500">
            If you don’t see funnel/top-products/AI charts yet, it means kiosk events haven’t been generated in this range.
          </div>
        </>
      )}
    </div>
  );
}
