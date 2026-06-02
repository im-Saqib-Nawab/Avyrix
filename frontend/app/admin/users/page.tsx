'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { Search, Zap, Plus, Minus, User, Mail, Calendar, CreditCard } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  credits: number;
  subscription: string;
  join_date: string;
};

function formatJoinDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminUsersPage() {
  const { addToast } = useUIStore();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [page, setPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [creditModalUser, setCreditModalUser] = React.useState<AdminUser | null>(null);
  const [creditDelta, setCreditDelta] = React.useState('');
  const [creditReason, setCreditReason] = React.useState('');

  const fetchUsers = React.useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get('/api/admin/users', { params });
      const rows = res.data.data as Array<{
        id: string;
        full_name: string;
        email: string;
        role: string;
        credit_balance: number;
        subscription_status: string;
        created_at: string;
      }>;
      setUsers(
        rows.map((u) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          credits: u.credit_balance,
          subscription: u.subscription_status,
          join_date: u.created_at,
        })),
      );
    } catch (error) {
      addToast({
        title: 'Failed to load users',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    }
  }, [addToast, page, searchQuery]);

  React.useEffect(() => {
    const debounce = window.setTimeout(() => void fetchUsers(), 300);
    return () => window.clearTimeout(debounce);
  }, [fetchUsers]);

  const filteredUsers = users;

  const previewBalance = React.useMemo(() => {
    if (!creditModalUser) return null;
    const delta = Number(creditDelta);
    if (Number.isNaN(delta) || creditDelta.trim() === '') {
      return creditModalUser.credits;
    }
    return creditModalUser.credits + delta;
  }, [creditModalUser, creditDelta]);

  const handleApplyCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditModalUser) return;

    const delta = Number(creditDelta);
    if (Number.isNaN(delta)) {
      addToast({ title: 'Enter a valid amount', type: 'error' });
      return;
    }

    try {
      const res = await api.post(`/api/admin/users/${creditModalUser.id}/credits`, {
        amount: delta,
        reason: creditReason || 'Admin adjustment',
      });
      addToast({
        title: 'Credits adjusted',
        description: `New balance: ${res.data.data.credit_balance}`,
        type: 'success',
      });
      setCreditModalUser(null);
      setCreditDelta('');
      setCreditReason('');
      void fetchUsers();
    } catch (error) {
      addToast({
        title: 'Failed to adjust credits',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Users</h1>
          <p className="text-sm text-gray-500">Manage user accounts and credits</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search users..."
            className="h-10 pl-10 bg-white/[0.02] border-white/[0.06] text-white placeholder:text-gray-500 focus:border-white/[0.12]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border-white/[0.06] bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Credits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-xs font-medium text-white">
                        {getInitials(user.full_name)}
                      </div>
                      <span className="text-sm font-medium text-white">{user.full_name}</span>
                    </div>
                   </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      user.role === 'admin' 
                        ? "bg-white/[0.08] text-gray-300" 
                        : "bg-white/[0.04] text-gray-500"
                    )}>
                      {user.role}
                    </span>
                   </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm font-medium text-white">
                      <Zap className="h-3.5 w-3.5 text-gray-500" />
                      {user.credits.toLocaleString()}
                    </span>
                   </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.subscription}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatJoinDate(user.join_date)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs bg-white/[0.05] border-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
                      onClick={() => {
                        setCreditModalUser(user);
                        setCreditDelta('');
                        setCreditReason('');
                      }}
                    >
                      Adjust credits
                    </Button>
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      </Card>

      {/* Credit Adjustment Modal */}
      <Modal
        isOpen={!!creditModalUser}
        onClose={() => {
          setCreditModalUser(null);
          setCreditDelta('');
          setCreditReason('');
        }}
        title="Adjust Credits"
      >
        {creditModalUser && (
          <form onSubmit={handleApplyCredits} className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="h-10 w-10 rounded-full bg-white/[0.08] flex items-center justify-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{creditModalUser.full_name}</p>
                <p className="text-xs text-gray-500">{creditModalUser.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Credit adjustment</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="e.g., 50 or -10"
                  value={creditDelta}
                  onChange={(e) => setCreditDelta(e.target.value)}
                  className="pl-10 bg-white/[0.02] border-white/[0.06] text-white"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {Number(creditDelta) >= 0 ? '+' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Reason (optional)</label>
              <textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Internal note..."
                rows={3}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-white/[0.12] focus:outline-none resize-none"
              />
            </div>

            <div className="rounded-lg bg-white/[0.03] p-3 border border-white/[0.06]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Current balance</span>
                <span className="font-medium text-white">{creditModalUser.credits.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-white/[0.06]">
                <span className="text-gray-400">New balance</span>
                <span className="font-medium text-white">
                  {previewBalance?.toLocaleString() ?? creditModalUser.credits.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 bg-white/[0.05] border-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
                onClick={() => setCreditModalUser(null)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="flex-1 bg-white text-black hover:bg-gray-200"
              >
                Apply Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}