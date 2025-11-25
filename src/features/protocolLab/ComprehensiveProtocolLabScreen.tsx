import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
  Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { bleService, hexToRgb } from '../../lib/ble';
import { useNiteControlStore } from '../../store/niteControlStore';
import { BleScanModal } from '../niteControl/BleScanModal';
import { ProtocolLabScreenProps } from '../../types/navigation';

const { width: screenWidth } = Dimensions.get('window');

interface LogEntry {
  id: string;
  timestamp: string;
  command: string;
  status: 'success' | 'error' | 'info';
  result?: string;
  marked?: boolean;
}

interface TestResult {
  command: string;
  success: boolean;
  timestamp: string;
  description: string;
}

export const ComprehensiveProtocolLabScreen: React.FC<ProtocolLabScreenProps> = ({ navigation }) => {
  // Store integration
  const { cups, connectToCup, selectedCups, selectAllCups } = useNiteControlStore();
  const connectedCups = cups.filter(cup => cup.isConnected);
  const selectedConnectedCups = selectedCups.filter(id =>
    cups.find(cup => cup.id === id)?.isConnected
  );

  // States
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hexCommand, setHexCommand] = useState('');
  const [protocolFormat, setProtocolFormat] = useState<'4byte' | '6byte' | '8byte'>('6byte');
  const [redValue, setRedValue] = useState(255);
  const [greenValue, setGreenValue] = useState(0);
  const [blueValue, setBlueValue] = useState(0);
  const [brightnessValue, setBrightnessValue] = useState(255);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState('');
  const [connectedDeviceId, setConnectedDeviceId] = useState<string>('');
  const [autoTest, setAutoTest] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<Set<number>>(new Set());
  const [bulkTestRunning, setBulkTestRunning] = useState(false);
  const [showBleModal, setShowBleModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  // bleService is already imported as the singleton instance

  // Auto scroll logs
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Add log entry
  const addLog = useCallback((message: string, status: 'success' | 'error' | 'info' = 'info', command?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      command: command || '',
      status,
      result: message,
    };

    setLogs(prev => [...prev, newLog]);
    scrollToBottom();
  }, [scrollToBottom]);

  // Initialize connection status using store data
  useEffect(() => {
    if (connectedCups.length > 0) {
      const firstConnectedCup = connectedCups[0];
      setIsConnected(true);
      setConnectedDeviceId(firstConnectedCup.id);
      setDeviceInfo(`${firstConnectedCup.name} (${firstConnectedCup.id})`);
      addLog(`🟢 ${firstConnectedCup.name} connected and ready for testing`, 'success');
    } else {
      setIsConnected(false);
      setConnectedDeviceId('');
      setDeviceInfo('');
      addLog('🔴 No devices connected - use Connect button below', 'error');
    }
  }, [connectedCups, addLog]);

  // Hex validation
  const isValidHex = (hex: string): boolean => {
    const cleaned = hex.replace(/[\s,]/g, '');
    return /^[0-9a-fA-F]+$/.test(cleaned) && cleaned.length % 2 === 0;
  };

  // Parse hex string to Uint8Array
  const parseHexString = (hex: string): Uint8Array => {
    const cleaned = hex.replace(/[\s,]/g, '');
    const bytes = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
  };

  // Send command safely with error handling using proper BLE methods
  const sendCommandSafely = async (command: Uint8Array, description: string): Promise<boolean> => {
    try {
      // Auto-select connected cups if none selected
      if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
        addLog('📋 Auto-selecting all connected devices for testing', 'info');
        selectAllCups();
      }

      if (!isConnected || selectedConnectedCups.length === 0) {
        addLog('❌ No connected devices selected', 'error');
        return false;
      }

      const hexStr = Array.from(command).map(b => b.toString(16).padStart(2, '0')).join(' ');
      addLog(`📤 Sending: ${description}`, 'info', hexStr);
      addLog(`🎯 Targeting ${selectedConnectedCups.length} selected device(s)`, 'info');

      // Send raw command to all selected devices
      for (const cupId of selectedConnectedCups) {
        const cup = cups.find(c => c.id === cupId);
        if (cup) {
          await bleService.sendCommandToDevice(cupId, command);
          addLog(`✅ Raw command sent to ${cup.name} (${cupId})`, 'success');
        }
      }

      addLog(`✅ Success: ${description}`, 'success', hexStr);

      // Add to test results
      const result: TestResult = {
        command: hexStr,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        description
      };
      setTestResults(prev => [...prev, result]);

      return true;
    } catch (error) {
      const hexStr = Array.from(command).map(b => b.toString(16).padStart(2, '0')).join(' ');
      addLog(`❌ Failed: ${description} - ${error}`, 'error', hexStr);

      // Add to test results
      const result: TestResult = {
        command: hexStr,
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        description
      };
      setTestResults(prev => [...prev, result]);

      return false;
    }
  };

  // Manual hex command
  const sendHexCommand = async () => {
    if (!hexCommand.trim()) {
      Alert.alert('Error', 'Please enter a hex command');
      return;
    }

    if (!isValidHex(hexCommand)) {
      Alert.alert('Error', 'Invalid hex format. Use format like: 38 01 00 00 2C 83');
      return;
    }

    try {
      const commandBytes = parseHexString(hexCommand);
      await sendCommandSafely(commandBytes, `Manual command (${commandBytes.length} bytes)`);
    } catch (error) {
      addLog(`❌ Error parsing hex command: ${error}`, 'error');
    }
  };

  // Generate RGB color command based on protocol format
  const generateColorCommand = (r: number, g: number, b: number): Uint8Array => {
    switch (protocolFormat) {
      case '4byte':
        return new Uint8Array([0x56, r, g, b]);
      case '6byte':
        return new Uint8Array([0x56, r, g, b, 0x00, 0xAA]);
      case '8byte':
        return new Uint8Array([0x38, 0x22, r, g, b, 0x00, 0x2C, 0x83]);
      default:
        return new Uint8Array([0x56, r, g, b, 0x00, 0xAA]);
    }
  };

  // Send RGB color using proper BLE method (matches Control tab)
  const sendColorCommand = async (r?: number, g?: number, b?: number) => {
    try {
      // Auto-select connected cups if none selected
      if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
        addLog('📋 Auto-selecting all connected devices for color testing', 'info');
        selectAllCups();
      }

      if (!isConnected || selectedConnectedCups.length === 0) {
        addLog('❌ No connected devices selected for color command', 'error');
        return false;
      }

      const red = r ?? redValue;
      const green = g ?? greenValue;
      const blue = b ?? blueValue;

      addLog(`🎨 Sending RGB color (${red}, ${green}, ${blue}) using store method`, 'info');
      addLog(`🎯 Targeting ${selectedConnectedCups.length} selected device(s)`, 'info');

      // Use proper BLE color method (same as Control debug buttons)
      const colorCommand = { r: red, g: green, b: blue };

      for (const cupId of selectedConnectedCups) {
        const cup = cups.find(c => c.id === cupId);
        if (cup) {
          await bleService.sendColorCommand(cupId, colorCommand);
          addLog(`✅ Color command sent to ${cup.name} (${cupId})`, 'success');
        }
      }

      // Add to test results
      const result: TestResult = {
        command: `RGB(${red}, ${green}, ${blue})`,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        description: `RGB Color using proper BLE method`
      };
      setTestResults(prev => [...prev, result]);

      return true;
    } catch (error) {
      addLog(`❌ Color command failed: ${error}`, 'error');
      return false;
    }
  };

  // Send pattern command using proper BLE method
  const sendPatternCommand = async (pattern: number) => {
    try {
      // Auto-select connected cups if none selected
      if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
        addLog('📋 Auto-selecting all connected devices for pattern testing', 'info');
        selectAllCups();
      }

      if (!isConnected || selectedConnectedCups.length === 0) {
        addLog('❌ No connected devices selected for pattern command', 'error');
        return false;
      }

      addLog(`🌈 Sending pattern ${pattern} using proper BLE method`, 'info');
      addLog(`🎯 Targeting ${selectedConnectedCups.length} selected device(s)`, 'info');

      // Map pattern numbers to mode names (same as Control debug)
      let mode: 'static' | 'pulse' | 'strobe' | 'rainbow' = 'static';
      if (pattern === 1) mode = 'rainbow';
      else if (pattern === 3) mode = 'pulse';
      else if (pattern === 6) mode = 'strobe';
      else mode = 'static'; // Default for other patterns

      for (const cupId of selectedConnectedCups) {
        const cup = cups.find(c => c.id === cupId);
        if (cup) {
          await bleService.sendModeCommand(cupId, mode);
          addLog(`✅ Pattern ${pattern} (${mode}) sent to ${cup.name} (${cupId})`, 'success');
        }
      }

      // Also try raw pattern command for discovery
      const rawCommand = new Uint8Array([0x38, pattern, 0x00, 0x00, 0x2C, 0x83]);
      for (const cupId of selectedConnectedCups) {
        const cup = cups.find(c => c.id === cupId);
        if (cup) {
          try {
            await bleService.sendCommandToDevice(cupId, rawCommand);
            addLog(`📡 Raw pattern ${pattern} sent to ${cup.name}`, 'info');
          } catch (error) {
            addLog(`⚠️ Raw pattern ${pattern} failed for ${cup.name}`, 'error');
          }
        }
      }

      // Add to test results
      const result: TestResult = {
        command: `Pattern ${pattern} (${mode})`,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        description: `Pattern using proper BLE method + raw discovery`
      };
      setTestResults(prev => [...prev, result]);

      return true;
    } catch (error) {
      addLog(`❌ Pattern command failed: ${error}`, 'error');
      return false;
    }
  };

  // Send brightness command using proper BLE method
  const sendBrightnessCommand = async (brightness: number) => {
    try {
      // Auto-select connected cups if none selected
      if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
        addLog('📋 Auto-selecting all connected devices for brightness testing', 'info');
        selectAllCups();
      }

      if (!isConnected || selectedConnectedCups.length === 0) {
        addLog('❌ No connected devices selected for brightness command', 'error');
        return false;
      }

      addLog(`💡 Sending brightness ${brightness} using proper BLE method`, 'info');
      addLog(`🎯 Targeting ${selectedConnectedCups.length} selected device(s)`, 'info');

      for (const cupId of selectedConnectedCups) {
        const cup = cups.find(c => c.id === cupId);
        if (cup) {
          await bleService.sendBrightnessCommand(cupId, brightness);
          addLog(`✅ Brightness ${brightness} sent to ${cup.name} (${cupId})`, 'success');
        }
      }

      // Also try raw brightness command for discovery
      const rawCommand = new Uint8Array([0x38, 0x2A, brightness, 0x00, 0x2C, 0x83]);
      for (const cupId of selectedConnectedCups) {
        const cup = cups.find(c => c.id === cupId);
        if (cup) {
          try {
            await bleService.sendCommandToDevice(cupId, rawCommand);
            addLog(`📡 Raw brightness ${brightness} sent to ${cup.name}`, 'info');
          } catch (error) {
            addLog(`⚠️ Raw brightness ${brightness} failed for ${cup.name}`, 'error');
          }
        }
      }

      // Add to test results
      const result: TestResult = {
        command: `Brightness ${brightness}`,
        success: true,
        timestamp: new Date().toLocaleTimeString(),
        description: `Brightness using proper BLE method + raw discovery`
      };
      setTestResults(prev => [...prev, result]);

      return true;
    } catch (error) {
      addLog(`❌ Brightness command failed: ${error}`, 'error');
      return false;
    }
  };

  // Bulk pattern testing
  const runBulkPatternTest = async () => {
    if (selectedPatterns.size === 0) {
      Alert.alert('Error', 'Please select patterns to test');
      return;
    }

    setBulkTestRunning(true);
    addLog(`🚀 Starting bulk test of ${selectedPatterns.size} patterns`, 'info');

    for (const pattern of Array.from(selectedPatterns).sort((a, b) => a - b)) {
      if (!bulkTestRunning) break; // Allow stopping

      await sendPatternCommand(pattern);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
    }

    setBulkTestRunning(false);
    addLog(`✅ Bulk pattern test completed`, 'success');
  };

  // Toggle pattern selection
  const togglePattern = (pattern: number) => {
    setSelectedPatterns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pattern)) {
        newSet.delete(pattern);
      } else {
        newSet.add(pattern);
      }
      return newSet;
    });
  };

  // Mark log as successful
  const markLogSuccess = (logId: string) => {
    setLogs(prev => prev.map(log =>
      log.id === logId ? { ...log, marked: !log.marked } : log
    ));
  };

  // Export results
  const exportResults = async () => {
    const successfulCommands = testResults.filter(r => r.success);
    const markedLogs = logs.filter(l => l.marked);

    const exportData = {
      successfulCommands,
      markedLogs,
      exportTime: new Date().toISOString(),
      deviceInfo,
      totalTests: testResults.length,
      successRate: `${((successfulCommands.length / testResults.length) * 100).toFixed(1)}%`
    };

    const content = `SP105E Protocol Lab Results\n\nExported: ${exportData.exportTime}\nDevice: ${deviceInfo}\nTotal Tests: ${exportData.totalTests}\nSuccess Rate: ${exportData.successRate}\n\nSuccessful Commands:\n${successfulCommands.map(cmd => `${cmd.timestamp}: ${cmd.command} - ${cmd.description}`).join('\n')}\n\nMarked Logs:\n${markedLogs.map(log => `${log.timestamp}: ${log.command} - ${log.result}`).join('\n')}`;

    try {
      await Share.share({
        message: content,
        title: 'SP105E Protocol Lab Results'
      });
    } catch (error) {
      addLog(`❌ Export failed: ${error}`, 'error');
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs cleared', 'info');
  };

  // Render pattern grid
  const renderPatternGrid = () => {
    const patterns = Array.from({ length: 255 }, (_, i) => i + 1);
    const itemsPerRow = 8;
    const rows = [];

    for (let i = 0; i < patterns.length; i += itemsPerRow) {
      const rowItems = patterns.slice(i, i + itemsPerRow);
      rows.push(
        <View key={i} style={styles.patternRow}>
          {rowItems.map(pattern => (
            <TouchableOpacity
              key={pattern}
              style={[
                styles.patternButton,
                selectedPatterns.has(pattern) && styles.patternButtonSelected
              ]}
              onPress={() => togglePattern(pattern)}
              onLongPress={() => sendPatternCommand(pattern)}
            >
              <Text style={[
                styles.patternButtonText,
                selectedPatterns.has(pattern) && styles.patternButtonTextSelected
              ]}>
                {pattern}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return <View style={styles.patternGrid}>{rows}</View>;
  };

  return (
    <LinearGradient
      colors={['#0A0A0F', '#1A1A2E', '#0A0A0F']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Protocol Lab</Text>
          <Text style={styles.subtitle}>SP105E Command Testing Suite</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#00FF88' : '#FF4444' }]} />
            <Text style={styles.statusText}>
              {isConnected ? `Connected: ${deviceInfo}` : 'Disconnected'}
            </Text>
          </View>

          {/* Connection Controls */}
          <View style={styles.connectionControls}>
            {!isConnected ? (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => setShowBleModal(true)}
              >
                <Ionicons name="bluetooth" size={16} color="#FFFFFF" />
                <Text style={styles.connectButtonText}>Connect Device</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={() => {
                  // Navigate to Control tab for device management
                  Alert.alert(
                    'Device Management',
                    'To disconnect devices, please use the Control tab → Multi-Cup → Disconnect',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                <Text style={styles.disconnectButtonText}>Manage Devices</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                // Force refresh connection status
                if (connectedCups.length > 0) {
                  addLog('🔄 Refreshed - devices still connected', 'info');
                } else {
                  addLog('🔄 Refreshed - no devices connected', 'error');
                }
              }}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Protocol Format Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Protocol Format</Text>
            <View style={styles.protocolSelector}>
              {['4byte', '6byte', '8byte'].map(format => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.protocolButton,
                    protocolFormat === format && styles.protocolButtonActive
                  ]}
                  onPress={() => setProtocolFormat(format as any)}
                >
                  <Text style={[
                    styles.protocolButtonText,
                    protocolFormat === format && styles.protocolButtonTextActive
                  ]}>
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Manual Hex Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manual Command</Text>
            <View style={styles.hexInputContainer}>
              <TextInput
                style={styles.hexInput}
                value={hexCommand}
                onChangeText={setHexCommand}
                placeholder="Enter hex command (e.g., 38 01 00 00 2C 83)"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendHexCommand}
              >
                <Ionicons name="send" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* RGB Color Testing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RGB Color Testing</Text>
            <View style={styles.colorContainer}>
              <View style={styles.colorPreview} style={{backgroundColor: `rgb(${redValue}, ${greenValue}, ${blueValue})`}} />
              <View style={styles.colorSliders}>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Red: {redValue}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={255}
                    value={redValue}
                    onValueChange={setRedValue}
                    step={1}
                    minimumTrackTintColor="#FF4444"
                    maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                    thumbStyle={styles.sliderThumb}
                  />
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Green: {greenValue}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={255}
                    value={greenValue}
                    onValueChange={setGreenValue}
                    step={1}
                    minimumTrackTintColor="#44FF44"
                    maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                    thumbStyle={styles.sliderThumb}
                  />
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Blue: {blueValue}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={255}
                    value={blueValue}
                    onValueChange={setBlueValue}
                    step={1}
                    minimumTrackTintColor="#4444FF"
                    maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                    thumbStyle={styles.sliderThumb}
                  />
                </View>
              </View>
            </View>
            <View style={styles.quickColorButtons}>
              <TouchableOpacity style={[styles.quickColorButton, {backgroundColor: '#FF0000'}]} onPress={() => sendColorCommand(255, 0, 0)}>
                <Text style={styles.quickColorButtonText}>RED</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickColorButton, {backgroundColor: '#00FF00'}]} onPress={() => sendColorCommand(0, 255, 0)}>
                <Text style={styles.quickColorButtonText}>GREEN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickColorButton, {backgroundColor: '#0000FF'}]} onPress={() => sendColorCommand(0, 0, 255)}>
                <Text style={styles.quickColorButtonText}>BLUE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickColorButton, {backgroundColor: '#FFFFFF'}]} onPress={() => sendColorCommand(255, 255, 255)}>
                <Text style={[styles.quickColorButtonText, {color: '#000'}]}>WHITE</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => sendColorCommand()}
            >
              <Text style={styles.testButtonText}>Send Current RGB</Text>
            </TouchableOpacity>
          </View>

          {/* Brightness Testing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Brightness Testing</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Brightness: {brightnessValue}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={255}
                value={brightnessValue}
                onValueChange={setBrightnessValue}
                step={1}
                minimumTrackTintColor="#00FF88"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbStyle={styles.sliderThumb}
              />
            </View>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => sendBrightnessCommand(brightnessValue)}
            >
              <Text style={styles.testButtonText}>Send Brightness Command</Text>
            </TouchableOpacity>
          </View>

          {/* Pattern Testing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pattern Testing</Text>
            <Text style={styles.sectionSubtitle}>Tap to select, long press to test individual pattern</Text>
            <ScrollView style={styles.patternScrollContainer} horizontal={false} nestedScrollEnabled={true}>
              {renderPatternGrid()}
            </ScrollView>
            <View style={styles.bulkTestControls}>
              <TouchableOpacity
                style={[styles.bulkTestButton, bulkTestRunning && styles.bulkTestButtonRunning]}
                onPress={bulkTestRunning ? () => setBulkTestRunning(false) : runBulkPatternTest}
                disabled={selectedPatterns.size === 0}
              >
                <Text style={styles.bulkTestButtonText}>
                  {bulkTestRunning ? `Stop Test` : `Test Selected (${selectedPatterns.size})`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={() => setSelectedPatterns(new Set())}
              >
                <Text style={styles.clearSelectionButtonText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Debug Console */}
          <View style={styles.section}>
            <View style={styles.consoleHeader}>
              <Text style={styles.sectionTitle}>Debug Console</Text>
              <View style={styles.consoleButtons}>
                <TouchableOpacity style={styles.consoleButton} onPress={exportResults}>
                  <Ionicons name="share-outline" size={16} color="#00FF88" />
                  <Text style={styles.consoleButtonText}>Export</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.consoleButton} onPress={clearLogs}>
                  <Ionicons name="trash-outline" size={16} color="#FF4444" />
                  <Text style={styles.consoleButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={scrollViewRef}
              style={styles.console}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {logs.map(log => (
                <TouchableOpacity
                  key={log.id}
                  style={[
                    styles.logEntry,
                    log.status === 'success' && styles.logEntrySuccess,
                    log.status === 'error' && styles.logEntryError,
                    log.marked && styles.logEntryMarked
                  ]}
                  onPress={() => markLogSuccess(log.id)}
                >
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  <Text style={styles.logText}>{log.result}</Text>
                  {log.command && <Text style={styles.logCommand}>CMD: {log.command}</Text>}
                  {log.marked && <Ionicons name="checkmark-circle" size={16} color="#00FF88" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Test Results Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{testResults.length}</Text>
                <Text style={styles.statLabel}>Total Tests</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{testResults.filter(r => r.success).length}</Text>
                <Text style={styles.statLabel}>Successful</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {testResults.length > 0 ? ((testResults.filter(r => r.success).length / testResults.length) * 100).toFixed(1) : '0'}%
                </Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* BLE Scan Modal */}
        <BleScanModal visible={showBleModal} onClose={() => setShowBleModal(false)} />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  protocolSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  protocolButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  protocolButtonActive: {
    backgroundColor: '#00FF88',
  },
  protocolButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  protocolButtonTextActive: {
    color: '#000000',
  },
  hexInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hexInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sendButton: {
    backgroundColor: '#00FF88',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  colorSliders: {
    flex: 1,
  },
  sliderContainer: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
  },
  quickColorButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickColorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickColorButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  testButton: {
    backgroundColor: '#00FF88',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  patternScrollContainer: {
    maxHeight: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  patternGrid: {
    gap: 8,
  },
  patternRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  patternButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternButtonSelected: {
    backgroundColor: '#00FF88',
    borderColor: '#00FF88',
  },
  patternButtonText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  patternButtonTextSelected: {
    color: '#000000',
  },
  bulkTestControls: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkTestButton: {
    flex: 1,
    backgroundColor: '#00FF88',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bulkTestButtonRunning: {
    backgroundColor: '#FF4444',
  },
  bulkTestButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  clearSelectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSelectionButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  consoleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  consoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  consoleButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  console: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logEntry: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logEntrySuccess: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  logEntryError: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  logEntryMarked: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#00FF88',
  },
  logTimestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minWidth: 70,
  },
  logText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  logCommand: {
    fontSize: 11,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  connectionControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00FF88',
  },
  disconnectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});