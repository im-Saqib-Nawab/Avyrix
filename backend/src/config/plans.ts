export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price_usd: 9,
    stripe_price_id: '',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 350,
    price_usd: 29,
    stripe_price_id: '',
    popular: false,
  },
  {
    id: 'business',
    name: 'Business',
    credits: 1000,
    price_usd: 79,
    stripe_price_id: '',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 2500,
    price_usd: 149,
    stripe_price_id: '',
    popular: true,
  },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]['id'];

export function findCreditPack(packId: string) {
  return CREDIT_PACKS.find((pack) => pack.id === packId);
}

export function getPlansForApi() {
  return CREDIT_PACKS.map((pack) => ({
    id: pack.id,
    name: pack.name,
    credits: pack.credits,
    price_usd: pack.price_usd,
    price_display: `$${pack.price_usd.toFixed(2)}`,
    popular: pack.popular,
    stripe_price_id: pack.stripe_price_id,
  }));
}
