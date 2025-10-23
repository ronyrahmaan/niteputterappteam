/**
 * Professional Stripe Payment Service for NiteNite React Native App
 * Based on website's proven patterns, adapted for mobile payments
 */

import {
  StripeProvider,
  useStripe,
  usePaymentSheet,
  initPaymentSheet,
  presentPaymentSheet,
  createPaymentMethod,
  confirmPayment,
  PaymentMethod,
  PaymentIntent,
  SetupIntent,
  confirmSetupIntent
} from '@stripe/stripe-react-native';
import {
  Order,
  OrderItem,
  Address,
  PaymentMethod as PaymentMethodEnum,
  PaymentStatus,
  OrderStatus,
  ShippingMethod,
  CreateOrderRequest
} from '../supabase/order-types';
import { CartItem } from '../../store/shopStore';
import { Alert } from 'react-native';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Get from environment or config
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RvWPRLWycZ0vXRC2QQ6JrF2nkHJHc3Ob76ibmlGV0jkXW5Q96iwNf1giKzI6w6BLwLuxXQApM5u9RoLzGrGO0jl00tK9fecdH';

// Payment method configurations
const PAYMENT_METHODS_CONFIG = {
  card: {
    displayName: 'Card',
    allowsDelayedPaymentMethods: true,
  },
  applePay: {
    displayName: 'Apple Pay',
    merchantId: 'merchant.com.niteputter.app', // Configure this in Stripe dashboard
  },
  googlePay: {
    displayName: 'Google Pay',
    merchantName: 'NitePutter',
    countryCode: 'US',
  }
};

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentServiceConfig {
  publishableKey: string;
  merchantDisplayName: string;
  countryCode: string;
  currency: string;
}

export interface PaymentIntentRequest {
  amount: number; // in cents
  currency: string;
  order_id: string;
  customer_email: string;
  payment_method_types: string[];
  capture_method?: 'automatic' | 'manual';
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  payment_intent_id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
}

export interface PaymentSheetConfig {
  customerId?: string;
  customerEphemeralKeySecret?: string;
  paymentIntentClientSecret: string;
  merchantDisplayName: string;
  applePay?: {
    merchantId: string;
  };
  googlePay?: {
    merchantName: string;
    countryCode: string;
  };
  allowsDelayedPaymentMethods?: boolean;
  appearance?: any;
}

export interface PaymentResult {
  success: boolean;
  payment_intent?: PaymentIntent;
  payment_method?: PaymentMethod;
  error?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    email?: string;
    name?: string;
    phone?: string;
  };
}

// ============================================================================
// STRIPE SERVICE CLASS
// ============================================================================

export class StripePaymentService {
  private config: PaymentServiceConfig;
  private initialized: boolean = false;

  constructor(config?: Partial<PaymentServiceConfig>) {
    this.config = {
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantDisplayName: 'NitePutter',
      countryCode: 'US',
      currency: 'usd',
      ...config
    };
  }

  /**
   * Initialize the Stripe SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Stripe initialization is handled by the provider wrapper
      this.initialized = true;
      console.log('✅ Stripe service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Stripe service:', error);
      throw new Error('Failed to initialize payment service');
    }
  }

  /**
   * Calculate shipping cost based on method and address
   */
  calculateShippingCost(
    method: ShippingMethod,
    items: CartItem[],
    address: Address
  ): number {
    // Base shipping costs (in cents)
    const shippingCosts = {
      [ShippingMethod.STANDARD]: 999,   // $9.99
      [ShippingMethod.EXPRESS]: 1999,   // $19.99
      [ShippingMethod.OVERNIGHT]: 3999, // $39.99
      [ShippingMethod.PICKUP]: 0,       // Free
    };

    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity * 100), 0);

    // Free shipping over $50
    if (subtotal >= 5000 && method === ShippingMethod.STANDARD) {
      return 0;
    }

    // International shipping surcharge
    if (address.country !== 'US') {
      return shippingCosts[method] + 1000; // +$10 for international
    }

    return shippingCosts[method];
  }

  /**
   * Calculate tax based on address
   */
  calculateTax(items: CartItem[], address: Address): number {
    // Tax rates by state (basic implementation)
    const taxRates: Record<string, number> = {
      'CA': 0.0875, // California
      'NY': 0.08,   // New York
      'TX': 0.0625, // Texas
      'FL': 0.06,   // Florida
      'WA': 0.065,  // Washington
      // Add more states as needed
    };

    const taxRate = taxRates[address.state_province] || 0;
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity * 100), 0);

    return Math.round(subtotal * taxRate);
  }

  /**
   * Apply promo code discount
   */
  applyPromoCode(code: string, subtotal: number): { valid: boolean; discount: number; description?: string } {
    // Basic promo code implementation
    const promoCodes: Record<string, { type: 'percentage' | 'fixed'; value: number; description: string }> = {
      'WELCOME10': { type: 'percentage', value: 10, description: '10% off your first order' },
      'SAVE20': { type: 'fixed', value: 2000, description: '$20 off orders over $100' }, // $20 in cents
      'FREESHIP': { type: 'fixed', value: 999, description: 'Free standard shipping' },
    };

    const promo = promoCodes[code.toUpperCase()];
    if (!promo) {
      return { valid: false, discount: 0 };
    }

    let discount = 0;
    if (promo.type === 'percentage') {
      discount = Math.round(subtotal * (promo.value / 100));
    } else {
      discount = promo.value;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    return {
      valid: true,
      discount,
      description: promo.description
    };
  }

  /**
   * Create payment intent on the server
   */
  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      // In a real implementation, this would call your backend API
      // For now, we'll simulate the response structure
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntent = await response.json();
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Process payment using Payment Sheet (recommended flow)
   */
  async processPaymentWithSheet(
    amount: number,
    currency: string,
    orderData: CreateOrderRequest,
    onSuccess: (paymentIntent: PaymentIntent) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      console.log('🔄 Processing payment with Payment Sheet...');

      // Create payment intent
      const paymentIntentResponse = await this.createPaymentIntent({
        amount,
        currency: currency.toLowerCase(),
        order_id: `temp_${Date.now()}`, // Temporary ID
        customer_email: orderData.customer_email,
        payment_method_types: ['card', 'apple_pay', 'google_pay'],
        metadata: {
          source: 'mobile_app',
          customer_phone: orderData.customer_phone,
        }
      });

      // Configure Payment Sheet
      const paymentSheetConfig: PaymentSheetConfig = {
        paymentIntentClientSecret: paymentIntentResponse.client_secret,
        merchantDisplayName: this.config.merchantDisplayName,
        applePay: {
          merchantId: PAYMENT_METHODS_CONFIG.applePay.merchantId,
        },
        googlePay: {
          merchantName: PAYMENT_METHODS_CONFIG.googlePay.merchantName,
          countryCode: PAYMENT_METHODS_CONFIG.googlePay.countryCode,
        },
        allowsDelayedPaymentMethods: true,
        appearance: {
          colors: {
            primary: '#00FF88', // NitePutter brand color
            background: '#0A0A0A',
            componentBackground: '#1A1A1A',
            componentBorder: '#333333',
            componentDivider: '#333333',
            primaryText: '#FFFFFF',
            secondaryText: '#CCCCCC',
            componentText: '#FFFFFF',
            placeholderText: '#888888',
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
        }
      };

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet(paymentSheetConfig);

      if (initError) {
        console.error('Payment Sheet init error:', initError);
        onError(`Payment setup failed: ${initError.message}`);
        return;
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log('Payment was cancelled by user');
          return; // Don't show error for user cancellation
        }
        console.error('Payment Sheet present error:', presentError);
        onError(`Payment failed: ${presentError.message}`);
        return;
      }

      // Payment succeeded
      console.log('✅ Payment completed successfully');

      // Create a mock PaymentIntent for the success callback
      const mockPaymentIntent: PaymentIntent = {
        id: paymentIntentResponse.payment_intent_id,
        amount: paymentIntentResponse.amount,
        currency: paymentIntentResponse.currency,
        status: 'succeeded',
        clientSecret: paymentIntentResponse.client_secret,
        created: new Date().toISOString(),
        livemode: false,
        paymentMethod: undefined, // Would be populated by actual Stripe response
      };

      onSuccess(mockPaymentIntent);

    } catch (error) {
      console.error('Payment processing error:', error);
      onError(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process payment using direct PaymentIntent confirmation (alternative flow)
   */
  async processDirectPayment(
    paymentMethodId: string,
    clientSecret: string,
    onSuccess: (paymentIntent: PaymentIntent) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      console.log('🔄 Processing direct payment...');

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId
        }
      });

      if (error) {
        console.error('Direct payment error:', error);
        onError(`Payment failed: ${error.message}`);
        return;
      }

      if (paymentIntent) {
        console.log('✅ Direct payment completed successfully');
        onSuccess(paymentIntent);
      }

    } catch (error) {
      console.error('Direct payment processing error:', error);
      onError(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(
    customerId: string,
    paymentMethodType: 'Card',
    onSuccess: (setupIntent: SetupIntent) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      console.log('🔄 Saving payment method...');

      // Create setup intent on server
      const response = await fetch('/api/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_id: customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create setup intent');
      }

      const { client_secret } = await response.json();

      const { error, setupIntent } = await confirmSetupIntent(client_secret, {
        paymentMethodType,
      });

      if (error) {
        console.error('Setup intent error:', error);
        onError(`Failed to save payment method: ${error.message}`);
        return;
      }

      if (setupIntent) {
        console.log('✅ Payment method saved successfully');
        onSuccess(setupIntent);
      }

    } catch (error) {
      console.error('Save payment method error:', error);
      onError(`Failed to save payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get saved payment methods for customer
   */
  async getSavedPaymentMethods(customerId: string): Promise<SavedPaymentMethod[]> {
    try {
      const response = await fetch(`/api/customers/${customerId}/payment-methods`);

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const paymentMethods = await response.json();
      return paymentMethods;

    } catch (error) {
      console.error('Error fetching saved payment methods:', error);
      return [];
    }
  }

  /**
   * Show payment success alert
   */
  showPaymentSuccessAlert(orderNumber: string, amount: number): void {
    const formattedAmount = this.formatCurrency(amount);

    Alert.alert(
      '🎉 Payment Successful!',
      `Your order ${orderNumber} for ${formattedAmount} has been placed successfully. You'll receive a confirmation email shortly.`,
      [
        {
          text: 'View Order',
          style: 'default',
        },
        {
          text: 'Continue Shopping',
          style: 'cancel',
        }
      ]
    );
  }

  /**
   * Show payment error alert
   */
  showPaymentErrorAlert(error: string): void {
    Alert.alert(
      '❌ Payment Failed',
      `We couldn't process your payment. ${error}\n\nPlease try again or use a different payment method.`,
      [
        {
          text: 'Try Again',
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        }
      ]
    );
  }

  /**
   * Format currency amount
   */
  formatCurrency(cents: number, currency = 'USD'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Validate payment form data
   */
  validatePaymentData(orderData: CreateOrderRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate email
    if (!orderData.customer_email || !orderData.customer_email.includes('@')) {
      errors.push('Valid email address is required');
    }

    // Validate phone
    if (!orderData.customer_phone || orderData.customer_phone.length < 10) {
      errors.push('Valid phone number is required');
    }

    // Validate addresses
    const requiredAddressFields = ['first_name', 'last_name', 'street_line1', 'city', 'state_province', 'postal_code'];

    for (const field of requiredAddressFields) {
      if (!orderData.billing_address[field as keyof Address]) {
        errors.push(`Billing ${field.replace('_', ' ')} is required`);
      }
      if (!orderData.shipping_address[field as keyof Address]) {
        errors.push(`Shipping ${field.replace('_', ' ')} is required`);
      }
    }

    // Validate items
    if (!orderData.items || orderData.items.length === 0) {
      errors.push('At least one item is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get payment method display name
   */
  getPaymentMethodDisplayName(method: PaymentMethodEnum): string {
    switch (method) {
      case PaymentMethodEnum.STRIPE:
        return 'Credit/Debit Card';
      case PaymentMethodEnum.APPLE_PAY:
        return 'Apple Pay';
      case PaymentMethodEnum.GOOGLE_PAY:
        return 'Google Pay';
      default:
        return 'Card';
    }
  }

  /**
   * Check if Apple Pay is available
   */
  async isApplePaySupported(): Promise<boolean> {
    try {
      // This would be implemented using the Stripe SDK's method
      // return await isApplePaySupported();
      return false; // Placeholder
    } catch {
      return false;
    }
  }

  /**
   * Check if Google Pay is available
   */
  async isGooglePaySupported(): Promise<boolean> {
    try {
      // This would be implemented using the Stripe SDK's method
      // return await isGooglePaySupported();
      return false; // Placeholder
    } catch {
      return false;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const stripeService = new StripePaymentService();

// ============================================================================
// PROVIDER WRAPPER COMPONENT
// ============================================================================

export const StripeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {children}
    </StripeProvider>
  );
};

// ============================================================================
// REACT HOOKS
// ============================================================================

export const useStripePayments = () => {
  const stripe = useStripe();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  return {
    stripe,
    initPaymentSheet,
    presentPaymentSheet,
    stripeService,
  };
};