import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  style?: ViewStyle | ViewStyle[];
  inputStyle?: TextStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = true,
  style,
  inputStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Stable focus handlers to prevent re-renders on Android
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Stable change handler to prevent Android input issues
  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
  }, [onChangeText]);

  const containerStyle: ViewStyle = useMemo(() => ({
    marginBottom: theme.spacing[4],
    ...(Array.isArray(style) ? StyleSheet.flatten(style) : style),
  }), [style]);

  const inputContainerStyle: ViewStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: error
      ? theme.colors.status.error
      : isFocused
      ? theme.colors.neon.green
      : theme.colors.border.primary,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    // Removed shadow and elevation on focus to prevent Android flicker
  }), [error, isFocused, multiline]);

  const textInputStyle: TextStyle = {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.normal,
    ...(multiline && {
      minHeight: numberOfLines * 20,
      textAlignVertical: 'top',
    }),
    ...inputStyle,
  };

  const labelStyle: TextStyle = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  };

  const errorStyle: TextStyle = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
    marginTop: theme.spacing[1],
    fontWeight: theme.typography.fontWeight.medium,
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={labelStyle}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={theme.colors.text.tertiary}
            style={{ marginRight: theme.spacing[3] }}
          />
        )}
        
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={textInputStyle}
          multiline={multiline}
          numberOfLines={numberOfLines}
          // Android-specific props to prevent input issues
          {...(Platform.OS === 'android' && {
            underlineColorAndroid: 'transparent',
            textAlignVertical: multiline ? 'top' : 'auto',
            blurOnSubmit: !multiline,
            returnKeyType: multiline ? 'default' : 'next',
            disableFullscreenUI: true,
          })}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={{ marginLeft: theme.spacing[3] }}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
};

// Enhanced memo comparison to prevent unnecessary re-renders, especially on Android
const arePropsEqual = (prevProps: InputProps, nextProps: InputProps) => {
  // For Android, we're more strict about preventing re-renders
  const basicPropsEqual = (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.label === nextProps.label &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.secureTextEntry === nextProps.secureTextEntry
  );

  // On Android, we only re-render if basic props change, ignoring function references
  if (Platform.OS === 'android') {
    return basicPropsEqual;
  }

  // On other platforms, include function comparison
  return basicPropsEqual && prevProps.onChangeText === nextProps.onChangeText;
};

export const Input = React.memo(InputComponent, arePropsEqual);