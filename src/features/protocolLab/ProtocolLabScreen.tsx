import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SkyBackground } from '../../components/ui';
import { bleService } from '../../lib/ble';
import { useNiteControlStore } from '../../store/niteControlStore';

const { width } = Dimensions.get('window');

interface ProtocolTest {
  command: string;
  result: string;
  timestamp: string;
  success: boolean;
}

export const ProtocolLabScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { connectedCups } = useNiteControlStore();
  const [hexInput, setHexInput] = useState('38 FF 00 00 22 83');
  const [selectedProtocol, setSelectedProtocol] = useState<'6byte' | '8byte' | '4byte' | 'custom'>('6byte');
  const [testResults, setTestResults] = useState<ProtocolTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testedPatterns, setTestedPatterns] = useState<Set<number>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  const addTestResult = (command: string, result: string, success: boolean = false) => {
    const newTest: ProtocolTest = {
      command,
      result,
      timestamp: new Date().toLocaleTimeString(),
      success,
    };
    setTestResults(prev => [...prev, newTest]);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendHexCommand = async () => {
    if (connectedCups.length === 0) {
      Alert.alert('Error', 'No connected devices');
      return;
    }

    try {
      // Parse hex input
      const hexBytes = hexInput.trim().split(/\s+/).map(hex => {
        const byte = parseInt(hex.replace('0x', ''), 16);
        if (isNaN(byte) || byte < 0 || byte > 255) {
          throw new Error(`Invalid hex byte: ${hex}`);
        }
        return byte;
      });

      if (hexBytes.length === 0) {
        throw new Error('No hex bytes provided');
      }

      const command = new Uint8Array(hexBytes);
      const deviceId = connectedCups[0].id;

      addTestResult(hexInput, 'Sending command...', false);

      // Send command to device
      await bleService.sendCommandToDevice(deviceId, command);

      addTestResult(hexInput, 'Command sent! Check your LED and report what you see.', false);

    } catch (error: any) {
      addTestResult(hexInput, `Error: ${error.message}`, false);
    }
  };

  const testPattern = async (patternNumber: number) => {
    if (connectedCups.length === 0) {
      Alert.alert('Error', 'No connected devices');
      return;
    }

    try {
      const command = new Uint8Array([0x38, patternNumber, 0x00, 0x00, 0x2C, 0x83]);
      const deviceId = connectedCups[0].id;
      const hexString = Array.from(command).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

      setTestedPatterns(prev => new Set(prev).add(patternNumber));
      addTestResult(`Pattern ${patternNumber}`, `Testing: ${hexString}`, false);

      await bleService.sendCommandToDevice(deviceId, command);

      addTestResult(`Pattern ${patternNumber}`, `Sent! Observe LED for 3 seconds...`, false);

    } catch (error: any) {
      addTestResult(`Pattern ${patternNumber}`, `Error: ${error.message}`, false);
    }
  };

  const test8ByteProtocol = async (r: number, g: number, b: number) => {
    if (connectedCups.length === 0) {
      Alert.alert('Error', 'No connected devices');
      return;
    }

    try {
      // Your original LightBlue format
      const command = new Uint8Array([0x01, 0xCB, r, g, b, 0x00, 0x02, 0x58]);
      const deviceId = connectedCups[0].id;
      const hexString = Array.from(command).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

      addTestResult(`8-Byte RGB(${r},${g},${b})`, `Testing: ${hexString}`, false);

      await bleService.sendCommandToDevice(deviceId, command);

      addTestResult(`8-Byte RGB(${r},${g},${b})`, `Sent! Check for solid color...`, false);

    } catch (error: any) {
      addTestResult(`8-Byte RGB(${r},${g},${b})`, `Error: ${error.message}`, false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setTestedPatterns(new Set());
  };

  const exportResults = () => {
    const successfulTests = testResults.filter(test => test.success);
    const exportData = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      successfulTests: successfulTests.length,
      results: testResults,
    };

    Alert.alert('Export Results', JSON.stringify(exportData, null, 2));
  };

  const markAsWorking = (index: number) => {
    setTestResults(prev => prev.map((test, i) =>
      i === index ? { ...test, success: true } : test
    ));
  };

  const generatePatternGrid = () => {
    const patterns = [];
    for (let i = 1; i <= 255; i++) {
      patterns.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.patternButton,
            testedPatterns.has(i) ? styles.patternButtonTested : null
          ]}
          onPress={() => testPattern(i)}
        >
          <Text style={styles.patternButtonText}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return patterns;
  };

  return (
    <View style={styles.container}>
      <SkyBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>SP105E Protocol Lab</Text>
            <Text style={styles.subtitle}>Systematic Protocol Discovery</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Connection Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Status</Text>
            <Text style={[styles.statusText, connectedCups.length > 0 ? styles.connected : styles.disconnected]}>
              {connectedCups.length > 0
                ? `✅ Connected: ${connectedCups[0]?.name || 'SP105E'}`
                : '❌ No device connected'
              }
            </Text>
          </View>

          {/* Manual Hex Command Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manual Hex Command</Text>
            <Text style={styles.sectionDescription}>
              Send raw hex commands directly to SP105E
            </Text>
            <View style={styles.hexInputContainer}>
              <TextInput
                style={styles.hexInput}
                value={hexInput}
                onChangeText={setHexInput}
                placeholder="38 FF 00 00 22 83"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendHexCommand}
                disabled={connectedCups.length === 0}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Test Buttons */}
            <View style={styles.quickTests}>
              <TouchableOpacity
                style={styles.quickTestButton}
                onPress={() => test8ByteProtocol(255, 0, 0)}
              >
                <Text style={styles.quickTestText}>8-Byte RED</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTestButton}
                onPress={() => test8ByteProtocol(0, 255, 0)}
              >
                <Text style={styles.quickTestText}>8-Byte GREEN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickTestButton}
                onPress={() => test8ByteProtocol(0, 0, 255)}
              >
                <Text style={styles.quickTestText}>8-Byte BLUE</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pattern Testing Matrix */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pattern Testing Matrix</Text>
            <Text style={styles.sectionDescription}>
              Test all 255 possible patterns to find solid colors
            </Text>
            <View style={styles.patternGrid}>
              {generatePatternGrid()}
            </View>
          </View>

          {/* Results Logger */}
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>Test Results</Text>
              <View style={styles.resultsActions}>
                <TouchableOpacity style={styles.actionButton} onPress={clearResults}>
                  <Text style={styles.actionButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={exportResults}>
                  <Text style={styles.actionButtonText}>Export</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.resultsContainer}
              showsVerticalScrollIndicator={false}
            >
              {testResults.length === 0 ? (
                <Text style={styles.emptyText}>No tests run yet. Start testing above!</Text>
              ) : (
                testResults.map((test, index) => (
                  <View key={index} style={[styles.resultItem, test.success ? styles.successResult : null]}>
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultCommand}>{test.command}</Text>
                      <TouchableOpacity
                        style={styles.markButton}
                        onPress={() => markAsWorking(index)}
                      >
                        <Text style={styles.markButtonText}>
                          {test.success ? '✅' : 'Mark✓'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.resultText}>{test.result}</Text>
                    <Text style={styles.resultTime}>{test.timestamp}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  connected: {
    color: '#00FF88',
  },
  disconnected: {
    color: '#FF4444',
  },
  hexInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hexInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#00FF88',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  quickTests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickTestText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  patternButton: {
    width: 40,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  patternButtonTested: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: '#00FF88',
  },
  patternButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  resultsContainer: {
    maxHeight: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  resultItem: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },
  successResult: {
    borderLeftColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultCommand: {
    color: '#00FF88',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  markButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  markButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 4,
  },
  resultTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
});