import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, SkyBackground } from '../../components/ui';
import { Text } from 'react-native';
import { theme } from '../../lib/theme';
import { useAuthStore } from '../../store';
import { validateEmail } from '../../lib/utils';
import { ResetPasswordScreenProps } from '../../types/navigation';

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Clear any existing errors
    clearError();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Reset Failed', error);
    }
  }, [error]);

  useEffect(() => {
    if (isSubmitted) {
      // Success animation
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isSubmitted]);

  const validateForm = (): boolean => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      await resetPassword(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by the store and useEffect
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleResendEmail = async () => {
    if (!validateForm()) return;

    try {
      await resetPassword(email.trim());
      Alert.alert('Email Sent', 'Password reset email has been sent again.');
    } catch (err) {
      // Error is handled by the store and useEffect
    }
  };

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            theme.colors.background.primary,
            theme.colors.background.secondary,
          ]}
          style={styles.backgroundGradient}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContainer}>
            <Animated.View
              style={[
                styles.successContent,
                {
                  opacity: successAnim,
                  transform: [
                    {
                      scale: successAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Success Icon */}
              <View style={styles.successIcon}>
                <Body style={styles.successEmoji}>📧</Body>
              </View>

              <Heading2 style={styles.successTitle}>Check Your Email</Heading2>
              
              <Body style={styles.successMessage}>
                We've sent a password reset link to:
              </Body>
              
              <Body style={styles.emailDisplay}>{email}</Body>
              
              <BodySmall style={styles.successInstructions}>
                Click the link in the email to reset your password. 
                If you don't see it, check your spam folder.
              </BodySmall>

              <View style={styles.successActions}>
                <Button
                  title="Back to Sign In"
                  variant="primary"
                  size="lg"
                  onPress={handleBackToLogin}
                  style={styles.actionButton}
                />

                <Button
                  title="Resend Email"
                  variant="outline"
                  size="md"
                  onPress={handleResendEmail}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.actionButton}
                />
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SkyBackground />
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={false}
      >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </View>

            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Reset Password</Text>
              <Text style={styles.welcomeSubtitle}>
                Enter your email address and we'll send you a link to reset your password
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isLoading}
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              >
                <Text style={styles.resetButtonText}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.helpText}>
                Remember your password?{' '}
                <Text style={styles.helpLink} onPress={handleBackToLogin}>
                  Sign in instead
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    marginLeft: -8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backIcon: {
    color: '#007AFF',
    fontSize: 24,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginRight: 4,
  },
  backText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  welcomeSection: {
    marginBottom: 48,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.5,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
    backdropFilter: 'blur(20px)',
  },
  form: {
    marginBottom: 0,
  },
  input: {
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  resetButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  helpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  helpLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neon.green + '20',
    borderWidth: 2,
    borderColor: theme.colors.neon.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  successEmoji: {
    fontSize: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emailDisplay: {
    fontSize: 16,
    color: theme.colors.neon.green,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  successInstructions: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  successActions: {
    width: '100%',
    gap: theme.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});