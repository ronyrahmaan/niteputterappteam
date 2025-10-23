import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../lib/theme';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  label,
  disabled = false,
  size = 'md',
  style,
  labelStyle,
}) => {
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 150,
      friction: 8,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onValueChange(!value);
    }
  };

  const sizes = {
    sm: { width: 44, height: 26, thumbSize: 22 },
    md: { width: 50, height: 30, thumbSize: 26 },
    lg: { width: 56, height: 34, thumbSize: 30 },
  };

  const { width, height, thumbSize } = sizes[size];

  const trackStyle = {
    backgroundColor: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(60, 60, 67, 0.16)', '#00FF88'],
    }),
    width,
    height,
    borderRadius: height / 2,
    justifyContent: 'center' as const,
    padding: 2,
    opacity: disabled ? 0.5 : 1,
    borderWidth: value ? 0 : 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  };

  const thumbStyle = {
    transform: [
      {
        translateX: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, width - thumbSize - 4],
        }),
      },
    ],
    width: thumbSize,
    height: thumbSize,
    borderRadius: thumbSize / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    ...style,
  };

  const textStyle: TextStyle = {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[3],
    ...labelStyle,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={containerStyle}
      activeOpacity={0.8}
    >
      <Animated.View style={trackStyle}>
        <Animated.View style={thumbStyle} />
      </Animated.View>
      {label && <Text style={textStyle}>{label}</Text>}
    </TouchableOpacity>
  );
};