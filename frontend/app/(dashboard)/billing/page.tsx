'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/page-header';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import type { CreditPack, CreditTransaction, CreditTransactionType } from '@/types';
import { useCreditsStore } from '@/store/credits.store';
import {
  ChevronDown,
  TrendingUp,
  Zap,
  Crown,
  Clock,
  History,
  HelpCircle,
  Plus,
  Coins,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAN_CREDIT_LIMIT = 500;
const PAGE_SIZE = 5;

function formatTxDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function transactionBadgeVariant(type: CreditTransactionType): 'success' | 'error' | 'info' | 'neutral' {
  switch (type) {
    case 'purchase':
      return 'success';
    case 'deduction':
      return 'error';
    case 'refund':
      return 'info';
    default:
      return 'neutral';
  }
}

function formatAmount(amount: number): string {
  return amount > 0 ? `+${amount}` : `${amount}`;
}

export default function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const setBalance = useCreditsStore((s) => s.setBalance);
  const { addToast } = useUIStore();
  const packsRef = React.useRef<HTMLDivElement>(null);
  const [page, setPage] = React.useState(0);
  const [buyingPack, setBuyingPack] = React.useState<string | null>(null);
  const [creditPacks, setCreditPacks] = React.useState<CreditPack[]>([]);
  const [transactions, setTransactions] = React.useState<CreditTransaction[]>([]);

  const credits = user?.credit_balance ?? 0;
  const creditPercent = Math.min(100, Math.round((credits / PLAN_CREDIT_LIMIT) * 100));
  const remainingCredits = Math.max(0, PLAN_CREDIT_LIMIT - credits);
  const subscriptionLabel =
    user?.subscription_status === 'active'
      ? 'Active'
      : user?.subscription_status === 'past_due'
        ? 'Past due'
        : user?.subscription_status === 'cancelled'
          ? 'Cancelled'
          : 'Free tier';

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, transactionsRes, creditsRes] = await Promise.all([
          api.get('/api/billing/plans'),
          api.get('/api/credits/transactions', { params: { limit: 10 } }),
          api.get('/api/credits/balance'),
        ]);
        const plans = plansRes.data.data as Array<{
          id: string;
          name: string;
          credits: number;
          price_display: string;
          popular: boolean;
        }>;
        setCreditPacks(
          plans.map((p) => ({
            id: p.id,
            name: p.name,
            credits: p.credits,
            price_display: p.price_display,
            popular: p.popular,
          })),
        );
        const txRows = transactionsRes.data.data as Array<{
          id: string;
          created_at: string;
          description: string;
          type: CreditTransactionType;
          amount: number;
          balance_after: number;
        }>;
        setTransactions(
          txRows.map((tx) => ({
            id: tx.id,
            date: tx.created_at,
            description: tx.description,
            type: tx.type,
            amount: tx.amount,
            balance_after: tx.balance_after,
          })),
        );
        setBalance(creditsRes.data.data.balance);
      } catch {
        // show empty state
      }
    };
    void fetchData();
  }, [setBalance]);

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const pageTransactions = transactions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleBuyPack = async (packId: string) => {
    setBuyingPack(packId);
    try {
      const res = await api.post('/api/billing/checkout', { pack_id: packId });
      window.location.assign(res.data.data.checkout_url as string);
    } catch (error) {
      addToast({
        title: 'Checkout unavailable',
        description: getApiErrorMessage(
          error,
          'Stripe checkout is not configured yet. Use test keys or contact support.',
        ),
        type: 'info',
      });
    } finally {
      setBuyingPack(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16">
      <PageHeader title="Billing" description="Manage your subscription and credits" />

      {/* Credits balance card */}
      <div className="gradient-border relative overflow-hidden rounded-2xl glass-card p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,70,229,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.08),transparent_50%)]" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent-violet/30 bg-gradient-to-br from-accent-indigo/20 to-accent-violet/10">
                <Crown className="h-6 w-6 text-accent-violet" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary">Credit Balance</h2>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs capitalize text-muted">{user?.subscription_status ?? 'free'} plan</span>
                  <Badge variant={user?.subscription_status === 'active' ? 'success' : 'neutral'}>
                    {subscriptionLabel}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums text-gradient-primary">{credits.toLocaleString()}</span>
                <span className="text-secondary">/ {PLAN_CREDIT_LIMIT} credits</span>
              </div>
              <p className="mt-1 text-sm text-muted">{remainingCredits} credits left this month</p>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Usage</span>
                <span className="font-medium text-primary">{creditPercent}%</span>
              </div>
              <Progress value={creditPercent} />
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => packsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 gap-2"
            rightIcon={<ChevronDown className="h-4 w-4" />}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Need more credits
          </Button>
        </div>
      </div>

      {/* Credit packs */}
      <div ref={packsRef} className="scroll-mt-20 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent-indigo" />
            <h3 className="text-xl font-semibold text-primary">Credit Packs</h3>
          </div>
          <p className="mt-1 text-sm text-secondary">One-time purchase, never expires</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creditPacks.map((pack) => {
            const priceValue = parseFloat(pack.price_display.replace('$', ''));
            const creditsPerDollar = Math.round(pack.credits / priceValue);

            return (
              <div
                key={pack.id}
                className={cn(
                  'relative rounded-2xl border transition-all duration-200 hover-lift glass-card',
                  pack.popular
                    ? 'gradient-border border-glow shadow-glow-violet'
                    : 'border-white/10 hover:border-glow hover:shadow-glow-indigo',
                  buyingPack === pack.id && 'opacity-60',
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-2.5 left-4">
                    <span className="rounded-full bg-gradient-to-r from-accent-indigo to-accent-pink px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-glow-indigo">
                      Best value
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <h4 className="font-medium text-primary">{pack.name}</h4>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-primary">{pack.credits.toLocaleString()}</span>
                    <span className="ml-1 text-sm text-muted">credits</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-semibold text-gradient-primary">{pack.price_display}</span>
                    <p className="mt-1 text-xs text-muted">~{creditsPerDollar} credits per $</p>
                  </div>
                  <Button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={buyingPack === pack.id}
                    variant={pack.popular ? 'primary' : 'secondary'}
                    className="mt-5 w-full"
                    isLoading={buyingPack === pack.id}
                  >
                    {buyingPack === pack.id ? 'Processing...' : 'Buy now'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annual plan suggestion */}
      <div className="glass-card rounded-2xl border border-white/10 p-4 transition-all duration-200 hover:border-glow hover-lift">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent-indigo/20 to-accent-cyan/10">
              <Zap className="h-5 w-5 text-accent-cyan" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Go annual & save 20%</p>
              <p className="text-xs text-muted">$19.99/month, billed yearly</p>
            </div>
          </div>
          <button className="text-sm text-accent-indigo transition-colors duration-200 hover:text-accent-violet">
            Switch to annual →
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent-indigo" />
            <h3 className="text-xl font-semibold text-primary">History</h3>
          </div>
          <p className="mt-1 text-sm text-secondary">Your recent credit activity</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 glass-card">
          {pageTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 text-muted" />
              <p className="text-sm text-muted">No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sticky-glass-header border-b border-white/10">
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Description</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">Type</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">Amount</th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pageTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="row-alt content-auto transition-colors duration-200 hover:bg-accent-indigo/5"
                      >
                        <td className="px-5 py-3 text-xs text-muted">{formatTxDate(tx.date)}</td>
                        <td className="px-5 py-3 text-primary">{tx.description}</td>
                        <td className="px-5 py-3">
                          <Badge variant={transactionBadgeVariant(tx.type)} className="capitalize">
                            {tx.type}
                          </Badge>
                        </td>
                        <td
                          className={cn(
                            'px-5 py-3 text-right font-mono',
                            tx.amount > 0 ? 'text-success' : 'text-error',
                          )}
                        >
                          {formatAmount(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-secondary">{tx.balance_after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant={page >= totalPages - 1 ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Support */}
      <div className="glass-card rounded-2xl border border-white/10 p-5 transition-all duration-200 hover:border-glow hover-lift">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent-indigo/20 to-accent-violet/10">
              <HelpCircle className="h-5 w-5 text-accent-violet" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Questions about billing?</p>
              <p className="text-xs text-muted">We&apos;re here to help 24/7</p>
            </div>
          </div>
          <button className="text-sm text-accent-indigo transition-colors duration-200 hover:text-accent-violet">
            Contact support →
          </button>
        </div>
      </div>
    </div>
  );
}
