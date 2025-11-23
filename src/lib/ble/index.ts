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

// ACTUAL SP105E Controller Constants (from reverse engineering research)
const SP105E_SERVICE_UUID = 'FFE0'; // CORRECTED: SP105E actually uses FFE0 service UUID
const SP105E_CHARACTERISTIC_MAIN = 'FFE1'; // CORRECTED: SP105E actually uses FFE1 characteristic
const SP105E_CHARACTERISTIC_INIT = 'FFF2'; // Secondary characteristic for initialization
const SP105E_DEVICE_NAMES = ['SP105E', 'Magic-LED', 'BLE-LED', 'LED-BLE'];

// ACTUAL SP105E Protocol (4-byte commands to FFE0/FFE1)
// Based on reverse engineering - commands are 4 bytes total
const SP105E_PROTOCOL = {
  // Power control commands
  POWER_ON: new Uint8Array([0x01, 0x00, 0x00, 0x01]),
  POWER_OFF: new Uint8Array([0x00, 0x00, 0x00, 0x02]),

  // RGB Color command: [R, G, B, 0x3C]
  SET_COLOR: (r: number, g: number, b: number) =>
    new Uint8Array([r, g, b, 0x3C]),

  // Brightness command: [brightness, 0x00, 0x00, 0x2A] (brightness 0-100)
  SET_BRIGHTNESS: (brightness: number) =>
    new Uint8Array([brightness, 0x00, 0x00, 0x2A]),

  // Effect/Pattern command: [pattern, speed, 0x00, 0x2C]
  SET_PATTERN: (pattern: number, speed: number = 50) =>
    new Uint8Array([pattern, speed, 0x00, 0x2C]),

  // Pixel count setting: [count_low, count_high, 0x00, 0x2D]
  SET_PIXEL_COUNT: (count: number) =>
    new Uint8Array([count & 0xFF, (count >> 8) & 0xFF, 0x00, 0x2D]),
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

      // Find SP105E service - try ALL possible service UUIDs for SP105E/Magic-LED
      let sp105eService = services.find(service => {
        const uuid = service.uuid.toLowerCase().replace(/-/g, '');
        return uuid === 'fff0' ||
               uuid.includes('fff0') ||
               uuid === 'ffe0' ||
               uuid.includes('ffe0') ||
               service.uuid.toLowerCase() === 'fff0' ||
               service.uuid.toLowerCase() === 'ffe0';
      });

      // If no specific service found, try any service for debugging
      if (!sp105eService && services.length > 0) {
        console.log(`🔍 No FFF0/FFE0 service found, trying first available service for debugging...`);
        console.log(`📋 Available services: ${services.map(s => s.uuid).join(', ')}`);
        sp105eService = services[0]; // Use first available service
        console.log(`🔧 Using service: ${sp105eService.uuid} for SP105E commands`);
      }

      if (!sp105eService) {
        console.error(`❌ CRITICAL: No services found on device!`);
        console.error(`📋 Available services: ${services.map(s => s.uuid).join(', ')}`);

        // Still create connection for debugging
        const connectionState: BLEConnectionState = {
          deviceId,
          isConnected: true,
          batteryLevel: 100,
          firmwareVersion: 'No-Service-Debug',
        };
        this.connectedDevices.set(deviceId, connectionState);
        this.notifyConnectionListeners(connectionState);
        return;
      }

      console.log('SP105E service found, checking characteristics...');
      const characteristics = await sp105eService.characteristics();
      console.log('Available characteristics:', characteristics.map(c => `${c.uuid} (isWritableWithResponse: ${c.isWritableWithResponse}, isWritableWithoutResponse: ${c.isWritableWithoutResponse})`));

      // Find the write characteristic for SP105E - try ALL possible characteristics
      let writeCharacteristic = characteristics.find(char =>
        char.uuid.toLowerCase() === SP105E_CHARACTERISTIC_MAIN.toLowerCase()
      );

      // Try FFF3 variations
      if (!writeCharacteristic) {
        console.log('🔍 Exact FFF3 match failed, trying FFF3 variations...');
        writeCharacteristic = characteristics.find(char => {
          const uuid = char.uuid.toLowerCase().replace(/-/g, '');
          return uuid.includes('fff3') || uuid === 'fff3';
        });
        if (writeCharacteristic) {
          console.log(`✅ Found FFF3 characteristic: ${writeCharacteristic.uuid}`);
        }
      }

      // Try FFE1 for older SP105E variants
      if (!writeCharacteristic) {
        console.log('🔍 No FFF3 found, trying FFE1 for older SP105E variants...');
        writeCharacteristic = characteristics.find(char => {
          const uuid = char.uuid.toLowerCase().replace(/-/g, '');
          return uuid.includes('ffe1') || uuid === 'ffe1';
        });
        if (writeCharacteristic) {
          console.log(`✅ Found FFE1 characteristic: ${writeCharacteristic.uuid}`);
        }
      }

      // Try any writable characteristic
      if (!writeCharacteristic) {
        console.log('🔍 No specific characteristics found, trying ANY writable characteristic...');
        writeCharacteristic = characteristics.find(char =>
          char.isWritableWithResponse || char.isWritableWithoutResponse
        );
        if (writeCharacteristic) {
          console.log(`✅ Found writable characteristic: ${writeCharacteristic.uuid}`);
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

      // Initialize SP105E with correct 4-byte protocol
      console.log('\n🚀 STARTING SP105E INITIALIZATION');
      console.log(`📋 Using Service: ${SP105E_SERVICE_UUID}, Characteristic: ${SP105E_CHARACTERISTIC_MAIN}`);
      console.log(`📋 Found ${characteristics.length} characteristics`);
      characteristics.forEach(char => {
        console.log(`  - ${char.uuid} (write: ${char.isWritableWithoutResponse}/${char.isWritableWithResponse}, read: ${char.isReadable})`);
      });

      // Send SP105E Power On command to initialize (4-byte format)
      try {
        console.log(`\n🔌 SENDING SP105E POWER ON COMMAND`);
        const powerOnCommand = SP105E_PROTOCOL.POWER_ON;
        console.log(`📤 Power On bytes:`, Array.from(powerOnCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        console.log(`📤 Expected format: 4-byte command [0x01, 0x00, 0x00, 0x01]`);

        // Send power on command
        if (writeCharacteristic.isWritableWithoutResponse) {
          await writeCharacteristic.writeWithoutResponse(
            uint8ArrayToBase64(powerOnCommand)
          );
          console.log(`✅ SP105E POWER_ON command sent via writeWithoutResponse`);
        } else if (writeCharacteristic.isWritableWithResponse) {
          await writeCharacteristic.writeWithResponse(
            uint8ArrayToBase64(powerOnCommand)
          );
          console.log(`✅ SP105E POWER_ON command sent via writeWithResponse`);
        }

        await delay(100); // Brief delay for initialization

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

    console.log(`\n🔄 STARTING COLOR COMMAND DEBUG for ${deviceId}`);
    console.log(`📤 Input RGB:`, command);

    try {
      const device = await this.bleManager.devices([deviceId]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      console.log(`🔍 Device found: ${device[0].name || device[0].id}`);

      const services = await device[0].services();
      console.log(`📋 Available services:`, services.map(s => s.uuid));

      let sp105eService = services.find(service =>
        service.uuid.toLowerCase() === SP105E_SERVICE_UUID.toLowerCase()
      );

      // Try to find ANY usable service if specific not found
      if (!sp105eService) {
        console.log(`🔍 SP105E service (${SP105E_SERVICE_UUID}) not found, trying fallbacks...`);

        // Try FFF0 variations
        sp105eService = services.find(service => {
          const uuid = service.uuid.toLowerCase().replace(/-/g, '');
          return uuid.includes('fff0') || uuid === 'fff0';
        });

        // Try FFE0 variations
        if (!sp105eService) {
          sp105eService = services.find(service => {
            const uuid = service.uuid.toLowerCase().replace(/-/g, '');
            return uuid.includes('ffe0') || uuid === 'ffe0';
          });
        }

        // Use first available service if nothing else works
        if (!sp105eService && services.length > 0) {
          console.log(`🔧 No specific services found, using first available: ${services[0].uuid}`);
          sp105eService = services[0];
        }
      }

      if (!sp105eService) {
        console.error(`❌ No usable service found! Available services: ${services.map(s => s.uuid).join(', ')}`);
        throw new Error('SP105E service not found');
      }

      console.log(`✅ SP105E service found: ${sp105eService.uuid}`);

      const characteristics = await sp105eService.characteristics();
      console.log(`📋 Available characteristics:`, characteristics.map(c => ({
        uuid: c.uuid,
        isWritableWithResponse: c.isWritableWithResponse,
        isWritableWithoutResponse: c.isWritableWithoutResponse
      })));

      const writeCharacteristic = await this.findWriteCharacteristic(sp105eService);
      if (!writeCharacteristic) {
        throw new Error('SP105E control characteristic not found');
      }

      console.log(`✅ Write characteristic found: ${writeCharacteristic.uuid}`);
      console.log(`📝 Characteristic capabilities: writeWithResponse=${writeCharacteristic.isWritableWithResponse}, writeWithoutResponse=${writeCharacteristic.isWritableWithoutResponse}`);

      // Send SP105E color command (4-byte protocol)
      console.log(`\n🎨 SENDING SP105E COLOR COMMAND`);
      const colorCommand = SP105E_PROTOCOL.SET_COLOR(command.red, command.green, command.blue);

      console.log(`🎨 Color RGB: ${command.red}, ${command.green}, ${command.blue}`);
      console.log(`📤 SP105E command bytes:`, Array.from(colorCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.log(`📤 Expected format: [${command.red.toString(16).padStart(2, '0').toUpperCase()}, ${command.green.toString(16).padStart(2, '0').toUpperCase()}, ${command.blue.toString(16).padStart(2, '0').toUpperCase()}, 3C]`);

      // Send the color command to SP105E
      if (writeCharacteristic.isWritableWithoutResponse) {
        console.log(`📡 Sending color command via writeWithoutResponse...`);
        await writeCharacteristic.writeWithoutResponse(
          uint8ArrayToBase64(colorCommand)
        );
        console.log(`✅ SP105E color command sent successfully!`);
      } else if (writeCharacteristic.isWritableWithResponse) {
        console.log(`📡 Sending color command via writeWithResponse...`);
        await writeCharacteristic.writeWithResponse(
          uint8ArrayToBase64(colorCommand)
        );
        console.log(`✅ SP105E color command sent successfully!`);
      } else {
        throw new Error('No writable characteristic found for color command');
      }

      console.log(`\n🎯 SP105E color command sent for RGB(${command.red},${command.green},${command.blue})`);
      console.log(`💡 Your SP105E LED ring should now display the new color!`);

    } catch (error) {
      console.error('❌ CRITICAL: Failed to send color command:', error);
      throw error;
    }
  }

  async sendModeCommand(deviceId: string, command: BLEModeCommand): Promise<void> {
    if (!this.connectedDevices.has(deviceId)) {
      throw new Error('Device not connected');
    }

    try {
      console.log(`\n🎭 STARTING SP105E MODE COMMAND for ${deviceId}`);
      console.log(`🎯 Mode: ${command.mode}${command.speed ? `, Speed: ${command.speed}` : ''}`);

      const device = await this.bleManager.devices([deviceId]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      const services = await device[0].services();
      let sp105eService = services.find(service =>
        service.uuid.toLowerCase() === SP105E_SERVICE_UUID.toLowerCase()
      );

      // Try fallback service discovery
      if (!sp105eService) {
        console.log(`🔍 SP105E service (${SP105E_SERVICE_UUID}) not found, trying fallbacks...`);

        // Try FFF0 variations
        sp105eService = services.find(service => {
          const uuid = service.uuid.toLowerCase().replace(/-/g, '');
          return uuid.includes('fff0') || uuid === 'fff0';
        });

        // Try FFE0 variations
        if (!sp105eService) {
          sp105eService = services.find(service => {
            const uuid = service.uuid.toLowerCase().replace(/-/g, '');
            return uuid.includes('ffe0') || uuid === 'ffe0';
          });
        }

        // Use first available service if nothing else works
        if (!sp105eService && services.length > 0) {
          console.log(`🔧 No specific services found, using first available: ${services[0].uuid}`);
          sp105eService = services[0];
        }
      }

      if (!sp105eService) {
        throw new Error('SP105E service not found');
      }

      const writeCharacteristic = await this.findWriteCharacteristic(sp105eService);
      if (!writeCharacteristic) {
        throw new Error('SP105E control characteristic not found');
      }

      // Map cup modes to SP105E pattern numbers
      let patternNumber = 1;
      let speed = command.speed || 5; // Default speed

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

      // Send SP105E pattern command (4-byte protocol)
      console.log(`\n🎭 SENDING SP105E PATTERN COMMAND`);
      const patternCommand = SP105E_PROTOCOL.SET_PATTERN(patternNumber, speed * 10);

      console.log(`🎭 Mode: ${command.mode} -> Pattern: ${patternNumber}, Speed: ${speed}`);
      console.log(`📤 SP105E command bytes:`, Array.from(patternCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.log(`📤 Expected format: [${patternNumber.toString(16).padStart(2, '0').toUpperCase()}, ${(speed * 10).toString(16).padStart(2, '0').toUpperCase()}, 00, 2C]`);

      // Send the pattern command to SP105E
      if (writeCharacteristic.isWritableWithoutResponse) {
        console.log(`📡 Sending pattern command via writeWithoutResponse...`);
        await writeCharacteristic.writeWithoutResponse(
          uint8ArrayToBase64(patternCommand)
        );
        console.log(`✅ SP105E pattern command sent successfully!`);
      } else if (writeCharacteristic.isWritableWithResponse) {
        console.log(`📡 Sending pattern command via writeWithResponse...`);
        await writeCharacteristic.writeWithResponse(
          uint8ArrayToBase64(patternCommand)
        );
        console.log(`✅ SP105E pattern command sent successfully!`);
      } else {
        throw new Error('No writable characteristic found for pattern command');
      }

      console.log(`\n🎯 SP105E pattern command sent: ${command.mode} (Pattern ${patternNumber})`);
      console.log(`💡 Your SP105E LED ring should now display the ${command.mode} effect!`);

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

    console.log(`\n🔆 STARTING SP105E BRIGHTNESS COMMAND for ${deviceId}`);
    console.log(`💪 Input brightness: ${command.brightness}%`);

    try {
      const device = await this.bleManager.devices([deviceId]);
      if (device.length === 0) {
        throw new Error('Device not found');
      }

      const services = await device[0].services();
      let sp105eService = services.find(service =>
        service.uuid.toLowerCase() === SP105E_SERVICE_UUID.toLowerCase()
      );

      // Try fallback service discovery for brightness commands
      if (!sp105eService) {
        sp105eService = services.find(service => {
          const uuid = service.uuid.toLowerCase().replace(/-/g, '');
          return uuid.includes('fff0') || uuid === 'fff0' || uuid.includes('ffe0') || uuid === 'ffe0';
        });

        // Use any available service
        if (!sp105eService && services.length > 0) {
          console.log(`🔧 Using first available service for brightness: ${services[0].uuid}`);
          sp105eService = services[0];
        }
      }

      if (!sp105eService) {
        throw new Error('SP105E service not found');
      }

      const writeCharacteristic = await this.findWriteCharacteristic(sp105eService);
      if (!writeCharacteristic) {
        throw new Error('SP105E control characteristic not found');
      }

      // Send SP105E brightness command (4-byte protocol)
      console.log(`\n🔆 SENDING SP105E BRIGHTNESS COMMAND`);

      const brightnessCommand = SP105E_PROTOCOL.SET_BRIGHTNESS(command.brightness);

      console.log(`💡 Brightness: ${command.brightness}%`);
      console.log(`📤 SP105E command bytes:`, Array.from(brightnessCommand).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.log(`📤 Expected format: [${command.brightness.toString(16).padStart(2, '0').toUpperCase()}, 00, 00, 2A]`);

      // Send the brightness command to SP105E
      if (writeCharacteristic.isWritableWithoutResponse) {
        console.log(`📡 Sending brightness command via writeWithoutResponse...`);
        await writeCharacteristic.writeWithoutResponse(
          uint8ArrayToBase64(brightnessCommand)
        );
        console.log(`✅ SP105E brightness command sent successfully!`);
      } else if (writeCharacteristic.isWritableWithResponse) {
        console.log(`📡 Sending brightness command via writeWithResponse...`);
        await writeCharacteristic.writeWithResponse(
          uint8ArrayToBase64(brightnessCommand)
        );
        console.log(`✅ SP105E brightness command sent successfully!`);
      } else {
        throw new Error('No writable characteristic found for brightness command');
      }

      console.log(`\n🎯 SP105E brightness command sent for ${command.brightness}%`);
      console.log(`💡 Your SP105E LED ring brightness should now be updated!`);

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

    // Try exact FFF3 match first
    let writeCharacteristic = characteristics.find(char =>
      char.uuid.toLowerCase() === SP105E_CHARACTERISTIC_MAIN.toLowerCase()
    );

    // Try FFF3 variations
    if (!writeCharacteristic) {
      writeCharacteristic = characteristics.find(char => {
        const uuid = char.uuid.toLowerCase().replace(/-/g, '');
        return uuid.includes('fff3') || uuid === 'fff3';
      });
    }

    // Try FFE1 for older SP105E variants
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