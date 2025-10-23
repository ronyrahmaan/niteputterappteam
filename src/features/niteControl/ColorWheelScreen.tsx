import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SkyBackground } from '../../components/ui/SkyBackground';

import { ColorWheel } from '../../components/ui/ColorWheel';
import { useNiteControlStore } from '../../store/niteControlStore';
import { ColorWheelScreenProps } from '../../types/navigation';
import { kelvinToHex, clamp } from '../../lib/colorUtils';

const { width } = Dimensions.get('window');

type TabKey = 'color' | 'temperature' | 'swatch';

export const ColorWheelScreen: React.FC<ColorWheelScreenProps> = ({ navigation, route }) => {
  const { cupId, currentColor } = route.params || ({} as any);
  const { cups, setCupColor, setCupBrightness } = useNiteControlStore();

  const initialColor = (typeof currentColor === 'string' && currentColor.startsWith('#') && (currentColor.length === 7 || currentColor.length === 9))
    ? currentColor
    : '#00FF88';
  const cup = cups.find(c => c.id === cupId);
  const initialBrightness = typeof cup?.brightness === 'number' ? cup!.brightness : 22;

  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [brightness, setBrightness] = useState(initialBrightness);
  const [activeTab, setActiveTab] = useState<TabKey>('color');
  const [isApplying, setIsApplying] = useState(false);
  const [kelvin, setKelvin] = useState<number>(4000);

  // Track dimensions
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const [tempTrackWidth, setTempTrackWidth] = useState<number>(0);

  // Reanimated values
  const fadeOpacity = useSharedValue(0);
  const slideY = useSharedValue(40);
  const colorPreviewScale = useSharedValue(1);
  const brightnessSliderValue = useSharedValue(brightness / 100);
  const tempSliderValue = useSharedValue((kelvin - 1000) / (6500 - 1000));
  const brightnessThumbScale = useSharedValue(1);
  const tempThumbScale = useSharedValue(1);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  const colorPreviewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: colorPreviewScale.value }],
  }));

  useEffect(() => {
    fadeOpacity.value = withSpring(1, { tension: 300, friction: 10 });
    slideY.value = withSpring(0, { tension: 300, friction: 10 });
    brightnessSliderValue.value = brightness / 100;
    tempSliderValue.value = (kelvin - 1000) / (6500 - 1000);
  }, []);

  useEffect(() => {
    brightnessSliderValue.value = withSpring(brightness / 100, { tension: 300, friction: 10 });
  }, [brightness]);

  useEffect(() => {
    tempSliderValue.value = withSpring((kelvin - 1000) / (6500 - 1000), { tension: 300, friction: 10 });
  }, [kelvin]);

  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
    colorPreviewScale.value = withSpring(1.06, { tension: 300, friction: 10 }, () => {
      colorPreviewScale.value = withSpring(1, { tension: 300, friction: 10 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Brightness slider pan responder
  const brightnessPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      brightnessThumbScale.value = withSpring(1.2, { tension: 400, friction: 8 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPanResponderMove: (_, gestureState) => {
      if (trackWidth <= 0) return;

      const x = Math.max(0, Math.min(gestureState.moveX - gestureState.x0, trackWidth));
      const ratio = x / trackWidth;
      const nextBrightness = Math.round(ratio * 100);

      brightnessSliderValue.value = ratio;
      setBrightness(nextBrightness);
    },
    onPanResponderRelease: () => {
      brightnessThumbScale.value = withSpring(1, { tension: 400, friction: 8 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  // Temperature slider pan responder
  const tempPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      tempThumbScale.value = withSpring(1.2, { tension: 400, friction: 8 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPanResponderMove: (_, gestureState) => {
      if (tempTrackWidth <= 0) return;

      const x = Math.max(0, Math.min(gestureState.moveX - gestureState.x0, tempTrackWidth));
      const ratio = x / tempTrackWidth;
      const nextKelvin = Math.round(1000 + ratio * (6500 - 1000));
      const nextColor = kelvinToHex(nextKelvin);

      tempSliderValue.value = ratio;
      setKelvin(nextKelvin);
      setSelectedColor(nextColor);
    },
    onPanResponderRelease: () => {
      tempThumbScale.value = withSpring(1, { tension: 400, friction: 8 });
      colorPreviewScale.value = withSpring(1.05, { tension: 300, friction: 10 }, () => {
        colorPreviewScale.value = withSpring(1, { tension: 300, friction: 10 });
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const handleConfirm = useCallback(async () => {
    try {
      setIsApplying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Promise.all([
        setCupColor(cupId, selectedColor),
        setCupBrightness(cupId, brightness),
      ]);
      navigation.goBack();
    } catch (e) {
      // Swallow and continue — mock environment
    } finally {
      setIsApplying(false);
    }
  }, [cupId, selectedColor, brightness, navigation]);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePresetColorSelect = useCallback((color: string) => {
    handleColorChange(color);
  }, [handleColorChange]);

  const handleTemperaturePreset = useCallback((k: number) => {
    setKelvin(k);
    const nextColor = kelvinToHex(k);
    setSelectedColor(nextColor);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Professional color presets
  const colorPresets = [
    '#00FF88', // Neon Green
    '#00D4FF', // Cyan
    '#8A2BE2', // Blue Violet
    '#FF1493', // Deep Pink
    '#FF8C00', // Dark Orange
    '#FFD700', // Gold
    '#32CD32', // Lime Green
    '#FF69B4', // Hot Pink
  ];

  const temperaturePresets = [
    { kelvin: 1500, name: 'Candle' },
    { kelvin: 2700, name: 'Warm' },
    { kelvin: 3500, name: 'Neutral' },
    { kelvin: 4500, name: 'Cool' },
    { kelvin: 5500, name: 'Daylight' },
    { kelvin: 6500, name: 'Sky' },
  ];

  // Animated slider styles
  const brightnessSliderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          brightnessSliderValue.value,
          [0, 1],
          [0, Math.max(0, trackWidth - 26)]
        ),
      },
      { scale: brightnessThumbScale.value },
    ],
  }));

  const brightnessTrackAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(
      brightnessSliderValue.value,
      [0, 1],
      [0, Math.max(0, trackWidth)]
    ),
  }));

  const tempSliderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          tempSliderValue.value,
          [0, 1],
          [0, Math.max(0, tempTrackWidth - 26)]
        ),
      },
      { scale: tempThumbScale.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <SkyBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Reanimated.View style={[styles.header, contentAnimatedStyle]}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()} activeOpacity={1}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Light Color</Text>
          <TouchableOpacity style={[styles.headerIcon, styles.confirmIcon]} onPress={handleConfirm} disabled={isApplying} activeOpacity={1}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Reanimated.View>

        {/* Tabs */}
        <View style={styles.tabsOuter}>
          <View style={styles.tabsInner}>
            {(['color','temperature','swatch'] as TabKey[]).map(key => (
              <TouchableOpacity
                key={key}
                style={[styles.tabButton, activeTab === key && styles.tabButtonActive]}
                onPress={() => handleTabChange(key)}
                activeOpacity={1}
              >
                <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                  {key === 'color' ? 'Color' : key === 'temperature' ? 'Temperature' : 'Presets'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Wheel Card */}
        {activeTab === 'color' && (
          <Reanimated.View style={[styles.card, styles.wheelCard, contentAnimatedStyle]}>
            <ColorWheel size={Math.min(width * 0.82, 320)} onColorChange={handleColorChange} initialColor={selectedColor} />
          </Reanimated.View>
        )}

        {/* Temperature Card */}
        {activeTab === 'temperature' && (
          <Reanimated.View style={[styles.card, contentAnimatedStyle]}>
            <Text style={styles.sectionLabel}>COLOR TEMPERATURE</Text>
            <View style={styles.sliderRow}>
              <View
                style={styles.tempSliderTrack}
                onLayout={(e) => setTempTrackWidth(e.nativeEvent.layout.width)}
                {...tempPanResponder.panHandlers}
              >
                <LinearGradient
                  colors={["#FFB56B", "#FFFFFF", "#8CB4FF"]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.tempSliderFill}
                />
                <Reanimated.View style={[styles.sliderThumb, tempSliderAnimatedStyle]} />
              </View>
              <View style={styles.valueBox}>
                <Text style={styles.valueText}>{kelvin}K</Text>
              </View>
            </View>

            <View style={styles.presetsContainer}>
              <View style={styles.colorPreview}>
                <Reanimated.View style={[styles.bigSwatch, { backgroundColor: selectedColor }, colorPreviewAnimatedStyle]} />
              </View>
              <View style={styles.tempPresetsGrid}>
                {temperaturePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.kelvin}
                    style={[styles.tempPreset, { backgroundColor: kelvinToHex(preset.kelvin) }]}
                    onPress={() => handleTemperaturePreset(preset.kelvin)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tempPresetText}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Reanimated.View>
        )}

        {/* Swatch Card */}
        {activeTab === 'swatch' && (
          <Reanimated.View style={[styles.card, contentAnimatedStyle]}>
            <Text style={styles.sectionLabel}>COLOR PRESETS</Text>
            <View style={styles.swatchGrid}>
              {colorPresets.map((color, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.colorSwatch, { backgroundColor: color }]}
                  onPress={() => handlePresetColorSelect(color)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </Reanimated.View>
        )}

        {/* Brightness Card */}
        <View style={[styles.card, styles.brightnessCard]}>
          <Text style={styles.sectionLabel}>BRIGHTNESS</Text>
          <View style={styles.sliderRow}>
            <View
              style={styles.sliderTrack}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              {...brightnessPanResponder.panHandlers}
            >
              <Reanimated.View style={[styles.sliderFill, brightnessTrackAnimatedStyle]} />
              <Reanimated.View style={[styles.sliderThumb, brightnessSliderAnimatedStyle]} />
            </View>
            <View style={styles.valueBox}>
              <Text style={styles.valueText}>{brightness}%</Text>
            </View>
          </View>

          <View style={styles.brightnessPreview}>
            <Reanimated.View style={[styles.bigSwatch, { backgroundColor: selectedColor }, colorPreviewAnimatedStyle]} />
            <View style={styles.colorInfo}>
              <Text style={styles.colorValue}>{selectedColor.toUpperCase()}</Text>
              <Text style={styles.colorDescription}>
                {brightness < 30 ? 'Dim' : brightness < 70 ? 'Medium' : 'Bright'}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  safeArea: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmIcon: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: Platform.OS === 'ios' ? 0.35 : 0.15,
  },

  tabsOuter: {
    paddingHorizontal: 16,
    marginBottom: 10
  },
  tabsInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: 4,
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Platform.OS === 'ios' ? 24 : 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wheelCard: {
    alignItems: 'center'
  },
  brightnessCard: {},

  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: Platform.OS === 'ios' ? 1.2 : 0.5,
  },

  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#00FF88',
    borderRadius: 3,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  tempSliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  tempSliderFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  sliderThumb: {
    position: 'absolute',
    top: -10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  valueBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 60,
    alignItems: 'center',
  },
  valueText: {
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  presetsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    gap: 16
  },
  colorPreview: {
    alignItems: 'center',
  },
  bigSwatch: {
    width: 80,
    height: 80,
    borderRadius: Platform.OS === 'ios' ? 18 : 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tempPresetsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tempPreset: {
    width: 48,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tempPresetText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 56,
    height: 56,
    borderRadius: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  brightnessPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 16
  },
  colorInfo: {
    flex: 1,
  },
  colorValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  colorDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginTop: 2,
  },
});