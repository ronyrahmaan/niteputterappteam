import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Other';

export interface SavedCard {
  id: string;
  brand: CardBrand;
  last4: string;
  exp: string; // MM/YY
  isDefault?: boolean;
  label?: string;
}

interface PaymentState {
  cards: SavedCard[];
  isLoading: boolean;
  error: string | null;
}

interface PaymentActions {
  addCard: (card: Omit<SavedCard, 'id'>) => void;
  removeCard: (id: string) => void;
  setDefault: (id: string) => void;
  clearError: () => void;
}

type PaymentStore = PaymentState & PaymentActions;

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      cards: [],
      isLoading: false,
      error: null,

      addCard: (card) => {
        const id = `card_${Date.now()}`;
        const hasDefault = get().cards.some(c => c.isDefault);
        const isDefault = hasDefault ? !!card.isDefault : true;
        const newCard: SavedCard = { id, ...card, isDefault };
        set(state => ({ cards: [newCard, ...state.cards] }));
      },

      removeCard: (id) => {
        set(state => ({ cards: state.cards.filter(c => c.id !== id) }));
      },

      setDefault: (id) => {
        set(state => ({ cards: state.cards.map(c => ({ ...c, isDefault: c.id === id })) }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'payment-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cards: state.cards }),
    }
  )
);