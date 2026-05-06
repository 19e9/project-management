import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiBaseUrl } from '../../lib/api-client';

export interface PublicPricingPlan {
  id: string;
  key: string;
  displayName: string;
  tier: 'free' | 'pro' | 'enterprise';
  sortOrder: number;
  isHighlighted: boolean;
  marketingDescription: string;
  pricing: {
    model: 'free' | 'per_seat' | 'custom';
    seatPriceMonthlyUsd: number;
    seatPriceEffectiveMonthlyAnnualUsd: number;
    annualDiscountPercent: number;
    customLabel: string | null;
  };
  limits: {
    maxMembers: number;
    maxProjects: number;
    storageMb: number;
  };
  features: {
    gantt: boolean;
    cpm: boolean;
    auditLog: boolean;
  };
  bullets: string[];
  cta: { label: string; href: string };
}

export interface PublicPricingResponse {
  currency: string;
  generatedAt: string;
  maxAnnualDiscountPercent: number;
  plans: PublicPricingPlan[];
}

export function usePublicPricingPlans() {
  return useQuery({
    queryKey: ['public', 'pricing-plans'],
    queryFn: async () => {
      const { data } = await axios.get<PublicPricingResponse>(
        `${apiBaseUrl}/public/pricing-plans`,
      );
      return data;
    },
    staleTime: 30_000,
  });
}
