import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '../../lib/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  neonGlow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  neonGlow = false,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...(fullWidth && { width: '100%' }),
    };

    const sizeStyles = {
      sm: { paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[2] },
      md: { paddingHorizontal: theme.spacing[6], paddingVertical: theme.spacing[3] },
      lg: { paddingHorizontal: theme.spacing[8], paddingVertical: theme.spacing[4] },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...(neonGlow && theme.shadows.neon),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      sm: { fontSize: theme.typography.fontSize.sm },
      md: { fontSize: theme.typography.fontSize.base },
      lg: { fontSize: theme.typography.fontSize.lg },
    };

    const variantStyles = {
      primary: { color: theme.colors.text.inverse },
      secondary: { color: theme.colors.text.primary },
      outline: { color: theme.colors.neon.green },
      ghost: { color: theme.colors.neon.green },
    };

    return {
      fontWeight: theme.typography.fontWeight.semibold,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { color: theme.colors.text.disabled }),
    };
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.text.inverse : theme.colors.neon.green}
          style={{ marginRight: theme.spacing[2] }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: theme.borderRadius.lg },
            disabled && { opacity: 0.5 },
          ]}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    secondary: {
      backgroundColor: theme.colors.background.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.neon.green,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        getButtonStyle(),
        variantStyles[variant],
        disabled && { opacity: 0.5 },
        style,
      ]}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};