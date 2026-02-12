import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Check, Camera, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Seo from '../components/Seo';

export default function VirtualTryOnKiosk() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500/30">
      <Seo
        title="Virtual Try-On Kiosk for Fashion Showrooms (India) | RetailVision AI"
        description="Deploy an in-store virtual try-on kiosk for fashion showrooms. Capture leads, track analytics, and convert more walk-ins with RetailVision AI."
        canonical="https://retailvision.in/virtual-try-on-kiosk"
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
                <span>Fashion Showrooms • In-store Experience</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Virtual Try-On Kiosk</h1>
              <p className="text-slate-400 text-lg mt-4">
                Turn walk-ins into buyers with an AI-powered showroom kiosk. Customers see themselves in the product before they decide —
                while you capture leads and track conversion signals.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/pricing')} className="h-12 rounded-2xl bg-white text-black hover:bg-slate-200 font-semibold">
                  View Plans <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => navigate('/contact')} variant="outline" className="h-12 rounded-2xl border-slate-700 text-white hover:bg-white/10 font-semibold">
                  Book a Demo
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
              <h2 className="text-2xl font-bold">What it does</h2>
              <div className="mt-6 space-y-4">
                {[{
                  icon: Camera,
                  title: 'Instant try-on experience',
                  desc: 'Customers upload or capture a photo and visualize selected products on themselves.'
                }, {
                  icon: Users,
                  title: 'Lead capture built in',
                  desc: 'Collect name and WhatsApp, then track which products each customer explored.'
                }, {
                  icon: BarChart3,
                  title: 'Retail analytics',
                  desc: 'Funnel, peak hours, top products, and share intent — based on real kiosk events.'
                }].map((x) => (
                  <div key={x.title} className="flex gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-white/5 flex items-center justify-center flex-shrink-0">
                      <x.icon className="w-5 h-5 text-red-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{x.title}</div>
                      <div className="text-slate-400 text-sm mt-1">{x.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-rose-600/10 border border-red-500/20 rounded-3xl p-8">
              <h2 className="text-2xl font-bold">Best for</h2>
              <p className="text-slate-300 mt-3">Showrooms that want premium experience and measurable outcomes.</p>
              <div className="mt-6 space-y-3">
                {[
                  'Saree showrooms & boutiques',
                  'Designer studios',
                  'Multi-brand stores',
                  'New collection launches'
                ].map((t) => (
                  <div key={t} className="flex items-center gap-3 text-slate-100">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-300" />
                    </div>
                    <span className="text-sm">{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-3xl bg-black/40 border border-white/10 p-6">
                <div className="text-sm text-slate-400">Need help choosing kiosk hardware?</div>
                <div className="text-white font-semibold mt-1">We’ll recommend a 43" or 55" setup based on your store layout.</div>
                <div className="mt-4">
                  <Button onClick={() => navigate('/contact')} className="rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold">
                    Talk to Sales
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-xl font-bold">FAQ</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="font-semibold">Does it work on any kiosk screen?</div>
                  <div className="text-slate-400 mt-1 text-sm">Yes. We recommend 43" or 55" touch displays with a good webcam for best results.</div>
                </div>
                <div>
                  <div className="font-semibold">Can I see analytics by day and product?</div>
                  <div className="text-slate-400 mt-1 text-sm">Yes. We track kiosk sessions, events, and visualizations to power dashboard analytics.</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="relative">
                <h3 className="text-xl font-bold">Ready to deploy in your showroom?</h3>
                <p className="text-red-100 mt-2">Share your city and store size — we’ll guide the setup.</p>
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => navigate('/contact')} className="rounded-full bg-white text-red-600 hover:bg-slate-100 font-bold">
                    Request a Callback
                  </Button>
                  <Button onClick={() => navigate('/pricing')} variant="ghost" className="rounded-full text-white hover:bg-white/10">
                    View Plans
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
