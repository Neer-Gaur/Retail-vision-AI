import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Check, Shield,
  CreditCard, Package, Users, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 2499,
    period: '+ GST & taxes',
    description: 'Essential setup for a single showroom to start capturing demand.',
    features: ['Inventory up to 50 items', 'Kiosk experience (in-store)', 'Lead capture + basic follow-up', 'Email support'],
    limitations: [],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4999,
    period: '+ GST & taxes',
    description: 'Built for teams that want visibility, insights, and faster conversions.',
    features: ['Inventory up to 200 items', 'Owner dashboard access', 'Advanced analytics', 'Lead analysis', 'Priority support'],
    limitations: [],
    popular: true
  },
  {
    id: 'super',
    name: 'Super',
    price: 12999,
    period: '+ GST & taxes',
    description: 'For growing showrooms—multi-kiosk readiness with maximum throughput.',
    features: ['Everything in Pro', 'Connect up to 3 kiosks', 'Multi-kiosk analytics view', 'Onboarding assistance'],
    limitations: [],
    popular: false
  }
];

export default function Subscription() {
  const navigate = useNavigate();
  const { shop, refreshShop } = useAuthStore();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const currentPlan = String(shop?.subscription_status || 'starter').toLowerCase();

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { error } = await supabase
        .from('shops')
        .update({ subscription_status: selectedPlan?.id || 'pro' })
        .eq('id', shop.id);

      if (error) throw error;

      await refreshShop();
      setShowPaymentDialog(false);
      toast.success('Plan updated. Access will reflect immediately.');
      navigate('/dashboard/inventory');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  const formatExpiry = (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20 border border-white/10"
        >
          <Crown className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">Upgrade Your Plan</h1>
        <p className="text-slate-400 max-w-md mx-auto">Choose a plan that matches your showroom scale. Payments are manual for now.</p>
      </div>

      {/* Current Plan Badge */}
      <div className="flex justify-center mb-8">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
          ['starter', 'pro', 'super', 'active'].includes(currentPlan)
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        }`}>
          <Crown className="w-4 h-4" />
          Current Plan: {currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) : 'Starter'}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-slate-900/50 backdrop-blur-xl rounded-2xl border p-6 ${
              plan.popular
                ? 'border-red-500/50 shadow-xl shadow-red-500/10'
                : 'border-slate-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-red-600 to-rose-700 text-white text-sm font-semibold rounded-full border border-white/10">
                Most Popular
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">₹{plan.price.toLocaleString('en-IN')}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-300" />
                  </div>
                  <span className="text-slate-200">{feature}</span>
                </li>
              ))}
              {plan.limitations.map((limitation, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">✕</span>
                  </div>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelectPlan(plan)}
              disabled={currentPlan === plan.id}
              className={`w-full h-12 rounded-xl font-semibold border transition-all ${
                plan.id === 'trial'
                  ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-red-600 hover:bg-red-700 text-white border-white/5 shadow-lg shadow-red-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              {currentPlan === plan.id ? 'Current Plan' : `Choose ${plan.name}`}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Features Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Why Upgrade?</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: Package, title: 'Unlimited Products', desc: 'Add as many products as you need' },
            { icon: BarChart3, title: 'Advanced Analytics', desc: 'Deep insights into your business' },
            { icon: Users, title: 'Lead Management', desc: 'Track and convert more customers' },
            { icon: Shield, title: 'Priority Support', desc: 'Get help when you need it' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.07 }}
              className="text-center p-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-white/5 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-red-300" />
              </div>
              <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-red-300" />
              Complete Payment
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{selectedPlan.name} Plan</p>
                  <p className="text-sm text-slate-400">Plan activation (manual for now)</p>
                </div>
                <p className="text-2xl font-bold text-red-300">₹{selectedPlan.price.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Card Number</Label>
              <Input
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                required
                className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">Expiry</Label>
                <Input
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/YY"
                  required
                  className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">CVV</Label>
                <Input
                  type="password"
                  maxLength="3"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                  placeholder="123"
                  required
                  className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-300 mb-2 block">Cardholder Name</Label>
              <Input
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                placeholder="John Doe"
                required
                className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)} className="flex-1 h-12 rounded-xl border-white/10 text-slate-200 hover:bg-white/5">
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white border border-white/5">
                {processing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>Pay ₹{selectedPlan?.price?.toLocaleString?.('en-IN') || selectedPlan?.price}</>
                )}
              </Button>
            </div>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            <Shield className="w-3 h-3 inline mr-1" />
            Secured by 256-bit SSL encryption
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
