import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  RefreshControl,
  StyleSheet,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNiteControlStore } from '../../store/niteControlStore';
import { SkyBackground } from '../../components/ui';
import { NiteControlScreenProps } from '../../types/navigation';
import { AddCupOptionsModal } from '../../components/ui/AddCupOptionsModal';
import { BleScanModal } from './BleScanModal';

const { width } = Dimensions.get('window');

const PRESET_COLORS = [
  '#00FF88', // Neon Green
  '#0088FF', // Electric Blue
  '#8800FF', // Purple Glow
  '#FF4400', // Sunset Orange
  '#FF0088', // Hot Pink
  '#00FFFF', // Cyan Bright
  '#88FF00', // Lime Punch
  '#FF0044', // Deep Red
];

const LIGHTING_MODES = [
  { id: 'static', name: 'Static', icon: 'stop', color: '#00FF88' },
  { id: 'pulse', name: 'Pulse', icon: 'heart', color: '#FF0088' },
  { id: 'strobe', name: 'Strobe', icon: 'flash', color: '#FFFF00' },
  { id: 'rainbow', name: 'Rainbow', icon: 'color-palette', color: '#FF6B6B' },
];

export const NiteControlScreen: React.FC<NiteControlScreenProps> = ({ navigation }) => {
  const {
    cups,
    selectedCups,
    currentColor,
    currentBrightness,
    currentMode,
    connectToCup,
    disconnectFromCup,
    setColor,
    setBrightness,
    setMode,
    selectAllCups,
    deselectAllCups,
    isConnecting,
  } = useNiteControlStore();

  const connectedCups = cups.filter(cup => cup.isConnected);
  const selectedConnectedCups = selectedCups.filter(id =>
    cups.find(cup => cup.id === id)?.isConnected
  );
  const avgBattery = connectedCups.length > 0
    ? Math.round(connectedCups.reduce((acc, cup) => acc + cup.batteryLevel, 0) / connectedCups.length)
    : 0;

  const [localBrightness, setLocalBrightness] = useState(currentBrightness);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showBleModal, setShowBleModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Animation values
  const fadeOpacity = useSharedValue(0);
  const slideY = useSharedValue(30);
  const pulseScale = useSharedValue(1);

  // Brightness slider pan responder
  const sliderRef = useRef(null);
  const brightnessSliderValue = useSharedValue(localBrightness);

  const brightnessPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      // Auto-select connected cups if none selected
      if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
        selectAllCups();
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Handle initial touch as immediate value change
      if (sliderRef.current) {
        sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          const percentage = Math.max(0, Math.min(100, (touchX / width) * 100));
          setLocalBrightness(Math.round(percentage));
          handleBrightnessChange(Math.round(percentage));
        });
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (sliderRef.current) {
        sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
          const touchX = evt.nativeEvent.pageX - pageX;
          const percentage = Math.max(0, Math.min(100, (touchX / width) * 100));
          setLocalBrightness(Math.round(percentage));
          handleBrightnessChange(Math.round(percentage));
        });
      }
    },
    onPanResponderRelease: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    fadeOpacity.value = withSpring(1, { tension: 300, friction: 10 });
    slideY.value = withSpring(0, { tension: 300, friction: 10 });
  }, []);

  useEffect(() => {
    setLocalBrightness(currentBrightness);
  }, [currentBrightness]);

  // Pulse animation for connected state
  useEffect(() => {
    if (connectedCups.length > 0) {
      const pulseInterval = setInterval(() => {
        pulseScale.value = withSpring(1.05, { tension: 300, friction: 10 }, () => {
          pulseScale.value = withSpring(1, { tension: 300, friction: 10 });
        });
      }, 3000);
      return () => clearInterval(pulseInterval);
    }
  }, [connectedCups.length]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleConnectAll = useCallback(async () => {
    if (isConnecting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const disconnectedCups = cups.filter(cup => !cup.isConnected);

    if (disconnectedCups.length === 0) {
      Alert.alert('All Connected', 'All cups are already connected.');
      return;
    }

    try {
      for (const cup of disconnectedCups) {
        await connectToCup(cup.id);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Connection Failed', 'Could not connect to all cups.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [cups, connectToCup, isConnecting]);

  const handleDisconnectAll = useCallback(async () => {
    if (connectedCups.length === 0) return;

    Alert.alert(
      'Disconnect All Cups',
      `Disconnect all ${connectedCups.length} connected cups?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const cup of connectedCups) {
                await disconnectFromCup(cup.id);
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect some cups.');
            }
          },
        },
      ]
    );
  }, [connectedCups, disconnectFromCup]);

  const handleColorSelect = useCallback(async (color: string) => {
    // If no cups selected but connected cups exist, auto-select all connected cups
    if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
      selectAllCups();
      // Small delay to ensure selection is processed
      setTimeout(async () => {
        try {
          await setColor(color);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
          console.error('Failed to set color:', error);
        }
      }, 100);
      return;
    }

    // If still no connected cups, show helpful message
    if (connectedCups.length === 0) {
      Alert.alert('No Connected Cups', 'Please connect cups first by tapping the Multi-Cup button.');
      return;
    }

    try {
      await setColor(color);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to set color:', error);
    }
  }, [selectedConnectedCups.length, connectedCups.length, setColor, selectAllCups]);

  const handleBrightnessChange = useCallback(async (newBrightness: number) => {
    // Auto-select all connected cups if none selected
    if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
      selectAllCups();
    }

    const clampedBrightness = Math.max(0, Math.min(100, newBrightness));
    setLocalBrightness(clampedBrightness);

    // Always update local brightness for immediate UI feedback
    if (connectedCups.length === 0) return;

    try {
      await setBrightness(clampedBrightness);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to set brightness:', error);
    }
  }, [selectedConnectedCups.length, connectedCups.length, setBrightness, selectAllCups]);

  const handleModeSelect = useCallback(async (mode: any) => {
    // Auto-select all connected cups if none selected
    if (selectedConnectedCups.length === 0 && connectedCups.length > 0) {
      selectAllCups();
      // Small delay to ensure selection is processed
      setTimeout(async () => {
        try {
          await setMode(mode);
          setShowModeSelector(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
          console.error('Failed to set mode:', error);
        }
      }, 100);
      return;
    }

    // If no connected cups, show helpful message
    if (connectedCups.length === 0) {
      Alert.alert('No Connected Cups', 'Please connect cups first by tapping the Multi-Cup button.');
      return;
    }

    try {
      await setMode(mode);
      setShowModeSelector(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to set mode:', error);
    }
  }, [selectedConnectedCups.length, connectedCups.length, setMode, selectAllCups]);

  const handleCupSelection = useCallback(() => {
    if (connectedCups.length === 0) {
      Alert.alert('No Connected Cups', 'Please connect cups first.');
      return;
    }

    if (selectedCups.length === connectedCups.length) {
      deselectAllCups();
    } else {
      selectAllCups();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [connectedCups.length, selectedCups.length, selectAllCups, deselectAllCups]);

  return (
    <View style={styles.container}>
      <SkyBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#00FF88"
              colors={['#00FF88']}
            />
          }
        >
          <Reanimated.View style={[styles.content, contentAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Nite Control</Text>
                <Text style={styles.subtitle}>Professional golf cup lighting</Text>
              </View>

              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.multiCupButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('MultiCupControl');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="apps" size={20} color="#FFFFFF" />
                  <Text style={styles.multiCupButtonText}>Multi-Cup</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddOptions(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Connection Dashboard */}
            <Reanimated.View style={[styles.dashboardCard, pulseAnimatedStyle]}>
              <View style={styles.dashboardHeader}>
                <View style={styles.connectionIcon}>
                  <Ionicons
                    name={connectedCups.length > 0 ? 'golf' : 'golf-outline'}
                    size={32}
                    color={connectedCups.length > 0 ? '#34C759' : 'rgba(255, 255, 255, 0.6)'}
                  />
                </View>
                <View style={styles.dashboardStats}>
                  <Text style={styles.connectionCount}>
                    {connectedCups.length} of {cups.length} connected
                  </Text>
                  {connectedCups.length > 0 && (
                    <Text style={styles.batteryLevel}>Avg Battery: {avgBattery}%</Text>
                  )}
                  {connectedCups.length > 0 && (
                    <View style={styles.connectedDevices}>
                      {connectedCups.slice(0, 3).map(cup => (
                        <View key={cup.id} style={styles.deviceChip}>
                          <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                          <Text style={styles.deviceName} numberOfLines={1}>
                            {cup.name}
                          </Text>
                        </View>
                      ))}
                      {connectedCups.length > 3 && (
                        <Text style={styles.moreDevicesText}>
                          +{connectedCups.length - 3} more
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={[styles.quickActionButton, styles.connectAllButton]}
                  onPress={handleConnectAll}
                  disabled={isConnecting}
                  activeOpacity={0.8}
                >
                  <Ionicons name="wifi" size={16} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>
                    {isConnecting ? 'Connecting...' : 'Connect All'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionButton, styles.disconnectAllButton]}
                  onPress={handleDisconnectAll}
                  disabled={connectedCups.length === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.quickActionText}>Disconnect All</Text>
                </TouchableOpacity>
              </View>
            </Reanimated.View>

            {/* Cup Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cup Selection</Text>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={handleCupSelection}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={selectedCups.length === connectedCups.length ? "checkbox" : "square-outline"}
                    size={18}
                    color="#00D4FF"
                  />
                  <Text style={styles.selectAllText}>
                    {selectedCups.length === connectedCups.length ? "Deselect All" : "Select All"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.selectionInfo}>
                <Text style={styles.selectionText}>
                  {selectedConnectedCups.length > 0
                    ? `${selectedConnectedCups.length} cup${selectedConnectedCups.length !== 1 ? 's' : ''} selected`
                    : 'No cups selected - tap Multi-Cup to select individual cups'
                  }
                </Text>
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color Control</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      currentColor === color && styles.selectedColor,
                    ]}
                    onPress={() => handleColorSelect(color)}
                    activeOpacity={0.8}
                  >
                    {currentColor === color && (
                      <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.customColorButton}
                onPress={() => {
                  if (connectedCups.length === 0) {
                    Alert.alert('No Connected Cups', 'Please connect cups first by tapping the Multi-Cup button.');
                    return;
                  }
                  // Auto-select if none selected
                  if (selectedConnectedCups.length === 0) {
                    selectAllCups();
                  }
                  navigation.navigate('ColorWheel', {
                    cupId: selectedConnectedCups[0] || connectedCups[0]?.id || '',
                    cupName: 'Selected Cups',
                    currentColor: currentColor,
                  });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="color-palette" size={20} color="#FFFFFF" />
                <Text style={styles.customColorText}>Custom Color Wheel</Text>
              </TouchableOpacity>
            </View>

            {/* Lighting Modes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lighting Effects</Text>
              <View style={styles.modeGrid}>
                {LIGHTING_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.modeOption,
                      currentMode === mode.id && styles.selectedMode,
                    ]}
                    onPress={() => handleModeSelect(mode.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.modeIcon, { backgroundColor: mode.color }]}>
                      <Ionicons name={mode.icon as any} size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[
                      styles.modeText,
                      currentMode === mode.id && styles.selectedModeText
                    ]}>
                      {mode.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Brightness Control */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Master Brightness</Text>
              <View style={styles.brightnessContainer}>
                <TouchableOpacity
                  onPress={() => handleBrightnessChange(Math.max(0, localBrightness - 10))}
                  style={styles.brightnessButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={20}
                    color={connectedCups.length > 0 ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.4)"}
                  />
                </TouchableOpacity>

                <View
                  style={styles.sliderContainer}
                  {...brightnessPanResponder.panHandlers}
                  ref={sliderRef}
                >
                  <View style={styles.sliderTrack}>
                    <View
                      style={[
                        styles.sliderFill,
                        {
                          width: `${localBrightness}%`,
                          backgroundColor: connectedCups.length > 0 ? '#00FF88' : 'rgba(255, 255, 255, 0.3)'
                        }
                      ]}
                    />
                    <View
                      style={[
                        styles.sliderThumb,
                        {
                          left: `${Math.max(0, Math.min(94, localBrightness - 3))}%`,
                          opacity: connectedCups.length > 0 ? 1 : 0.5,
                        }
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleBrightnessChange(Math.min(100, localBrightness + 10))}
                  style={styles.brightnessButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="sunny"
                    size={20}
                    color={connectedCups.length > 0 ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.4)"}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.brightnessValue, { opacity: connectedCups.length > 0 ? 1 : 0.5 }]}>
                {Math.round(localBrightness)}%
              </Text>
            </View>

            {/* Live Preview */}
            <View style={styles.section}>
              <View style={styles.previewHeader}>
                <Text style={styles.sectionTitle}>Live Preview</Text>
                <View style={styles.previewStatus}>
                  <View style={[styles.statusIndicator, { backgroundColor: connectedCups.length > 0 ? '#00FF88' : '#FF6B6B' }]} />
                  <Text style={styles.statusText}>
                    {connectedCups.length > 0 ? `${connectedCups.length} Connected` : 'Demo Mode'}
                  </Text>
                </View>
              </View>

              <View style={styles.previewContainer}>
                {/* Golf Course Layout */}
                <View style={styles.courseLayoutContainer}>
                  <View style={styles.courseBackground}>
                    {/* Fairway lines */}
                    <View style={styles.fairwayLine} />
                    <View style={[styles.fairwayLine, { top: '60%' }]} />

                    {/* Cup grid with 3D effect */}
                    <View style={styles.previewGrid}>
                      {(selectedConnectedCups.length > 0 ? selectedConnectedCups : connectedCups.length > 0 ? connectedCups.slice(0, 6).map(c => c.id) : ['demo-1', 'demo-2', 'demo-3', 'demo-4', 'demo-5', 'demo-6']).slice(0, 9).map((cupId, index) => {
                        const cup = cups.find(c => c.id === cupId);
                        const isDemo = cupId.startsWith('demo-');
                        const row = Math.floor(index / 3);
                        const col = index % 3;

                        return (
                          <Reanimated.View
                            key={cupId}
                            style={[
                              styles.previewCup,
                              {
                                backgroundColor: cup?.color || currentColor,
                                opacity: isDemo ? 0.6 : Math.max(0.3, (cup?.brightness || localBrightness) / 100),
                                transform: [
                                  {
                                    scale: currentMode === 'pulse' && !isDemo ?
                                      1 + Math.sin(Date.now() / 500 + index) * 0.1 : 1
                                  }
                                ],
                                left: col * 45 + 10,
                                top: row * 45 + 10,
                                shadowColor: cup?.color || currentColor,
                                shadowOpacity: isDemo ? 0.3 : ((cup?.brightness || localBrightness) / 200),
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 4 },
                              }
                            ]}
                          >
                            <Ionicons
                              name={cup?.name?.toLowerCase().includes('sp105e') ||
                                   cup?.name?.toLowerCase().includes('magic') ||
                                   cup?.name?.toLowerCase().includes('led') ? "radio-button-on" : "golf"}
                              size={14}
                              color="rgba(255, 255, 255, 0.9)"
                              style={styles.cupIcon}
                            />
                            {!isDemo && cup?.isConnected && (
                              <View style={styles.connectionIndicator}>
                                <View style={styles.connectionDot} />
                              </View>
                            )}
                          </Reanimated.View>
                        );
                      })}

                      {/* Show overflow indicator */}
                      {((selectedConnectedCups.length > 0 ? selectedConnectedCups : connectedCups).length > 9) && (
                        <View style={[styles.previewMore, { left: 10, top: 145 }]}>
                          <Text style={styles.previewMoreText}>
                            +{((selectedConnectedCups.length > 0 ? selectedConnectedCups : connectedCups).length - 9)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Preview Details */}
                <View style={styles.previewDetails}>
                  <View style={styles.previewDetailRow}>
                    <View style={styles.colorPreview}>
                      <View style={[styles.colorSwatch, { backgroundColor: currentColor }]} />
                      <Text style={styles.previewColor}>{currentColor.toUpperCase()}</Text>
                    </View>
                    <View style={styles.brightnessPreview}>
                      <Ionicons name="sunny" size={16} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.brightnessText}>{Math.round(localBrightness)}%</Text>
                    </View>
                  </View>

                  <View style={styles.previewDetailRow}>
                    <View style={styles.modePreview}>
                      <Ionicons
                        name={LIGHTING_MODES.find(m => m.id === currentMode)?.icon || 'stop'}
                        size={16}
                        color={LIGHTING_MODES.find(m => m.id === currentMode)?.color || '#00FF88'}
                      />
                      <Text style={styles.previewMode}>
                        {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode
                      </Text>
                    </View>
                    {connectedCups.length > 0 && (
                      <View style={styles.deviceCountPreview}>
                        <Ionicons name="hardware-chip" size={16} color="#00FF88" />
                        <Text style={styles.deviceCountText}>
                          {selectedConnectedCups.length > 0 ? selectedConnectedCups.length : connectedCups.length} Active
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </Reanimated.View>
        </ScrollView>

        {/* Add Device Options */}
        <AddCupOptionsModal
          visible={showAddOptions}
          onClose={() => setShowAddOptions(false)}
          onScanQr={() => {
            setShowAddOptions(false);
            navigation.navigate('QrScan');
          }}
          onBluetoothScan={() => {
            setShowAddOptions(false);
            setShowBleModal(true);
          }}
        />

        {/* BLE Scan Modal */}
        <BleScanModal visible={showBleModal} onClose={() => setShowBleModal(false)} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: Platform.OS === 'ios' ? 34 : 32,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.4,
    lineHeight: Platform.OS === 'ios' ? 40 : 38,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '400',
    lineHeight: 22,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  multiCupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
  },
  multiCupButtonText: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dashboard
  dashboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 24 : 18,
    padding: 24,
    marginBottom: 32,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  connectionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardStats: {
    flex: 1,
  },
  connectionCount: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  batteryLevel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  connectedDevices: {
    marginTop: 8,
    gap: 6,
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    maxWidth: '100%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  deviceName: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    flex: 1,
  },
  moreDevicesText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontStyle: 'italic',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Platform.OS === 'ios' ? 14 : 10,
    gap: 8,
  },
  connectAllButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  disconnectAllButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
    color: '#00D4FF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectionInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    marginBottom: 16,
  },
  selectionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Color Grid
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  colorOption: {
    width: (width - 40 - 48) / 4,
    height: 72,
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  customColorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 10,
  },
  customColorText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Mode Grid
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modeOption: {
    width: (width - 40 - 16) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMode: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modeText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectedModeText: {
    color: '#00FF88',
  },

  // Brightness Control
  brightnessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  brightnessButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  sliderContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: 8,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  brightnessValue: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },

  // Live Preview - Professional Golf Course Style
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '500',
  },
  previewContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  courseLayoutContainer: {
    marginBottom: 20,
  },
  courseBackground: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(0, 80, 0, 0.3)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  fairwayLine: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewGrid: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  previewCup: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 4,
  },
  cupIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  connectionIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF88',
  },
  previewMore: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  previewMoreText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  previewDetails: {
    gap: 12,
  },
  previewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  previewColor: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },
  brightnessPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brightnessText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '500',
  },
  modePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewMode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '500',
  },
  deviceCountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceCountText: {
    fontSize: 14,
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '600',
  },
});