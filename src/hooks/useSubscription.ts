import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING_PLANS, TRIAL_CONFIG, getPlanById, PricingPlan } from '@/integrations/stripe/config';
import { differenceInDays } from 'date-fns';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'none';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
}

export interface SubscriptionInfo {
  subscription: Subscription | null;
  plan: PricingPlan | null;
  status: SubscriptionStatus;
  isActive: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  clientLimit: number;
  hasAI: boolean;
  canAccessApp: boolean;
  needsSubscription: boolean;
}

/**
 * Hook to get and manage the current user's subscription
 */
export const useSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionInfo> => {
      if (!user) {
        return {
          subscription: null,
          plan: null,
          status: 'none',
          isActive: false,
          isTrialing: false,
          trialDaysRemaining: null,
          clientLimit: 0,
          hasAI: false,
          canAccessApp: false,
          needsSubscription: true,
        };
      }

      // Fetch subscription from database
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }

      // No subscription found
      if (!subscription) {
        return {
          subscription: null,
          plan: null,
          status: 'none',
          isActive: false,
          isTrialing: false,
          trialDaysRemaining: null,
          clientLimit: 0,
          hasAI: false,
          canAccessApp: false,
          needsSubscription: true,
        };
      }

      const plan = getPlanById(subscription.plan_id);
      const now = new Date();

      // Check trial status
      let isTrialing = false;
      let trialDaysRemaining: number | null = null;

      if (subscription.status === 'trialing' && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end);
        if (trialEnd > now) {
          isTrialing = true;
          trialDaysRemaining = differenceInDays(trialEnd, now);
        }
      }

      // Determine if subscription is active
      const isActive = ['active', 'trialing'].includes(subscription.status);

      // Get plan limits
      const clientLimit = plan?.clientLimit || 0;
      const hasAI = plan?.hasAI || false;

      return {
        subscription: subscription as Subscription,
        plan: plan || null,
        status: subscription.status as SubscriptionStatus,
        isActive,
        isTrialing,
        trialDaysRemaining,
        clientLimit,
        hasAI,
        canAccessApp: isActive,
        needsSubscription: !isActive,
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to check if user has reached their client limit
 */
export const useClientLimitCheck = () => {
  const { data: subscriptionInfo } = useSubscription();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-limit-check', user?.id],
    queryFn: async () => {
      if (!user || !subscriptionInfo) {
        return {
          canAddClient: false,
          currentCount: 0,
          limit: 0,
          remaining: 0,
        };
      }

      // Count current connected clients
      const { count, error } = await supabase
        .from('coach_connections')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error counting clients:', error);
        return {
          canAddClient: false,
          currentCount: 0,
          limit: subscriptionInfo.clientLimit,
          remaining: 0,
        };
      }

      const currentCount = count || 0;
      const limit = subscriptionInfo.clientLimit;
      const remaining = Math.max(0, limit - currentCount);

      return {
        canAddClient: currentCount < limit,
        currentCount,
        limit,
        remaining,
      };
    },
    enabled: !!user && !!subscriptionInfo,
  });
};

/**
 * Hook to check if user has access to AI features
 */
export const useAIAccess = () => {
  const { data: subscriptionInfo, isLoading } = useSubscription();

  return {
    hasAIAccess: subscriptionInfo?.hasAI || false,
    isLoading,
  };
};

/**
 * Start a trial for a new user
 */
export const startTrial = async (userId: string): Promise<{ error: any }> => {
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_CONFIG.durationDays);

  const { error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: TRIAL_CONFIG.plan,
      status: 'trialing',
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
    });

  return { error };
};
