import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Brain, Check, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Seo from '../components/Seo';

export default function AIKiosk() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500/30">
      <Seo
        title="AI Kiosk for Retail Showrooms | RetailVision AI"
        description="Deploy an AI kiosk experience in-store. RetailVision AI combines virtual try-on, lead capture, and analytics to improve showroom conversions."
        canonical="https://retailvision.in/ai-kiosk"
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
                <span>AI Kiosk • Retail AI • Showroom Conversions</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">AI Kiosk for Retail</h1>
              <p className="text-slate-400 text-lg mt-4">
                RetailVision AI is an AI-first kiosk experience designed for real showrooms. It improves customer confidence and gives owners
                measurable insights—without adding operational complexity.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/virtual-try-on-kiosk')} className="h-12 rounded-2xl bg-white text-black hover:bg-slate-200 font-semibold">
                  See Virtual Try-On <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => navigate('/pricing')} variant="outline" className="h-12 rounded-2xl border-slate-700 text-white hover:bg-white/10 font-semibold">
                  View Plans
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
            {[{
              icon: Brain,
              title: 'AI-led experience',
              desc: 'Transforms product browsing into a guided visual decision—customers feel confident faster.'
            }, {
              icon: Zap,
              title: 'Fast in-store flow',
              desc: 'Built for kiosks: large touch targets, clear steps, and session-based usage.'
            }, {
              icon: Shield,
              title: 'Controlled rollout',
              desc: 'Owner gating, device id logging, and analytics you can trust.'
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
              <h3 className="text-xl font-bold">Why it wins</h3>
              <div className="mt-5 space-y-3">
                {[
                  'Higher engagement than static catalog browsing',
                  'Lead capture tied to product interest',
                  'Analytics that reveal top-selling intent',
                  'Premium brand experience in-store'
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
                <h3 className="text-xl font-bold">Want a tailored rollout plan?</h3>
                <p className="text-red-100 mt-2">Tell us your inventory size and footfall—we’ll recommend the right plan and kiosk setup.</p>
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => navigate('/contact')} className="rounded-full bg-white text-red-600 hover:bg-slate-100 font-bold">
                    Request a Callback
                  </Button>
                  <Button onClick={() => navigate('/retail-analytics-ai')} variant="ghost" className="rounded-full text-white hover:bg-white/10">
                    Analytics
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
