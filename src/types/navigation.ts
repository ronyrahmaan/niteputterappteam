import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root Stack Navigator Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ResetPassword: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
};

// Tab Navigator Types
export type TabParamList = {
  Home: undefined;
  Shop: NavigatorScreenParams<ShopStackParamList>;
  NiteControl: NavigatorScreenParams<NiteControlStackParamList>;
  ProtocolLab: NavigatorScreenParams<ProtocolLabStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Shop Stack Navigator Types
export type ShopStackParamList = {
  ShopMain: undefined;
  ProductDetail: {
    productId: string;
  };
  Cart: undefined;
  Checkout: undefined;
};

// NiteControl Stack Navigator Types
export type NiteControlStackParamList = {
  NiteControlMain: undefined;
  MultiCupControl: undefined;
  ColorWheel: {
    cupId: string;
    cupName: string;
    currentColor: string;
  };
  QrScan: undefined;
};

// Protocol Lab Stack Navigator Types
export type ProtocolLabStackParamList = {
  ProtocolLabMain: undefined;
};

// Profile Stack Navigator Types
export type ProfileStackParamList = {
  ProfileMain: undefined;
  Referrals: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  PaymentMethods: undefined;
  About: undefined;
  HelpSupport: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  T
>;

export type ShopStackScreenProps<T extends keyof ShopStackParamList> = StackScreenProps<
  ShopStackParamList,
  T
>;

export type NiteControlStackScreenProps<T extends keyof NiteControlStackParamList> = StackScreenProps<
  NiteControlStackParamList,
  T
>;

export type ProtocolLabStackScreenProps<T extends keyof ProtocolLabStackParamList> = StackScreenProps<
  ProtocolLabStackParamList,
  T
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = StackScreenProps<
  ProfileStackParamList,
  T
>;

// Navigation Props for Screens
export type WelcomeScreenProps = RootStackScreenProps<'Welcome'>;
export type LoginScreenProps = RootStackScreenProps<'Login'>;
export type SignupScreenProps = RootStackScreenProps<'Signup'>;
export type ResetPasswordScreenProps = RootStackScreenProps<'ResetPassword'>;

export type HomeScreenProps = TabScreenProps<'Home'>;
export type NiteControlScreenProps = NiteControlStackScreenProps<'NiteControlMain'>;
export type MultiCupControlScreenProps = NiteControlStackScreenProps<'MultiCupControl'>;
export type ColorWheelScreenProps = NiteControlStackScreenProps<'ColorWheel'>;
export type QrScanScreenProps = NiteControlStackScreenProps<'QrScan'>;
export type ProtocolLabScreenProps = ProtocolLabStackScreenProps<'ProtocolLabMain'>;

export type ShopScreenProps = ShopStackScreenProps<'ShopMain'>;
export type ProductDetailScreenProps = ShopStackScreenProps<'ProductDetail'>;
export type CartScreenProps = ShopStackScreenProps<'Cart'>;
export type CheckoutScreenProps = ShopStackScreenProps<'Checkout'>;

export type ProfileScreenProps = ProfileStackScreenProps<'ProfileMain'>;
export type ReferralsScreenProps = ProfileStackScreenProps<'Referrals'>;
export type SettingsScreenProps = ProfileStackScreenProps<'Settings'>;
export type AccountSettingsScreenProps = ProfileStackScreenProps<'AccountSettings'>;
export type PaymentMethodsScreenProps = ProfileStackScreenProps<'PaymentMethods'>;
export type AboutScreenProps = ProfileStackScreenProps<'About'>;
export type HelpSupportScreenProps = ProfileStackScreenProps<'HelpSupport'>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}