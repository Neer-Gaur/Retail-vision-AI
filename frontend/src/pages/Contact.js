import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function TiltShell({ children }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 10;
    const rx = -(py - 0.5) * 10;
    setTilt({ rx, ry });
  };

  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div style={{ perspective: 1200 }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Placeholder: you can wire this to Supabase table, webhook, email, etc.
      await new Promise((r) => setTimeout(r, 700));
      toast.success('Thanks — we’ll reach out soon.');
      setForm({ name: '', phone: '', email: '', company: '' });
    } catch {
      toast.error('Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-red-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      </div>

      <div className="relative z-10">
        <header className="pt-28 pb-10 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="text-slate-300 hover:text-white transition-colors">← Back</button>
              <Button onClick={() => navigate('/pricing')} variant="ghost" className="rounded-full text-white hover:bg-white/10">Pricing</Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mt-12 max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Contact</h1>
              <p className="text-slate-400 text-lg mt-4">Tell us about your showroom. We’ll help you set up a pilot.</p>
            </motion.div>
          </div>
        </header>

        <main className="px-6 pb-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-start">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
              <h2 className="text-2xl font-bold">Fast track setup</h2>
              <p className="text-slate-400 mt-2">We can configure your kiosk flow (saree or tiles), branding, and onboarding.</p>
              <div className="mt-6 space-y-3 text-slate-300">
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-red-300" /> support@retailvision.in</div>
                <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-red-300" /> +91 7988987401</div>
                <div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-red-300" /> Gurugram, India</div>
              </div>
            </div>

            <TiltShell>
              <div className="relative rounded-3xl border border-red-500/25 bg-slate-900/55 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-rose-600/10" />
                <form onSubmit={submit} className="relative p-8 space-y-5">
                  <div>
                    <Label className="text-slate-300 mb-2 block">Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white" required />
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white" required />
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white" required />
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Showroom / Company</Label>
                    <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white" />
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button disabled={loading} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-white/5 shadow-lg shadow-red-500/20">
                      {loading ? 'Sending...' : 'Request Demo'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </form>
              </div>
            </TiltShell>
          </div>
        </main>
      </div>
    </div>
  );
}
