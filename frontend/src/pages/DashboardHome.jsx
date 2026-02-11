import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock,
  Eye,
  Flame,
  Layers,
  MessageCircle,
  Package,
  Radar,
  Share2,
  TrendingUp,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function startOfDayISO(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function formatHM(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { shop, refreshShop } = useAuthStore();

  const [loading, setLoading] = useState(true);

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
  }, [shop?.id]);

  const loadAll = async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const todayISO = startOfDayISO(new Date());
      const since7d = new Date();
      since7d.setDate(since7d.getDate() - 6);
      since7d.setHours(0, 0, 0, 0);

      const [invRes, leadsRes, vizRes, sesRes, evRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('shop_id', shop.id),
        supabase.from('leads').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('visualizations').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('kiosk_sessions').select('*').eq('shop_id', shop.id).gte('started_at', since7d.toISOString()).order('started_at', { ascending: false }).limit(1000),
        supabase.from('kiosk_events').select('*').eq('shop_id', shop.id).gte('created_at', since7d.toISOString()).order('created_at', { ascending: false }).limit(5000)
      ]);

      setInventory(invRes.data || []);
      setLeads(leadsRes.data || []);
      setVisualizations(vizRes.data || []);
      setSessions(sesRes.data || []);
      setEvents(evRes.data || []);

      // If new tables are empty (because logging is not wired yet), command center still works from legacy tables.
      // We keep fallback logic in derived stats.
      void todayISO;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const derived = useMemo(() => {
    const todayKey = new Date().toISOString().split('T')[0];

    const leadsToday = leads.filter(l => (l.created_at || '').startsWith(todayKey)).length;
    const vizToday = visualizations.filter(v => (v.created_at || '').startsWith(todayKey)).length;

    const sessionsToday = sessions.filter(s => (s.started_at || '').startsWith(todayKey)).length;

    const sharesToday = events.filter(e => e.event_type === 'share_clicked' && (e.created_at || '').startsWith(todayKey)).length;
    const aiOkToday = events.filter(e => e.event_type === 'visualize_success' && (e.created_at || '').startsWith(todayKey)).length;
    const aiFailToday = events.filter(e => e.event_type === 'visualize_failed' && (e.created_at || '').startsWith(todayKey)).length;

    const shareRate = vizToday > 0 ? Math.round((sharesToday / vizToday) * 100) : 0;
    const aiAttempts = aiOkToday + aiFailToday;
    const aiSuccessRate = aiAttempts > 0 ? Math.round((aiOkToday / aiAttempts) * 100) : 0;

    const ended = sessions.filter(s => s.ended_at);
    const avgSessionSec = ended.length
      ? Math.round(
          ended.reduce((acc, s) => acc + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()), 0) /
            ended.length /
            1000
        )
      : 0;

    // Funnel (distinct sessions reaching each step)
    const stepSessions = {
      lead_submitted: new Set(),
      photo_uploaded: new Set(),
      product_selected: new Set(),
      visualize_clicked: new Set(),
      share_clicked: new Set()
    };

    events.forEach(e => {
      if (stepSessions[e.event_type] && e.session_id) stepSessions[e.event_type].add(e.session_id);
    });

    const funnel = [
      { step: 'Lead', key: 'lead_submitted' },
      { step: 'Photo', key: 'photo_uploaded' },
      { step: 'Select', key: 'product_selected' },
      { step: 'Visualize', key: 'visualize_clicked' },
      { step: 'Share', key: 'share_clicked' }
    ].map(x => ({ step: x.step, count: stepSessions[x.key].size }));

    // 7-day trend
    const last7 = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        leads: leads.filter(l => (l.created_at || '').startsWith(key)).length,
        viz: visualizations.filter(v => (v.created_at || '').startsWith(key)).length,
        sessions: sessions.filter(s => (s.started_at || '').startsWith(key)).length
      };
    });

    // Hot leads (simple score): visualizations per lead + shares (from events)
    const leadVizCount = new Map();
    visualizations.forEach(v => {
      if (!v.lead_id) return;
      leadVizCount.set(v.lead_id, (leadVizCount.get(v.lead_id) || 0) + 1);
    });
    const leadShareCount = new Map();
    events.forEach(e => {
      if (e.event_type !== 'share_clicked' || !e.lead_id) return;
      leadShareCount.set(e.lead_id, (leadShareCount.get(e.lead_id) || 0) + 1);
    });

    const hotLeads = (leads || [])
      .slice(0, 100)
      .map(l => {
        const score = (leadVizCount.get(l.id) || 0) * 2 + (leadShareCount.get(l.id) || 0) * 4;
        return { ...l, _score: score, _viz: leadVizCount.get(l.id) || 0, _shares: leadShareCount.get(l.id) || 0 };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);

    // Inventory risks
    const prodInterest = new Map();
    events.forEach(e => {
      if (!e.product_id) return;
      if (e.event_type === 'product_selected' || e.event_type === 'visualize_clicked') {
        prodInterest.set(e.product_id, (prodInterest.get(e.product_id) || 0) + 1);
      }
    });

    const lowStock = inventory
      .filter(p => (p.stock_count ?? 0) > 0 && (p.stock_count ?? 0) <= 5)
      .map(p => ({ ...p, _interest: prodInterest.get(p.id) || 0 }))
      .sort((a, b) => b._interest - a._interest)
      .slice(0, 5);

    const outOfStockTrending = inventory
      .filter(p => (p.stock_count ?? 0) <= 0)
      .map(p => ({ ...p, _interest: prodInterest.get(p.id) || 0 }))
      .sort((a, b) => b._interest - a._interest)
      .slice(0, 5);

    // Peak hours (from sessions or visualizations fallback)
    const hours = Array.from({ length: 24 }, (_, h) => ({ h, count: 0 }));
    if (sessions.length) {
      sessions.forEach(s => {
        const h = new Date(s.started_at).getHours();
        hours[h].count += 1;
      });
    } else {
      visualizations.forEach(v => {
        const h = new Date(v.created_at).getHours();
        hours[h].count += 1;
      });
    }
    const peak = [...hours].sort((a, b) => b.count - a.count)[0];

    return {
      leadsToday,
      vizToday,
      sessionsToday,
      sharesToday,
      shareRate,
      aiSuccessRate,
      avgSessionSec,
      funnel,
      last7,
      hotLeads,
      lowStock,
      outOfStockTrending,
      peakHour: peak ? `${peak.h}:00` : '—'
    };
  }, [events, inventory, leads, sessions, visualizations]);

  const cards = useMemo(
    () => [
      { label: 'Sessions Today', value: derived.sessionsToday, icon: Radar, accent: 'from-red-600/20 to-rose-600/10', iconBg: 'bg-red-500/15', iconText: 'text-red-300' },
      { label: 'Leads Today', value: derived.leadsToday, icon: Users, accent: 'from-blue-600/20 to-cyan-600/10', iconBg: 'bg-blue-500/15', iconText: 'text-blue-300' },
      { label: 'Visualizations Today', value: derived.vizToday, icon: Eye, accent: 'from-violet-600/20 to-fuchsia-600/10', iconBg: 'bg-violet-500/15', iconText: 'text-violet-300' },
      { label: 'Share Rate', value: `${derived.shareRate}%`, icon: Share2, accent: 'from-emerald-600/20 to-teal-600/10', iconBg: 'bg-emerald-500/15', iconText: 'text-emerald-300' },
      { label: 'AI Success', value: `${derived.aiSuccessRate}%`, icon: TrendingUp, accent: 'from-red-600/15 to-transparent', iconBg: 'bg-red-500/10', iconText: 'text-red-200' },
      { label: 'Avg Session', value: derived.avgSessionSec ? `${Math.round(derived.avgSessionSec / 60)}m` : '—', icon: Clock, accent: 'from-white/10 to-transparent', iconBg: 'bg-white/5', iconText: 'text-slate-200' },
      { label: 'Peak Hour', value: derived.peakHour, icon: Flame, accent: 'from-amber-600/20 to-transparent', iconBg: 'bg-amber-500/10', iconText: 'text-amber-200' },
      { label: 'Inventory Items', value: inventory.length, icon: Package, accent: 'from-white/10 to-transparent', iconBg: 'bg-white/5', iconText: 'text-slate-200' }
    ],
    [derived, inventory.length]
  );

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
          <p className="text-slate-400 mt-1">Shop-level analytics & actions. Everything you need, at a glance.</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/kiosk')}
            className="rounded-full bg-red-600 hover:bg-red-700 text-white border border-white/5 shadow-lg shadow-red-500/20"
          >
            Launch Kiosk
          </Button>
          <Button
            onClick={() => navigate('/dashboard/inventory')}
            variant="outline"
            className="rounded-full border-white/10 text-slate-200 hover:bg-white/5"
          >
            Inventory
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map((c, idx) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.accent} opacity-50`} />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">{c.label}</div>
                    <div className="text-2xl md:text-3xl font-bold text-white mt-1">{c.value}</div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${c.iconBg} border border-white/5 flex items-center justify-center flex-shrink-0`}>
                    <c.icon className={`w-5 h-5 ${c.iconText}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Trend */}
            <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">7-day trend</h3>
                  <p className="text-sm text-slate-400">Sessions, leads, and visualizations</p>
                </div>
                <Button
                  onClick={() => navigate('/dashboard/analytics')}
                  variant="outline"
                  className="rounded-full border-white/10 text-slate-200 hover:bg-white/5"
                >
                  Full Analytics
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={derived.last7}>
                    <defs>
                      <linearGradient id="cc_viz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cc_leads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #334155', borderRadius: 12 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#e2e8f0' }} />
                    <Area type="monotone" dataKey="sessions" stroke="#a855f7" fillOpacity={0} strokeWidth={2} name="Sessions" />
                    <Area type="monotone" dataKey="leads" stroke="#3b82f6" fill="url(#cc_leads)" strokeWidth={2} name="Leads" />
                    <Area type="monotone" dataKey="viz" stroke="#ef4444" fill="url(#cc_viz)" strokeWidth={2.5} name="Visualizations" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Funnel */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Funnel</h3>
                  <p className="text-sm text-slate-400">Drop-offs by step</p>
                </div>
                <Layers className="w-5 h-5 text-slate-500" />
              </div>

              {derived.funnel.every(f => f.count === 0) ? (
                <div className="text-sm text-slate-500">
                  Funnel data will appear once kiosk events are logged.
                </div>
              ) : (
                <div className="space-y-3">
                  {derived.funnel.map((f, i) => {
                    const max = Math.max(...derived.funnel.map(x => x.count), 1);
                    const w = clamp(Math.round((f.count / max) * 100), 8, 100);
                    return (
                      <div key={f.step} className="bg-white/5 border border-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-200 font-semibold">{i + 1}. {f.step}</div>
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

          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            {/* Hot Leads */}
            <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Hot leads</h3>
                  <p className="text-sm text-slate-400">Prioritized follow-ups</p>
                </div>
                <Button
                  onClick={() => navigate('/dashboard/leads')}
                  variant="outline"
                  className="rounded-full border-white/10 text-slate-200 hover:bg-white/5"
                >
                  Leads
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {derived.hotLeads.length === 0 ? (
                <div className="text-sm text-slate-500">No leads yet.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {derived.hotLeads.map((l) => (
                    <div key={l.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{l.customer_name}</div>
                          <div className="text-slate-400 text-sm font-mono truncate">{l.whatsapp_number}</div>
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/30">Score {l._score}</div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-slate-300">
                        <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-500" /> {l._viz}</div>
                        <div className="flex items-center gap-2"><Share2 className="w-4 h-4 text-slate-500" /> {l._shares}</div>
                        <div className="ml-auto text-slate-500">{formatHM(l.created_at)}</div>
                      </div>
                      <div className="mt-4">
                        <Button
                          onClick={() => window.open(`https://wa.me/${String(l.whatsapp_number || '').replace(/\D/g, '')}`, '_blank')}
                          className="w-full rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Risks */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Inventory risks</h3>
                  <p className="text-sm text-slate-400">Low stock & out-of-stock</p>
                </div>
                <Activity className="w-5 h-5 text-slate-500" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-300 font-semibold mb-2">Out of stock (trending)</div>
                  {derived.outOfStockTrending.length === 0 ? (
                    <div className="text-sm text-slate-500">No out-of-stock items.</div>
                  ) : (
                    <div className="space-y-2">
                      {derived.outOfStockTrending.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3">
                          <div className="min-w-0">
                            <div className="text-sm text-white font-semibold truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 truncate">{p.category}</div>
                          </div>
                          <div className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/30">{p._interest} hits</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm text-slate-300 font-semibold mb-2">Low stock</div>
                  {derived.lowStock.length === 0 ? (
                    <div className="text-sm text-slate-500">No low-stock items.</div>
                  ) : (
                    <div className="space-y-2">
                      {derived.lowStock.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3">
                          <div className="min-w-0">
                            <div className="text-sm text-white font-semibold truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 truncate">Stock {p.stock_count}</div>
                          </div>
                          <div className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-200 border border-amber-500/30">{p._interest} hits</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 text-xs text-slate-500">
            Note: Funnel/share/AI metrics require kiosk event logging. Leads and visualizations already work with current data.
          </div>
        </>
      )}
    </div>
  );
}
