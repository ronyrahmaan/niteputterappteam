import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { LinearGradient } from 'expo-linear-gradient';
import { useShopStore } from '../../store/shopStore';
import { CartScreenProps } from '../../types/navigation';

export const CartScreen = ({ navigation }: CartScreenProps) => {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useShopStore();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tempQuantity, setTempQuantity] = useState('');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const ctaBottomOffset = tabBarHeight + insets.bottom + 8;
  const ctaExtraPadding = 80;

  useEffect(() => {
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

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      Alert.alert(
        'Remove Item',
        'Are you sure you want to remove this item from your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(productId) },
        ]
      );
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  const handleQuantityPress = (productId: string, currentQuantity: number) => {
    setSelectedProductId(productId);
    setTempQuantity(currentQuantity.toString());
    setQuantityModalVisible(true);
  };

  const handleQuantityModalSave = () => {
    const newQuantity = parseInt(tempQuantity);
    if (newQuantity && newQuantity > 0 && newQuantity <= 99) {
      handleQuantityChange(selectedProductId, newQuantity);
      setQuantityModalVisible(false);
    } else {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity between 1 and 99');
    }
  };

  const handleQuantityModalCancel = () => {
    setQuantityModalVisible(false);
    setTempQuantity('');
    setSelectedProductId('');
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View
          style={[
            styles.emptyContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some glow to your game! Browse our collection of night golf accessories.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ShopMain')}
            style={styles.shopButton}
          >
            <LinearGradient
              colors={['#00FF88', '#00D4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shopButtonGradient}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { paddingBottom: ctaBottomOffset + ctaExtraPadding },
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Shopping Cart</Text>
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Items */}
        <ScrollView
          style={styles.itemsContainer}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: ctaBottomOffset + ctaExtraPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {cart.map((item) => (
            <View key={item.product.id} style={styles.cartItem}>
              <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
              
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>${item.product.price.toFixed(2)}</Text>
                
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleQuantityPress(item.product.id, item.quantity)}>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemActions}>
                <Text style={styles.itemTotal}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeFromCart(item.product.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>

          {subtotal < 50 && (
            <Text style={styles.shippingNote}>
              Add ${(50 - subtotal).toFixed(2)} more for free shipping!
            </Text>
          )}
        </View>

        {/* Checkout Button (Sticky Bottom) */}
        <View style={[styles.checkoutContainer, { bottom: ctaBottomOffset }] }>
          <TouchableOpacity onPress={handleCheckout}>
            <LinearGradient
              colors={['#00FF88', '#00D4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkoutButton}
            >
              <Text style={styles.checkoutText}>
                Proceed to Checkout • ${total.toFixed(2)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Quantity Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={quantityModalVisible}
        onRequestClose={handleQuantityModalCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Quantity</Text>
            <TextInput
              style={styles.modalInput}
              value={tempQuantity}
              onChangeText={setTempQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor="#888"
              autoFocus={true}
              selectTextOnFocus={true}
              maxLength={2}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleQuantityModalCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleQuantityModalSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearButton: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '600',
  },
  itemsContainer: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#00FF88',
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#333333',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 16,
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#1A1A1A',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  summaryValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00FF88',
  },
  shippingNote: {
    fontSize: 14,
    color: '#00FF88',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  checkoutContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: '#0A0A0AE6',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  checkoutButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    width: '100%',
  },
  shopButtonGradient: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shopButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#333333',
  },
  saveButton: {
    backgroundColor: '#00D4FF',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});