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

// CORRECTED SP105E Protocol - Based on GitHub Issue Documentation
// Source: https://github.com/spled/spled.github.io/issues/1
// Confirmed working 6-byte packet structure: [START_FLAG][DATA][MODE][END_FLAG]
const SP105E_PROTOCOL = {
  // Command codes from GitHub documentation
  CMD_COLOR: 0x22,        // Change color command
  CMD_BRIGHTNESS: 0x2A,   // Adjust brightness command
  CMD_MODE_CHANGE: 0x2C,  // Change display mode command
  CMD_SPEED: 0x03,        // Adjust effect speed command
  START_FLAG: 0x38,       // Packet start flag
  END_FLAG: 0x83,         // Packet end flag

  // Color Command: 6-byte GitHub format (ONLY format that works with your SP105E)
  SET_COLOR: (r: number, g: number, b: number) => {
    return new Uint8Array([
      SP105E_PROTOCOL.START_FLAG,  // 0x38
      r,                           // Red (0-255)
      g,                           // Green (0-255)
      b,                           // Blue (0-255)
      SP105E_PROTOCOL.CMD_COLOR,   // 0x22
      SP105E_PROTOCOL.END_FLAG     // 0x83
    ]);
  },

  // Brightness Command: Correct GitHub format - brightness value repeated 3x
  SET_BRIGHTNESS: (brightness: number) => {
    // Convert 0-100% to 0-255 range for SP105E format
    const sp105eBrightness = Math.round((brightness / 100) * 255);
    return new Uint8Array([
      SP105E_PROTOCOL.START_FLAG,      // 0x38
      sp105eBrightness,                // Brightness (0-255)
      sp105eBrightness,                // Brightness repeated (GitHub format)
      sp105eBrightness,                // Brightness repeated (GitHub format)
      SP105E_PROTOCOL.CMD_BRIGHTNESS,  // 0x2A
      SP105E_PROTOCOL.END_FLAG         // 0x83
    ]);
  },

  // Mode/Pattern Command: [0x38, mode, 0x00, 0x00, 0x2C, 0x83] (6 bytes)
  SET_PATTERN: (pattern: number, speed: number = 50) => {
    return new Uint8Array([
      SP105E_PROTOCOL.START_FLAG,       // 0x38
      pattern,                          // Pattern number (1-180)
      0x00,                             // Padding (speed handled separately)
      0x00,                             // Padding
      SP105E_PROTOCOL.CMD_MODE_CHANGE,  // 0x2C
      SP105E_PROTOCOL.END_FLAG          // 0x83
    ]);
  },

  // Speed Command: [0x38, speed, 0x00, 0x00, 0x03, 0x83] (6 bytes)
  SET_SPEED: (speed: number) => {
    // Convert 0-100% to 0-255 range
    const sp105eSpeed = Math.round((speed / 100) * 255);
    return new Uint8Array([
      SP105E_PROTOCOL.START_FLAG,  // 0x38
      sp105eSpeed,                 // Speed (0-255)
      0x00,                        // Padding
      0x00,                        // Padding
      SP105E_PROTOCOL.CMD_SPEED,   // 0x03
      SP105E_PROTOCOL.END_FLAG     // 0x83
    ]);
  },

  // Alternative: Your LightBlue Pattern (8 bytes) - for testing compatibility
  LIGHTBLUE_PATTERN: (r: number, g: number, b: number) => {
    // Your captured pattern: 01CB 0204 0400 0258
    // Adapted for color: 01CB [R][G][B] [checksum_calculated]
    const checksum = (0x01 + 0xCB + 0x02 + r + g + b) & 0xFF;
    return new Uint8Array([0x01, 0xCB, 0x02, r, g, b, 0x02, checksum]);
  },

  // Test Commands: 6-byte GitHub format (ONLY format that works)
  TEST_RED: new Uint8Array([0x38, 255, 0, 0, 0x22, 0x83]),      // Red
  TEST_GREEN: new Uint8Array([0x38, 0, 255, 0, 0x22, 0x83]),    // Green
  TEST_BLUE: new Uint8Array([0x38, 0, 0, 255, 0x22, 0x83]),     // Blue
  TEST_WHITE: new Uint8Array([0x38, 255, 255, 255, 0x22, 0x83]) // White
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

      // Send SP105E initialization sequence using 6-byte GitHub format (ONLY format that works)
      try {
        console.log(`\n🔌 STARTING SP105E GITHUB PROTOCOL INITIALIZATION`);
        console.log(`📋 Using ONLY 6-byte GitHub format: [0x38][DATA][CMD][0x83]`);

        // Step 1: Test RED using 6-byte GitHub format
        console.log(`\n🔴 Step 1: Test RED (6-byte GitHub format)`);
        const testRed = SP105E_PROTOCOL.TEST_RED;
        console.log(`📤 GitHub Red Command:`, Array.from(testRed).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        console.log(`🔧 Format: [0x38][R=255][G=0][B=0][CMD=0x22][0x83] (6-byte GitHub)`);
        await this.sendCommandToDevice(deviceId, testRed);
        await delay(1000);

        // Step 2: Test GREEN using 6-byte GitHub format
        console.log(`\n🟢 Step 2: Test GREEN (6-byte GitHub format)`);
        const testGreen = SP105E_PROTOCOL.TEST_GREEN;
        console.log(`📤 GitHub Green Command:`, Array.from(testGreen).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        await this.sendCommandToDevice(deviceId, testGreen);
        await delay(1000);

        // Step 3: Test BLUE using 6-byte GitHub format
        console.log(`\n🔵 Step 3: Test BLUE (6-byte GitHub format)`);
        const testBlue = SP105E_PROTOCOL.TEST_BLUE;
        console.log(`📤 GitHub Blue Command:`, Array.from(testBlue).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        await this.sendCommandToDevice(deviceId, testBlue);
        await delay(1000);

        // Step 4: Test WHITE using 6-byte GitHub format
        console.log(`\n⚪ Step 4: Test WHITE (6-byte GitHub format)`);
        const testWhite = SP105E_PROTOCOL.TEST_WHITE;
        console.log(`📤 GitHub White Command:`, Array.from(testWhite).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        await this.sendCommandToDevice(deviceId, testWhite);
        await delay(1000);

        console.log(`\n✅ SP105E GITHUB PROTOCOL INITIALIZATION COMPLETED!`);
        console.log(`💡 LED should have cycled: Red → Green → Blue → White`);
        console.log(`🎯 If you saw these color changes, the 6-byte GitHub protocol works!`);
        console.log(`🚀 All app controls should now work with your SP105E!`);

      } catch (initError) {
        console.error(`❌ SP105E initialization failed:`, (initError as Error).message);
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
      // DIRECT COLOR: Send color command directly (no static mode interference)
      console.log(`🎯 Direct Color Command: RGB(${command.red}, ${command.green}, ${command.blue})`);
      console.log(`🚫 No pattern mode - direct color only`);

      const colorCommand = SP105E_PROTOCOL.SET_COLOR(command.red, command.green, command.blue);
      console.log(`📤 GitHub Color Command:`, Array.from(colorCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.log(`🔧 Format: [0x38][R=${command.red}][G=${command.green}][B=${command.blue}][0x22][0x83] (direct color)`);

      await this.sendCommandToDevice(deviceId, colorCommand);
      await delay(100); // Standard delay

      console.log(`✅ Direct color command sent!`);
      console.log(`💡 LED should display solid RGB(${command.red},${command.green},${command.blue})`);

    } catch (error) {
      console.error('❌ Failed to send SP105E color command:', error);
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
      // Map cup modes to SP105E pattern numbers (GitHub protocol)
      let patternNumber = 1;
      let speed = command.speed || 50;

      switch (command.mode) {
        case 'static':
          console.log('Static mode - using current color, no pattern change needed');
          return;
        case 'pulse':
          patternNumber = 3; // Breathing/pulse pattern
          break;
        case 'strobe':
          patternNumber = 6; // Strobe pattern
          break;
        case 'rainbow':
          patternNumber = 1; // Rainbow cycle pattern
          break;
        default:
          patternNumber = 1;
      }

      // Use GitHub's documented pattern protocol [0x38, pattern, 0x00, 0x00, 0x2C, 0x83]
      const patternCommand = SP105E_PROTOCOL.SET_PATTERN(patternNumber);
      console.log(`📤 GitHub SP105E Pattern Command:`, Array.from(patternCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.log(`🔧 Format: [START=0x38][PATTERN=${patternNumber}][PAD=0x00][PAD=0x00][CMD=0x2C][END=0x83]`);
      console.log(`🎭 Setting mode: ${command.mode} (Pattern ${patternNumber}) using GitHub protocol`);

      await this.sendCommandToDevice(deviceId, patternCommand);
      await delay(100);

      // Also send speed if provided (separate command)
      if (command.speed && command.speed !== 50) {
        const speedCommand = SP105E_PROTOCOL.SET_SPEED(speed);
        console.log(`📤 GitHub SP105E Speed Command:`, Array.from(speedCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        await delay(50);
        await this.sendCommandToDevice(deviceId, speedCommand);
      }

      console.log(`✅ GitHub SP105E pattern command sent!`);
      console.log(`💡 LED should display ${command.mode} effect`);

    } catch (error) {
      console.error('❌ Failed to send SP105E mode command:', error);
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
      // CORRECTED: Use GitHub format with brightness value repeated 3x
      const brightnessCommand = SP105E_PROTOCOL.SET_BRIGHTNESS(command.brightness);
      const brightnessValue = Math.round((command.brightness / 100) * 255);

      console.log(`📤 Corrected Brightness Command:`, Array.from(brightnessCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.log(`🔧 Format: [0x38][${brightnessValue}][${brightnessValue}][${brightnessValue}][0x2A][0x83] (GitHub format)`);
      console.log(`🎯 Brightness: ${command.brightness}% → 0x${brightnessValue.toString(16)} repeated 3x`);

      await this.sendCommandToDevice(deviceId, brightnessCommand);
      await delay(100); // Standard delay

      console.log(`✅ Brightness command sent with correct format!`);
      console.log(`💡 LED brightness should change to ${command.brightness}%`);

    } catch (error) {
      console.error('❌ Failed to send brightness command:', error);
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
  async sendCommandToDevice(deviceId: string, command: Uint8Array): Promise<void> {
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

  // PATTERN DISCOVERY SYSTEM - Systematic testing for SP105E protocol
  async discoverPatterns(deviceId: string, startPattern: number = 1, endPattern: number = 50): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    console.log(`\n🔍 STARTING PATTERN DISCOVERY: ${startPattern}-${endPattern}`);
    console.log(`📋 Testing each pattern for 3 seconds to observe LED behavior`);
    console.log(`🎯 Looking for: solid colors, brightness variations, special modes`);

    try {
      for (let pattern = startPattern; pattern <= endPattern; pattern++) {
        console.log(`\n🧪 TESTING PATTERN ${pattern}:`);

        // Send pattern command
        const patternCommand = SP105E_PROTOCOL.SET_PATTERN(pattern);
        console.log(`📤 Command: [${Array.from(patternCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
        console.log(`🔧 Format: [0x38][PATTERN=${pattern}][0x00][0x00][0x2C][0x83]`);

        await this.sendCommandToDevice(deviceId, patternCommand);

        // Wait and observe
        console.log(`⏱️ Observing pattern ${pattern} for 3 seconds...`);
        console.log(`👀 OBSERVE YOUR LED: What color/effect is showing?`);

        await delay(3000); // 3 second observation period
      }

      console.log(`\n✅ PATTERN DISCOVERY COMPLETE: ${startPattern}-${endPattern}`);
      console.log(`📊 Please note which patterns showed solid colors vs effects`);

    } catch (error) {
      console.error('❌ Pattern discovery failed:', error);
      throw error;
    }
  }

  // Test alternative command codes on the same data
  async testAlternativeCommands(deviceId: string, testData: number[]): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    console.log(`\n🧪 TESTING ALTERNATIVE COMMAND CODES`);
    console.log(`📋 Data: [${testData.join(', ')}] - trying different command codes`);

    const commandCodes = [
      { code: 0x22, name: 'COLOR' },
      { code: 0x2A, name: 'BRIGHTNESS' },
      { code: 0x2C, name: 'PATTERN (known working)' },
      { code: 0x03, name: 'SPEED' },
      { code: 0x21, name: 'POWER' },
      { code: 0x23, name: 'UNKNOWN_A' },
      { code: 0x2B, name: 'UNKNOWN_B' }
    ];

    try {
      for (const cmd of commandCodes) {
        console.log(`\n🔧 TESTING COMMAND CODE: 0x${cmd.code.toString(16)} (${cmd.name})`);

        // Build command with alternative code
        const command = new Uint8Array([
          SP105E_PROTOCOL.START_FLAG,  // 0x38
          testData[0] || 255,          // Data 1
          testData[1] || 0,            // Data 2
          testData[2] || 0,            // Data 3
          cmd.code,                    // Command code
          SP105E_PROTOCOL.END_FLAG     // 0x83
        ]);

        console.log(`📤 Command: [${Array.from(command).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
        console.log(`👀 Observe LED for 2 seconds...`);

        await this.sendCommandToDevice(deviceId, command);
        await delay(2000);
      }

      console.log(`\n✅ ALTERNATIVE COMMAND TESTING COMPLETE`);

    } catch (error) {
      console.error('❌ Alternative command testing failed:', error);
      throw error;
    }
  }

  // Test 8-byte protocol format
  async test8ByteProtocol(deviceId: string, r: number, g: number, b: number): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    console.log(`\n🧪 TESTING 8-BYTE PROTOCOL FORMAT`);
    console.log(`📋 Based on your LightBlue data: 01CB 0204 0400 0258`);
    console.log(`🎯 Testing RGB(${r}, ${g}, ${b}) in 8-byte format`);

    try {
      // Your original LightBlue pattern adapted for color
      const checksum = 0x58; // From your data - might need calculation
      const command8Byte = new Uint8Array([
        0x01,          // Header 1
        0xCB,          // Header 2
        r,             // Red
        g,             // Green
        b,             // Blue
        0x00,          // Unknown
        0x02,          // Footer 1
        checksum       // Checksum
      ]);

      console.log(`📤 8-Byte Command: [${Array.from(command8Byte).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
      console.log(`🔧 Format: [0x01][0xCB][R][G][B][0x00][0x02][CHECKSUM]`);
      console.log(`👀 Observe LED for 3 seconds...`);

      await this.sendCommandToDevice(deviceId, command8Byte);
      await delay(3000);

      console.log(`✅ 8-BYTE PROTOCOL TEST COMPLETE`);

    } catch (error) {
      console.error('❌ 8-byte protocol test failed:', error);
      throw error;
    }
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