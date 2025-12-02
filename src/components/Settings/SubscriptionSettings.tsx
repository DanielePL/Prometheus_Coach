import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { getPlanById, formatPrice } from '@/integrations/stripe/config';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard,
  Calendar,
  Users,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function SubscriptionSettings() {
  const navigate = useNavigate();
  const { data: subscriptionInfo, isLoading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/settings?tab=subscription`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const subscription = subscriptionInfo?.subscription;
  const plan = subscriptionInfo?.plan;
  const status = subscriptionInfo?.status;

  // No subscription yet
  if (!subscription || status === 'none') {
    return (
      <div className="glass rounded-xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Active Subscription</h3>
          <p className="text-muted-foreground mb-6">
            Choose a plan to unlock all coaching features and start managing your clients.
          </p>
          <Button onClick={() => navigate('/pricing')} size="lg">
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'trialing':
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/50">
            <Clock className="w-3 h-3 mr-1" />
            Trial ({subscriptionInfo?.trialDaysRemaining} days left)
          </Badge>
        );
      case 'past_due':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/50">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Past Due
          </Badge>
        );
      case 'canceled':
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/50">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Canceled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="flex items-start gap-4 p-4 bg-background/50 rounded-lg">
            <div className="p-3 bg-primary/20 rounded-lg">
              {plan?.hasAI ? (
                <Sparkles className="w-6 h-6 text-primary" />
              ) : (
                <CreditCard className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{plan?.name || 'Unknown Plan'}</h4>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Up to {plan?.clientLimit || 0} clients
                </span>
                {plan?.hasAI && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    AI Features
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscription.current_period_end && (
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  {subscription.cancel_at_period_end ? 'Access Until' : 'Next Billing Date'}
                </div>
                <p className="font-medium">
                  {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                </p>
              </div>
            )}

            {subscriptionInfo?.isTrialing && subscription.trial_end && (
              <div className="p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  Trial Ends
                </div>
                <p className="font-medium">
                  {format(new Date(subscription.trial_end), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Cancellation Warning */}
          {subscription.cancel_at_period_end && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600">Subscription Canceling</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription will end on{' '}
                  {subscription.current_period_end
                    ? format(new Date(subscription.current_period_end), 'MMMM d, yyyy')
                    : 'the end of your billing period'}
                  . You can reactivate it anytime before then.
                </p>
              </div>
            </div>
          )}

          {/* Past Due Warning */}
          {status === 'past_due' && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600">Payment Failed</p>
                <p className="text-sm text-muted-foreground">
                  Please update your payment method to continue using all features.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              variant="outline"
            >
              {portalLoading ? (
                'Loading...'
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </>
              )}
            </Button>

            {!subscription.cancel_at_period_end && (
              <Button
                onClick={() => navigate('/pricing')}
                variant="ghost"
              >
                Change Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      {plan && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
