import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { maybePlayConfirm, play } from '../lib/sound';
import { bleService, BLEDevice, hexToRgb } from '../lib/ble';

export interface Cup {
  id: string;
  name: string;
  isConnected: boolean;
  batteryLevel: number;
  color: string;
  mode: CupMode;
  brightness: number;
}

export type CupMode = 'static' | 'pulse' | 'strobe' | 'rainbow';

export interface ColorPreset {
  id: string;
  name: string;
  color: string;
  mode: CupMode;
  brightness: number;
}

export interface GolfScene {
  id: string;
  name: string;
  description: string;
  cupConfigs: {
    cupId: string;
    color: string;
    mode: CupMode;
    brightness: number;
  }[];
  isDefault: boolean;
}

interface NiteControlState {
  cups: Cup[];
  selectedCups: string[];
  colorPresets: ColorPreset[];
  golfScenes: GolfScene[];
  currentScene: string | null;
  isScanning: boolean;
  isConnecting: boolean;
  error: string | null;
  currentColor: string;
  currentMode: CupMode;
  currentBrightness: number;
}

interface NiteControlActions {
  scanForCups: () => Promise<void>;
  connectToCup: (cupId: string) => Promise<void>;
  disconnectFromCup: (cupId: string) => Promise<void>;
  addCup: (cup: Partial<Cup> & { id: string }) => void;
  removeCup: (cupId: string) => void;
  renameCup: (cupId: string, name: string) => void;
  selectCup: (cupId: string) => void;
  deselectCup: (cupId: string) => void;
  selectAllCups: () => void;
  deselectAllCups: () => void;
  setColor: (color: string) => Promise<void>;
  setCupColor: (cupId: string, color: string) => Promise<void>;
  setMode: (mode: CupMode) => Promise<void>;
  setBrightness: (brightness: number) => Promise<void>;
  setCupBrightness: (cupId: string, brightness: number) => Promise<void>;
  savePreset: (name: string) => void;
  deletePreset: (presetId: string) => void;
  applyPreset: (presetId: string) => Promise<void>;
  saveScene: (name: string, description: string) => void;
  deleteScene: (sceneId: string) => void;
  applyScene: (sceneId: string) => Promise<void>;
  clearError: () => void;
  clearStoredData: () => void;
}

type NiteControlStore = NiteControlState & NiteControlActions;

// Start with empty cups array - devices will be added via real BLE scanning
const initialCups: Cup[] = [];

// Initialize BLE service and clear any old data on startup
bleService.initialize().catch(console.error);

// Clear any stored mock data on app startup to ensure clean state
// This fixes the issue where old mock data persists across builds
setTimeout(() => {
  const store = useNiteControlStore.getState();
  store.clearStoredData();
  console.log('🔄 Cleared legacy cup data on startup');
}, 100);

export const useNiteControlStore = create<NiteControlStore>()(
  persist(
    (set, get) => ({
      // State
      cups: initialCups,
      selectedCups: [],
      colorPresets: [
        {
          id: 'preset-1',
          name: 'Neon Green',
          color: '#00FF88',
          mode: 'static',
          brightness: 80,
        },
        {
          id: 'preset-2',
          name: 'Electric Blue',
          color: '#00D4FF',
          mode: 'pulse',
          brightness: 75,
        },
        {
          id: 'preset-3',
          name: 'Party Mode',
          color: '#FF47B3',
          mode: 'rainbow',
          brightness: 100,
        },
      ],
      golfScenes: [
        {
          id: 'scene-1',
          name: 'Tournament Mode',
          description: 'Professional tournament lighting with high visibility',
          cupConfigs: [],
          isDefault: true,
        },
        {
          id: 'scene-2',
          name: 'Night Golf',
          description: 'Bright illumination for evening play',
          cupConfigs: [],
          isDefault: true,
        },
        {
          id: 'scene-3',
          name: 'Practice Range',
          description: 'Steady lighting for practice sessions',
          cupConfigs: [],
          isDefault: true,
        },
        {
          id: 'scene-4',
          name: 'Course Hazards',
          description: 'Warning colors for water and sand hazards',
          cupConfigs: [],
          isDefault: true,
        },
      ],
      currentScene: null,
      isScanning: false,
      isConnecting: false,
      error: null,
      currentColor: '#00FF88',
      currentMode: 'static',
      currentBrightness: 80,

      // Actions
      scanForCups: async () => {
        set({ isScanning: true, error: null });

        try {
          console.log('Starting real BLE scan for devices...');

          // Set up scan listener to auto-add discovered devices as cups
          const unsubscribe = bleService.onScanResult((devices: BLEDevice[]) => {
            const { addCup } = get();

            devices.forEach(device => {
              // Add each discovered device as a cup
              addCup({
                id: device.id,
                name: device.name,
                isConnected: false,
                batteryLevel: 0, // Battery level will be updated after connection
                color: '#00FF88',
                mode: 'static' as CupMode,
                brightness: 80,
              });
            });
          });

          await bleService.requestPermissions();
          await bleService.startScan();

          // Stop scanning after 10 seconds
          setTimeout(() => {
            bleService.stopScan();
            unsubscribe();
            set({
              isScanning: false,
              error: null,
            });
            console.log('BLE scan completed');
          }, 10000);

        } catch (error) {
          console.error('BLE scan failed:', error);
          set({
            isScanning: false,
            error: 'Failed to scan for cups',
          });
        }
      },

      connectToCup: async (cupId: string) => {
        set({ isConnecting: true, error: null });

        try {
          console.log(`Connecting to BLE device: ${cupId}`);
          await bleService.connectToDevice(cupId);

          // Get real battery level after connection
          let batteryLevel = 0;
          try {
            batteryLevel = await bleService.getBatteryLevel(cupId);
            console.log(`Battery level for ${cupId}: ${batteryLevel}%`);
          } catch (error) {
            console.log(`Could not get battery level for ${cupId}, using 0%`);
          }

          set(state => ({
            cups: state.cups.map(cup =>
              cup.id === cupId ? { ...cup, isConnected: true, batteryLevel } : cup
            ),
            isConnecting: false,
            error: null,
          }));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          play('connect');
          console.log(`✅ Successfully connected to ${cupId}`);
        } catch (error) {
          console.error(`❌ Failed to connect to ${cupId}:`, error);
          set({
            isConnecting: false,
            error: 'Failed to connect to cup',
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          play('error');
        }
      },

      disconnectFromCup: async (cupId: string) => {
        try {
          console.log(`Disconnecting from BLE device: ${cupId}`);
          await bleService.disconnectFromDevice(cupId);

          set(state => ({
            cups: state.cups.map(cup =>
              cup.id === cupId ? { ...cup, isConnected: false, batteryLevel: 0 } : cup
            ),
            selectedCups: state.selectedCups.filter(id => id !== cupId),
          }));
          console.log(`✅ Successfully disconnected from ${cupId}`);
        } catch (error) {
          console.error(`❌ Failed to disconnect from ${cupId}:`, error);
          set({ error: 'Failed to disconnect from cup' });
        }
      },

      addCup: (cup: Partial<Cup> & { id: string }) => {
        set((state) => {
          // Enforce a maximum of 18 cups globally
          if (state.cups.length >= 18) {
            return {
              cups: state.cups,
              error: 'Maximum of 18 cups reached',
            };
          }
          const exists = state.cups.some((c) => c.id === cup.id);
          if (exists) {
            return {
              cups: state.cups.map((c) =>
                c.id === cup.id
                  ? {
                      ...c,
                      ...cup,
                      name: cup.name ?? c.name,
                      isConnected: cup.isConnected ?? c.isConnected,
                      batteryLevel: cup.batteryLevel ?? c.batteryLevel,
                      color: cup.color ?? c.color,
                      mode: cup.mode ?? c.mode,
                      brightness: cup.brightness ?? c.brightness,
                    }
                  : c
              ),
            };
          }
          const newCup: Cup = {
            id: cup.id,
            name: cup.name ?? `Cup ${state.cups.length + 1}`,
            isConnected: cup.isConnected ?? false,
            batteryLevel: cup.batteryLevel ?? 80,
            color: cup.color ?? state.currentColor,
            mode: cup.mode ?? state.currentMode,
            brightness: cup.brightness ?? state.currentBrightness,
          };
          return { cups: [...state.cups, newCup] };
        });
      },

      removeCup: (cupId: string) => {
        set((state) => ({
          cups: state.cups.filter((c) => c.id !== cupId),
          selectedCups: state.selectedCups.filter((id) => id !== cupId),
        }));
      },

      renameCup: (cupId: string, name: string) => {
        set(state => ({
          cups: state.cups.map(cup =>
            cup.id === cupId ? { ...cup, name } : cup
          ),
        }));
      },

      selectCup: (cupId: string) => {
        set(state => ({
          selectedCups: state.selectedCups.includes(cupId)
            ? state.selectedCups
            : [...state.selectedCups, cupId],
        }));
      },

      deselectCup: (cupId: string) => {
        set(state => ({
          selectedCups: state.selectedCups.filter(id => id !== cupId),
        }));
      },

      selectAllCups: () => {
        const { cups } = get();
        const connectedCupIds = cups
          .filter(cup => cup.isConnected)
          .map(cup => cup.id);
        
        set({ selectedCups: connectedCupIds });
      },

      deselectAllCups: () => {
        set({ selectedCups: [] });
      },

      setColor: async (color: string) => {
        const { selectedCups, cups } = get();
        set({ currentColor: color });

        try {
          // Get connected cups that are selected
          const selectedConnectedCups = cups.filter(cup =>
            selectedCups.includes(cup.id) && cup.isConnected
          );

          if (selectedConnectedCups.length === 0) {
            console.log('No connected cups selected for color change');
            return;
          }

          // Send real BLE color commands to each selected connected cup
          const colorCommand = hexToRgb(color);
          console.log(`Setting color ${color} for ${selectedConnectedCups.length} cups:`, colorCommand);

          for (const cup of selectedConnectedCups) {
            try {
              await bleService.sendColorCommand(cup.id, colorCommand);
              console.log(`✅ Color command sent to ${cup.name} (${cup.id})`);
            } catch (error) {
              console.error(`❌ Failed to send color to ${cup.name}:`, error);
            }
          }

          // Update cup colors in state
          set(state => ({
            cups: state.cups.map(cup =>
              selectedCups.includes(cup.id) ? { ...cup, color } : cup
            ),
          }));
          maybePlayConfirm();
        } catch (error) {
          console.error('Failed to set color:', error);
          set({ error: 'Failed to set color' });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          play('error');
        }
      },

      setCupColor: async (cupId: string, color: string) => {
        try {
          const { cups } = get();
          const cup = cups.find(c => c.id === cupId);

          if (!cup) {
            throw new Error('Cup not found');
          }

          if (!cup.isConnected) {
            console.log(`Cup ${cup.name} is not connected, skipping BLE command`);
            set(state => ({
              cups: state.cups.map(cup =>
                cup.id === cupId ? { ...cup, color } : cup
              ),
            }));
            return;
          }

          // Send real BLE color command to specific cup
          const colorCommand = hexToRgb(color);
          console.log(`Setting color ${color} for ${cup.name}:`, colorCommand);

          await bleService.sendColorCommand(cupId, colorCommand);
          console.log(`✅ Color command sent to ${cup.name} (${cupId})`);

          set(state => ({
            cups: state.cups.map(cup =>
              cup.id === cupId ? { ...cup, color } : cup
            ),
          }));
          maybePlayConfirm();
        } catch (error) {
          console.error(`❌ Failed to set cup color:`, error);
          set({ error: 'Failed to set cup color' });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          play('error');
        }
      },

      setMode: async (mode: CupMode) => {
        const { selectedCups, cups } = get();
        set({ currentMode: mode });

        try {
          // Get connected cups that are selected
          const selectedConnectedCups = cups.filter(cup =>
            selectedCups.includes(cup.id) && cup.isConnected
          );

          if (selectedConnectedCups.length === 0) {
            console.log('No connected cups selected for mode change');
            return;
          }

          // Send real BLE mode commands to each selected connected cup
          console.log(`Setting mode ${mode} for ${selectedConnectedCups.length} cups`);

          for (const cup of selectedConnectedCups) {
            try {
              await bleService.sendModeCommand(cup.id, { mode });
              console.log(`✅ Mode command sent to ${cup.name} (${cup.id})`);
            } catch (error) {
              console.error(`❌ Failed to send mode to ${cup.name}:`, error);
            }
          }

          set(state => ({
            cups: state.cups.map(cup =>
              selectedCups.includes(cup.id) ? { ...cup, mode } : cup
            ),
          }));
        } catch (error) {
          console.error('Failed to set mode:', error);
          set({ error: 'Failed to set mode' });
        }
      },

      setBrightness: async (brightness: number) => {
        const { selectedCups, cups } = get();
        set({ currentBrightness: brightness });

        try {
          // Get connected cups that are selected
          const selectedConnectedCups = cups.filter(cup =>
            selectedCups.includes(cup.id) && cup.isConnected
          );

          if (selectedConnectedCups.length === 0) {
            console.log('No connected cups selected for brightness change');
            return;
          }

          // Send real BLE brightness commands to each selected connected cup
          console.log(`Setting brightness ${brightness} for ${selectedConnectedCups.length} cups`);

          for (const cup of selectedConnectedCups) {
            try {
              await bleService.sendBrightnessCommand(cup.id, { brightness });
              console.log(`✅ Brightness command sent to ${cup.name} (${cup.id})`);
            } catch (error) {
              console.error(`❌ Failed to send brightness to ${cup.name}:`, error);
            }
          }

          set(state => ({
            cups: state.cups.map(cup =>
              selectedCups.includes(cup.id) ? { ...cup, brightness } : cup
            ),
          }));
          maybePlayConfirm();
        } catch (error) {
          console.error('Failed to set brightness:', error);
          set({ error: 'Failed to set brightness' });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          play('error');
        }
      },

      setCupBrightness: async (cupId: string, brightness: number) => {
        try {
          // Smooth interpolation to reduce flicker
          const current = get().cups.find(c => c.id === cupId)?.brightness ?? 0;
          const steps = 8;
          const duration = 240;
          const stepDelay = Math.max(10, Math.floor(duration / steps));
          const diff = brightness - current;
          for (let i = 1; i <= steps; i++) {
            const interim = Math.round(current + (diff * (i / steps)));
            await new Promise(resolve => setTimeout(resolve, stepDelay));
            set(state => ({
              cups: state.cups.map(cup => cup.id === cupId ? { ...cup, brightness: interim } : cup),
            }));
          }
          maybePlayConfirm();
        } catch (error) {
          set({ error: 'Failed to set cup brightness' });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          play('error');
        }
      },

      savePreset: (name: string) => {
        const { currentColor, currentMode, currentBrightness } = get();
        const newPreset: ColorPreset = {
          id: Date.now().toString(),
          name,
          color: currentColor,
          mode: currentMode,
          brightness: currentBrightness,
        };
        
        set(state => ({
          colorPresets: [...state.colorPresets, newPreset],
        }));
      },

      deletePreset: (presetId: string) => {
        set(state => ({
          colorPresets: state.colorPresets.filter(preset => preset.id !== presetId),
        }));
      },

      applyPreset: async (presetId: string) => {
        const { colorPresets } = get();
        const preset = colorPresets.find(p => p.id === presetId);
        
        if (!preset) return;
        
        set({
          currentColor: preset.color,
          currentMode: preset.mode,
          currentBrightness: preset.brightness,
        });
        
        // Apply to selected cups
        await get().setColor(preset.color);
        await get().setMode(preset.mode);
        await get().setBrightness(preset.brightness);
      },

      saveScene: (name: string, description: string) => {
        const { cups } = get();
        const newScene: GolfScene = {
          id: Date.now().toString(),
          name,
          description,
          cupConfigs: cups.map(cup => ({
            cupId: cup.id,
            color: cup.color,
            mode: cup.mode,
            brightness: cup.brightness,
          })),
          isDefault: false,
        };

        set(state => ({
          golfScenes: [...state.golfScenes, newScene],
        }));
      },

      deleteScene: (sceneId: string) => {
        set(state => ({
          golfScenes: state.golfScenes.filter(scene => scene.id !== sceneId),
          currentScene: state.currentScene === sceneId ? null : state.currentScene,
        }));
      },

      applyScene: async (sceneId: string) => {
        const { golfScenes, cups } = get();
        const scene = golfScenes.find(s => s.id === sceneId);

        if (!scene) return;

        try {
          // Apply scene configuration to each cup
          for (const config of scene.cupConfigs) {
            const cup = cups.find(c => c.id === config.cupId);
            if (cup && cup.isConnected) {
              // Update cup color
              await get().setCupColor(config.cupId, config.color);
              // Update cup brightness
              await get().setCupBrightness(config.cupId, config.brightness);
              // Update cup mode
              await get().setMode(config.mode);
            }
          }

          set({ currentScene: sceneId });
        } catch (error) {
          set({ error: 'Failed to apply scene' });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      clearStoredData: () => {
        console.log('🗑️ Clearing all stored cup data and resetting to clean state');
        set({
          cups: [], // Clear all cups including any mock data
          selectedCups: [],
          currentScene: null,
          error: null,
        });
      },
    }),
    {
      name: 'nite-control-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cups: state.cups,
        colorPresets: state.colorPresets,
        golfScenes: state.golfScenes,
        currentScene: state.currentScene,
        currentColor: state.currentColor,
        currentMode: state.currentMode,
        currentBrightness: state.currentBrightness,
      }),
    }
  )
);