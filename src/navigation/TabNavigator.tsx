import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../features/home/HomeScreen';
import { ShopScreen } from '../features/shop/ShopScreen';
import { ProductDetailScreen } from '../features/shop/ProductDetailScreen';
import { CartScreen } from '../features/shop/CartScreen';
import { CheckoutScreen } from '../features/shop/CheckoutScreen';
import { NiteControlScreen } from '../features/niteControl/NiteControlScreen';
import { MultiCupControlScreen } from '../features/niteControl/MultiCupControlScreen';
import { ColorWheelScreen } from '../features/niteControl/ColorWheelScreen';
import QrScanScreen from '../features/niteControl/QrScanScreen';
import { ComprehensiveProtocolLabScreen } from '../features/protocolLab/ComprehensiveProtocolLabScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { ReferralsScreen } from '../features/profile/ReferralsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { AccountSettingsScreen } from '../features/settings/AccountSettingsScreen';
import { PaymentMethodsScreen } from '../features/settings/PaymentMethodsScreen';
import { AboutScreen } from '../features/about/AboutScreen';
import { HelpSupportScreen } from '../features/support/HelpSupportScreen';
import { theme } from '../lib/theme';
import { TabParamList, ShopStackParamList, NiteControlStackParamList, ProtocolLabStackParamList, ProfileStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<TabParamList>();
const ShopStack = createStackNavigator<ShopStackParamList>();
const NiteControlStack = createStackNavigator<NiteControlStackParamList>();
const ProtocolLabStack = createStackNavigator<ProtocolLabStackParamList>();
const ProfileStackNavigator = createStackNavigator<ProfileStackParamList>();

interface TabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  size?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, iconName, size = 24 }) => (
  <View style={styles.tabIcon}>
    <Ionicons
      name={iconName}
      size={size}
      color={focused ? '#00FF88' : 'rgba(255, 255, 255, 0.6)'}
      style={focused ? styles.tabIconFocused : {}}
    />
  </View>
);

// Shop Stack Navigator
const ShopStackComponent = () => {
  return (
    <ShopStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ShopStack.Screen
        name="ShopMain"
        component={ShopScreen}
        options={{
          headerShown: false,
          title: 'Shop'
        }}
      />
      <ShopStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: 'Product Details',
          headerBackTitle: ''
        }}
      />
      <ShopStack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          headerBackTitle: ''
        }}
      />
      <ShopStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: false
        }}
      />
    </ShopStack.Navigator>
  );
};

// NiteControl Stack Navigator
const NiteControlStackComponent = () => {
  return (
    <NiteControlStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <NiteControlStack.Screen
        name="NiteControlMain"
        component={NiteControlScreen}
        options={{ headerShown: false }}
      />
      <NiteControlStack.Screen
        name="MultiCupControl"
        component={MultiCupControlScreen}
        options={{ headerShown: false }}
      />
      <NiteControlStack.Screen 
        name="ColorWheel" 
        component={ColorWheelScreen} 
        options={{ headerShown: false }}
      />
      <NiteControlStack.Screen
        name="QrScan"
        component={QrScanScreen}
        options={{ headerShown: false }}
      />
    </NiteControlStack.Navigator>
  );
};

// Protocol Lab Stack Navigator
const ProtocolLabStackComponent = () => {
  return (
    <ProtocolLabStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProtocolLabStack.Screen
        name="ProtocolLabMain"
        component={ComprehensiveProtocolLabScreen}
        options={{ headerShown: false }}
      />
    </ProtocolLabStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStack = () => {
  return (
    <ProfileStackNavigator.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProfileStackNavigator.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
      <ProfileStackNavigator.Screen 
        name="Referrals" 
        component={ReferralsScreen} 
        options={{ title: 'Referral Program' }}
      />
      <ProfileStackNavigator.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <ProfileStackNavigator.Screen 
        name="AccountSettings" 
        component={AccountSettingsScreen} 
        options={{ title: 'Account Settings' }}
      />
      <ProfileStackNavigator.Screen 
        name="PaymentMethods" 
        component={PaymentMethodsScreen} 
        options={{ title: 'Payment Methods' }}
      />
      <ProfileStackNavigator.Screen 
        name="About" 
        component={AboutScreen} 
        options={{ title: 'About' }}
      />
      <ProfileStackNavigator.Screen 
        name="HelpSupport" 
        component={HelpSupportScreen} 
        options={{ title: 'Help & Support' }}
      />
    </ProfileStackNavigator.Navigator>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
        ),
        tabBarActiveTintColor: '#00FF88',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="home" />
          ),
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopStackComponent}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="bag" />
          ),
        }}
      />
      <Tab.Screen
        name="NiteControl"
        component={NiteControlStackComponent}
        options={{
          title: 'Control',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="game-controller" />
          ),
        }}
      />
      <Tab.Screen
        name="ProtocolLab"
        component={ProtocolLabStackComponent}
        options={{
          title: 'Lab',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="flask" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="person" />
          ),
        }}
      />

    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 88 : 70,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
  },
  tabBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    backdropFilter: 'blur(20px)',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: Platform.OS === 'ios' ? 2 : 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.1,
  },
  tabBarItem: {
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 4 : 2,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    marginBottom: 2,
  },
  tabIconFocused: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});