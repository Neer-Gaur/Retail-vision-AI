import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const values = [
  { icon: Zap, title: 'Speed', desc: 'Retail decisions happen in seconds. Our kiosk flow is built for instant confidence.' },
  { icon: Shield, title: 'Reliability', desc: 'Multiple fallbacks so the showroom experience never breaks in front of customers.' },
  { icon: Sparkles, title: 'Delight', desc: 'A premium interface that makes your store feel futuristic — not “another POS”.' }
];

export default function About() {
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
              <div className="flex gap-2">
                <Button onClick={() => navigate('/pricing')} variant="ghost" className="rounded-full text-white hover:bg-white/10">Pricing</Button>
                <Button onClick={() => navigate('/signup')} className="rounded-full bg-red-600 hover:bg-red-700 text-white">Get Started</Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 max-w-3xl"
            >
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">About RetailVision AI</h1>
              <p className="text-slate-400 text-lg mt-4">
                We build showroom experiences that convert — by letting customers see the product on themselves (or in their space) before they buy.
              </p>
            </motion.div>
          </div>
        </header>

        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-7"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-white/5 flex items-center justify-center">
                    <v.icon className="w-6 h-6 text-red-300" />
                  </div>
                  <h3 className="text-xl font-bold mt-5">{v.title}</h3>
                  <p className="text-slate-400 mt-2">{v.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/35 border border-slate-800 rounded-3xl p-8">
                <h2 className="text-2xl font-bold">What we believe</h2>
                <p className="text-slate-400 mt-3">
                  Physical retail wins when customers feel certainty. Our job is to reduce uncertainty without reducing emotion.
                  That means fast interactions, premium visuals, and a flow designed for real showrooms.
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="relative">
                  <h2 className="text-2xl font-bold">Work with us</h2>
                  <p className="text-red-100 mt-2">Want RetailVision in your store? We can set up a pilot quickly.</p>
                  <div className="mt-6 flex gap-3">
                    <Button onClick={() => navigate('/contact')} className="rounded-full bg-white text-red-600 hover:bg-slate-100 font-bold">Contact</Button>
                    <Button onClick={() => navigate('/signup')} variant="ghost" className="rounded-full text-white hover:bg-white/10">Start Trial</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
