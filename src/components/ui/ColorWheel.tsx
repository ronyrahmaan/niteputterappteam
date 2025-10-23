import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, RadialGradient, Stop, Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface ColorWheelProps {
  size?: number;
  onColorChange?: (color: string) => void;
  initialColor?: string;
  disabled?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  thumbSize?: number;
  thumbStyle?: any;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  size = 200,
  onColorChange,
  initialColor = '#ff0000',
  disabled = false,
  onInteractionStart,
  onInteractionEnd,
  thumbSize = 24,
  thumbStyle = {},
}) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 30;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const lastColorRef = useRef<string>(initialColor);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert HSV to RGB
  const hsvToRgb = (h: number, s: number, v: number): string => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);

    return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
  };

  // Convert hex to position
  const hexToPosition = (hex: string): { x: number; y: number } => {
    const hexClean = hex.replace('#', '');
    const r = parseInt(hexClean.substring(0, 2), 16) / 255;
    const g = parseInt(hexClean.substring(2, 4), 16) / 255;
    const b = parseInt(hexClean.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let hue = 0;
    if (diff !== 0) {
      if (max === r) {
        hue = ((g - b) / diff) % 6;
      } else if (max === g) {
        hue = (b - r) / diff + 2;
      } else {
        hue = (r - g) / diff + 4;
      }
    }
    hue = (hue * 60 + 360) % 360;

    const saturation = max === 0 ? 0 : diff / max;
    const angle = (hue * Math.PI) / 180;
    const distance = saturation * radius;

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  // Update color with debouncing
  const updateColor = useCallback((color: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (lastColorRef.current !== color && onColorChange) {
        lastColorRef.current = color;
        onColorChange(color);
      }
    }, 16);
  }, [onColorChange]);

  // Calculate color from position
  const getColorFromPosition = useCallback((x: number, y: number): string => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > radius) return lastColorRef.current;

    const angle = Math.atan2(dy, dx);
    let hue = ((angle * 180) / Math.PI + 360) % 360;
    const saturation = Math.min(distance / radius, 1);

    return hsvToRgb(hue, saturation, 1);
  }, [centerX, centerY, radius]);

  // Handle touch events
  const handleTouch = useCallback((x: number, y: number) => {
    if (disabled) return;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let finalX = dx;
    let finalY = dy;

    // Constrain to circle
    if (distance > radius) {
      const angle = Math.atan2(dy, dx);
      finalX = Math.cos(angle) * radius;
      finalY = Math.sin(angle) * radius;
    }

    // Update position
    translateX.value = finalX;
    translateY.value = finalY;

    // Update color
    const color = getColorFromPosition(centerX + finalX, centerY + finalY);
    updateColor(color);
  }, [disabled, centerX, centerY, radius, updateColor, getColorFromPosition]);

  // Modern Gesture API handlers
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (disabled) return;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      if (onInteractionStart) runOnJS(onInteractionStart)();
      scale.value = withSpring(1.1);
    })
    .onUpdate((event) => {
      if (disabled) return;
      runOnJS(handleTouch)(event.x, event.y);
    })
    .onEnd(() => {
      if (disabled) return;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      if (onInteractionEnd) runOnJS(onInteractionEnd)();
      scale.value = withSpring(1);
    });

  const tapGesture = Gesture.Tap()
    .onStart((event) => {
      if (disabled) return;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      if (onInteractionStart) runOnJS(onInteractionStart)();
      scale.value = withSpring(1.1);
      runOnJS(handleTouch)(event.x, event.y);
    })
    .onEnd(() => {
      if (disabled) return;
      if (onInteractionEnd) runOnJS(onInteractionEnd)();
      scale.value = withSpring(1);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Initialize position from color
  useEffect(() => {
    const position = hexToPosition(initialColor);
    translateX.value = withSpring(position.x);
    translateY.value = withSpring(position.y);
    lastColorRef.current = initialColor;
  }, [initialColor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Animated styles
  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Color Wheel SVG */}
      <Svg width={size} height={size} style={styles.wheel}>
        <Defs>
          <RadialGradient id="saturationGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Color segments */}
        {Array.from({ length: 36 }, (_, i) => {
          const startAngle = (i * 10 * Math.PI) / 180;
          const endAngle = ((i + 1) * 10 * Math.PI) / 180;

          const x1 = centerX + Math.cos(startAngle) * 20;
          const y1 = centerY + Math.sin(startAngle) * 20;
          const x2 = centerX + Math.cos(endAngle) * 20;
          const y2 = centerY + Math.sin(endAngle) * 20;
          const x3 = centerX + Math.cos(endAngle) * radius;
          const y3 = centerY + Math.sin(endAngle) * radius;
          const x4 = centerX + Math.cos(startAngle) * radius;
          const y4 = centerY + Math.sin(startAngle) * radius;

          const hue = i * 10;
          const color = hsvToRgb(hue, 1, 1);

          const pathData = `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;

          return (
            <Path
              key={`segment-${i}`}
              d={pathData}
              fill={color}
            />
          );
        })}

        {/* Saturation overlay */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="url(#saturationGradient)"
        />
      </Svg>

      {/* Gesture detector with thumb */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.gestureArea}>
          {/* Color selector thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                marginTop: -thumbSize / 2,
                marginLeft: -thumbSize / 2,
              },
              thumbStyle,
              thumbAnimatedStyle,
            ]}
          >
            <View style={styles.thumbInner} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Disabled overlay */}
      {disabled && <View style={styles.disabledOverlay} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wheel: {
    position: 'absolute',
  },
  gestureArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 100,
  },
});