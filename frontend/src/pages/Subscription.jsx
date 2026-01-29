import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, Check, Sparkles, Shield, Zap, 
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
    id: 'trial',
    name: 'Trial',
    price: 0,
    period: 'forever',
    description: 'Get started with basic features',
    features: [
      'Up to 3 products',
      'Basic analytics',
      'Kiosk mode',
      'Lead capture'
    ],
    limitations: [
      'Limited products',
      'No priority support'
    ],
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    period: 'month',
    description: 'Perfect for growing businesses',
    features: [
      'Unlimited products',
      'Advanced analytics',
      'Kiosk mode',
      'Lead capture',
      'Priority support',
      'WhatsApp integration',
      'Custom branding'
    ],
    limitations: [],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2499,
    period: 'month',
    description: 'For large scale operations',
    features: [
      'Everything in Pro',
      'Multiple kiosks',
      'API access',
      'Dedicated support',
      'Custom features',
      'White-label option'
    ],
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
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const currentPlan = shop?.subscription_status || 'trial';

  const handleSelectPlan = (plan) => {
    if (plan.id === 'trial') return;
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update subscription status in Supabase
      const { error } = await supabase
        .from('shops')
        .update({ subscription_status: 'active' })
        .eq('id', shop.id);

      if (error) throw error;

      await refreshShop();
      setShowPaymentDialog(false);
      toast.success('🎉 Subscription activated! You now have unlimited access.');
      navigate('/dashboard/inventory');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiry = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200"
        >
          <Crown className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upgrade Your Plan</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Unlock unlimited products and advanced features to grow your business
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="flex justify-center mb-8">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          currentPlan === 'active' 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          <Crown className="w-4 h-4" />
          Current Plan: {currentPlan === 'active' ? 'Pro' : 'Trial'}
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
            className={`relative bg-white rounded-2xl border-2 p-6 ${
              plan.popular 
                ? 'border-violet-500 shadow-xl shadow-violet-100' 
                : 'border-slate-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-full">
                Most Popular
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-slate-900">₹{plan.price}</span>
                <span className="text-slate-500">/{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
              {plan.limitations.map((limitation, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">✕</span>
                  </div>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelectPlan(plan)}
              disabled={plan.id === 'trial' || (currentPlan === 'active' && plan.id !== 'enterprise')}
              className={`w-full h-12 rounded-xl font-semibold ${
                plan.popular
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200'
                  : plan.id === 'trial'
                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {plan.id === 'trial' 
                ? 'Current Plan' 
                : currentPlan === 'active' && plan.id === 'pro'
                ? 'Active'
                : `Get ${plan.name}`}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Features Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Why Upgrade?</h2>
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
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center p-6 bg-white rounded-2xl border border-slate-200"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-violet-600" />
              Complete Payment
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="bg-violet-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">{selectedPlan.name} Plan</p>
                  <p className="text-sm text-slate-500">Monthly subscription</p>
                </div>
                <p className="text-2xl font-bold text-violet-600">₹{selectedPlan.price}</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Card Number</Label>
              <Input
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                placeholder="1234 5678 9012 3456"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Expiry</Label>
                <Input
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                  placeholder="MM/YY"
                  required
                  className="h-12 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">CVV</Label>
                <Input
                  type="password"
                  maxLength="3"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                  placeholder="123"
                  required
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Cardholder Name</Label>
              <Input
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                placeholder="John Doe"
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white"
              >
                {processing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>Pay ₹{selectedPlan?.price}</>
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
