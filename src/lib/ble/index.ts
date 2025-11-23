import { CupMode } from '../../store/niteControlStore';
import { Platform, Alert } from 'react-native';

// Conditionally import BLE modules
let BleManager: any = null;
let PermissionsAndroid: any = null;

try {
  // Try to import react-native-ble-plx (requires development build)
  const BLE = require('react-native-ble-plx');
  BleManager = BLE.BleManager;

  if (Platform.OS === 'android') {
    const RNPermissions = require('react-native');
    PermissionsAndroid = RNPermissions.PermissionsAndroid;
  }
} catch (error) {
  console.log('BLE module not available in Expo Go - using mock mode');
}

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

// Magic-LED SP105E Controller Constants (researched from Magic-LED app)
const SP105E_SERVICE_UUID = 'FFE0';
const SP105E_CHARACTERISTIC_MAIN = 'FFE1'; // Main command characteristic
const SP105E_CHARACTERISTIC_INIT = 'FFE2'; // Initialization characteristic
const SP105E_DEVICE_NAMES = ['SP105E', 'Magic-LED', 'BLE-LED', 'LED-BLE'];

// Magic-LED Protocol Commands (based on SP110E reverse engineering - compatible with SP105E)
const MAGIC_LED_COMMANDS = {
  // Initialization sequence (critical for Magic-LED protocol)
  INIT_SEQUENCE: new Uint8Array([0x01, 0x00]), // Write to FFE2 first
  INIT_HANDSHAKE: new Uint8Array([0x01, 0xb7, 0xe3, 0xd5]), // Write to FFE1 after init

  // Power control
  TURN_ON: new Uint8Array([0xfa, 0x0e, 0xc7, 0xaa]),
  TURN_OFF: new Uint8Array([0xb0, 0x4f, 0xc2, 0xab]),

  // Color control (RR GG BB 1E format)
  SET_COLOR: (r: number, g: number, b: number) => new Uint8Array([r, g, b, 0x1E]),

  // Brightness control (VV ED 29 2A format)
  SET_BRIGHTNESS: (brightness: number) => new Uint8Array([brightness, 0xed, 0x29, 0x2A]),

  // Preset mode control (VV 09 FA 2C format)
  SET_PRESET: (preset: number) => new Uint8Array([preset, 0x09, 0xfa, 0x2C]),

  // Preset speed control (VV 10 34 03 format)
  SET_SPEED: (speed: number) => new Uint8Array([speed, 0x10, 0x34, 0x03]),
};

// Mock delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to convert Uint8Array to base64 (React Native compatible)
const uint8ArrayToBase64 = (uint8Array: Uint8Array): string => {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

// Mock devices completely removed - only real SP105E devices supported

class BLEService {
  private static instance: BLEService;
  private isScanning = false;
  private bleManager: BleManager;
  private connectedDevices = new Map<string, BLEConnectionState>();
  private scanListeners: ((devices: BLEDevice[]) => void)[] = [];
  private connectionListeners: ((state: BLEConnectionState) => void)[] = [];
  private discoveredDevices = new Map<string, BLEDevice>();

  static getInstance(): BLEService {
    if (!BLEService.instance) {
      BLEService.instance = new BLEService();
    }
    return BLEService.instance;
  }

  constructor() {
    if (BleManager) {
      this.bleManager = new BleManager();
    } else {
      throw new Error('BLE Manager not available - react-native-ble-plx is required. Please run on a development build.');
    }
  }

  async initialize(): Promise<void> {
    try {
      const state = await this.bleManager.state();
      console.log('BLE Manager initialized, state:', state);

      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth is not powered on. Please enable Bluetooth and try again.');
      }
    } catch (error) {
      console.error('Failed to initialize BLE Manager:', error);
      throw new Error(`Failed to initialize Bluetooth: ${error.message}`);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && PermissionsAndroid) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and location permissions are required to scan for LED controllers.'
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async isBluetoothEnabled(): Promise<boolean> {
    try {
      const state = await this.bleManager.state();
      return state === 'PoweredOn';
    } catch (error) {
      console.error('Failed to check Bluetooth state:', error);
      return false;
    }
  }

  async startScan(): Promise<void> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    this.isScanning = true;
    this.discoveredDevices.clear();

    try {
      console.log('Starting real Bluetooth device scan...');
      this.bleManager.startDeviceScan(
        null, // Scan for all devices (not just specific service UUID)
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('BLE scan error:', error);
            return;
          }

          if (device) {
            console.log(`Found device: ${device.name || device.localName || 'Unknown'} (${device.id})`);

            // Add all devices for debugging, filter later
            const bleDevice: BLEDevice = {
              id: device.id,
              name: device.name || device.localName || 'Unknown Device',
              rssi: device.rssi || -100,
              isConnectable: device.isConnectable !== false,
            };

            this.discoveredDevices.set(device.id, bleDevice);
            this.notifyScanListeners(Array.from(this.discoveredDevices.values()));
          }
        }
      );

      // Stop scan after 10 seconds
      setTimeout(() => {
        this.stopScan();
      }, 10000);

    } catch (error) {
      this.isScanning = false;
      throw error;
    }
  }

  private isLEDController(device: any): boolean {
    const name = (device.name || device.localName || '').toLowerCase();
    return SP105E_DEVICE_NAMES.some(controllerName =>
      name.includes(controllerName.toLowerCase())
    ) || device.serviceUUIDs?.includes(SP105E_SERVICE_UUID) || false;
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
    try {
      this.bleManager.stopDeviceScan();
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  }

  async connectToDevice(deviceId: string): Promise<void> {
    try {
      // Only connect to real BLE devices

      // Real device connection
      console.log('Connecting to device:', deviceId);

      // First, try to get device if already connected to system
      let device;
      try {
        const connectedDevices = await this.bleManager.connectedDevices([]);
        device = connectedDevices.find(d => d.id === deviceId);
        if (device) {
          console.log('Device already connected to system, using existing connection');
        }
      } catch (error) {
        console.log('Could not check connected devices, proceeding with fresh connection');
      }

      // If not found in connected devices, connect fresh
      if (!device) {
        device = await this.bleManager.connectToDevice(deviceId);
      }

      console.log('Connected, discovering services...');
      const deviceWithServices = await device.discoverAllServicesAndCharacteristics();

      // Check if device has SP105E service
      const services = await deviceWithServices.services();
      console.log('Available services:', services.map(s => `${s.uuid} (${s.deviceID})`));

      // More comprehensive service matching
      const sp105eService = services.find(service => {
        const uuid = service.uuid.toLowerCase().replace(/-/g, '');
        return uuid === 'ffe0' ||
               uuid.includes('ffe0') ||
               service.uuid.toLowerCase() === SP105E_SERVICE_UUID.toLowerCase() ||
               service.uuid.toLowerCase() === 'ffe0' ||
               service.uuid.toUpperCase() === 'FFE0';
      });

      if (!sp105eService) {
        console.error(`Device does not support SP105E protocol. Available services: ${services.map(s => s.uuid).join(', ')}`);
        console.log('Attempting connection anyway for debugging...');

        // Try to connect anyway - maybe the device doesn't advertise services properly
        const connectionState: BLEConnectionState = {
          deviceId,
          isConnected: true,
          batteryLevel: 100,
          firmwareVersion: 'Unknown',
        };
        this.connectedDevices.set(deviceId, connectionState);
        this.notifyConnectionListeners(connectionState);
        return;
      }

      console.log('SP105E service found, checking characteristics...');
      const characteristics = await sp105eService.characteristics();
      console.log('Available characteristics:', characteristics.map(c => `${c.uuid} (isWritableWithResponse: ${c.isWritableWithResponse}, isWritableWithoutResponse: ${c.isWritableWithoutResponse})`));

      // Try multiple ways to find the write characteristic
      let writeCharacteristic = characteristics.find(char =>
        char.uuid.toLowerCase() === SP105E_CHARACTERISTIC_MAIN.toLowerCase()
      );

      // If not found by exact match, try partial matches
      if (!writeCharacteristic) {
        console.log('Exact UUID match failed, trying partial matches...');
        writeCharacteristic = characteristics.find(char => {
          const uuid = char.uuid.toLowerCase().replace(/-/g, '');
          return uuid.includes('ffe1') || uuid === 'ffe1';
        });
      }

      // If still not found, try any writable characteristic
      if (!writeCharacteristic) {
        console.log('No FFE1 characteristic found, looking for any writable characteristic...');
        writeCharacteristic = characteristics.find(char =>
          char.isWritableWithResponse || char.isWritableWithoutResponse
        );
        if (writeCharacteristic) {
          console.log(`Using alternative writable characteristic: ${writeCharacteristic.uuid}`);
        }
      }

      if (!writeCharacteristic) {
        // Log all characteristics for debugging
        console.error('No suitable characteristics found. All characteristics:',
          characteristics.map(c => ({
            uuid: c.uuid,
            isWritableWithResponse: c.isWritableWithResponse,
            isWritableWithoutResponse: c.isWritableWithoutResponse,
            isReadable: c.isReadable,
            isNotifiable: c.isNotifiable
          }))
        );
        throw new Error(`SP105E control characteristic not found. Available: ${characteristics.map(c => c.uuid).join(', ')}`);
      }

      // Initialize the device with Magic-LED protocol sequence (critical!)
      console.log('Initializing SP105E device with Magic-LED protocol...');

      // Step 1: Find FFE2 characteristic for initialization
      const initCharacteristic = characteristics.find(char => {
        const uuid = char.uuid.toLowerCase().replace(/-/g, '');
        return uuid.includes('ffe2') || uuid === 'ffe2';
      });

      if (initCharacteristic) {
        try {
          console.log('Writing init sequence to FFE2...');
          await initCharacteristic.writeWithoutResponse(
            uint8ArrayToBase64(MAGIC_LED_COMMANDS.INIT_SEQUENCE)
          );
          await delay(100); // Short delay between init steps
        } catch (error) {
          console.warn('FFE2 init sequence failed, continuing anyway:', error);
        }
      }

      // Step 2: Send handshake command to FFE1
      try {
        console.log('Writing handshake to FFE1...');
        await writeCharacteristic.writeWithoutResponse(
          uint8ArrayToBase64(MAGIC_LED_COMMANDS.INIT_HANDSHAKE)
        );
        await delay(100);

        // Step 3: Turn on the device
        console.log('Turning on SP105E device...');
        await writeCharacteristic.writeWithoutResponse(
          uint8ArrayToBase64(MAGIC_LED_COMMANDS.TURN_ON)
        );
      } catch (error) {
        console.error('Magic-LED initialization failed:', error);
        throw new Error(`Failed to initialize Magic-LED protocol: ${error}`);
      }

      const connectionState: BLEConnectionState = {
        deviceId,
        isConnected: true,
        batteryLevel: undefined, // SP105E doesn't report battery - will be handled by store
        firmwareVersion: 'SP105E',
      };

      this.connectedDevices.set(deviceId, connectionState);
      this.notifyConnectionListeners(connectionState);
      console.log('Successfully connected to SP105E device');

    } catch (error) {
      console.error('Failed to connect to device:', error);
      throw new Error(`Connection failed: ${error}`);
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    try {
      // Only disconnect from real BLE devices

      // Real device disconnection
      const device = await this.bleManager.devices([deviceId]);
      if (device.length > 0) {
        await device[0].cancelConnection();
      }

      const connectionState = this.connectedDevices.get(deviceId);
      if (connectionState) {
        connectionState.isConnected = false;
        this.connectedDevices.delete(deviceId);
        this.notifyConnectionListeners(connectionState);
      }
    } catch (error) {
      console.error('Failed to disconnect from device:', error);
      throw error;
    }
  }

  async sendColorCommand(deviceId: string, command: BLEColorCommand): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    // Validate color values
    if (command.red < 0 || command.red > 255 ||
        command.green < 0 || command.green > 255 ||
        command.blue < 0 || command.blue > 255) {
      throw new Error('Invalid color values. RGB values must be 0-255');
    }

    try {
      // Only send commands to real BLE devices

      // Real device command
      const device = await this.bleManager.devices([deviceId]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      const services = await device[0].services();
      const sp105eService = services.find(service =>
        service.uuid.toLowerCase() === SP105E_SERVICE_UUID.toLowerCase()
      );

      if (!sp105eService) {
        throw new Error('SP105E service not found');
      }

      const writeCharacteristic = await this.findWriteCharacteristic(sp105eService);
      if (!writeCharacteristic) {
        throw new Error('SP105E control characteristic not found');
      }

      // Send Magic-LED color command to SP105E (RR GG BB 1E format)
      const colorCommand = MAGIC_LED_COMMANDS.SET_COLOR(command.red, command.green, command.blue);

      // Use writeWithoutResponse for Magic-LED protocol (more reliable)
      await writeCharacteristic.writeWithoutResponse(
        uint8ArrayToBase64(colorCommand)
      );

      console.log(`✅ Sent Magic-LED color command to SP105E ${deviceId}:`, command,
                  `Hex: [${Array.from(colorCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
    } catch (error) {
      console.error('Failed to send color command:', error);
      throw error;
    }
  }

  async sendModeCommand(deviceId: string, command: BLEModeCommand): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    try {
      // Only send commands to real BLE devices

      // Real device command
      const device = await this.bleManager.devices([deviceId]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      const services = await device[0].services();
      const sp105eService = services.find(service =>
        service.uuid.toLowerCase() === SP105E_SERVICE_UUID.toLowerCase()
      );

      if (!sp105eService) {
        throw new Error('SP105E service not found');
      }

      const characteristics = await sp105eService.characteristics();
      const writeCharacteristic = characteristics.find(char =>
        char.uuid.toLowerCase() === SP105E_CHARACTERISTIC_MAIN.toLowerCase()
      );

      if (!writeCharacteristic) {
        throw new Error('SP105E control characteristic not found');
      }

      // Map cup modes to Magic-LED presets (based on research)
      let presetNumber = 63; // Default preset number
      switch (command.mode) {
        case 'static':
          // For static mode, we don't change presets, just set color directly
          console.log('Static mode - color setting handled separately');
          return;
        case 'pulse':
          presetNumber = 5; // Breathing/pulse effect
          break;
        case 'strobe':
          presetNumber = 15; // Strobe effect
          break;
        case 'rainbow':
          presetNumber = 1; // Rainbow effect
          break;
        default:
          presetNumber = 1;
      }

      // Send Magic-LED mode command
      const modeCommand = MAGIC_LED_COMMANDS.SET_PRESET(presetNumber);
      await writeCharacteristic.writeWithoutResponse(
        uint8ArrayToBase64(modeCommand)
      );

      // If speed is provided, send speed command
      if (command.speed !== undefined) {
        const speedValue = Math.round((command.speed / 10) * 255); // Convert 1-10 scale to 0-255
        const speedCommand = MAGIC_LED_COMMANDS.SET_SPEED(speedValue);
        await writeCharacteristic.writeWithoutResponse(
          uint8ArrayToBase64(speedCommand)
        );
      }

      console.log(`✅ Sent Magic-LED mode command to SP105E ${deviceId}:`, command,
                  `Preset: ${presetNumber}, Hex: [${Array.from(modeCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
    } catch (error) {
      console.error('Failed to send mode command:', error);
      throw error;
    }
  }

  async sendBrightnessCommand(deviceId: string, command: BLEBrightnessCommand): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    if (command.brightness < 0 || command.brightness > 100) {
      throw new Error('Brightness must be between 0 and 100');
    }

    try {
      // Only send commands to real BLE devices

      // Real device command
      const device = await this.bleManager.devices([deviceId]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      const services = await device[0].services();
      const sp105eService = services.find(service =>
        service.uuid.toLowerCase() === SP105E_SERVICE_UUID.toLowerCase()
      );

      if (!sp105eService) {
        throw new Error('SP105E service not found');
      }

      const characteristics = await sp105eService.characteristics();
      const writeCharacteristic = characteristics.find(char =>
        char.uuid.toLowerCase() === SP105E_CHARACTERISTIC_MAIN.toLowerCase()
      );

      if (!writeCharacteristic) {
        throw new Error('SP105E control characteristic not found');
      }

      // Convert 0-100 to 0-255 for Magic-LED protocol
      const magicLedBrightness = Math.round((command.brightness / 100) * 255);
      const brightnessCommand = MAGIC_LED_COMMANDS.SET_BRIGHTNESS(magicLedBrightness);

      await writeCharacteristic.writeWithoutResponse(
        uint8ArrayToBase64(brightnessCommand)
      );

      console.log(`✅ Sent Magic-LED brightness command to SP105E ${deviceId}:`, command,
                  `Hex: [${Array.from(brightnessCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
    } catch (error) {
      console.error('Failed to send brightness command:', error);
      throw error;
    }
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

  private async findWriteCharacteristic(service: any): Promise<any> {
    const characteristics = await service.characteristics();

    // Try exact match first
    let writeCharacteristic = characteristics.find(char =>
      char.uuid.toLowerCase() === SP105E_CHARACTERISTIC_MAIN.toLowerCase()
    );

    // Try flexible matching
    if (!writeCharacteristic) {
      writeCharacteristic = characteristics.find(char => {
        const uuid = char.uuid.toLowerCase().replace(/-/g, '');
        return uuid.includes('ffe1') || uuid === 'ffe1';
      });
    }

    // Try any writable characteristic
    if (!writeCharacteristic) {
      writeCharacteristic = characteristics.find(char =>
        char.isWritableWithResponse || char.isWritableWithoutResponse
      );
    }

    return writeCharacteristic;
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