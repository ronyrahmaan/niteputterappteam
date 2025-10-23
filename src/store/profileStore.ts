import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generatePromoCode, isLikelyValidPromo } from "../lib/utils/promo";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  favoriteColor: string;
  golfHandicap?: number;
}

export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  availableCredit: number;
  referralLink: string;
  rewardPreference?: 'store_credit' | 'visa_gift_card';
}

export interface Referral {
  id: string;
  friendName: string;
  friendEmail: string;
  status: 'pending' | 'completed' | 'credited';
  referredAt: string;
  completedAt?: string;
  creditAmount: number;
  orderAmount?: number;
}

interface ProfileState {
  profile: UserProfile | null;
  referralData: ReferralData | null;
  referrals: Referral[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  appliedPromoCode?: string | null;
  hasReferralDiscount: boolean;
  referralOriginCode?: string | null;
}

interface ProfileActions {
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  fetchReferralData: () => Promise<void>;
  sendReferralInvite: (email: string, name?: string) => Promise<void>;
  shareReferralLink: () => Promise<void>;
  initializeReferralForUser: () => Promise<void>;
  setRewardPreference: (pref: 'store_credit' | 'visa_gift_card') => Promise<void>;
  applyReferralCredit: (amount?: number) => Promise<void>;
  setReferralOrigin: (code?: string) => void;
  clearReferralOrigin: () => void;
  setAppliedPromoCode: (code: string | null) => void;
  generateAndSetPromoCode: (length?: number) => string;
  setCustomReferralCode: (code: string) => Promise<void>;
  clearError: () => void;
}

type ProfileStore = ProfileState & ProfileActions;

// Mock data
const mockProfile: UserProfile = {
  id: 'user-123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: 'https://via.placeholder.com/150x150/00FF88/000000?text=JD',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  bio: 'Night golf enthusiast and tech lover. Always looking for the perfect glow!',
  joinedAt: '2023-06-15T10:30:00Z',
  totalOrders: 8,
  totalSpent: 245.99,
  favoriteColor: '#00FF88',
  golfHandicap: 12,
};

const mockReferralData: ReferralData = {
  referralCode: 'JOHN2024',
  totalReferrals: 5,
  totalEarnings: 25.00,
  availableCredit: 15.00,
  referralLink: 'https://niteputter.com/ref/JOHN2024',
  rewardPreference: 'store_credit',
};

const mockReferrals: Referral[] = [
  {
    id: 'ref-1',
    friendName: 'Sarah Johnson',
    friendEmail: 'sarah.j@example.com',
    status: 'completed',
    referredAt: '2024-01-15T14:20:00Z',
    completedAt: '2024-01-18T09:45:00Z',
    creditAmount: 5.00,
    orderAmount: 89.99,
  },
  {
    id: 'ref-2',
    friendName: 'Mike Chen',
    friendEmail: 'mike.chen@example.com',
    status: 'credited',
    referredAt: '2024-01-10T16:30:00Z',
    completedAt: '2024-01-12T11:15:00Z',
    creditAmount: 5.00,
    orderAmount: 124.50,
  },
  {
    id: 'ref-3',
    friendName: 'Emily Davis',
    friendEmail: 'emily.d@example.com',
    status: 'pending',
    referredAt: '2024-01-20T12:00:00Z',
    creditAmount: 5.00,
  },
];

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // State
      profile: mockProfile,
      referralData: mockReferralData,
      referrals: mockReferrals,
      isLoading: false,
      isUpdating: false,
      error: null,
      appliedPromoCode: null,
      hasReferralDiscount: false,
      referralOriginCode: null,

      // Actions
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            profile: mockProfile,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to load profile',
          });
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        set({ isUpdating: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set(state => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
            isUpdating: false,
          }));
        } catch (error) {
          set({
            isUpdating: false,
            error: 'Failed to update profile',
          });
        }
      },

      uploadAvatar: async (_imageUri: string) => {
        set({ isUpdating: true, error: null });
        
        try {
          // Mock image upload - replace with real upload later
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const avatarUrl = `https://via.placeholder.com/150x150/00FF88/000000?text=${Date.now()}`;
          
          set(state => ({
            profile: state.profile ? { ...state.profile, avatar: avatarUrl } : null,
            isUpdating: false,
          }));
        } catch (error) {
          set({
            isUpdating: false,
            error: 'Failed to upload avatar',
          });
        }
      },

      fetchReferralData: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set({
            referralData: mockReferralData,
            referrals: mockReferrals,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to load referral data',
          });
        }
      },

      sendReferralInvite: async (email: string, name?: string) => {
        set({ isUpdating: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newReferral: Referral = {
            id: `ref-${Date.now()}`,
            friendName: name || email.split('@')[0] || 'Unknown',
            friendEmail: email,
            status: 'pending',
            referredAt: new Date().toISOString(),
            creditAmount: 5.00,
          };
          
          set(state => ({
            referrals: [newReferral, ...state.referrals],
            isUpdating: false,
          }));
        } catch (error) {
          set({
            isUpdating: false,
            error: 'Failed to send referral invite',
          });
        }
      },

      shareReferralLink: async () => {
        try {
          const { referralData } = get();
          if (!referralData) return;
          
          // Mock sharing - replace with real sharing later
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // In a real app, this would use React Native's Share API
          console.log('Sharing referral link:', referralData.referralLink);
        } catch (error) {
          set({ error: 'Failed to share referral link' });
        }
      },

      initializeReferralForUser: async () => {
        const { referralData } = get();
        if (referralData?.referralCode) {
          return;
        }
        const code = generatePromoCode(8);
        const link = `https://niteputter.com/ref/${code}`;
        set({
          referralData: {
            referralCode: code,
            referralLink: link,
            totalReferrals: 0,
            totalEarnings: 0,
            availableCredit: 0,
            rewardPreference: 'store_credit',
          },
        });
      },

      setRewardPreference: async (pref: 'store_credit' | 'visa_gift_card') => {
        set(state => ({
          referralData: state.referralData ? { ...state.referralData, rewardPreference: pref } : state.referralData,
        }));
      },

      applyReferralCredit: async (amount = 5.0) => {
        set(state => ({
          referralData: state.referralData
            ? {
                ...state.referralData,
                availableCredit: state.referralData.availableCredit + amount,
                totalEarnings: state.referralData.totalEarnings + amount,
              }
            : state.referralData,
        }));
      },

      setReferralOrigin: (code?: string) => {
        const normalized = code?.trim().toUpperCase();
        set({
          referralOriginCode: normalized && isLikelyValidPromo(normalized) ? normalized : normalized || null,
          hasReferralDiscount: true,
        });
      },

      clearReferralOrigin: () => {
        set({ referralOriginCode: null, hasReferralDiscount: false });
      },

      setAppliedPromoCode: (code: string | null) => {
        const normalized = code ? code.trim().toUpperCase() : null;
        set({ appliedPromoCode: normalized });
      },

      generateAndSetPromoCode: (length: number = 8) => {
        const code = generatePromoCode(length);
        set({ appliedPromoCode: code });
        return code;
      },

      setCustomReferralCode: async (code: string) => {
        const normalized = code.trim().toUpperCase();
        if (!isLikelyValidPromo(normalized)) {
          return;
        }
        set(state => ({
          referralData: state.referralData
            ? {
                ...state.referralData,
                referralCode: normalized,
                referralLink: `https://niteputter.com/ref/${normalized}`,
              }
            : state.referralData,
        }));
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        referralData: state.referralData,
        referrals: state.referrals,
        appliedPromoCode: state.appliedPromoCode,
        hasReferralDiscount: state.hasReferralDiscount,
        referralOriginCode: state.referralOriginCode,
      }),
    }
  )
);
