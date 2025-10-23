import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Body } from '../components/ui/Typography';
import { theme } from '../lib/theme';
import { useAuthStore } from '../store';
import { TabNavigator } from './TabNavigator';
import {
  WelcomeScreen,
  LoginScreen,
  SignupScreen,
  ResetPasswordScreen,
} from '../features/auth';
import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <LinearGradient
      colors={[theme.colors.background.primary, theme.colors.background.secondary]}
      style={styles.loadingGradient}
    />
    <Body style={styles.loadingText}>Loading...</Body>
  </View>
);

// Auth Stack Navigator
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: 'transparent' },
      cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
          opacity: current.progress,
        },
      }),
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

// Main App Stack Navigator
const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="MainTabs" component={TabNavigator} />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    // Initialize auth state - check for stored tokens, etc.
    // This would typically involve checking AsyncStorage for tokens
    // and validating them with the backend
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.neon.blue,
          background: theme.colors.background.primary,
          card: theme.colors.background.secondary,
          text: theme.colors.text.primary,
          border: theme.colors.border.primary,
          notification: theme.colors.neon.green,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: 'bold',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      {isAuthenticated && user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});