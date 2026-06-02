'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  Shield,
  User,
  Mail,
  Key,
  CreditCard,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingTab = 'profile' | 'security';

function calculatePasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: 'No password', color: 'bg-white/10' };
  if (pass.length < 6) return { score: 1, label: 'Weak', color: 'bg-error' };

  let score = 2;
  const hasUpper = /[A-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);
  const hasLower = /[a-z]/.test(pass);

  if (hasUpper && hasLower) score = 3;
  if (hasNumber) score = 4;
  if (hasSpecial) score = 5;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-error', 'bg-orange-500', 'bg-yellow-500', 'bg-success', 'bg-success'];

  return { score, label: labels[score], color: colors[score] };
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = React.useState<SettingTab>('profile');

  const profileUser = user;
  const initials = profileUser?.avatar_initials ?? 'AM';

  const [fullNameOverride, setFullNameOverride] = React.useState<string | null>(null);
  const fullName = fullNameOverride ?? profileUser?.full_name ?? '';
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const passwordStrength = calculatePasswordStrength(newPassword);

  const tabs: { id: SettingTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch('/api/users/me', { full_name: fullName });
      setUser(res.data.data.user);
      setFullNameOverride(null);
      addToast({
        title: 'Profile updated successfully',
        description: 'Your changes have been saved',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Update failed',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        type: 'error',
      });
      return;
    }
    try {
      await api.patch('/api/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast({
        title: 'Password changed successfully',
        description: 'Your password has been updated',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Password change failed',
        description: getApiErrorMessage(error),
        type: 'error',
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-secondary">Manage your account</p>
      </div>

      <Card className="border border-white/10 bg-gradient-to-br from-card to-card/80 p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent-indigo via-accent-violet to-accent-cyan text-3xl font-bold text-white shadow-glow-indigo"
            aria-hidden
          >
            {initials}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-primary">{fullName || profileUser?.full_name}</h2>
            <p className="text-sm text-muted">{profileUser?.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant={profileUser?.is_verified ? 'success' : 'warning'} className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {profileUser?.is_verified ? 'Verified' : 'Unverified'}
              </Badge>
              <Badge variant="info" className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {profileUser?.credit_balance ?? 0} credits
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-input p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-accent-indigo to-accent-violet text-white shadow-glow-indigo'
                : 'text-secondary hover:text-primary',
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border border-white/10 bg-card p-6 md:p-8">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary flex items-center gap-2">
                      <User className="h-4 w-4 text-muted" />
                      Full Name
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullNameOverride(e.target.value)}
                      className="h-11"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted" />
                      Email Address
                    </label>
                    <Input
                      value={profileUser?.email ?? ''}
                      readOnly
                      type="email"
                      className="h-11 bg-input/50 text-secondary"
                    />
                    <p className="text-xs text-muted">Email cannot be changed here.</p>
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/10 pt-6">
                  <Button type="submit" variant="primary" className="h-11 px-8" leftIcon={<Save className="h-4 w-4" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border border-white/10 bg-card p-6 md:p-8">
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted" />
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-11"
                  />
                  {newPassword && (
                    <p className="text-xs text-muted mt-1">
                      Strength: {passwordStrength.label}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Confirm New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="h-11"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-error mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex justify-end border-t border-white/10 pt-6 gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="px-8" leftIcon={<Shield className="h-4 w-4" />}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
