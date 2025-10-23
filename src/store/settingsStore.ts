import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newProducts: boolean;
  referralUpdates: boolean;
  achievementNotifications: boolean;
  emailUpdates: boolean;
  marketingCommunications: boolean;
}

interface AppSettings {
  theme: 'dark' | 'auto';
  hapticFeedback: boolean;
  soundEffects: boolean;
  autoConnect: boolean;
  language: string;
  autoSaveGames: boolean;
  showPerformanceStats: boolean;
  autoConnectCup: boolean;
  smartLighting: boolean;
  batteryAlerts: boolean;
  usageAnalytics: boolean;
  locationServices: boolean;
  biometricAuth: boolean;
  darkMode: boolean;
  units: string;
}

interface SettingsState {
  notifications: NotificationSettings;
  app: AppSettings;
  isLoading: boolean;
  error: string | null;
  // Unified settings object for easier access
  settings: NotificationSettings & AppSettings;
}

interface SettingsActions {
  updateNotificationSetting: (key: keyof NotificationSettings, value: boolean) => Promise<void>;
  updateAppSetting: (key: keyof AppSettings, value: any) => Promise<void>;
  updateSettings: (updates: Partial<NotificationSettings & AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  clearError: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultNotificationSettings: NotificationSettings = {
  pushNotifications: true,
  orderUpdates: true,
  promotions: false,
  newProducts: true,
  referralUpdates: true,
  achievementNotifications: true,
  emailUpdates: true,
  marketingCommunications: false,
};

const defaultAppSettings: AppSettings = {
  theme: 'dark',
  hapticFeedback: true,
  soundEffects: true,
  autoConnect: true,
  language: 'en',
  autoSaveGames: true,
  showPerformanceStats: false,
  autoConnectCup: true,
  smartLighting: true,
  batteryAlerts: true,
  usageAnalytics: false,
  locationServices: false,
  biometricAuth: false,
  darkMode: true,
  units: 'metric',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // State
      notifications: defaultNotificationSettings,
      app: defaultAppSettings,
      settings: { ...defaultNotificationSettings, ...defaultAppSettings },
      isLoading: false,
      error: null,

      // Actions
      updateNotificationSetting: async (key: keyof NotificationSettings, value: boolean) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => {
            const newNotifications = {
              ...state.notifications,
              [key]: value,
            };
            return {
              notifications: newNotifications,
              settings: { ...state.app, ...newNotifications },
              isLoading: false,
            };
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to update notification setting',
          });
        }
      },

      updateAppSetting: async (key: keyof AppSettings, value: any) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => {
            const newApp = {
              ...state.app,
              [key]: value,
            };
            return {
              app: newApp,
              settings: { ...state.notifications, ...newApp },
              isLoading: false,
            };
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to update app setting',
          });
        }
      },

      updateSettings: async (updates: Partial<NotificationSettings & AppSettings>) => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set(state => {
            const newSettings = { ...state.settings, ...updates };
            // Split updates into notifications and app settings
            const notificationKeys = Object.keys(defaultNotificationSettings);
            const appKeys = Object.keys(defaultAppSettings);
            
            const newNotifications = { ...state.notifications };
            const newApp = { ...state.app };
            
            Object.entries(updates).forEach(([key, value]) => {
              if (notificationKeys.includes(key)) {
                (newNotifications as any)[key] = value;
              } else if (appKeys.includes(key)) {
                (newApp as any)[key] = value;
              }
            });
            
            return {
              notifications: newNotifications,
              app: newApp,
              settings: newSettings,
              isLoading: false,
            };
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to update settings',
          });
        }
      },

      resetSettings: async () => {
        return get().resetToDefaults();
      },

      resetToDefaults: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Mock API call - replace with real API later
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set({
            notifications: defaultNotificationSettings,
            app: defaultAppSettings,
            settings: { ...defaultNotificationSettings, ...defaultAppSettings },
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: 'Failed to reset settings',
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        app: state.app,
      }),
    }
  )
);