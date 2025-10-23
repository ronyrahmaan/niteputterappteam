import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Switch, SkyBackground } from '../../components/ui';
import { theme } from '../../lib/theme';
import { useAuthStore } from '../../store';
import { validateEmail, validatePassword } from '../../lib/utils';
import { SignupScreenProps } from '../../types/navigation';

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  const { signup, isLoading, error, clearError } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Clear any existing errors
    clearError();
    
    // Entrance animation with reduced duration to minimize conflicts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Signup Failed', error);
    }
  }, [error]);

  // Ultra-stable form handlers for Android - no dependencies at all
  const handleFirstNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, firstName: value }));
    setErrors(prev => prev.firstName ? { ...prev, firstName: '' } : prev);
  }, []);

  const handleLastNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, lastName: value }));
    setErrors(prev => prev.lastName ? { ...prev, lastName: '' } : prev);
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
    setErrors(prev => prev.email ? { ...prev, email: '' } : prev);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    setErrors(prev => prev.password ? { ...prev, password: '' } : prev);
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    setErrors(prev => prev.confirmPassword ? { ...prev, confirmPassword: '' } : prev);
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
      isValid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    if (!acceptTerms) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service to continue');
      return;
    }

    try {
      await signup(
        formData.email.trim(),
        formData.password,
        formData.firstName.trim(),
        formData.lastName.trim()
      );
      // Navigation will be handled by the auth state change
    } catch (err) {
      // Error is handled by the store and useEffect
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTermsPress = () => {
    // Navigate to terms screen or open modal
    Alert.alert('Terms of Service', 'Terms of Service content would be displayed here.');
  };

  const handlePrivacyPress = () => {
    // Navigate to privacy screen or open modal
    Alert.alert('Privacy Policy', 'Privacy Policy content would be displayed here.');
  };

  return (
    <View style={styles.container}>
      {/* Beautiful iOS-style Sky Background */}
      <SkyBackground animated={true} />

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
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>
                Join the Nite Putter community and start your glow golf journey
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View collapsable={false} style={styles.form}>
              <View style={styles.nameRow}>
                <Input
                  label="First Name"
                  placeholder="First name"
                  value={formData.firstName}
                  onChangeText={handleFirstNameChange}
                  error={errors.firstName}
                  autoCapitalize="words"
                  style={[styles.input, styles.nameInput]}
                />
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChangeText={handleLastNameChange}
                  error={errors.lastName}
                  autoCapitalize="words"
                  style={[styles.input, styles.nameInput]}
                />
              </View>

              <Input
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={handleEmailChange}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={handlePasswordChange}
                error={errors.password}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye' : 'eye-off'}
                onRightIconPress={() => setShowPassword(!showPassword)}
                style={styles.input}
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                error={errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                rightIcon={showConfirmPassword ? 'eye' : 'eye-off'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.input}
              />

              {/* Terms and Marketing */}
              <View style={styles.checkboxContainer}>
                <View style={styles.checkboxRow}>
                  <Switch
                    value={acceptTerms}
                    onValueChange={setAcceptTerms}
                    size="sm"
                  />
                  <View style={styles.checkboxText}>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>I agree to the </Text>
                      <TouchableOpacity onPress={handleTermsPress}>
                        <Text style={styles.linkText}>Terms of Service</Text>
                      </TouchableOpacity>
                      <Text style={styles.termsText}> and </Text>
                      <TouchableOpacity onPress={handlePrivacyPress}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.checkboxRow}>
                  <Switch
                    value={acceptMarketing}
                    onValueChange={setAcceptMarketing}
                    size="sm"
                  />
                  <View style={styles.checkboxText}>
                    <Text style={styles.termsText}>
                      I'd like to receive marketing emails about new products and features
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSignup}
                disabled={isLoading}
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              >
                <Text style={styles.signupButtonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink} onPress={handleLogin}>
                  Sign in
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
    marginBottom: 40,
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
  nameRow: {
    flexDirection: 'row',
    gap: 16,
  },
  nameInput: {
    flex: 1,
  },
  input: {
    marginBottom: 20,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 12,
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    lineHeight: 20,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0,
  },
  signupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  signupButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});