import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { CreditCard, Clock, AlertTriangle } from 'lucide-react';

interface SubscriptionRouteProps {
  children: ReactNode;
}

/**
 * Route wrapper that ensures coaches have an active subscription.
 * Shows appropriate messaging for trial expiry, payment issues, etc.
 * Clients bypass this check entirely.
 */
export const SubscriptionRoute = ({ children }: SubscriptionRouteProps) => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { data: subscriptionInfo, isLoading: subLoading } = useSubscription();

  // Show loading while fetching auth/subscription data
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Clients don't need subscriptions - they're invited by coaches
  const isClient = profile?.roles?.includes('client') && !profile?.roles?.includes('coach');
  if (isClient) {
    return <>{children}</>;
  }

  // Coaches need an active subscription
  const isCoach = profile?.roles?.includes('coach') || profile?.roles?.includes('admin');

  if (isCoach && !subscriptionInfo?.canAccessApp) {
    // Determine the specific issue
    const status = subscriptionInfo?.status;

    // Trial expired
    if (status === 'none' || !subscriptionInfo?.subscription) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Start Your Journey</h2>
            <p className="text-muted-foreground mb-6">
              Choose a plan to unlock all coaching features and start managing your clients.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/pricing')}
                className="w-full"
                size="lg"
              >
                View Plans
              </Button>
              <p className="text-sm text-muted-foreground">
                14-day free trial with full Pro features
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Past due payment
    if (status === 'past_due' || status === 'unpaid') {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Issue</h2>
            <p className="text-muted-foreground mb-6">
              There was an issue with your payment. Please update your payment method to continue using the app.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/settings')}
                className="w-full"
                size="lg"
              >
                Update Payment
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Subscription canceled
    if (status === 'canceled') {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Subscription Ended</h2>
            <p className="text-muted-foreground mb-6">
              Your subscription has ended. Resubscribe to continue using all coaching features.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/pricing')}
                className="w-full"
                size="lg"
              >
                Resubscribe
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
