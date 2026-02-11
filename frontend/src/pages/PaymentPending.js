import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PhoneCall, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentPending() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black text-white selection:bg-red-500/30">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[620px] h-[620px] bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <Button
          onClick={() => navigate('/pricing')}
          variant="ghost"
          className="mb-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-red-600 to-rose-600 blur-xl opacity-30" />
          <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 border border-white/10 overflow-hidden flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">We’ll connect you soon</h1>
                <p className="text-slate-400 mt-1">Your plan request has been received.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-slate-200">
              <p>
                For now, payments are handled manually. Our team will reach out to confirm your plan and activate your account.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-5 h-5 text-red-300" />
                  <div>
                    <div className="text-sm text-slate-400">Support</div>
                    <div className="font-semibold">support@retailvision.in • +91 7988987401</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/login')}
                className="h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold border border-white/5"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => navigate('/contact')}
                variant="outline"
                className="h-12 rounded-2xl border-slate-700 text-white hover:bg-white/10 font-semibold"
              >
                Request a Callback
              </Button>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Note: Your dashboard access is enabled once subscription_status is updated in Supabase.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
