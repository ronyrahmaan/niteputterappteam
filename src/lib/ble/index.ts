import { CupMode } from '../../store/niteControlStore';

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  isConnectable: boolean;
}

export interface BLEConnectionState {
  deviceId: string;
  isConnected: boolean;
  batteryLevel?: number;
  firmwareVersion?: string;
}

export interface BLEColorCommand {
  red: number;
  green: number;
  blue: number;
}

export interface BLEModeCommand {
  mode: CupMode;
  speed?: number;
}

export interface BLEBrightnessCommand {
  brightness: number; // 0-100
}

// Mock delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock BLE devices
const mockDevices: BLEDevice[] = [
  {
    id: 'cup-1',
    name: 'Nite Cup 1',
    rssi: -45,
    isConnectable: true,
  },
  {
    id: 'cup-2',
    name: 'Nite Cup 2',
    rssi: -52,
    isConnectable: true,
  },
  {
    id: 'cup-3',
    name: 'Nite Cup 3',
    rssi: -38,
    isConnectable: true,
  },
  {
    id: 'cup-4',
    name: 'Nite Cup 4',
    rssi: -67,
    isConnectable: false, // Out of range or low battery
  },
];

class BLEService {
  private static instance: BLEService;
  private isScanning = false;
  private connectedDevices = new Map<string, BLEConnectionState>();
  private scanListeners: ((devices: BLEDevice[]) => void)[] = [];
  private connectionListeners: ((state: BLEConnectionState) => void)[] = [];

  static getInstance(): BLEService {
    if (!BLEService.instance) {
      BLEService.instance = new BLEService();
    }
    return BLEService.instance;
  }

  async initialize(): Promise<void> {
    await delay(500); // Simulate BLE initialization
    console.log('BLE Service initialized');
  }

  async requestPermissions(): Promise<boolean> {
    await delay(300); // Simulate permission request
    // In a real app, this would request actual BLE permissions
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    await delay(100); // Simulate checking Bluetooth state
    return true; // Mock: always enabled
  }

  async startScan(): Promise<void> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    this.isScanning = true;
    
    // Simulate progressive device discovery
    setTimeout(() => {
      this.notifyScanListeners([mockDevices[0]!]);
    }, 500);

    setTimeout(() => {
      this.notifyScanListeners([mockDevices[0]!, mockDevices[1]!]);
    }, 1200);

    setTimeout(() => {
      this.notifyScanListeners([mockDevices[0]!, mockDevices[1]!, mockDevices[2]!]);
    }, 2000);

    setTimeout(() => {
      this.notifyScanListeners(mockDevices);
    }, 3000);
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
  }

  async connectToDevice(deviceId: string): Promise<void> {
    await delay(1500); // Simulate connection time

    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    if (!device.isConnectable) {
      throw new Error('Device is not connectable');
    }

    const connectionState: BLEConnectionState = {
      deviceId,
      isConnected: true,
      batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
      firmwareVersion: '2.1.0',
    };

    this.connectedDevices.set(deviceId, connectionState);
    this.notifyConnectionListeners(connectionState);
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    await delay(500); // Simulate disconnection time

    const connectionState = this.connectedDevices.get(deviceId);
    if (connectionState) {
      connectionState.isConnected = false;
      this.connectedDevices.delete(deviceId);
      this.notifyConnectionListeners(connectionState);
    }
  }

  async sendColorCommand(deviceId: string, command: BLEColorCommand): Promise<void> {
    await delay(200); // Simulate command transmission

    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    // Validate color values
    if (command.red < 0 || command.red > 255 ||
        command.green < 0 || command.green > 255 ||
        command.blue < 0 || command.blue > 255) {
      throw new Error('Invalid color values. RGB values must be 0-255');
    }

    console.log(`Sent color command to ${deviceId}:`, command);
  }

  async sendModeCommand(deviceId: string, command: BLEModeCommand): Promise<void> {
    await delay(200); // Simulate command transmission

    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    console.log(`Sent mode command to ${deviceId}:`, command);
  }

  async sendBrightnessCommand(deviceId: string, command: BLEBrightnessCommand): Promise<void> {
    await delay(150); // Simulate command transmission

    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    if (command.brightness < 0 || command.brightness > 100) {
      throw new Error('Brightness must be between 0 and 100');
    }

    console.log(`Sent brightness command to ${deviceId}:`, command);
  }

  async getBatteryLevel(deviceId: string): Promise<number> {
    await delay(100); // Simulate battery level request

    const connectionState = this.connectedDevices.get(deviceId);
    if (!connectionState || !connectionState.isConnected) {
      throw new Error('Device not connected');
    }

    return connectionState.batteryLevel || 0;
  }

  async getFirmwareVersion(deviceId: string): Promise<string> {
    await delay(100); // Simulate firmware version request

    const connectionState = this.connectedDevices.get(deviceId);
    if (!connectionState || !connectionState.isConnected) {
      throw new Error('Device not connected');
    }

    return connectionState.firmwareVersion || 'Unknown';
  }

  getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices.keys()).filter(deviceId => {
      const state = this.connectedDevices.get(deviceId);
      return state?.isConnected;
    });
  }

  isDeviceConnected(deviceId: string): boolean {
    const state = this.connectedDevices.get(deviceId);
    return state?.isConnected || false;
  }

  // Event listeners
  onScanResult(callback: (devices: BLEDevice[]) => void): () => void {
    this.scanListeners.push(callback);
    return () => {
      const index = this.scanListeners.indexOf(callback);
      if (index > -1) {
        this.scanListeners.splice(index, 1);
      }
    };
  }

  onConnectionStateChange(callback: (state: BLEConnectionState) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private notifyScanListeners(devices: BLEDevice[]): void {
    this.scanListeners.forEach(listener => listener(devices));
  }

  private notifyConnectionListeners(state: BLEConnectionState): void {
    this.connectionListeners.forEach(listener => listener(state));
  }
}

// Utility functions for color conversion
export const hexToRgb = (hex: string): BLEColorCommand => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    throw new Error('Invalid hex color');
  }
  
  return {
    red: parseInt(result[1], 16),
    green: parseInt(result[2], 16),
    blue: parseInt(result[3], 16),
  };
};

export const rgbToHex = (rgb: BLEColorCommand): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgb.red)}${toHex(rgb.green)}${toHex(rgb.blue)}`;
};

// Production-ready utilities for golf cup hardware integration
export const golfCupBleUtils = {
  // Convert RGB to golf cup command format
  createColorCommand: (hexColor: string): BLEColorCommand => {
    return hexToRgb(hexColor);
  },

  // Create brightness command with golf cup specific constraints
  createBrightnessCommand: (brightness: number): BLEBrightnessCommand => {
    // Golf cups typically operate between 10-100% for visibility
    const clampedBrightness = Math.max(10, Math.min(100, brightness));
    return { brightness: clampedBrightness };
  },

  // Create mode command with golf cup specific effects
  createModeCommand: (mode: CupMode, speed?: number): BLEModeCommand => {
    const effectSpeed = speed || getDefaultModeSpeed(mode);
    return { mode, speed: effectSpeed };
  },

  // Batch commands for multiple cups
  createBatchCommands: (cupIds: string[], commands: any[]) => {
    return cupIds.map(cupId => ({
      deviceId: cupId,
      commands: commands
    }));
  },

  // Golf course specific presets
  getGolfCoursePresets: () => [
    { name: 'Fairway Green', color: '#2E7D2E', mode: 'static' as CupMode, brightness: 80 },
    { name: 'Hazard Orange', color: '#FF8C00', mode: 'pulse' as CupMode, brightness: 100 },
    { name: 'Pin Flag Red', color: '#DC143C', mode: 'strobe' as CupMode, brightness: 90 },
    { name: 'Water Blue', color: '#1E90FF', mode: 'pulse' as CupMode, brightness: 70 },
    { name: 'Sand Trap Yellow', color: '#F4A460', mode: 'static' as CupMode, brightness: 75 },
    { name: 'Night Tournament', color: '#FFFFFF', mode: 'pulse' as CupMode, brightness: 100 },
  ],
};

// Helper function for mode speeds
function getDefaultModeSpeed(mode: CupMode): number {
  switch (mode) {
    case 'pulse': return 2; // Slow pulse for golf
    case 'strobe': return 5; // Medium strobe for visibility
    case 'rainbow': return 3; // Smooth rainbow transition
    default: return 1; // Static has minimal speed
  }
}

export const bleService = BLEService.getInstance();