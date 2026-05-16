import { useState } from 'react';
import { Check, Sparkles, Zap, ShieldCheck, BarChart3, Brain, Ticket } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { toast } from 'sonner';

export default function Membership() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    // In a real production app, this would redirect to Stripe Checkout
    // Example: window.location.href = 'https://buy.stripe.com/abc123...';
    
    toast.info('Redirecting to secure checkout...');
    setTimeout(() => {
      alert('In this demo, please use a Promo Code (e.g., MINDEDGE_FREE) to upgrade immediately.');
    }, 1000);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !user) return;
    setLoading(true);

    try {
      const { data: code, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim())
        .eq('is_active', true)
        .single();

      if (error || !code) {
        toast.error('Invalid or expired promo code.');
        return;
      }

      // Check usage limits
      if (code.used_count >= code.usage_limit) {
        toast.error('This promo code has reached its usage limit.');
        return;
      }

      // If 100% discount, upgrade immediately
      if (code.discount_percent === 100) {
        await updateProfile({ plan: 'premium' });
        
        // Update used count
        await supabase
          .from('promo_codes')
          .update({ used_count: code.used_count + 1 })
          .eq('id', code.id);

        toast.success(`Success! Code ${code.code} applied. You are now Premium!`);
        setPromoCode('');
      } else {
        toast.success(`${code.discount_percent}% discount applied! Checkout to complete.`);
      }
    } catch (err) {
      toast.error('Failed to apply promo code.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started with trading journaling.',
      features: [
        'Up to 5 trades per month',
        'Basic statistics',
        'Standard trade log',
        'Psychology journal',
      ],
      cta: 'Current Plan',
      current: user?.plan === 'free',
      premium: false
    },
    {
      name: 'Premium',
      price: '$29',
      period: '/month',
      description: 'The ultimate toolkit for professional traders.',
      features: [
        'Unlimited trade logging',
        'AI Trading Coach insights',
        'Advanced analytics & heatmaps',
        'Unlimited checklist items',
        'Data export (CSV/Excel)',
      ],
      cta: user?.plan === 'premium' ? 'Current Plan' : 'Get Edge Now',
      current: user?.plan === 'premium',
      premium: true
    }
  ];

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-display text-text">Choose Your Edge</h1>
        <p className="text-text2 max-w-2xl mx-auto text-lg">
          Join thousands of disciplined traders using MindEdge to master their psychology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            accentColor={plan.premium ? 'var(--accent)' : 'var(--border)'}
            className={`relative overflow-hidden transition-all duration-300 ${plan.premium ? 'scale-105 z-10 border-accent/30' : ''}`}
          >
            {plan.premium && (
              <div className="absolute top-4 right-4">
                <Badge variant="good">RECOMMENDED</Badge>
              </div>
            )}
            
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-display text-text">{plan.name}</h2>
                <p className="text-text2 text-sm">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-text">{plan.price}</span>
                {plan.period && <span className="text-text3">{plan.period}</span>}
              </div>

              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${plan.premium ? 'bg-accent/20 text-accent' : 'bg-surface2 text-text3'}`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[14px] text-text2">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.premium && !plan.current && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-text3" />
                    <span className="text-xs font-semibold text-text3 uppercase tracking-wider">PROMO CODE</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter code..."
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors text-text"
                    />
                    <button 
                      onClick={handleApplyPromo}
                      disabled={loading || !promoCode}
                      className="px-4 py-2 bg-surface2 border border-border rounded-lg text-sm font-bold text-text hover:bg-border transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={plan.premium && !plan.current ? handleUpgrade : undefined}
                disabled={plan.current}
                className={`w-full py-4 rounded-xl font-bold text-[16px] transition-all flex items-center justify-center gap-2 ${
                  plan.current 
                    ? 'bg-surface2 text-text3 cursor-default' 
                    : plan.premium 
                      ? 'bg-accent text-bg hover:brightness-110 active:scale-[0.98]' 
                      : 'bg-surface2 text-text hover:bg-border'
                }`}
              >
                {plan.premium && !plan.current && <Sparkles className="w-5 h-5" />}
                {plan.cta}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface2 border border-border flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text">Secure Payments</h3>
          <p className="text-sm text-text3">All transactions are encrypted and processed securely via Stripe.</p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface2 border border-border flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-accent2" />
          </div>
          <h3 className="text-lg font-semibold text-text">Instant Activation</h3>
          <p className="text-sm text-text3">Get immediate access to all premium features upon successful payment.</p>
        </div>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface2 border border-border flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-text">Cancel Anytime</h3>
          <p className="text-sm text-text3">No long term commitments. Manage your subscription in settings.</p>
        </div>
      </div>
    </div>
  );
}
