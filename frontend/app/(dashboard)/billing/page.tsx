'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import type { CreditPack, CreditTransaction, CreditTransactionType } from '@/types';
import { useCreditsStore } from '@/store/credits.store';
import { 
  ChevronDown, 
  TrendingUp, 
  Calendar, 
  Zap,
  Crown,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle,
  RefreshCw,
  Wallet,
  CreditCard,
  History,
  Package,
  HelpCircle,
  Plus,
  Coins
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
    case 'purchase': return 'success';
    case 'deduction': return 'error';
    case 'refund': return 'info';
    default: return 'neutral';
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Billing</h1>
        <p className="text-gray-500 text-sm">Manage your subscription and credits</p>
      </div>

      {/* Current Plan Card - Black/White theme */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
                <Crown className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Credit balance</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 capitalize">{user?.subscription_status ?? 'free'} plan</span>
                  <Badge
                    variant={user?.subscription_status === 'active' ? 'success' : 'neutral'}
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                  >
                    {subscriptionLabel}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{credits.toLocaleString()}</span>
                <span className="text-gray-500">/ {PLAN_CREDIT_LIMIT} credits</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{remainingCredits} credits left this month</p>
            </div>
            
            <div className="w-full max-w-sm space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Usage</span>
                <span className="text-gray-300">{creditPercent}%</span>
              </div>
              <Progress value={creditPercent} className="h-1.5 bg-white/[0.05]" />
            </div>
          </div>
          
          <button
            onClick={() => packsRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm text-gray-300 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
          >
            <Plus className="h-4 w-4" />
            Need more credits
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Credit Packs - Black/White theme */}
      <div ref={packsRef} className="scroll-mt-20 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-gray-400" />
            <h3 className="text-xl font-semibold text-white">Credit packs</h3>
          </div>
          <p className="text-gray-500 text-sm mt-1">One-time purchase, never expires</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPacks.map((pack) => {
            const priceValue = parseFloat(pack.price_display.replace('$', ''));
            const creditsPerDollar = Math.round(pack.credits / priceValue);
            
            return (
              <div
                key={pack.id}
                className={cn(
                  "relative rounded-xl border transition-all duration-200 bg-white/[0.02]",
                  pack.popular 
                    ? "border-white/[0.15] ring-1 ring-white/[0.08]" 
                    : "border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03]",
                  buyingPack === pack.id && "opacity-60"
                )}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-4">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-600 text-white">
                      Best value
                    </span>
                  </div>
                )}
                
                <div className="p-5">
                  <h4 className="font-medium text-white">{pack.name}</h4>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-white">{pack.credits.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm ml-1">credits</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-semibold text-white">{pack.price_display}</span>
                    <p className="text-xs text-gray-500 mt-1">~{creditsPerDollar} credits per $</p>
                  </div>
                  <button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={buyingPack === pack.id}
                    className={cn(
                      "w-full mt-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                      pack.popular
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-white/[0.08] text-gray-200 hover:bg-white/[0.12]"
                    )}
                  >
                    {buyingPack === pack.id ? 'Processing...' : 'Buy now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annual Plan Suggestion - Black/White theme */}
      <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 hover:bg-white/[0.03] transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
              <Zap className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Go annual & save 20%</p>
              <p className="text-xs text-gray-500">$19.99/month, billed yearly</p>
            </div>
          </div>
          <button className="text-sm text-gray-300 hover:text-white transition-colors">
            Switch to annual →
          </button>
        </div>
      </div>

      {/* Transaction History - Black/White theme */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-400" />
            <h3 className="text-xl font-semibold text-white">History</h3>
          </div>
          <p className="text-gray-500 text-sm mt-1">Your recent credit activity</p>
        </div>

        <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
          {pageTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Description</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Type</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Amount</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {pageTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {formatTxDate(tx.date)}
                        </td>
                        <td className="px-5 py-3 text-gray-300">
                          {tx.description}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={transactionBadgeVariant(tx.type)} className="text-xs capitalize">
                            {tx.type}
                          </Badge>
                        </td>
                        <td className={cn(
                          "px-5 py-3 text-right font-mono",
                          tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {formatAmount(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-400 font-mono">
                          {tx.balance_after}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className={cn(
                      "text-sm px-3 py-1 rounded-lg transition-colors",
                      page === 0 ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className={cn(
                      "text-sm px-3 py-1 rounded-lg transition-colors",
                      page >= totalPages - 1 ? "text-gray-600 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Support - Black/White theme */}
      <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5 hover:bg-white/[0.03] transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Questions about billing?</p>
              <p className="text-xs text-gray-500">We&apos;re here to help 24/7</p>
            </div>
          </div>
          <button className="text-sm text-gray-300 hover:text-white transition-colors">
            Contact support →
          </button>
        </div>
      </div>
    </div>
  );
}