import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'gradient';
  padding?: keyof typeof theme.spacing;
  neonBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 4,
  neonBorder = false,
}) => {
  const baseStyle: ViewStyle = {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[padding],
    ...theme.shadows.base,
  };

  const variantStyles = {
    default: {
      backgroundColor: theme.colors.background.card,
      borderWidth: 1,
      borderColor: theme.colors.border.primary,
    },
    glass: {
      backgroundColor: theme.colors.glass.background,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      backdropFilter: 'blur(10px)',
    },
    gradient: {},
  };

  const neonBorderStyle: ViewStyle = neonBorder
    ? {
        borderWidth: 2,
        borderColor: theme.colors.neon.green,
        ...theme.shadows.neon,
      }
    : {};

  if (variant === 'gradient') {
    return (
      <View style={[baseStyle, neonBorderStyle, style]}>
        <LinearGradient
          colors={theme.colors.gradients.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: theme.borderRadius.xl,
          }}
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[baseStyle, variantStyles[variant], neonBorderStyle, style]}>
      {children}
    </View>
  );
};