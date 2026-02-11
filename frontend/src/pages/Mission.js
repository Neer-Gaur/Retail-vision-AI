import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Scan, Store, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Store,
    title: 'Make the showroom feel premium',
    desc: 'Your store should look like the future — and the UI must match.'
  },
  {
    icon: Scan,
    title: 'Reduce uncertainty',
    desc: 'Customers should see the product on themselves / in-room before buying.'
  },
  {
    icon: Monitor,
    title: 'Convert faster',
    desc: 'Shorter decision loops = higher close rates + more WhatsApp sharing.'
  }
];

export default function Mission() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      </div>

      <div className="relative z-10">
        <header className="pt-28 pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="text-slate-300 hover:text-white transition-colors">← Back</button>
              <Button onClick={() => navigate('/signup')} className="rounded-full bg-red-600 hover:bg-red-700 text-white">Get Started</Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-12 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-medium text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Our Mission</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Make physical retail feel like the future.</h1>
              <p className="text-slate-400 text-lg mt-4">
                RetailVision AI exists to give customers instant confidence inside the showroom — and give owners a faster, measurable conversion loop.
              </p>
            </motion.div>
          </div>
        </header>

        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-7"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-white/5 flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-red-300" />
                  </div>
                  <h3 className="text-xl font-bold mt-5">{s.title}</h3>
                  <p className="text-slate-400 mt-2">{s.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-8 md:p-10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">Ready to pilot RetailVision?</h2>
                  <p className="text-red-100 mt-2 max-w-2xl">We can set up a store in minutes. Add inventory, launch kiosk, capture leads, and start visualizations.</p>
                </div>
                <Button
                  onClick={() => navigate('/pricing')}
                  className="rounded-full bg-white text-red-600 hover:bg-slate-100 font-bold h-12 px-6"
                >
                  View Pricing <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
