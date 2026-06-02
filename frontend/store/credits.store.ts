import { create } from 'zustand';

interface CreditsStore {
  balance: number;
  isLow: boolean;
  isCritical: boolean;
  setBalance: (balance: number) => void;
  resetCredits: () => void;
  deduct: (amount: number) => void;
  refund: (amount: number) => void;
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  balance: 0,
  isLow: false,
  isCritical: false,
  setBalance: (balance) => set({
    balance,
    isLow: balance < 20,
    isCritical: balance < 5,
  }),
  resetCredits: () => set({ balance: 0, isLow: false, isCritical: false }),
  deduct: (amount) => set((state) => {
    const newBalance = state.balance - amount;
    return {
      balance: newBalance,
      isLow: newBalance < 20,
      isCritical: newBalance < 5
    };
  }),
  refund: (amount) => set((state) => {
    const newBalance = state.balance + amount;
    return {
      balance: newBalance,
      isLow: newBalance < 20,
      isCritical: newBalance < 5
    };
  }),
}));
