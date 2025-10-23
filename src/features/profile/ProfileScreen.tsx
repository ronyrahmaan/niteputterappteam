import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SkyBackground } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { useNavigation } from '@react-navigation/native';
import { ProfileStackScreenProps } from '../../types/navigation';

const { width } = Dimensions.get('window');



export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { profile, updateProfile, referralData } = useProfileStore();
  const navigation = useNavigation<ProfileStackScreenProps<'ProfileMain'>['navigation']>();

  // Modern animation setup
  const fadeOpacity = useSharedValue(0);
  const slideY = useSharedValue(30);

  useEffect(() => {
    fadeOpacity.value = withSpring(1, { tension: 300, friction: 10 });
    slideY.value = withSpring(0, { tension: 300, friction: 10 });
  }, []);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatar: result.assets[0].uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logout();
          },
        },
      ]
    );
  };

  // Animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ translateY: slideY.value }],
  }));

  const ProfileStat = ({ label, value, icon, color }: {
    label: string;
    value: string;
    icon: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    iconColor = '#00FF88'
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.4)" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SkyBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Reanimated.View style={[styles.content, contentAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Manage your golf experience</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
              <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: profile?.avatar || 'https://via.placeholder.com/100x100/333/fff?text=👤'
                  }}
                  style={styles.avatar}
                />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.userName}>
                {user ? `${user.firstName} ${user.lastName}` : 'Golf Professional'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || 'pro@niteputter.com'}
              </Text>

              <View style={styles.membershipBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.badgeText}>Pro Member</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <ProfileStat
                label="Cups Connected"
                value={profile?.totalOrders?.toString() || '12'}
                icon="golf"
                color="#00FF88"
              />
              <ProfileStat
                label="Golf Handicap"
                value={profile?.golfHandicap?.toString() || '8.2'}
                icon="trophy"
                color="#FFD700"
              />
              <ProfileStat
                label="Rounds Played"
                value={referralData?.totalReferrals?.toString() || '47'}
                icon="analytics"
                color="#00D4FF"
              />
            </View>

            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.menuContainer}>
                <MenuItem
                  icon="person-circle"
                  title="Account Settings"
                  subtitle="Edit profile and preferences"
                  onPress={() => navigation.navigate('AccountSettings')}
                  iconColor="#00FF88"
                />
                <MenuItem
                  icon="card"
                  title="Payment Methods"
                  subtitle="Manage cards and billing"
                  onPress={() => navigation.navigate('PaymentMethods')}
                  iconColor="#00D4FF"
                />
                <MenuItem
                  icon="notifications"
                  title="Notifications"
                  subtitle="Customize your alerts"
                  onPress={() => {
                    Alert.alert('Coming Soon', 'Notification settings will be available in a future update.');
                  }}
                  iconColor="#FF9500"
                />
              </View>
            </View>

            {/* Golf Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Golf Features</Text>
              <View style={styles.menuContainer}>
                <MenuItem
                  icon="trophy"
                  title="Achievements"
                  subtitle="View your golf milestones"
                  onPress={() => {
                    Alert.alert('Coming Soon', 'Achievement tracking will be available in a future update.');
                  }}
                  iconColor="#FFD700"
                />
                <MenuItem
                  icon="analytics"
                  title="Game Statistics"
                  subtitle="Track your performance"
                  onPress={() => {
                    Alert.alert('Coming Soon', 'Game statistics will be available in a future update.');
                  }}
                  iconColor="#00D4FF"
                />
                <MenuItem
                  icon="people"
                  title="Referral Program"
                  subtitle="Invite friends and earn rewards"
                  onPress={() => navigation.navigate('Referrals')}
                  iconColor="#B347FF"
                />
              </View>
            </View>

            {/* Support Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Support</Text>
              <View style={styles.menuContainer}>
                <MenuItem
                  icon="help-circle"
                  title="Help & Support"
                  subtitle="FAQs and contact support"
                  onPress={() => navigation.navigate('HelpSupport')}
                  iconColor="#00FF88"
                />
                <MenuItem
                  icon="information-circle"
                  title="About"
                  subtitle="App version and legal info"
                  onPress={() => navigation.navigate('About')}
                  iconColor="#00D4FF"
                />
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out" size={20} color="#FF453A" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </Reanimated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  content: {
    padding: 20,
  },

  // Header
  header: {
    alignItems: 'center' as const,
    marginBottom: 32,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  title: {
    fontSize: Platform.OS === 'ios' ? 34 : 32,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '400',
  },

  // Profile Card
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 20 : 16,
    padding: 24,
    alignItems: 'center' as const,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00FF88',
  },
  avatarOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: '#00FF88',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#000000',
  },
  userName: {
    fontSize: 22,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center' as const,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center' as const,
  },
  membershipBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center' as const,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Menu
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    overflow: 'hidden' as const,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderRadius: Platform.OS === 'ios' ? 16 : 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#FF453A',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
};