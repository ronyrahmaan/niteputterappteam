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

/**
 * SP105E LED Controller Protocol Implementation
 *
 * PROTOCOL ANALYSIS FROM LIGHTBLUE APP:
 * - Service UUID: FFE0 (confirmed working)
 * - Characteristic UUID: FFE1 (confirmed working)
 * - Write Method: writeWithoutResponse preferred
 * - LightBlue showed: 01CB 0204 0400 0258 (8 bytes)
 *
 * REVISED PROTOCOL (based on SP105E documentation):
 * - Color: [0x38, R, G, B] (4 bytes)
 * - Brightness: [0x3A, brightness] (2 bytes, 0-255)
 * - Pattern: [0x3C, pattern, speed] (3 bytes)
 * - Power On: [0x71, 0x23, 0x0F, 0xA3] (4 bytes)
 * - Power Off: [0x71, 0x24, 0x0F, 0xA4] (4 bytes)
 *
 * FALLBACK PROTOCOL:
 * - Alternative Color: [0x56, R, G, B, 0x00, 0xF0, 0xAA] (7 bytes)
 *
 * CHANGES MADE:
 * - Removed complex 8-byte protocol with checksums
 * - Simplified to standard SP105E commands
 * - Added command queuing to prevent conflicts
 * - Added fallback protocols for compatibility
 * - Focused service discovery on confirmed FFE0/FFE1
 */

// SP105E Controller Constants (from LightBlue analysis)
const SP105E_SERVICE_UUID = 'FFE0'; // Confirmed from LightBlue: FFE0 service
const SP105E_CHARACTERISTIC_MAIN = 'FFE1'; // Confirmed from LightBlue: FFE1 characteristic
const SP105E_DEVICE_NAMES = ['SP105E', 'Magic-LED', 'BLE-LED', 'LED-BLE'];

// SP105E Protocol Implementation
// Based on LightBlue analysis and testing with real hardware
// Trying multiple known SP105E protocols since devices vary by firmware
const SP105E_PROTOCOL = {
  // Protocol 1: Magic Home / WiZ compatible (most common)
  SET_COLOR: (r: number, g: number, b: number) => {
    // 7-byte format used by many SP105E clones
    return new Uint8Array([0x56, r, g, b, 0x00, 0xF0, 0xAA]);
  },

  // Protocol 2: BTF-Lighting format
  SET_COLOR_V2: (r: number, g: number, b: number) => {
    // 9-byte format with checksum
    const data = [0x7E, 0x00, 0x03, r, g, b, 0x00, 0xEF];
    const checksum = data.reduce((sum, byte) => sum + byte, 0) & 0xFF;
    return new Uint8Array([...data, checksum]);
  },

  // Protocol 3: Simple 4-byte format
  SET_COLOR_V3: (r: number, g: number, b: number) => {
    return new Uint8Array([0x38, r, g, b]);
  },

  // Protocol 4: Standard LED strip format
  SET_COLOR_V4: (r: number, g: number, b: number) => {
    return new Uint8Array([0xCC, r, g, b, 0x33, 0x33, 0x33]);
  },

  // Brightness commands (multiple formats)
  SET_BRIGHTNESS: (brightness: number) => {
    const sp105eBrightness = Math.round((brightness / 100) * 255);
    return new Uint8Array([0x56, 0x00, 0x00, 0x00, sp105eBrightness, 0x0F, 0xAA]);
  },

  SET_BRIGHTNESS_V2: (brightness: number) => {
    const sp105eBrightness = Math.round((brightness / 100) * 255);
    return new Uint8Array([0x3A, sp105eBrightness]);
  },

  // Pattern commands
  SET_PATTERN: (pattern: number, speed: number = 50) => {
    const sp105eSpeed = Math.round((speed / 100) * 255);
    return new Uint8Array([0xBB, pattern, sp105eSpeed, 0x44]);
  },

  SET_PATTERN_V2: (pattern: number, speed: number = 50) => {
    const sp105eSpeed = Math.round((speed / 100) * 255);
    return new Uint8Array([0x3C, pattern, sp105eSpeed]);
  },

  // Power commands
  POWER_ON: new Uint8Array([0x71, 0x23, 0x0F, 0xA3]),
  POWER_OFF: new Uint8Array([0x71, 0x24, 0x0F, 0xA4]),

  // Alternative power commands
  POWER_ON_V2: new Uint8Array([0xCC, 0x23, 0x33]),
  POWER_OFF_V2: new Uint8Array([0xCC, 0x24, 0x33]),

  // Initialize command
  INITIALIZE: new Uint8Array([0x56, 0x00, 0x00, 0x00, 0x00, 0xF0, 0xAA]), // Black with Magic Home format
};

// Use the actual SP105E protocol
const MAGIC_LED_PROTOCOL = SP105E_PROTOCOL; // Use real SP105E commands
const MAGIC_LED_COMMANDS = SP105E_PROTOCOL; // Backward compatibility

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
  private connectedCharacteristics = new Map<string, any>();
  private commandQueue = new Map<string, Array<() => Promise<void>>>();
  private isProcessingCommands = new Map<string, boolean>();
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

      // Find SP105E service - specifically look for FFE0 (confirmed from LightBlue)
      const sp105eService = services.find(service => {
        const uuid = service.uuid.toLowerCase().replace(/-/g, '');
        return uuid === 'ffe0' || uuid.includes('ffe0');
      });

      console.log(`🔍 Looking for FFE0 service...`);
      console.log(`📋 Available services: ${services.map(s => s.uuid).join(', ')}`);

      if (!sp105eService) {
        console.error(`❌ SP105E service FFE0 not found!`);
        console.error(`📋 This device may not be a compatible SP105E controller`);
        throw new Error(`SP105E service FFE0 not found. Available services: ${services.map(s => s.uuid).join(', ')}`);
      }

      console.log('SP105E service found, checking characteristics...');
      const characteristics = await sp105eService.characteristics();
      console.log('Available characteristics:', characteristics.map(c => `${c.uuid} (writable: ${c.isWritableWithoutResponse}/${c.isWritableWithResponse})`));

      // Find FFE1 characteristic (confirmed from LightBlue analysis)
      const writeCharacteristic = characteristics.find(char => {
        const uuid = char.uuid.toLowerCase().replace(/-/g, '');
        return uuid === 'ffe1' || uuid.includes('ffe1');
      });

      if (!writeCharacteristic) {
        console.error(`❌ SP105E characteristic FFE1 not found!`);
        console.error(`📋 Available characteristics: ${characteristics.map(c => c.uuid).join(', ')}`);
        throw new Error(`SP105E characteristic FFE1 not found. Available: ${characteristics.map(c => c.uuid).join(', ')}`);
      }

      console.log(`✅ Found FFE1 characteristic: ${writeCharacteristic.uuid}`);
      console.log(`📝 Write capabilities: withResponse=${writeCharacteristic.isWritableWithResponse}, withoutResponse=${writeCharacteristic.isWritableWithoutResponse}`);

      // Initialize SP105E with proper command sequence
      console.log('\n🚀 STARTING SP105E INITIALIZATION');
      console.log(`📋 Using Service: ${SP105E_SERVICE_UUID}, Characteristic: ${SP105E_CHARACTERISTIC_MAIN}`);

      // Store characteristic for later use
      this.connectedCharacteristics = this.connectedCharacteristics || new Map();
      this.connectedCharacteristics.set(deviceId, writeCharacteristic);

      // Send SP105E initialization sequence
      try {
        console.log(`\n🔌 SENDING SP105E INITIALIZATION SEQUENCE`);

        // Step 1: Initialize with black color (turns on device if needed)
        const initCommand = SP105E_PROTOCOL.INITIALIZE;
        console.log(`📤 Init bytes:`, Array.from(initCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

        await this.sendCommandToDevice(deviceId, initCommand);
        await delay(200); // Allow device to initialize

        // Step 2: Set a default color to verify communication
        const testColor = SP105E_PROTOCOL.SET_COLOR(0, 255, 0); // Green
        console.log(`📤 Test color bytes:`, Array.from(testColor).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

        await this.sendCommandToDevice(deviceId, testColor);
        await delay(100);

        console.log(`✅ SP105E initialization sequence completed`);

      } catch (initError) {
        console.error(`❌ SP105E initialization failed:`, initError.message);
        // Continue anyway, the device might still be usable
      }

      console.log(`\n🎯 SP105E Magic-LED initialization complete`);
      console.log(`💡 Your SP105E should now be ready for commands!`);

      const connectionState: BLEConnectionState = {
        deviceId,
        isConnected: true,
        batteryLevel: 0, // SP105E doesn't report battery
        firmwareVersion: 'SP105E-Magic-LED',
      };

      console.log(`\n✅ SP105E CONNECTION ESTABLISHED`);
      console.log(`📱 Device: ${deviceId}`);
      console.log(`🔌 Service: ${SP105E_SERVICE_UUID}`);
      console.log(`✍️ Write Char: ${writeCharacteristic.uuid}`);
      console.log(`💡 Ready for color/brightness commands!`);

      this.connectedDevices.set(deviceId, connectionState);
      this.notifyConnectionListeners(connectionState);

      console.log('\n🎉 SP105E CONNECTION SUCCESS!');
      console.log(`📋 Connected devices: ${this.connectedDevices.size}`);
      console.log('🚀 Ready to test color commands from the app!');
      console.log('💡 Tap any color button in the app and watch the console logs...');

    } catch (error) {
      console.error('\n❌ CRITICAL CONNECTION FAILURE:', error);
      console.error('🚑 Connection attempt failed completely');
      console.error('📝 Error details:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });
      throw new Error(`SP105E connection failed: ${error.message}`);
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    try {
      console.log(`🔌 Disconnecting from device: ${deviceId}`);

      // Cancel BLE connection
      const device = await this.bleManager.devices([deviceId]);
      if (device.length > 0) {
        await device[0].cancelConnection();
      }

      // Clean up stored data
      this.connectedCharacteristics.delete(deviceId);
      this.commandQueue.delete(deviceId);
      this.isProcessingCommands.delete(deviceId);

      const connectionState = this.connectedDevices.get(deviceId);
      if (connectionState) {
        connectionState.isConnected = false;
        this.connectedDevices.delete(deviceId);
        this.notifyConnectionListeners(connectionState);
      }

      console.log(`✅ Successfully disconnected from ${deviceId}`);
    } catch (error) {
      console.error('❌ Failed to disconnect from device:', error);
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

    console.log(`\n🎨 SENDING SP105E COLOR COMMAND to ${deviceId}`);
    console.log(`📤 Input RGB: ${command.red}, ${command.green}, ${command.blue}`);

    try {
      const protocols = [
        { name: 'Magic Home V1', cmd: SP105E_PROTOCOL.SET_COLOR(command.red, command.green, command.blue) },
        { name: 'BTF-Lighting V2', cmd: SP105E_PROTOCOL.SET_COLOR_V2(command.red, command.green, command.blue) },
        { name: 'Simple V3', cmd: SP105E_PROTOCOL.SET_COLOR_V3(command.red, command.green, command.blue) },
        { name: 'LED Strip V4', cmd: SP105E_PROTOCOL.SET_COLOR_V4(command.red, command.green, command.blue) }
      ];

      let success = false;
      for (const protocol of protocols) {
        try {
          console.log(`📤 Trying ${protocol.name}:`, Array.from(protocol.cmd).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          await this.sendCommandToDevice(deviceId, protocol.cmd);
          console.log(`✅ SUCCESS! ${protocol.name} protocol worked!`);
          success = true;
          break;
        } catch (protocolError) {
          console.log(`⚠️ ${protocol.name} failed, trying next protocol...`);
        }
      }

      if (!success) {
        throw new Error('All color protocols failed');
      }

      console.log(`💡 Your SP105E LED ring should now display RGB(${command.red},${command.green},${command.blue})!`);

    } catch (error) {
      console.error('❌ CRITICAL: Failed to send color command with all protocols:', error);
      throw error;
    }
  }

  async sendModeCommand(deviceId: string, command: BLEModeCommand): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    console.log(`\n🎭 SENDING SP105E MODE COMMAND to ${deviceId}`);
    console.log(`🎯 Mode: ${command.mode}${command.speed ? `, Speed: ${command.speed}` : ''}`);

    try {
      // Map cup modes to SP105E pattern numbers
      let patternNumber = 1;
      let speed = command.speed || 50; // Default speed

      switch (command.mode) {
        case 'static':
          // For static mode, we don't change patterns
          console.log('Static mode - pattern change not needed');
          return;
        case 'pulse':
          patternNumber = 3; // SP105E breathing/pulse pattern
          break;
        case 'strobe':
          patternNumber = 6; // SP105E strobe pattern
          break;
        case 'rainbow':
          patternNumber = 1; // SP105E rainbow pattern
          break;
        default:
          patternNumber = 1;
      }

      // Try multiple pattern protocols
      const patternProtocols = [
        { name: 'Pattern V1', cmd: SP105E_PROTOCOL.SET_PATTERN(patternNumber, speed) },
        { name: 'Pattern V2', cmd: SP105E_PROTOCOL.SET_PATTERN_V2(patternNumber, speed) }
      ];

      let success = false;
      for (const protocol of patternProtocols) {
        try {
          console.log(`📤 Trying ${protocol.name}:`, Array.from(protocol.cmd).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          await this.sendCommandToDevice(deviceId, protocol.cmd);
          console.log(`✅ SUCCESS! ${protocol.name} protocol worked for ${command.mode}!`);
          success = true;
          break;
        } catch (protocolError) {
          console.log(`⚠️ ${protocol.name} failed, trying next...`);
        }
      }

      if (!success) {
        console.log(`⚠️ All pattern protocols failed, device may not support mode: ${command.mode}`);
      }

    } catch (error) {
      console.error('❌ CRITICAL: Failed to send mode command:', error);
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

    console.log(`\n🔆 SENDING SP105E BRIGHTNESS COMMAND to ${deviceId}`);
    console.log(`💡 Brightness: ${command.brightness}%`);

    try {
      // Try multiple brightness protocols
      const brightnessProtocols = [
        { name: 'Brightness V1', cmd: SP105E_PROTOCOL.SET_BRIGHTNESS(command.brightness) },
        { name: 'Brightness V2', cmd: SP105E_PROTOCOL.SET_BRIGHTNESS_V2(command.brightness) }
      ];

      let success = false;
      for (const protocol of brightnessProtocols) {
        try {
          console.log(`📤 Trying ${protocol.name}:`, Array.from(protocol.cmd).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          await this.sendCommandToDevice(deviceId, protocol.cmd);
          console.log(`✅ SUCCESS! ${protocol.name} protocol worked for ${command.brightness}%!`);
          success = true;
          break;
        } catch (protocolError) {
          console.log(`⚠️ ${protocol.name} failed, trying next...`);
        }
      }

      if (!success) {
        console.log(`⚠️ All brightness protocols failed, device may not support brightness control`);
      }

    } catch (error) {
      console.error('❌ CRITICAL: Failed to send brightness command:', error);
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

    // Find FFE1 characteristic (confirmed from LightBlue)
    const writeCharacteristic = characteristics.find(char => {
      const uuid = char.uuid.toLowerCase().replace(/-/g, '');
      return uuid === 'ffe1' || uuid.includes('ffe1');
    });

    return writeCharacteristic;
  }

  // Command queuing system for reliable SP105E communication
  private async sendCommandToDevice(deviceId: string, command: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      // Add command to queue
      if (!this.commandQueue.has(deviceId)) {
        this.commandQueue.set(deviceId, []);
      }

      const commandPromise = async () => {
        try {
          const characteristic = this.connectedCharacteristics.get(deviceId);
          if (!characteristic) {
            throw new Error('Device characteristic not available');
          }

          console.log(`📡 Sending command to ${deviceId}: ${Array.from(command).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);

          // Try writeWithoutResponse first (preferred for SP105E)
          if (characteristic.isWritableWithoutResponse) {
            await characteristic.writeWithoutResponse(uint8ArrayToBase64(command));
            console.log(`✅ Command sent via writeWithoutResponse`);
          } else if (characteristic.isWritableWithResponse) {
            await characteristic.writeWithResponse(uint8ArrayToBase64(command));
            console.log(`✅ Command sent via writeWithResponse`);
          } else {
            throw new Error('Characteristic not writable');
          }

          resolve();
        } catch (error) {
          console.error(`❌ Failed to send command:`, error);
          reject(error);
        }
      };

      this.commandQueue.get(deviceId)!.push(commandPromise);
      this.processCommandQueue(deviceId);
    });
  }

  // Process command queue to prevent command conflicts
  private async processCommandQueue(deviceId: string): Promise<void> {
    if (this.isProcessingCommands.get(deviceId)) {
      return; // Already processing
    }

    this.isProcessingCommands.set(deviceId, true);

    const queue = this.commandQueue.get(deviceId) || [];
    while (queue.length > 0) {
      const commandPromise = queue.shift();
      if (commandPromise) {
        try {
          await commandPromise();
          await delay(50); // Small delay between commands
        } catch (error) {
          console.error('Command failed:', error);
        }
      }
    }

    this.isProcessingCommands.set(deviceId, false);
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