/**
 * Order management types for NiteNite React Native app
 * Based on website's proven patterns, adapted for Supabase
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay'
}

export enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  FULFILLED = 'fulfilled',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  RETURNED = 'returned'
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  PICKUP = 'pickup'
}

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Address {
  id?: string;
  order_id?: string;
  address_type?: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  company?: string;
  street_line1: string;
  street_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone: string;
  is_residential: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  product_image?: string;
  variant_id?: string;
  variant_title?: string;
  price: number; // in cents
  compare_at_price?: number; // in cents
  quantity: number;
  subtotal: number; // in cents
  tax_amount: number; // in cents
  discount_amount: number; // in cents
  total: number; // in cents
  fulfillment_status: FulfillmentStatus;
  fulfilled_quantity: number;
  created_at?: string;
}

export interface PaymentInfo {
  id?: string;
  order_id?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  amount: number; // in cents
  currency: string;
  card_last4?: string;
  card_brand?: string;
  receipt_url?: string;
  created_at?: string;
  paid_at?: string;
}

export interface ShippingInfo {
  id?: string;
  order_id?: string;
  method: ShippingMethod;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  cost: number; // in cents
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at?: string;
}

export interface OrderDiscount {
  id?: string;
  order_id?: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  amount_saved: number; // in cents
  description?: string;
  created_at?: string;
}

export interface RefundInfo {
  id?: string;
  order_id?: string;
  refund_id: string; // Stripe refund ID
  amount: number; // in cents
  reason: string;
  status: string;
  notes?: string;
  created_at?: string;
  processed_at?: string;
}

export interface Order {
  id?: string;
  order_number: string;
  customer_id?: string;
  customer_email: string;
  customer_phone: string;
  customer_note?: string;

  // Financial totals (in cents)
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  discount_total: number;
  total: number;
  total_refunded: number;

  // Status tracking
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;

  // Metadata
  source: string;
  ip_address?: string;
  user_agent?: string;
  tags: string[];
  admin_notes?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
  processed_at?: string;

  // Related data (populated when fetched with joins)
  items?: OrderItem[];
  billing_address?: Address;
  shipping_address?: Address;
  payment?: PaymentInfo;
  shipping?: ShippingInfo;
  discounts?: OrderDiscount[];
  refunds?: RefundInfo[];
}

// ============================================================================
// CUSTOMER SAVED DATA
// ============================================================================

export interface CustomerAddress {
  id?: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  company?: string;
  street_line1: string;
  street_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone: string;
  is_residential: boolean;
  is_default: boolean;
  address_type: 'billing' | 'shipping' | 'both';
  created_at?: string;
  updated_at?: string;
}

export interface CustomerPaymentMethod {
  id?: string;
  customer_id: string;
  stripe_payment_method_id: string;
  method_type: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default: boolean;
  created_at?: string;
}

// ============================================================================
// VIEW TYPES (for complex queries)
// ============================================================================

export interface OrderSummary {
  id: string;
  order_number: string;
  customer_email: string;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  item_count: number;
  total_quantity: number;
}

export interface OrderDetails extends Order {
  // Billing address fields
  billing_first_name?: string;
  billing_last_name?: string;
  billing_company?: string;
  billing_street_line1?: string;
  billing_street_line2?: string;
  billing_city?: string;
  billing_state_province?: string;
  billing_postal_code?: string;
  billing_country?: string;
  billing_phone?: string;

  // Shipping address fields
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_company?: string;
  shipping_street_line1?: string;
  shipping_street_line2?: string;
  shipping_city?: string;
  shipping_state_province?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  shipping_phone?: string;

  // Payment info fields
  payment_method?: PaymentMethod;
  card_last4?: string;
  card_brand?: string;
  paid_at?: string;

  // Shipping info fields
  shipping_method?: ShippingMethod;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateOrderRequest {
  customer_email: string;
  customer_phone: string;
  customer_note?: string;
  billing_address: Omit<Address, 'id' | 'order_id' | 'address_type' | 'created_at'>;
  shipping_address: Omit<Address, 'id' | 'order_id' | 'address_type' | 'created_at'>;
  items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[];
  shipping: Omit<ShippingInfo, 'id' | 'order_id' | 'created_at'>;
  payment_method: PaymentMethod;
  promo_code?: string;
  source?: string;
}

export interface UpdateOrderStatusRequest {
  order_id: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
  admin_notes?: string;
}

export interface ShippingCalculationRequest {
  items: Array<{
    product_id: string;
    quantity: number;
    weight?: number;
  }>;
  shipping_address: {
    country: string;
    state_province: string;
    postal_code: string;
  };
  shipping_method: ShippingMethod;
}

export interface ShippingCalculationResponse {
  method: ShippingMethod;
  cost: number; // in cents
  estimated_delivery_days: number;
  carrier?: string;
}

export interface TaxCalculationRequest {
  items: Array<{
    product_id: string;
    price: number; // in cents
    quantity: number;
    tax_category?: string;
  }>;
  shipping_address: {
    country: string;
    state_province: string;
    postal_code: string;
    city: string;
  };
}

export interface TaxCalculationResponse {
  total_tax: number; // in cents
  tax_rate: number; // percentage
  breakdown: Array<{
    type: string;
    rate: number;
    amount: number;
  }>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface OrderMetrics {
  total_orders: number;
  total_revenue: number; // in cents
  average_order_value: number; // in cents
  orders_by_status: Record<OrderStatus, number>;
  recent_orders: OrderSummary[];
}

export interface PaymentMetrics {
  successful_payments: number;
  failed_payments: number;
  total_processed: number; // in cents
  average_processing_time: number; // seconds
  payment_methods_breakdown: Record<PaymentMethod, number>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface OrderError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError extends OrderError {
  field: string;
  value?: any;
}

// ============================================================================
// STRIPE INTEGRATION TYPES
// ============================================================================

export interface StripePaymentIntentData {
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeCheckoutSessionData {
  session_id: string;
  url: string;
  order_id: string;
}

// ============================================================================
// UTILITY FUNCTIONS TYPE DEFINITIONS
// ============================================================================

export type CentsToDecimal = (cents: number) => number;
export type DecimalToCents = (decimal: number) => number;
export type FormatCurrency = (cents: number, currency?: string) => string;
export type GenerateOrderNumber = () => string;
export type CalculateOrderTotals = (items: OrderItem[], shipping: number, tax: number, discounts: number) => {
  subtotal: number;
  total: number;
};

// ============================================================================
// HOOK TYPES (for React Native)
// ============================================================================

export interface UseOrdersOptions {
  customer_id?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  limit?: number;
  offset?: number;
}

export interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: OrderError | null;
  total_count: number;
  refetch: () => Promise<void>;
}

export interface UseOrderResult {
  order: Order | null;
  loading: boolean;
  error: OrderError | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// BUSINESS LOGIC CONSTANTS
// ============================================================================

export const ORDER_CONSTANTS = {
  // Tax rates by state (US)
  TAX_RATES: {
    'CA': 0.0875, // California
    'NY': 0.08,   // New York
    'TX': 0.0625, // Texas
    'FL': 0.06,   // Florida
    // Add more as needed
  } as Record<string, number>,

  // Shipping costs (in cents)
  SHIPPING_COSTS: {
    [ShippingMethod.STANDARD]: 999,   // $9.99
    [ShippingMethod.EXPRESS]: 1999,   // $19.99
    [ShippingMethod.OVERNIGHT]: 3999, // $39.99
    [ShippingMethod.PICKUP]: 0,       // Free
  },

  // Free shipping threshold (in cents)
  FREE_SHIPPING_THRESHOLD: 5000, // $50.00

  // Order number prefix
  ORDER_NUMBER_PREFIX: 'NP',

  // Default currency
  DEFAULT_CURRENCY: 'USD',

  // Status transitions
  ALLOWED_STATUS_TRANSITIONS: {
    [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED, OrderStatus.PARTIALLY_REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
    [OrderStatus.PARTIALLY_REFUNDED]: [OrderStatus.REFUNDED],
  }
} as const;