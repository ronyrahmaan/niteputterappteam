import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { useShopStore } from '../../store/shopStore';
import { useProfileStore } from '../../store/profileStore';
import { CheckoutScreenProps } from '../../types/navigation';
import { StripePaymentService } from '../../lib/stripe/stripe-service';
import { OrderService } from '../../lib/supabase/orders';
import { useCreateOrder, useOrderCalculations } from '../../hooks/useOrders';
import {
  CreateOrderRequest,
  ShippingMethod,
  PaymentMethod,
  FulfillmentStatus
} from '../../lib/supabase/order-types';

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PaymentMethodUI {
  id: PaymentMethod;
  type: 'card' | 'apple_pay' | 'google_pay';
  name: string;
  icon: string;
}

export const CheckoutScreenPro = ({ navigation }: CheckoutScreenProps) => {
  const { cart, clearCart } = useShopStore();
  const { hasReferralDiscount, appliedPromoCode, setAppliedPromoCode, generateAndSetPromoCode } = useProfileStore();
  const { createOrder, loading: orderLoading, error: orderError } = useCreateOrder();
  const { calculateShipping, calculateTax, loading: calculationLoading } = useOrderCalculations();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(PaymentMethod.STRIPE);
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(999); // Default to standard shipping

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const paymentMethods: PaymentMethodUI[] = [
    { id: PaymentMethod.STRIPE, type: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: PaymentMethod.APPLE_PAY, type: 'apple_pay', name: 'Apple Pay', icon: '' },
    { id: PaymentMethod.GOOGLE_PAY, type: 'google_pay', name: 'Google Pay', icon: '🅿️' },
  ];

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

    if (appliedPromoCode && isLikelyValidPromo(appliedPromoCode)) {
      setPromoCode(appliedPromoCode);
      setIsPromoApplied(true);
    }

    // Calculate initial tax and shipping
    calculateInitialTotals();
  }, []);

  const calculateInitialTotals = async () => {
    if (cart.length === 0) return;

    // Calculate tax if we have shipping address
    if (shippingInfo.state && shippingInfo.city && shippingInfo.zipCode) {
      const taxItems = cart.map(item => ({
        product_id: item.product.id,
        price: Math.round(item.product.price * 100),
        quantity: item.quantity
      }));

      const taxResult = await calculateTax(taxItems, {
        country: 'US',
        state_province: shippingInfo.state,
        postal_code: shippingInfo.zipCode,
        city: shippingInfo.city
      });

      setTaxAmount(taxResult.total_tax);
    }

    // Calculate shipping
    const shippingItems = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      weight: 1 // Default weight
    }));

    const shippingResult = await calculateShipping(shippingItems, {
      country: 'US',
      state_province: shippingInfo.state || 'CA',
      postal_code: shippingInfo.zipCode || '90210'
    }, ShippingMethod.STANDARD);

    setShippingCost(shippingResult.cost);
  };

  const isLikelyValidPromo = (code: string) => /^[A-Z0-9]{6,12}$/.test(code.trim().toUpperCase());

  // Calculate totals in cents
  const subtotalCents = cart.reduce((sum, item) => sum + (Math.round(item.product.price * 100) * item.quantity), 0);
  const promoEligible = isPromoApplied && isLikelyValidPromo(promoCode);
  const referralEligible = hasReferralDiscount;
  const discountCents = (promoEligible || referralEligible) ? Math.round(subtotalCents * 0.10) : 0;
  const discountedSubtotalCents = Math.max(0, subtotalCents - discountCents);
  const totalCents = discountedSubtotalCents + shippingCost + taxAmount;

  // Convert to dollars for display
  const subtotal = subtotalCents / 100;
  const discount = discountCents / 100;
  const shipping = shippingCost / 100;
  const tax = taxAmount / 100;
  const total = totalCents / 100;

  const validateForm = (): boolean => {
    const required = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingInfo[field as keyof ShippingInfo]) {
        Alert.alert('Missing Information', `Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
        return false;
      }
    }

    if (!shippingInfo.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleCardExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    if (formatted.length <= 5) {
      setCardExpiry(formatted);
    }
  };

  const handleApplyPromo = () => {
    if (!promoCode || !isLikelyValidPromo(promoCode)) {
      Alert.alert('Invalid Code', 'Please enter a valid promo code.');
      return;
    }
    setIsPromoApplied(true);
    setAppliedPromoCode(promoCode.trim().toUpperCase());
  };

  const handleClearPromo = () => {
    setPromoCode('');
    setIsPromoApplied(false);
    setAppliedPromoCode(null);
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    // Payment validation for card entries
    if (selectedPayment === PaymentMethod.STRIPE) {
      if (!cardName || !cardNumber || !cardExpiry || !cardCvc) {
        Alert.alert('Missing Card Details', 'Please fill in all card fields.');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length < 12) {
        Alert.alert('Invalid Card Number', 'Please enter a valid card number.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Prepare order items
      const orderItems = cart.map(item => ({
        product_id: item.product.id,
        product_sku: item.product.sku || item.product.id,
        product_name: item.product.name,
        product_image: item.product.imageUrl,
        price: Math.round(item.product.price * 100),
        quantity: item.quantity,
        subtotal: Math.round(item.product.price * 100) * item.quantity,
        tax_amount: Math.round(taxAmount * item.quantity / cart.length),
        discount_amount: Math.round(discountCents * item.quantity / cart.reduce((sum, i) => sum + i.quantity, 0)),
        total: Math.round(item.product.price * 100) * item.quantity,
        fulfillment_status: FulfillmentStatus.UNFULFILLED,
        fulfilled_quantity: 0
      }));

      // Create order data
      const orderData: CreateOrderRequest = {
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        billing_address: {
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
          street_line1: shippingInfo.address,
          city: shippingInfo.city,
          state_province: shippingInfo.state,
          postal_code: shippingInfo.zipCode,
          country: 'US',
          phone: shippingInfo.phone,
          is_residential: true
        },
        shipping_address: {
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
          street_line1: shippingInfo.address,
          city: shippingInfo.city,
          state_province: shippingInfo.state,
          postal_code: shippingInfo.zipCode,
          country: 'US',
          phone: shippingInfo.phone,
          is_residential: true
        },
        items: orderItems,
        shipping: {
          method: ShippingMethod.STANDARD,
          cost: shippingCost
        },
        payment_method: selectedPayment,
        promo_code: promoEligible ? promoCode.trim().toUpperCase() : undefined,
        source: 'mobile_app'
      };

      // Create order in database
      const { order, error: createOrderError } = await createOrder(orderData);

      if (createOrderError || !order) {
        throw new Error('Failed to create order');
      }

      // Process payment based on method
      if (selectedPayment === PaymentMethod.STRIPE) {
        // Initialize Stripe payment
        const paymentResult = await StripePaymentService.createPaymentIntent({
          amount: totalCents,
          currency: 'usd',
          orderId: order.id!,
          customerEmail: shippingInfo.email,
          shipping: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.zipCode,
              country: 'US'
            }
          }
        });

        if (!paymentResult.success || !paymentResult.data) {
          throw new Error(paymentResult.error || 'Payment initialization failed');
        }

        // Present payment sheet
        const { error: paymentError } = await StripePaymentService.presentPaymentSheet();

        if (paymentError) {
          throw new Error(paymentError);
        }

        // Update order with payment success
        await OrderService.updateOrderStatus({
          order_id: order.id!,
          payment_status: 'completed' as const,
          status: 'paid' as const
        });
      }

      Alert.alert(
        'Order Placed!',
        `Order #${order.order_number} has been successfully placed. You will receive a confirmation email shortly.`,
        [
          {
            text: 'Continue Shopping',
            onPress: () => {
              clearCart();
              navigation.navigate('ShopMain');
            },
          },
          {
            text: 'View Order',
            onPress: () => {
              navigation.navigate('OrderDetails', { orderId: order.id });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Order Failed', 'There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentDetails = () => {
    if (selectedPayment === PaymentMethod.STRIPE) {
      return (
        <View style={styles.paymentDetails}>
          <TextInput
            style={styles.input}
            placeholder="Name on Card"
            placeholderTextColor="#888888"
            value={cardName}
            onChangeText={setCardName}
          />
          <TextInput
            style={styles.input}
            placeholder="Card Number"
            placeholderTextColor="#888888"
            keyboardType="numeric"
            value={cardNumber}
            onChangeText={(t) => setCardNumber(t.replace(/[^0-9\s]/g, ''))}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.cityInput]}
              placeholder="MM/YY"
              placeholderTextColor="#888888"
              keyboardType="numeric"
              value={cardExpiry}
              onChangeText={handleCardExpiryChange}
              maxLength={5}
            />
            <TextInput
              style={[styles.input, styles.stateInput]}
              placeholder="CVC"
              placeholderTextColor="#888888"
              keyboardType="numeric"
              value={cardCvc}
              onChangeText={setCardCvc}
            />
          </View>
        </View>
      );
    }
    if (selectedPayment === PaymentMethod.APPLE_PAY) {
      const applePayAvailable = Platform.OS === 'ios';
      return (
        <View style={styles.paymentDetails}>
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isProcessing || !applePayAvailable}
            style={[styles.applePayButton, (isProcessing || !applePayAvailable) && styles.disabledButton]}
          >
            <Text style={styles.applePayText}>
              {isProcessing
                ? 'Processing...'
                : applePayAvailable
                  ? 'Pay with Apple Pay'
                  : 'Apple Pay not available on this device'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.paymentNote}>
            Quick and secure payment with Apple Pay.
          </Text>
        </View>
      );
    }
    if (selectedPayment === PaymentMethod.GOOGLE_PAY) {
      return (
        <View style={styles.paymentDetails}>
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isProcessing}
            style={[styles.paypalButton, isProcessing && styles.disabledButton]}
          >
            <Text style={styles.paypalText}>{isProcessing ? 'Processing...' : 'Pay with Google Pay'}</Text>
          </TouchableOpacity>
          <Text style={styles.paymentNote}>
            Secure Google Pay payment processing available.
          </Text>
        </View>
      );
    }
    return null;
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('ShopMain')}
          >
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Checkout</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name"
              placeholderTextColor="#888888"
              value={shippingInfo.firstName}
              onChangeText={(text) => setShippingInfo(prev => ({ ...prev, firstName: text }))}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name"
              placeholderTextColor="#888888"
              value={shippingInfo.lastName}
              onChangeText={(text) => setShippingInfo(prev => ({ ...prev, lastName: text }))}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#888888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={shippingInfo.email}
            onChangeText={(text) => setShippingInfo(prev => ({ ...prev, email: text }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#888888"
            keyboardType="phone-pad"
            value={shippingInfo.phone}
            onChangeText={(text) => setShippingInfo(prev => ({ ...prev, phone: text }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Street Address"
            placeholderTextColor="#888888"
            value={shippingInfo.address}
            onChangeText={(text) => setShippingInfo(prev => ({ ...prev, address: text }))}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.cityInput]}
              placeholder="City"
              placeholderTextColor="#888888"
              value={shippingInfo.city}
              onChangeText={(text) => {
                setShippingInfo(prev => ({ ...prev, city: text }));
                // Recalculate totals when address changes
                if (text && shippingInfo.state && shippingInfo.zipCode) {
                  calculateInitialTotals();
                }
              }}
            />
            <TextInput
              style={[styles.input, styles.stateInput]}
              placeholder="State"
              placeholderTextColor="#888888"
              value={shippingInfo.state}
              onChangeText={(text) => {
                setShippingInfo(prev => ({ ...prev, state: text }));
                // Recalculate totals when address changes
                if (text && shippingInfo.city && shippingInfo.zipCode) {
                  calculateInitialTotals();
                }
              }}
            />
            <TextInput
              style={[styles.input, styles.zipInput]}
              placeholder="ZIP"
              placeholderTextColor="#888888"
              keyboardType="numeric"
              value={shippingInfo.zipCode}
              onChangeText={(text) => {
                setShippingInfo(prev => ({ ...prev, zipCode: text }));
                // Recalculate totals when address changes
                if (text && shippingInfo.city && shippingInfo.state) {
                  calculateInitialTotals();
                }
              }}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPayment === method.id && styles.selectedPaymentMethod,
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.paymentMethodContent}>
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text style={styles.paymentName}>{method.name}</Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedPayment === method.id && styles.selectedRadioButton,
              ]} />
            </TouchableOpacity>
          ))}

          {renderPaymentDetails()}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {cart.map((item) => (
            <View key={item.product.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>
                {item.product.name} × {item.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                ${(item.product.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {promoEligible && !referralEligible ? 'Promo Discount (10%)' : 'Referral Discount (10%)'}
                </Text>
                <Text style={styles.summaryValue}>-${discount.toFixed(2)}</Text>
              </View>
            )}

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
          </View>
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoCodeContainer}>
            <TextInput
              style={styles.promoCodeInput}
              placeholder="Enter promo/referral code"
              placeholderTextColor="#888888"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            {!isPromoApplied ? (
              <TouchableOpacity onPress={handleApplyPromo} style={styles.promoApplyButton}>
                <Text style={styles.promoButtonText}>Apply</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleClearPromo} style={styles.promoApplyButton}>
                <Text style={styles.promoButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                const code = generateAndSetPromoCode(8);
                setPromoCode(code);
                setIsPromoApplied(true);
              }}
              style={[styles.promoButton, { flex: 1 }]}
            >
              <Text style={styles.promoButtonText}>Use system code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAppliedPromoCode(promoCode.trim().toUpperCase())}
              style={[styles.promoButton, { flex: 1 }]}
              disabled={!promoCode || !isLikelyValidPromo(promoCode)}
            >
              <Text style={styles.promoButtonText}>Save my code</Text>
            </TouchableOpacity>
          </View>
          {referralEligible && !promoEligible && (
            <Text style={{ color: '#00FF88', marginTop: 8 }}>
              Referral applied: 10% off automatically
            </Text>
          )}
        </View>

        {/* Place Order Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={isProcessing || selectedPayment === PaymentMethod.APPLE_PAY || selectedPayment === PaymentMethod.GOOGLE_PAY}
            style={[styles.placeOrderButton, isProcessing && styles.disabledButton]}
          >
            <LinearGradient
              colors={isProcessing ? ['#666666', '#444444'] : ['#00FF88', '#00D4FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.placeOrderGradient}
            >
              <Text style={styles.placeOrderText}>
                {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#00FF88',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
    minWidth: 40,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  cityInput: {
    flex: 0.5,
  },
  stateInput: {
    flex: 0.25,
  },
  zipInput: {
    flex: 0.2,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedPaymentMethod: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666666',
  },
  selectedRadioButton: {
    borderColor: '#00FF88',
    backgroundColor: '#00FF88',
  },
  paymentDetails: {
    marginTop: 12,
  },
  applePayButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  applePayText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  paypalButton: {
    backgroundColor: '#003087',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  paypalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentNote: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: '#CCCCCC',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    paddingTop: 8,
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
  buttonContainer: {
    padding: 20,
  },
  placeOrderButton: {
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderGradient: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  promoCodeInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  promoApplyButton: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  promoButton: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  promoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});