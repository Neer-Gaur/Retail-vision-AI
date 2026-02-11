import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, Calendar, MessageCircle, UserPlus, CheckCircle2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', badge: 'bg-slate-500/10 text-slate-200 border-slate-500/30' },
  { value: 'contacted', label: 'Contacted', badge: 'bg-blue-500/10 text-blue-200 border-blue-500/30' },
  { value: 'interested', label: 'Interested', badge: 'bg-amber-500/10 text-amber-200 border-amber-500/30' },
  { value: 'purchased', label: 'Purchased', badge: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30' },
  { value: 'lost', label: 'Lost', badge: 'bg-red-500/10 text-red-200 border-red-500/30' }
];

function fmtDateTime(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

export default function Leads() {
  const { shop, refreshShop } = useAuthStore();
  const [leads, setLeads] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [sortMode, setSortMode] = useState('newest'); // newest | hot

  // notes editor
  const [notesOpenId, setNotesOpenId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    const initializeLeads = async () => {
      if (!shop) {
        await refreshShop();
      }
      if (shop?.id) {
        await loadLeads();
      }
    };
    initializeLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  const loadLeads = async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const since90 = new Date();
      since90.setDate(since90.getDate() - 90);
      since90.setHours(0, 0, 0, 0);

      const [leadsRes, vizRes, evRes] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('visualizations')
          .select('id,lead_id,created_at')
          .eq('shop_id', shop.id)
          .gte('created_at', since90.toISOString())
          .limit(5000),
        supabase
          .from('kiosk_events')
          .select('id,lead_id,event_type,created_at')
          .eq('shop_id', shop.id)
          .gte('created_at', since90.toISOString())
          .limit(20000)
      ]);

      if (leadsRes.error) console.error('Leads load error:', leadsRes.error);
      if (vizRes.error) console.warn('Viz load warning:', vizRes.error);
      if (evRes.error) console.warn('Events load warning:', evRes.error);

      setLeads(leadsRes.data || []);
      setVisualizations(vizRes.data || []);
      setEvents(evRes.data || []);
    } catch (error) {
      console.error('Leads exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayLeads = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter(l => l.created_at?.startsWith(today)).length;
  }, [leads]);

  const thisWeekLeads = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return leads.filter(l => new Date(l.created_at) >= weekAgo).length;
  }, [leads]);

  const leadScoreMap = useMemo(() => {
    const m = new Map();
    // viz weight
    visualizations.forEach(v => {
      if (!v.lead_id) return;
      m.set(v.lead_id, (m.get(v.lead_id) || 0) + 2);
    });
    // share weight
    events.forEach(e => {
      if (!e.lead_id) return;
      if (e.event_type === 'share_clicked') m.set(e.lead_id, (m.get(e.lead_id) || 0) + 5);
      if (e.event_type === 'visualize_clicked') m.set(e.lead_id, (m.get(e.lead_id) || 0) + 1);
    });
    return m;
  }, [events, visualizations]);

  const sortedLeads = useMemo(() => {
    const list = [...leads];
    if (sortMode === 'hot') {
      return list
        .map(l => ({ ...l, _score: leadScoreMap.get(l.id) || 0 }))
        .sort((a, b) => (b._score - a._score) || (new Date(b.created_at) - new Date(a.created_at)));
    }
    return list;
  }, [leadScoreMap, leads, sortMode]);

  const countsByStatus = useMemo(() => {
    const counts = { new: 0, contacted: 0, interested: 0, purchased: 0, lost: 0 };
    leads.forEach(l => {
      const s = (l.status || 'new').toLowerCase();
      if (counts[s] !== undefined) counts[s] += 1;
      else counts.new += 1;
    });
    return counts;
  }, [leads]);

  const updateLead = async (leadId, patch) => {
    if (!leadId) return;
    setUpdatingId(leadId);

    // optimistic UI
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, ...patch } : l)));

    try {
      const { error } = await supabase
        .from('leads')
        .update(patch)
        .eq('id', leadId)
        .eq('shop_id', shop.id);

      if (error) {
        console.error('Lead update error:', error);
        await loadLeads();
      }
    } catch (e) {
      console.error('Lead update exception:', e);
      await loadLeads();
    } finally {
      setUpdatingId(null);
    }
  };

  const openNotes = (lead) => {
    setNotesOpenId(lead.id);
    setNotesDraft(lead.notes || '');
  };

  const saveNotes = async () => {
    const id = notesOpenId;
    if (!id) return;
    await updateLead(id, { notes: notesDraft });
    setNotesOpenId(null);
    setNotesDraft('');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-white/10 border-t-red-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Leads</h1>
        <p className="text-slate-400">Capture → follow up → close. Edit status directly.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-white/5 flex items-center justify-center">
              <Users className="w-6 h-6 text-red-300" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Leads</p>
              <p className="text-3xl font-bold text-white">{leads.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-white/5 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Today</p>
              <p className="text-3xl font-bold text-white">{todayLeads}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-white/5 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-slate-400">This Week</p>
              <p className="text-3xl font-bold text-white">{thisWeekLeads}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status chips + sort */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <div key={s.value} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${s.badge}`}>
              {s.label}: <span className="text-white">{countsByStatus[s.value] || 0}</span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="bg-black/40 border border-white/10 text-slate-200 rounded-full px-3 py-2 text-xs outline-none focus:border-red-500/40"
          >
            <option value="newest">Newest</option>
            <option value="hot">Hot (score)</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      {sortedLeads.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
          <Users className="w-20 h-20 text-slate-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-2">No Leads Yet</h3>
          <p className="text-slate-400 max-w-md mx-auto">Leads will appear here when customers use your kiosk.</p>
        </motion.div>
      ) : (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-300">Customer</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-300">WhatsApp</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-300">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-300">Last Contacted</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-300">Created</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead, index) => {
                  const status = (lead.status || 'new').toLowerCase();
                  const statusMeta = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
                  const isUpdating = updatingId === lead.id;

                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-semibold border border-white/10">
                            {lead.customer_name?.charAt(0)?.toUpperCase?.()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate">{lead.customer_name}</div>
                            {lead.notes ? (
                              <div className="text-xs text-slate-500 truncate">{lead.notes}</div>
                            ) : (
                              <div className="text-xs text-slate-600">No notes</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-300 font-mono">
                          <Phone className="w-4 h-4 text-slate-500" />
                          {lead.whatsapp_number}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold ${statusMeta.badge}`}>
                            {statusMeta.label}
                          </span>
                          <select
                            disabled={isUpdating}
                            value={status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              updateLead(lead.id, { status: newStatus });
                            }}
                            className="bg-black/40 border border-white/10 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-red-500/40"
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {fmtDateTime(lead.last_contacted_at)}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {fmtDateTime(lead.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => {
                              updateLead(lead.id, {
                                status: status === 'new' ? 'contacted' : status,
                                last_contacted_at: new Date().toISOString()
                              });
                            }}
                            className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
                            title="Mark contacted (updates last_contacted_at)"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Contacted
                          </Button>

                          <Button
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => openNotes(lead)}
                            className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10"
                            title="Edit notes"
                          >
                            <StickyNote className="w-4 h-4 mr-2" />
                            Notes
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => window.open(`https://wa.me/${String(lead.whatsapp_number || '').replace(/\D/g, '')}`, '_blank')}
                            className="rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes modal */}
      {notesOpenId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNotesOpenId(null)} />
          <div className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <div className="text-lg font-semibold text-white">Edit Notes</div>
              <div className="text-sm text-slate-500">Add context for follow-up calls.</div>
            </div>
            <div className="p-6">
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={6}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500/40"
                placeholder="e.g., Customer liked red saree, wants delivery next week..."
              />
              <div className="mt-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setNotesOpenId(null)}
                  className="rounded-full border-white/10 text-slate-200 hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNotes}
                  className="rounded-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
