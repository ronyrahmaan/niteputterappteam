import React from 'react';
import { Text, TextStyle } from 'react-native';
import { theme } from '../../lib/theme';

interface TypographyProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  color?: keyof typeof theme.colors.text | string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  onPress?: () => void;
}

const createTypographyComponent = (
  defaultStyle: TextStyle
) => {
  return React.forwardRef<Text, TypographyProps>(
    ({ children, style, color, align, numberOfLines, onPress }, ref) => {
      const textColor = color
        ? typeof color === 'string' && color.startsWith('#')
          ? color
          : theme.colors.text[color as keyof typeof theme.colors.text] || color
        : defaultStyle.color;

      const textStyle: TextStyle = {
        ...defaultStyle,
        color: textColor,
        textAlign: align,
        ...(Array.isArray(style) ? Object.assign({}, ...style) : style),
      };

      return (
        <Text
          ref={ref}
          style={textStyle}
          numberOfLines={numberOfLines}
          onPress={onPress}
        >
          {children}
        </Text>
      );
    }
  );
};

export const Heading1 = createTypographyComponent({
  fontSize: theme.typography.fontSize['5xl'],
  fontWeight: theme.typography.fontWeight.bold,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize['5xl'],
});

export const Heading2 = createTypographyComponent({
  fontSize: theme.typography.fontSize['4xl'],
  fontWeight: theme.typography.fontWeight.bold,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize['4xl'],
});

export const Heading3 = createTypographyComponent({
  fontSize: theme.typography.fontSize['3xl'],
  fontWeight: theme.typography.fontWeight.semibold,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize['3xl'],
});

export const Heading4 = createTypographyComponent({
  fontSize: theme.typography.fontSize['2xl'],
  fontWeight: theme.typography.fontWeight.semibold,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize['2xl'],
});

export const Heading5 = createTypographyComponent({
  fontSize: theme.typography.fontSize.xl,
  fontWeight: theme.typography.fontWeight.medium,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xl,
});

export const Heading6 = createTypographyComponent({
  fontSize: theme.typography.fontSize.lg,
  fontWeight: theme.typography.fontWeight.medium,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.lg,
});

export const BodyLarge = createTypographyComponent({
  fontSize: theme.typography.fontSize.lg,
  fontWeight: theme.typography.fontWeight.normal,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.lg,
});

export const Body = createTypographyComponent({
  fontSize: theme.typography.fontSize.base,
  fontWeight: theme.typography.fontWeight.normal,
  color: theme.colors.text.primary,
  lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
});

export const BodySmall = createTypographyComponent({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeight.normal,
  color: theme.colors.text.secondary,
  lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
});

export const Caption = createTypographyComponent({
  fontSize: theme.typography.fontSize.xs,
  fontWeight: theme.typography.fontWeight.normal,
  color: theme.colors.text.tertiary,
  lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xs,
});

export const Label = createTypographyComponent({
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeight.medium,
  color: theme.colors.text.secondary,
  lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
});

export const NeonText = createTypographyComponent({
  fontSize: theme.typography.fontSize.base,
  fontWeight: theme.typography.fontWeight.semibold,
  color: theme.colors.neon.green,
  textShadowColor: theme.colors.neon.green,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 10,
});