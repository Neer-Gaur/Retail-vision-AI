import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹2,499',
    period: '+ GST & taxes',
    desc: 'Essential setup for a single showroom to start capturing demand.',
    accent: 'from-white/10 to-white/5',
    border: 'border-white/10',
    features: [
      'Inventory up to 50 items',
      'Kiosk experience (in-store)',
      'Lead capture + basic follow-up',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹4,999',
    period: '+ GST & taxes',
    desc: 'Built for teams that want visibility, insights, and faster conversions.',
    accent: 'from-red-600/20 to-rose-600/10',
    border: 'border-red-500/30',
    featured: true,
    features: [
      'Inventory up to 200 items',
      'Owner dashboard access',
      'Advanced analytics (funnel, peak hours, top products)',
      'Lead analysis (hot leads, status pipeline)',
      'Priority support'
    ]
  },
  {
    id: 'super',
    name: 'Super',
    price: '₹12,999',
    period: '+ GST & taxes',
    desc: 'For growing showrooms—multi-kiosk readiness with maximum throughput.',
    accent: 'from-violet-600/20 to-fuchsia-600/10',
    border: 'border-white/10',
    features: [
      'Everything in Pro',
      'Connect up to 3 kiosks',
      'Multi-kiosk analytics view',
      'Onboarding assistance'
    ]
  }
];

function TiltCard({ children, className = '' }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 10;
    const rx = -(py - 0.5) * 10;
    setTilt({ rx, ry });
  };

  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1200 }}
    >
      <div
        className="h-full"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();

  const faq = useMemo(
    () => [
      { q: 'What does “+ GST & taxes” mean?', a: 'Prices are exclusive of GST and applicable local taxes, billed as per invoice.' },
      { q: 'Can I upgrade later?', a: 'Yes. You can move from Starter → Pro → Super anytime as your inventory and kiosks grow.' },
      { q: 'How many kiosks can I connect?', a: 'Starter and Pro are designed for a single kiosk. Super supports up to 3 kiosks.' }
    ],
    []
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      </div>

      <div className="relative z-10">
        <header className="pt-28 pb-14 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="text-slate-300 hover:text-white transition-colors">← Back</button>
              <Button onClick={() => navigate('/signup')} className="rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.25)]">
                Get Started
              </Button>
            </div>

            <div className="mt-12 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-medium text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Simple pricing. Premium experience.</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Pricing</h1>
              <p className="text-slate-400 text-lg mt-4">Choose a plan that matches your showroom scale. Upgrade anytime.</p>
            </div>
          </div>
        </header>

        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <TiltCard className="h-full">
                    <div className={`relative h-full rounded-3xl border ${p.border} bg-slate-900/45 backdrop-blur-xl overflow-hidden`}
                         style={{ transform: 'translateZ(0px)' }}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${p.accent}`} />
                      {p.featured && (
                        <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-200 text-xs font-semibold">
                          <Crown className="w-3 h-3" /> Featured
                        </div>
                      )}
                      <div className="relative p-7">
                        <h3 className="text-xl font-bold">{p.name}</h3>
                        <p className="text-slate-400 text-sm mt-1">{p.desc}</p>

                        <div className="mt-6 flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold">{p.price}</span>
                          <span className="text-slate-400">{p.period}</span>
                        </div>

                        <div className="mt-6 space-y-3">
                          {p.features.map((f) => (
                            <div key={f} className="flex items-center gap-3 text-slate-200">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-300" />
                              </div>
                              <span className="text-sm">{f}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8">
                          <Button
                            onClick={() => navigate('/payment')}
                            className={`w-full h-12 rounded-2xl font-semibold border ${
                              p.featured
                                ? 'bg-red-600 hover:bg-red-700 text-white border-white/5 shadow-lg shadow-red-500/20'
                                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            }`}
                          >
                            Proceed to Payment
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>

            <div className="mt-14 grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                <h2 className="text-2xl font-bold">FAQ</h2>
                <div className="mt-6 space-y-5">
                  {faq.map((x) => (
                    <div key={x.q} className="border-b border-white/5 pb-5">
                      <div className="text-white font-semibold">{x.q}</div>
                      <div className="text-slate-400 mt-2">{x.a}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="relative">
                  <h2 className="text-2xl font-bold">Want a demo in your store?</h2>
                  <p className="text-red-100 mt-2">We can help you set up a kiosk flow tailored for sarees or tiles.</p>
                  <div className="mt-6 flex gap-3">
                    <Button onClick={() => navigate('/contact')} className="rounded-full bg-white text-red-600 hover:bg-slate-100 font-bold">
                      Contact
                    </Button>
                    <Button onClick={() => navigate('/contact')} variant="ghost" className="rounded-full text-white hover:bg-white/10">
                      Request a Callback
                    </Button>
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
