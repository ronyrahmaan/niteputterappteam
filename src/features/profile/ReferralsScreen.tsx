import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore } from '../../store/profileStore';
import { ReferralsScreenProps } from '../../types/navigation';

export const ReferralsScreen = ({}: ReferralsScreenProps) => {
  const { referralData, referrals, isLoading, fetchReferralData, sendReferralInvite, setRewardPreference, setCustomReferralCode } = useProfileStore();
  
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(30));
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [customCode, setCustomCode] = useState(referralData?.referralCode || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchReferralData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCopyLink = async () => {
    const link = referralData?.referralLink;
    if (!link) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        Alert.alert('Copied!', 'Referral link copied to clipboard');
        return;
      }
      // Fallback: show the link so user can manually copy
      Alert.alert('Referral Link', link);
    } catch {
      Alert.alert('Copy failed', 'Unable to copy to clipboard');
    }
  };

  const handleShareLink = async () => {
  if (!referralData?.referralLink) return;
  try {
    setIsUpdating(true);
    await Share.share({
      message: `Join me on Nite Putter and get 10% off your first order! Use my referral link: ${referralData.referralLink}`,
      url: referralData.referralLink,
    });
  } catch (error) {
    console.error('Error sharing:', error);
  } finally {
    setIsUpdating(false);
  }
};

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      Alert.alert('Missing Email', 'Please enter an email address');
      return;
    }
    
    if (!inviteEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    try {
      setIsUpdating(true);
      await sendReferralInvite(inviteEmail, inviteName);
      setInviteEmail('');
      setInviteName('');
      Alert.alert('Invite Sent!', 'Your referral invite has been sent successfully');
      setIsUpdating(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite. Please try again.');
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00FF88';
      case 'credited':
        return '#00D4FF';
      case 'pending':
        return '#FFD700';
      default:
        return '#888888';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Order Completed';
      case 'credited':
        return 'Credit Applied';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading referral data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.title}>Referral Program</Text>
          <Text style={styles.subtitle}>
            Invite friends and earn $5 for each successful referral!
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralData?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${referralData?.totalEarnings?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${referralData?.availableCredit?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Available Credit</Text>
          </View>
        </View>

                {/* Reward Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reward Preference</Text>
          <Text style={{ color: '#CCCCCC', marginBottom: 12 }}>
            Choose how you want to receive your $5 referral rewards.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: referralData?.rewardPreference === 'store_credit' ? 'rgba(0,255,136,0.15)' : '#1A1A1A',
                borderColor: referralData?.rewardPreference === 'store_credit' ? '#00FF88' : '#333333',
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
              }}
              onPress={() => setRewardPreference('store_credit')}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Store Credit</Text>
              <Text style={{ color: '#888888', fontSize: 12 }}>Adds to your available credit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: referralData?.rewardPreference === 'visa_gift_card' ? 'rgba(0,212,255,0.15)' : '#1A1A1A',
                borderColor: referralData?.rewardPreference === 'visa_gift_card' ? '#00D4FF' : '#333333',
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
              }}
              onPress={() => setRewardPreference('visa_gift_card')}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Visa Gift Card</Text>
              <Text style={{ color: '#888888', fontSize: 12 }}>Well issue Visa gift cards</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Custom Referral Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your preferred code (A–Z, 0–9)"
            placeholderTextColor="#888888"
            autoCapitalize="characters"
            value={customCode}
            onChangeText={(t) => setCustomCode(t.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
          />
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={async () => {
              if (!customCode || customCode.length < 6 || customCode.length > 12) {
                Alert.alert('Invalid Code', 'Use 6–12 characters (A–Z, 0–9).');
                return;
              }
              setIsUpdating(true);
              await setCustomReferralCode(customCode);
              setIsUpdating(false);
              Alert.alert('Saved', 'Your referral code has been updated.');
            }}
            disabled={isUpdating}
          >
            <Text style={styles.inviteButtonText}>{isUpdating ? 'Saving...' : 'Save Referral Code'}</Text>
          </TouchableOpacity>
        </View>
        {/* Referral Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.referralCode}>{referralData?.referralCode || 'Loading...'}</Text>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
              <Text style={styles.copyButtonText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={handleShareLink} style={styles.shareButton}>
            <LinearGradient
              colors={['#00FF88', '#00D4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareButtonGradient}
            >
              <Text style={styles.shareButtonText}>Share Referral Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Send Invite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Invite</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Friend's Name (Optional)"
            placeholderTextColor="#888888"
            value={inviteName}
            onChangeText={setInviteName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Friend's Email Address"
            placeholderTextColor="#888888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={inviteEmail}
            onChangeText={setInviteEmail}
          />
          
          <TouchableOpacity
            onPress={handleSendInvite}
            disabled={isUpdating}
            style={[styles.inviteButton, isUpdating && styles.disabledButton]}
          >
            <Text style={styles.inviteButtonText}>
              {isUpdating ? 'Sending...' : 'Send Invite'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Link</Text>
              <Text style={styles.stepDescription}>
                Send your unique referral link to friends via email, social media, or messaging apps.
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Makes Purchase</Text>
              <Text style={styles.stepDescription}>
                Your friend gets 10% off their first order when they use your link.
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You Earn Credit</Text>
              <Text style={styles.stepDescription}>
                You receive $5 credit that can be used on any future purchase.
              </Text>
            </View>
          </View>
        </View>

        {/* Referral History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral History</Text>
          
          {referrals && referrals.length > 0 ? (
            referrals.map((referral) => (
              <View key={referral.id} style={styles.referralItem}>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName}>{referral.friendName}</Text>
                  <Text style={styles.referralEmail}>{referral.friendEmail}</Text>
                  <Text style={styles.referralDate}>
                    Referred on {new Date(referral.referredAt).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.referralStatus}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(referral.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusText(referral.status)}</Text>
                  </View>
                  <Text style={styles.creditAmount}>+${referral.creditAmount.toFixed(2)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No referrals yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start sharing your referral link to earn credits!
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  referralCode: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FF88',
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: '#333333',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shareButton: {
    borderRadius: 8,
  },
  shareButtonGradient: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  inviteButton: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00FF88',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  referralItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  referralEmail: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
    color: '#888888',
  },
  referralStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  creditAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00FF88',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});



