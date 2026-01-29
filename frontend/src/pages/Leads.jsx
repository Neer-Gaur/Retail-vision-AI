import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Phone, Calendar, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export default function Leads() {
  const { shop } = useAuthStore();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shop?.id) loadLeads();
  }, [shop?.id]);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const todayLeads = leads.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.created_at?.startsWith(today);
  }).length;

  const thisWeekLeads = leads.filter(l => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(l.created_at) >= weekAgo;
  }).length;

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
        <p className="text-slate-500 mt-1">Customer contacts captured from kiosk</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Leads</p>
              <p className="text-3xl font-bold text-slate-900">{leads.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Today</p>
              <p className="text-3xl font-bold text-slate-900">{todayLeads}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">This Week</p>
              <p className="text-3xl font-bold text-slate-900">{thisWeekLeads}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-white rounded-2xl border border-slate-200"
        >
          <Users className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-900 mb-2">No Leads Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Leads will appear here when customers use your kiosk
          </p>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Customer</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">WhatsApp</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-700">Date</th>
                <th className="text-right px-6 py-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, index) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {lead.customer_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{lead.customer_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      {lead.whatsapp_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      onClick={() => window.open(`https://wa.me/${lead.whatsapp_number?.replace(/\D/g, '')}`, '_blank')}
                      className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
