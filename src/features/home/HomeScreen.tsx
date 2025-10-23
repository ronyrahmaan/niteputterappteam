import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Card, SkyBackground } from '../../components/ui';
import { theme } from '../../lib/theme';
import { useHomeStore, useAuthStore } from '../../store';
import { formatRelativeTime } from '../../lib/utils/index';

const { width: screenWidth } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const {
    announcements,
    videos,
    fetchDashboardData,
    refreshDashboardData,
    markAnnouncementAsRead,
    markVideoAsWatched,
  } = useHomeStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnims = useRef(Array(10).fill(0).map(() => new Animated.Value(1))).current;
  const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();

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
  }, []);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);

    try {
      await refreshDashboardData();
    } finally {
      setTimeout(() => {
        setRefreshing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 600);
    }
  }, [refreshDashboardData]);

  const handleAnnouncementPress = useCallback((announcementId: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(scaleAnims[index], {
        toValue: 0.98,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    markAnnouncementAsRead(announcementId);
  }, [scaleAnims, markAnnouncementAsRead]);

  const handleVideoPress = useCallback((videoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markVideoAsWatched(videoId);
  }, [markVideoAsWatched]);




  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const unreadAnnouncements = announcements.filter(a => !a.isRead);
  const unwatchedVideos = videos.filter(v => !v.isWatched);
  const totalCoursesPlayed = 12; // This could come from user stats
  const achievementLevel = 'Pro'; // This could come from user profile

  return (
    <View style={styles.container}>
      {/* Beautiful iOS-style Sky Background */}
      <SkyBackground animated={true} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          bouncesZoom={false}
          alwaysBounceVertical={true}
          decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.98}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={'#00D4FF'}
              colors={['#00D4FF']}
              progressBackgroundColor={'rgba(30, 30, 46, 0.8)'}
              titleColor={'#FFFFFF'}
              title={'Pull to refresh'}
            />
          }
        >
          {/* Clean spacer for status bar */}
          <View style={styles.headerSpacer} />

          {/* Welcome Hero Section */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.heroCard}>
              <Text style={styles.welcomeText}>
                {getGreeting()}, {user?.firstName || 'Golfer'}
              </Text>
              <Text style={styles.heroSubtext}>
                Your golf lighting control center
              </Text>
              <TouchableOpacity style={styles.quickActionButton}>
                <Text style={styles.quickActionText}>Connect Devices</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Quick Stats Grid */}
          <Animated.View
            style={[
              styles.statsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <TouchableOpacity style={styles.statCard}>
                <Text style={styles.statNumber}>{totalCoursesPlayed}</Text>
                <Text style={styles.statLabel}>Rounds Played</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statCard}>
                <Text style={styles.statNumber}>{unreadAnnouncements.length}</Text>
                <Text style={styles.statLabel}>New Updates</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statCard}>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Connection</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statCard}>
                <Text style={styles.statNumber}>{achievementLevel}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Latest Updates Section */}
          <Animated.View
            style={[
              styles.updatesSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Updates</Text>
              {unreadAnnouncements.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadAnnouncements.length}</Text>
                </View>
              )}
            </View>

            <View style={styles.updatesContainer}>
              {announcements.slice(0, 2).map((announcement, index) => (
                <TouchableOpacity
                  key={announcement.id}
                  onPress={() => handleAnnouncementPress(announcement.id, index)}
                  style={styles.updateCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.updateIcon}>
                    <Ionicons name="notifications" size={20} color="#00FF88" />
                  </View>
                  <View style={styles.updateContent}>
                    <Text style={styles.updateTitle} numberOfLines={1}>
                      {announcement.title}
                    </Text>
                    <Text style={styles.updateDescription} numberOfLines={2}>
                      {announcement.message}
                    </Text>
                    <Text style={styles.updateTime}>
                      {formatRelativeTime(announcement.createdAt)}
                    </Text>
                  </View>
                  {!announcement.isRead && <View style={styles.newDot} />}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Training & Development Section */}
          <Animated.View
            style={[
              styles.videosSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Training & Development</Text>
              {unwatchedVideos.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unwatchedVideos.length}</Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.videosContainer}
            >
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  onPress={() => handleVideoPress(video.id)}
                  style={styles.videoCard}
                >
                  <View style={styles.videoCardInner}>
                    <View style={styles.videoThumbnail}>
                      <Image
                        source={{ uri: video.thumbnailUrl }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                      <View style={styles.playButton}>
                        <Ionicons name="play" size={16} color="#00FF88" />
                      </View>
                      {!video.isWatched && <View style={styles.newVideoBadge} />}
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={styles.videoDuration}>{video.duration}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerSpacer: {
    height: 20,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroCard: {
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  heroSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  quickActionButton: {
    backgroundColor: '#00FF88',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (screenWidth - 40 - 12) / 2,
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00FF88',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  updatesSection: {
    marginBottom: 32,
  },
  updatesContainer: {
    gap: 12,
  },
  updateCard: {
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  updateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  updateDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  updateTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  newDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  videosSection: {
    marginBottom: 32,
  },
  videosContainer: {
    paddingRight: 20,
  },
  videoCard: {
    marginRight: 16,
    width: 200,
  },
  videoCardInner: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  videoThumbnail: {
    position: 'relative',
    height: 120,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  newVideoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.1,
  },
  videoDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  badge: {
    backgroundColor: '#00D4FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.2,
  },
});