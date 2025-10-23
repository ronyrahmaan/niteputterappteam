import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Linking, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { validateEmail } from '../../lib/utils';

export const HelpSupportScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const openContactPage = () => {
    Linking.openURL('https://niteputterpro.com/');
  };

  const handleSubmit = () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (phone && phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please describe your request.');
      return;
    }

    Alert.alert('Thanks!', 'Your request has been prepared. We will reach out shortly.');
    // Optionally open the site contact page for final submission
    openContactPage();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Help & Support</Text>
            <Text style={styles.description}>
              Veteran-owned team ready to help with installations and custom solutions.
            </Text>

            {/* <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get In Touch</Text>
              <View style={styles.contactRow}>
                <Ionicons name="planet" size={18} color={theme.colors.neon.blue} />
                <Text
                  style={styles.linkText}
                  accessibilityRole="link"
                  onPress={openContactPage}
                >
                  Open Contact Page (Website)
                </Text>
              </View>
              <Text style={styles.helperText}>
                Opens the website contact page to reach our team.
              </Text>
            </View> */}

            {/* General Inquiries */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📧 General Inquiries</Text>
              <View style={styles.contactRow}>
                <Ionicons name="call" size={18} color={theme.colors.neon.green} />
                <Text
                  style={styles.linkText}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL('tel:+14696427171')}
                >
                  Phone: (469) 642-7171
                </Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={18} color={theme.colors.neon.green} />
                <Text
                  style={styles.linkText}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL('mailto:niteputter@gmail.com')}
                >
                  Email: niteputter@gmail.com
                </Text>
              </View>
              <Text style={styles.helperText}>Hours: Mon–Fri 9AM–6PM CST</Text>
            </View>

            {/* Bucky Thrash */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👨‍💼 Bucky Thrash</Text>
              <Text style={styles.description}>Co-Founder & CEO — Direct business inquiries</Text>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={18} color={theme.colors.neon.blue} />
                <Text
                  style={styles.linkText}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL('mailto:buckythrash@gmail.com')}
                >
                  Email: buckythrash@gmail.com
                </Text>
              </View>
            </View>

            {/* Dusty Thrash */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 Dusty Thrash</Text>
              <Text style={styles.description}>Co-Founder & Operations — Technical & installation support</Text>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={18} color={theme.colors.neon.blue} />
                <Text
                  style={styles.linkText}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL('mailto:dustythrash@yahoo.com')}
                >
                  Email: dustythrash@yahoo.com
                </Text>
              </View>
            </View>

            {/* Headquarters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏢 Texas Headquarters</Text>
              <Text style={styles.description}>Veteran-owned operations</Text>
              <Text style={styles.description}>312 E Main St, Forney, TX 75126, United States</Text>
              <View style={styles.contactRow}>
                <Ionicons name="location" size={18} color={theme.colors.neon.green} />
                <Text
                  style={styles.linkText}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=312%20E%20Main%20St%2C%20Forney%2C%20TX%2075126')}
                >
                  Open in Maps
                </Text>
              </View>
            </View>


            {/* Contact Form */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>For quick support enter your details:</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={theme.colors.text.secondary}
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                style={styles.input}
                placeholder="Company (optional)"
                placeholderTextColor={theme.colors.text.secondary}
                value={company}
                onChangeText={setCompany}
              />
              <TextInput
                style={styles.input}
                placeholder="Subject (optional)"
                placeholderTextColor={theme.colors.text.secondary}
                value={subject}
                onChangeText={setSubject}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Message"
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity style={styles.contactButton} onPress={handleSubmit}>
                <LinearGradient
                  colors={[theme.colors.neon.blue, theme.colors.neon.green]}
                  style={styles.contactGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="send" size={18} color={theme.colors.text.primary} />
                  <Text style={styles.contactText}>Submit Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Quick Help removed as requested (content covered in About) */}

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
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 10 },
  description: { color: theme.colors.text.primary, marginBottom: 12 },
  section: { backgroundColor: theme.colors.background.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { color: theme.colors.neon.blue },
  helperText: { color: theme.colors.text.secondary, marginTop: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  featureText: { color: theme.colors.text.primary },
  input: { backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 12, color: theme.colors.text.primary, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border.primary },
  textArea: { minHeight: 100, textAlignVertical: 'top' as const },
  contactButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginTop: 8 },
  contactGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing[4] },
  contactText: { fontSize: theme.typography.fontSize.base, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text.primary, marginLeft: theme.spacing[2] },
});