import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Check,
  Sparkles,
  Users,
  Zap,
  ArrowLeft,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PRICING_PLANS,
  ClientLimit,
  BillingInterval,
  getYearlySavingsPercent,
  PricingPlan,
} from '@/integrations/stripe/config';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import logoFull from '@/assets/logo-full.png';
import logoWhite from '@/assets/logo-white.png';
import gradientBg from '@/assets/gradient-bg.jpg';
import gradientBgDark from '@/assets/gradient-bg-dark.png';
import { toast } from 'sonner';

const Pricing = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subscriptionInfo } = useSubscription();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [clientLimit, setClientLimit] = useState<ClientLimit>(10);
  const [loading, setLoading] = useState<string | null>(null);

  // Filter plans by selected client limit
  const filteredPlans = PRICING_PLANS.filter(p => p.clientLimit === clientLimit);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth');
      return;
    }

    setLoading(plan.id);

    try {
      // Get the price ID based on billing interval
      const priceId = billingInterval === 'yearly' ? plan.yearlyPriceId : plan.monthlyPriceId;

      toast.info('Stripe Checkout wird geladen...');

      // Call Supabase Edge Function to create Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          planId: plan.id,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=canceled`,
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const clientLimitOptions: ClientLimit[] = [10, 25, 50, 100];

  return (
    <div
      className="min-h-screen w-full py-12 px-4"
      style={{
        backgroundImage: `url(${theme === 'dark' ? gradientBgDark : gradientBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {user && (
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="absolute top-4 left-4 glass"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}

          <img
            src={theme === 'dark' ? logoWhite : logoFull}
            alt="Prometheus Coach"
            className="h-12 mx-auto mb-6"
          />

          <h1 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start your 14-day free trial with full Pro features. No credit card required.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10">
          {/* Client Limit Selector */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <Label>Clients:</Label>
            <Select
              value={clientLimit.toString()}
              onValueChange={(v) => setClientLimit(Number(v) as ClientLimit)}
            >
              <SelectTrigger className="w-32 glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clientLimitOptions.map((limit) => (
                  <SelectItem key={limit} value={limit.toString()}>
                    Up to {limit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center gap-3 glass rounded-full px-4 py-2">
            <span
              className={`text-sm ${
                billingInterval === 'monthly' ? 'font-bold' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) =>
                setBillingInterval(checked ? 'yearly' : 'monthly')
              }
            />
            <span
              className={`text-sm ${
                billingInterval === 'yearly' ? 'font-bold' : 'text-muted-foreground'
              }`}
            >
              Yearly
            </span>
            {billingInterval === 'yearly' && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/50">
                Save ~17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`glass rounded-3xl p-8 relative ${
                plan.tier === 'pro'
                  ? 'border-2 border-primary ring-2 ring-primary/20'
                  : ''
              }`}
            >
              {plan.tier === 'pro' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {plan.hasAI ? (
                    <Sparkles className="w-6 h-6 text-primary" />
                  ) : (
                    <Zap className="w-6 h-6 text-muted-foreground" />
                  )}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-muted-foreground">
                  {plan.hasAI
                    ? 'Full AI-powered coaching suite'
                    : 'Essential coaching tools'}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">
                    €{billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    /{billingInterval === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                {billingInterval === 'yearly' && (
                  <p className="text-sm text-green-600 mt-1">
                    Save €{plan.monthlyPrice * 12 - plan.yearlyPrice} per year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        plan.hasAI ? 'text-primary' : 'text-green-500'
                      }`}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading !== null}
                className={`w-full ${
                  plan.tier === 'pro'
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-secondary hover:bg-secondary/90'
                }`}
                size="lg"
              >
                {loading === plan.id ? (
                  'Loading...'
                ) : subscriptionInfo?.plan?.id === plan.id ? (
                  'Current Plan'
                ) : (
                  `Start Free Trial`
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Trial Info */}
        <div className="mt-12 text-center">
          <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="font-bold text-lg mb-2">14-Day Free Trial</h3>
            <p className="text-muted-foreground text-sm">
              Try all Pro features free for 14 days. No credit card required to start.
              Cancel anytime. After your trial, choose the plan that fits your needs.
            </p>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Questions?{' '}
            <a href="mailto:support@prometheus.coach" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
