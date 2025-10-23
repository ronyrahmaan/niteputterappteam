import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GolfNeonBackground, NitePutterLogo } from '../../components/ui';
import { WelcomeScreenProps } from '../../types/navigation';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

// Dimensions available if needed for responsive design
// const { width, height } = Dimensions.get('window');

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Netflix-style text animation values
  const textAnimValues = useRef(
    'NITEPUTTER'.split('').map(() => new Animated.Value(1))
  ).current;
  const textScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // iOS-style entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Text is immediately visible with curve
    // No animation needed for the curve to persist
  }, []);

  const handleLogin = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Add subtle button animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.navigate('Login');
  };

  const handleSignup = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Add subtle button animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    navigation.navigate('Signup');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Beautiful Neon Golf Background */}
      <GolfNeonBackground animated={true} />

      <SafeAreaView style={styles.content}>
        {/* Clean iOS Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <NitePutterLogo size={120} color="light" />
          </View>

          <View style={styles.titleContainer}>
            <Animated.View
              style={[
                styles.netflixTitleContainer,
                {
                  transform: [{ scale: textScaleAnim }],
                },
              ]}
            >
              <View style={styles.netflixContainer}>
                <View style={styles.lettersContainer}>
                  {'NITEPUTTER'.split('').map((letter, index) => {
                    // Create Netflix-style arc by positioning letters in a curve
                    const totalLetters = 10;
                    const centerIndex = (totalLetters - 1) / 2;
                    const distanceFromCenter = Math.abs(index - centerIndex);
                    // Create subtle Netflix-style arc curve
                    const arcHeight = distanceFromCenter * 1.5; // Much more subtle curve like Netflix

                    return (
                      <View
                        key={index}
                        style={{
                          transform: [{ translateY: arcHeight }],
                        }}
                      >
                        <Text
                          style={[
                            styles.netflixLetter,
                            index >= 4 && index <= 9 ? styles.netflixLetterShadow : null,
                          ]}
                        >
                          {letter}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
            <Text style={styles.subtitle}>
              Premium Golf Technology
            </Text>
          </View>
        </Animated.View>

        {/* iOS Action Buttons */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignup}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  titleCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    }),
  },
  netflixTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  netflixContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  lettersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  netflixLetter: {
    fontSize: 54,
    fontWeight: '900',
    color: '#00D4FF',
    letterSpacing: -2.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
    ...Platform.select({
      ios: {
        fontFamily: 'Impact',
        fontWeight: '900',
      },
      android: {
        fontFamily: 'sans-serif-condensed',
        fontWeight: '900',
      },
    }),
  },
  netflixLetterShadow: {
    color: '#0088CC',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
        fontWeight: '700',
      },
    }),
  },
  featuresSection: {
    paddingVertical: 40,
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  actionSection: {
    paddingBottom: 50,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
    }),
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 24,
    marginTop: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
        fontWeight: '400',
      },
    }),
  },
});