import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, BarChart3, Flame, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Seo from '../components/Seo';

export default function RetailAnalyticsAI() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500/30">
      <Seo
        title="Retail Analytics & AI Analytics Dashboard | RetailVision AI"
        description="Measure showroom performance with retail analytics powered by real kiosk events—funnels, peak hours, top products, share intent, and lead analysis."
        canonical="https://retailvision.in/retail-analytics-ai"
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[520px] h-[520px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[620px] h-[620px] bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      </div>

      <div className="relative z-10">
        <header className="pt-28 pb-14 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="text-slate-300 hover:text-white transition-colors">← Back</button>
              <Button onClick={() => navigate('/contact')} className="rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.25)]">
                Request a Callback
              </Button>
            </div>

            <div className="mt-12 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-medium text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Retail Analytics • AI Analytics • Showroom Insights</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Retail Analytics, Built for Kiosks</h1>
              <p className="text-slate-400 text-lg mt-4">
                Don’t guess. Measure what customers actually did at the kiosk—what they selected, what they visualized, what they shared,
                and which leads are hottest.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/pricing')} className="h-12 rounded-2xl bg-white text-black hover:bg-slate-200 font-semibold">
                  View Plans <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => navigate('/contact')} variant="outline" className="h-12 rounded-2xl border-slate-700 text-white hover:bg-white/10 font-semibold">
                  See a Live Demo
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
            {[{
              icon: BarChart3,
              title: 'Funnel analytics',
              desc: 'Track the customer journey from session start to visualize, render, and share.'
            }, {
              icon: Flame,
              title: 'Peak hours heatmap',
              desc: 'Identify your highest-traffic times to staff and optimize accordingly.'
            }, {
              icon: Share2,
              title: 'Share intent',
              desc: 'Measure what customers shared and which products generate social proof.'
            }].map((x) => (
              <div key={x.title} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-white/5 flex items-center justify-center">
                  <x.icon className="w-6 h-6 text-red-300" />
                </div>
                <h2 className="text-xl font-bold mt-5">{x.title}</h2>
                <p className="text-slate-400 mt-2">{x.desc}</p>
              </div>
            ))}
          </div>

          <div className="max-w-6xl mx-auto mt-10 grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-xl font-bold">What’s included</h3>
              <div className="mt-5 space-y-3">
                {[
                  'Top products by interest and intent',
                  'Lead analysis (status pipeline, notes, hot sorting)',
                  'AI success/failure trend',
                  'Kiosk and shop-wise breakdowns (multi-kiosk ready)'
                ].map((t) => (
                  <div key={t} className="flex items-center gap-3 text-slate-100">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-300" />
                    </div>
                    <span className="text-sm">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="relative">
                <h3 className="text-xl font-bold">See the dashboard in action</h3>
                <p className="text-red-100 mt-2">We’ll show exactly how it maps to your showroom workflow.</p>
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => navigate('/contact')} className="rounded-full bg-white text-red-600 hover:bg-slate-100 font-bold">
                    Request a Callback
                  </Button>
                  <Button onClick={() => navigate('/retail-kiosk-for-shops')} variant="ghost" className="rounded-full text-white hover:bg-white/10">
                    Retail Kiosk
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
