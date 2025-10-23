import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ProfileStackScreenProps } from '../../types/navigation';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useSettingsStore } from '../../store/settingsStore';
import { Switch } from '../../components/ui/Switch';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<ProfileStackScreenProps<'Settings'>['navigation']>();
  const {
    settings,
    updateSettings,
    resetSettings,
  } = useSettingsStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleResetSettings = () => {
    resetSettings();
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    type = 'switch',
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean | string;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button' | 'info';
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={type === 'switch' || type === 'info'}
      activeOpacity={type === 'button' ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={icon as any} size={20} color={theme.colors.neon.blue} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {type === 'switch' && (
          <Switch
            value={value as boolean}
            onValueChange={(newValue) => {
              onValueChange?.(newValue);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        )}
        {type === 'button' && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        )}
        {type === 'info' && (
          <Text style={styles.settingValue}>{value as string}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Settings</Text>
            </View>

            {/* Game Settings */}
            <SettingSection title="Game Settings">
              <SettingItem
                icon="golf"
                title="Auto-Save Games"
                subtitle="Automatically save game progress"
                value={settings.autoSaveGames}
                onValueChange={(value) => updateSettings({ autoSaveGames: value })}
              />
              
              <SettingItem
                icon="speedometer"
                title="Show Performance Stats"
                subtitle="Display detailed game statistics"
                value={settings.showPerformanceStats}
                onValueChange={(value) => updateSettings({ showPerformanceStats: value })}
              />
              
              <SettingItem
                icon="trophy"
                title="Achievement Notifications"
                subtitle="Get notified when you unlock achievements"
                value={settings.achievementNotifications}
                onValueChange={(value) => updateSettings({ achievementNotifications: value })}
              />
            </SettingSection>

            {/* Nite Cup Settings */}
            <SettingSection title="Nite Cup">
              <SettingItem
                icon="bluetooth"
                title="Auto-Connect"
                subtitle="Automatically connect to nearby Nite Cup"
                value={settings.autoConnectCup}
                onValueChange={(value) => updateSettings({ autoConnectCup: value })}
              />
              
              <SettingItem
                icon="flash"
                title="Smart Lighting"
                subtitle="Adjust cup brightness based on ambient light"
                value={settings.smartLighting}
                onValueChange={(value) => updateSettings({ smartLighting: value })}
              />
              
              <SettingItem
                icon="battery-charging"
                title="Battery Alerts"
                subtitle="Notify when cup battery is low"
                value={settings.batteryAlerts}
                onValueChange={(value) => updateSettings({ batteryAlerts: value })}
              />
            </SettingSection>

            {/* Notifications */}
            <SettingSection title="Notifications">
              <SettingItem
                icon="notifications"
                title="Push Notifications"
                subtitle="Receive app notifications"
                value={settings.pushNotifications}
                onValueChange={(value) => updateSettings({ pushNotifications: value })}
              />
              
              <SettingItem
                icon="mail"
                title="Email Updates"
                subtitle="Get updates via email"
                value={settings.emailUpdates}
                onValueChange={(value) => updateSettings({ emailUpdates: value })}
              />
              
              <SettingItem
                icon="megaphone"
                title="Marketing Communications"
                subtitle="Receive promotional content"
                value={settings.marketingCommunications}
                onValueChange={(value) => updateSettings({ marketingCommunications: value })}
              />
            </SettingSection>

            {/* Privacy & Security */}
            <SettingSection title="Privacy & Security">
              <SettingItem
                icon="analytics"
                title="Usage Analytics"
                subtitle="Help improve the app by sharing usage data"
                value={settings.usageAnalytics}
                onValueChange={(value) => updateSettings({ usageAnalytics: value })}
              />
              
              <SettingItem
                icon="location"
                title="Location Services"
                subtitle="Allow location access for course features"
                value={settings.locationServices}
                onValueChange={(value) => updateSettings({ locationServices: value })}
              />
              
              <SettingItem
                icon="shield-checkmark"
                title="Biometric Authentication"
                subtitle="Use fingerprint or face ID"
                value={settings.biometricAuth}
                onValueChange={(value) => updateSettings({ biometricAuth: value })}
              />
            </SettingSection>

            {/* App Preferences */}
            <SettingSection title="App Preferences">
              <SettingItem
                icon="moon"
                title="Dark Mode"
                subtitle="Use dark theme"
                value={settings.darkMode}
                onValueChange={(value) => updateSettings({ darkMode: value })}
              />
              
              <SettingItem
                icon="volume-high"
                title="Sound Effects"
                subtitle="Play app sounds and haptics"
                value={settings.soundEffects}
                onValueChange={(value) => updateSettings({ soundEffects: value })}
              />
              
              <SettingItem
                icon="language"
                title="Language"
                subtitle="App language"
                value={settings.language}
                type="button"
                onPress={() => {}}
              />
              
              <SettingItem
                icon="resize"
                title="Units"
                subtitle="Distance and measurement units"
                value={settings.units}
                type="button"
                onPress={() => {}}
              />
            </SettingSection>

            {/* About */}
            <SettingSection title="About">
              <SettingItem
                icon="information-circle"
                title="App Version"
                value="1.0.0"
                type="info"
              />
              
              <SettingItem
                icon="document-text"
                title="Terms of Service"
                type="button"
                onPress={() => {}}
              />
              
              <SettingItem
                icon="shield"
                title="Privacy Policy"
                type="button"
                onPress={() => {}}
              />
              
              <SettingItem
                icon="help-circle"
                title="Help & Support"
                type="button"
                onPress={() => navigation.navigate('HelpSupport')}
              />
            </SettingSection>

            {/* Reset Button */}
            <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
              <LinearGradient
                colors={[theme.colors.warning.primary, theme.colors.warning.secondary]}
                style={styles.resetGradient}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.text.primary} />
                <Text style={styles.resetText}>Reset All Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[4],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  sectionContent: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden' as const,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  settingLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: theme.spacing[3],
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  settingSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[0.5],
  },
  settingRight: {
    alignItems: 'center' as const,
  },
  settingValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  resetButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden' as const,
    marginBottom: theme.spacing[4],
  },
  resetGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: theme.spacing[4],
  },
  resetText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[2],
  },
};