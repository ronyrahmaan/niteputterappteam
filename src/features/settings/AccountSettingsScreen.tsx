import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { useAuthStore } from '../../store/authStore';

export const AccountSettingsScreen: React.FC = () => {
  const { user, updateProfile } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSaveProfile = () => {
    updateProfile?.({ firstName, lastName, email });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Profile updated successfully');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please enter your current and new passwords.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    // Placeholder: integrate with backend
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', 'Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Account Settings</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>First Name</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor={theme.colors.text.secondary} />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor={theme.colors.text.secondary} />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Email" placeholderTextColor={theme.colors.text.secondary} />
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile}>
                <LinearGradient colors={[theme.colors.neon.blue, theme.colors.neon.green]} style={styles.primaryButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="save" size={18} color={theme.colors.text.primary} />
                  <Text style={styles.primaryButtonText}>Save Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Change Password</Text>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Current Password" placeholderTextColor={theme.colors.text.secondary} />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>New Password</Text>
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="New Password" placeholderTextColor={theme.colors.text.secondary} />
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Confirm New Password" placeholderTextColor={theme.colors.text.secondary} />
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword}>
                <LinearGradient colors={[theme.colors.neon.blue, theme.colors.neon.green]} style={styles.primaryButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="key" size={18} color={theme.colors.text.primary} />
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 12 },
  section: { backgroundColor: theme.colors.background.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 12 },
  fieldRow: { marginBottom: 12 },
  label: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 6 },
  input: { backgroundColor: theme.colors.background.secondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.border.primary },
  primaryButton: { marginTop: 8 },
  primaryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  primaryButtonText: { color: theme.colors.text.primary, fontWeight: '600' },
});