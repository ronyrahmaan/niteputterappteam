import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';
import { usePaymentStore } from '../../store/paymentStore';
import type { SavedCard } from '../../store/paymentStore';

// Using the persisted payment store types
type CardItem = SavedCard;

export const PaymentMethodsScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const { cards, addCard, removeCard, setDefault } = usePaymentStore();

  // Add-card modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState(''); // MM/YY
  const [label, setLabel] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleMakeDefault = (id: string) => {
    setDefault(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveCard = (id: string) => {
    removeCard(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const detectBrand = (num: string): CardItem['brand'] => {
    const n = num.replace(/\D/g, '');
    if (n.startsWith('4')) return 'Visa';
    if (n.startsWith('5')) return 'Mastercard';
    if (n.startsWith('34') || n.startsWith('37')) return 'Amex';
    if (n.startsWith('6')) return 'Discover';
    return 'Other';
  };

  const handleAddCardSubmit = () => {
    const digits = cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4);

    // Basic validation
    if (digits.length < 12 || last4.length !== 4) {
      Alert.alert('Invalid card', 'Please enter a valid card number.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      Alert.alert('Invalid expiry', 'Use MM/YY format, e.g., 12/30.');
      return;
    }

    const brand = detectBrand(digits);
    addCard({ brand, last4, exp: expiry, label });

    setShowAddModal(false);
    setCardNumber('');
    setExpiry('');
    setLabel('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const Card = ({ item }: { item: CardItem }) => (
    <View style={[styles.cardItem, item.isDefault ? styles.cardDefault : {}]}>
      <View style={styles.cardLeft}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="card" size={20} color={theme.colors.neon.blue} />
        </View>
        <View>
          <Text style={styles.cardBrand}>{item.brand} •••• {item.last4}</Text>
          <Text style={styles.cardMeta}>Exp {item.exp}{item.isDefault ? ' • Default' : ''}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {!item.isDefault && (
          <TouchableOpacity style={styles.smallButton} onPress={() => handleMakeDefault(item.id)}>
            <Text style={styles.smallButtonText}>Make Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.smallButton, styles.removeButton]} onPress={() => handleRemoveCard(item.id)}>
          <Text style={[styles.smallButtonText, styles.removeButtonText]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[theme.colors.background.primary, theme.colors.background.secondary]} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Payment Methods</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved Cards</Text>
              {cards.length === 0 ? (
                <Text style={styles.emptyText}>No saved cards</Text>
              ) : (
                cards.map(c => <Card key={c.id} item={c} />)
              )}
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowAddModal(true)}>
                <LinearGradient colors={[theme.colors.neon.blue, theme.colors.neon.green]} style={styles.primaryButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="add" size={18} color={theme.colors.text.primary} />
                  <Text style={styles.primaryButtonText}>Add Card</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Add Card Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add a Card</Text>
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={setCardNumber}
              />
              <TextInput
                style={styles.input}
                placeholder="Expiry (MM/YY)"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="numeric"
                value={expiry}
                onChangeText={setExpiry}
              />
              <TextInput
                style={styles.input}
                placeholder="Label (optional)"
                placeholderTextColor={theme.colors.text.secondary}
                value={label}
                onChangeText={setLabel}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.smallButton, { flex: 1 }]} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.smallButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallButton, { flex: 1 }]} onPress={handleAddCardSubmit}>
                  <Text style={styles.smallButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  emptyText: { color: theme.colors.text.secondary },
  cardItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.background.secondary, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border.primary },
  cardDefault: { borderColor: theme.colors.interactive.primary },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.background.card, alignItems: 'center', justifyContent: 'center' },
  cardBrand: { color: theme.colors.text.primary, fontWeight: '600' },
  cardMeta: { color: theme.colors.text.secondary, fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 8 },
  smallButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: theme.colors.background.card },
  smallButtonText: { color: theme.colors.neon.blue, fontSize: 12, fontWeight: '600' },
  removeButton: { backgroundColor: theme.colors.error.secondary + '20' },
  removeButtonText: { color: theme.colors.error.primary },
  primaryButton: { marginTop: 8 },
  primaryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  primaryButtonText: { color: theme.colors.text.primary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: theme.colors.background.card, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: theme.colors.border.primary },
  modalTitle: { color: theme.colors.text.primary, fontSize: 18, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: theme.colors.background.secondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text.primary, borderWidth: 1, borderColor: theme.colors.border.primary, marginBottom: 8 },
});