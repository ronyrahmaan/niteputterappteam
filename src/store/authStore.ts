import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, _password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock user data
          const mockUser: User = {
            id: '1',
            email,
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'https://via.placeholder.com/150',
            createdAt: new Date().toISOString(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Invalid email or password',
          });
        }
      },

      signup: async (email: string, _password: string, firstName: string, lastName: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: Date.now().toString(),
            email,
            firstName,
            lastName,
            createdAt: new Date().toISOString(),
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to create account',
          });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      resetPassword: async (_email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to send reset email',
          });
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({
            user: { ...user, ...updates },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to update profile',
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
