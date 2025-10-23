import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Animated, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

export const AboutScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>About Nite Putter Pro</Text>
            <Text style={styles.description}>
              Professional illuminated golf cup systems engineered for premium night putting experiences. From concept to installation, Nite Putter Pro delivers complete illuminated golf systems that transform your putting experience.
            </Text>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Key Technologies</Text>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={18} color={theme.colors.neon.green} />
                <Text style={styles.featureText}>Patented POLY LIGHT CASING — Durable, protected from water and debris.</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="water" size={18} color={theme.colors.neon.blue} />
                <Text style={styles.featureText}>Multi-Level Drainage — Withstands heavy rains and flooding.</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="flash" size={18} color={theme.colors.neon.green} />
                <Text style={styles.featureText}>Hardwired System — 12v low voltage, no charging required.</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Integration & Support</Text>
              <Text style={styles.description}>
                Professional installation and ongoing support for golf courses, entertainment facilities, and residential greens. Veteran-owned and engineered with premium build quality and proven workflows.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Facts</Text>
              <View style={styles.quickRow}>
                <View style={styles.quickItem}>
                  <Text style={styles.quickNumber}>24/7</Text>
                  <Text style={styles.quickLabel}>Technical Support</Text>
                </View>
                <View style={styles.quickItem}>
                  <Text style={styles.quickNumber}>Veteran</Text>
                  <Text style={styles.quickLabel}>Owned</Text>
                </View>
                <View style={styles.quickItem}>
                  <Text style={styles.quickNumber}>Nationwide</Text>
                  <Text style={styles.quickLabel}>Integration</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Learn More</Text>
              <Text
                style={styles.linkText}
                accessibilityRole="link"
                onPress={() => Linking.openURL('https://niteputterpro.com/')}
              >
                Visit: https://niteputterpro.com/
              </Text>
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
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 10 },
  description: { color: theme.colors.text.primary, marginBottom: 12 },
  section: { backgroundColor: theme.colors.background.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
  featuresSection: { backgroundColor: theme.colors.background.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  featureText: { color: theme.colors.text.primary },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', flex: 1 },
  quickNumber: { fontSize: 16, fontWeight: '700', color: theme.colors.interactive.primary },
  quickLabel: { fontSize: 12, color: theme.colors.text.secondary },
  linkText: { color: theme.colors.neon.blue },
});