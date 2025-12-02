import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SZhoeBoVtgrhZNAJjmPBfzjP5uI10jgwdVmkOfG8dwTZHig9sXGEjSOnzEsqYKZX5souwSBr67PZtwp3Qzdhky600mnmcQ7LF';

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Plan types
export type PlanTier = 'basic' | 'pro';
export type ClientLimit = 10 | 25 | 50 | 100;
export type BillingInterval = 'monthly' | 'yearly';

// Plan definition
export interface PricingPlan {
  id: string;
  name: string;
  tier: PlanTier;
  clientLimit: ClientLimit;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  features: string[];
  hasAI: boolean;
  popular?: boolean;
}

// Pricing plans configuration with actual Stripe Price IDs
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'basic_10',
    name: 'Coach Basic',
    tier: 'basic',
    clientLimit: 10,
    monthlyPrice: 29,
    yearlyPrice: 290,
    monthlyPriceId: 'price_1SZhvWBoVtgrhZNAsegoVzwr',
    yearlyPriceId: 'price_1SZjbaBoVtgrhZNAciz9JCbk',
    hasAI: false,
    features: [
      'Up to 10 clients',
      'Exercise library (800+ exercises)',
      'Workout builder',
      'Client messaging',
      'Progress tracking',
      'Calendar & scheduling',
    ],
  },
  {
    id: 'pro_10',
    name: 'Coach Pro',
    tier: 'pro',
    clientLimit: 10,
    monthlyPrice: 69,
    yearlyPrice: 690,
    monthlyPriceId: 'price_1SZi0zBoVtgrhZNAbV6ZmSDe',
    yearlyPriceId: 'price_1SZjbDBoVtgrhZNA0Wmm2stj',
    hasAI: true,
    popular: true,
    features: [
      'Up to 10 clients',
      'Everything in Basic',
      'AI Video Analysis',
      'Bar Path Tracking',
      'VBT (Velocity Based Training)',
      'Time Under Tension Analysis',
      'AI Training Insights',
    ],
  },
  {
    id: 'basic_25',
    name: 'Coach Basic',
    tier: 'basic',
    clientLimit: 25,
    monthlyPrice: 49,
    yearlyPrice: 490,
    monthlyPriceId: 'price_1SZi5NBoVtgrhZNA97MHGSbp',
    yearlyPriceId: 'price_1SZja5BoVtgrhZNAKyHLiudj',
    hasAI: false,
    features: [
      'Up to 25 clients',
      'Exercise library (800+ exercises)',
      'Workout builder',
      'Client messaging',
      'Progress tracking',
      'Calendar & scheduling',
    ],
  },
  {
    id: 'pro_25',
    name: 'Coach Pro',
    tier: 'pro',
    clientLimit: 25,
    monthlyPrice: 99,
    yearlyPrice: 990,
    monthlyPriceId: 'price_1SZi3nBoVtgrhZNA8cwAS7xc',
    yearlyPriceId: 'price_1SZjaUBoVtgrhZNA5z9YMHpq',
    hasAI: true,
    features: [
      'Up to 25 clients',
      'Everything in Basic',
      'AI Video Analysis',
      'Bar Path Tracking',
      'VBT (Velocity Based Training)',
      'Time Under Tension Analysis',
      'AI Training Insights',
    ],
  },
  {
    id: 'basic_50',
    name: 'Coach Basic',
    tier: 'basic',
    clientLimit: 50,
    monthlyPrice: 79,
    yearlyPrice: 790,
    monthlyPriceId: 'price_1SZi5xBoVtgrhZNA6Ram1H0g',
    yearlyPriceId: 'price_1SZjZWBoVtgrhZNAfx6yi4Ef',
    hasAI: false,
    features: [
      'Up to 50 clients',
      'Exercise library (800+ exercises)',
      'Workout builder',
      'Client messaging',
      'Progress tracking',
      'Calendar & scheduling',
    ],
  },
  {
    id: 'pro_50',
    name: 'Coach Pro',
    tier: 'pro',
    clientLimit: 50,
    monthlyPrice: 149,
    yearlyPrice: 1490,
    monthlyPriceId: 'price_1SZi6XBoVtgrhZNAs5wUQWIi',
    yearlyPriceId: 'price_1SZjZ0BoVtgrhZNA3IUAKqc5',
    hasAI: true,
    features: [
      'Up to 50 clients',
      'Everything in Basic',
      'AI Video Analysis',
      'Bar Path Tracking',
      'VBT (Velocity Based Training)',
      'Time Under Tension Analysis',
      'AI Training Insights',
    ],
  },
  {
    id: 'basic_100',
    name: 'Coach Basic',
    tier: 'basic',
    clientLimit: 100,
    monthlyPrice: 129,
    yearlyPrice: 1290,
    monthlyPriceId: 'price_1SZi79BoVtgrhZNAOkUTT1IH',
    yearlyPriceId: 'price_1SZjYaBoVtgrhZNAMeeWUBgP',
    hasAI: false,
    features: [
      'Up to 100 clients',
      'Exercise library (800+ exercises)',
      'Workout builder',
      'Client messaging',
      'Progress tracking',
      'Calendar & scheduling',
    ],
  },
  {
    id: 'pro_100',
    name: 'Coach Pro',
    tier: 'pro',
    clientLimit: 100,
    monthlyPrice: 229,
    yearlyPrice: 2290,
    monthlyPriceId: 'price_1SZi7pBoVtgrhZNAwn2Fc5Tb',
    yearlyPriceId: 'price_1SZjY3BoVtgrhZNAeRLmc4lQ',
    hasAI: true,
    features: [
      'Up to 100 clients',
      'Everything in Basic',
      'AI Video Analysis',
      'Bar Path Tracking',
      'VBT (Velocity Based Training)',
      'Time Under Tension Analysis',
      'AI Training Insights',
    ],
  },
];

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 14,
  plan: 'pro_10' as const, // Trial gives Pro features with 10 clients
};

// Helper functions
export const getPlanById = (planId: string): PricingPlan | undefined => {
  return PRICING_PLANS.find(p => p.id === planId);
};

export const getPlansByClientLimit = (limit: ClientLimit): PricingPlan[] => {
  return PRICING_PLANS.filter(p => p.clientLimit === limit);
};

export const formatPrice = (price: number, interval: BillingInterval): string => {
  if (interval === 'yearly') {
    return `€${price}/year`;
  }
  return `€${price}/month`;
};

export const getYearlySavings = (plan: PricingPlan): number => {
  const yearlyIfMonthly = plan.monthlyPrice * 12;
  return yearlyIfMonthly - plan.yearlyPrice;
};

export const getYearlySavingsPercent = (plan: PricingPlan): number => {
  const yearlyIfMonthly = plan.monthlyPrice * 12;
  return Math.round(((yearlyIfMonthly - plan.yearlyPrice) / yearlyIfMonthly) * 100);
};
