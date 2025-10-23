-- ============================================================================
-- NiteNite E-commerce Order Management Schema for Supabase (CLEAN VERSION)
-- This version safely handles existing types and tables
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS (with safe creation)
-- ============================================================================

-- Drop existing types if they exist, then recreate
DO $$
BEGIN
    -- Drop existing types (if they exist)
    DROP TYPE IF EXISTS order_status CASCADE;
    DROP TYPE IF EXISTS payment_status CASCADE;
    DROP TYPE IF EXISTS payment_method CASCADE;
    DROP TYPE IF EXISTS fulfillment_status CASCADE;
    DROP TYPE IF EXISTS shipping_method CASCADE;
END $$;

-- Order status workflow
CREATE TYPE order_status AS ENUM (
    'pending',
    'processing',
    'paid',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'partially_refunded'
);

-- Payment status tracking
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'partially_refunded',
    'cancelled'
);

-- Payment methods
CREATE TYPE payment_method AS ENUM (
    'stripe',
    'apple_pay',
    'google_pay'
);

-- Fulfillment status
CREATE TYPE fulfillment_status AS ENUM (
    'unfulfilled',
    'partially_fulfilled',
    'fulfilled',
    'shipped',
    'delivered',
    'returned'
);

-- Shipping methods
CREATE TYPE shipping_method AS ENUM (
    'standard',
    'express',
    'overnight',
    'pickup'
);

-- ============================================================================
-- DROP EXISTING TABLES (if they exist)
-- ============================================================================

DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS order_discounts CASCADE;
DROP TABLE IF EXISTS shipping_info CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS customer_payment_methods CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS order_details CASCADE;
DROP VIEW IF EXISTS order_summary CASCADE;

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Orders table - main order information
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Order identification
    order_number VARCHAR(50) UNIQUE NOT NULL,

    -- Customer information
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_note TEXT,

    -- Financial summary (stored in cents for precision)
    subtotal BIGINT NOT NULL DEFAULT 0, -- cents
    shipping_total BIGINT NOT NULL DEFAULT 0, -- cents
    tax_total BIGINT NOT NULL DEFAULT 0, -- cents
    discount_total BIGINT NOT NULL DEFAULT 0, -- cents
    total BIGINT NOT NULL DEFAULT 0, -- cents
    total_refunded BIGINT NOT NULL DEFAULT 0, -- cents

    -- Status tracking
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    fulfillment_status fulfillment_status NOT NULL DEFAULT 'unfulfilled',

    -- Metadata
    source VARCHAR(50) NOT NULL DEFAULT 'app',
    ip_address INET,
    user_agent TEXT,
    tags TEXT[] DEFAULT '{}',
    admin_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Indexes for performance
    CONSTRAINT orders_total_positive CHECK (total >= 0),
    CONSTRAINT orders_subtotal_positive CHECK (subtotal >= 0)
);

-- Order items - individual line items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Product information
    product_id VARCHAR(255) NOT NULL,
    product_sku VARCHAR(255) NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_image TEXT,
    variant_id VARCHAR(255),
    variant_title VARCHAR(255),

    -- Pricing (in cents)
    price BIGINT NOT NULL,
    compare_at_price BIGINT,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal BIGINT NOT NULL,
    tax_amount BIGINT NOT NULL DEFAULT 0,
    discount_amount BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL,

    -- Fulfillment
    fulfillment_status fulfillment_status NOT NULL DEFAULT 'unfulfilled',
    fulfilled_quantity INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_price_positive CHECK (price > 0),
    CONSTRAINT order_items_fulfilled_quantity_valid CHECK (fulfilled_quantity >= 0 AND fulfilled_quantity <= quantity)
);

-- Addresses - billing and shipping addresses
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL CHECK (address_type IN ('billing', 'shipping')),

    -- Address fields
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    street_line1 VARCHAR(255) NOT NULL,
    street_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    phone VARCHAR(50) NOT NULL,
    is_residential BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one billing and one shipping address per order
    UNIQUE(order_id, address_type)
);

-- Payment information
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Payment details
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    amount BIGINT NOT NULL, -- cents
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',

    -- Card details (if applicable)
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    receipt_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT payments_amount_positive CHECK (amount > 0)
);

-- Shipping information
CREATE TABLE shipping_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Shipping details
    method shipping_method NOT NULL,
    carrier VARCHAR(100), -- "USPS", "UPS", "FedEx"
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    cost BIGINT NOT NULL DEFAULT 0, -- cents

    -- Timestamps
    estimated_delivery TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT shipping_info_cost_positive CHECK (cost >= 0),

    -- One shipping info per order
    UNIQUE(order_id)
);

-- Discounts/coupons applied to orders
CREATE TABLE order_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Discount details
    code VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- "percentage", "fixed_amount", "free_shipping"
    value DECIMAL(10,2) NOT NULL,
    amount_saved BIGINT NOT NULL, -- cents
    description TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT order_discounts_amount_saved_positive CHECK (amount_saved >= 0)
);

-- Refunds tracking
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Refund details
    refund_id VARCHAR(255) NOT NULL, -- Stripe refund ID
    amount BIGINT NOT NULL, -- cents
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT refunds_amount_positive CHECK (amount > 0)
);

-- ============================================================================
-- SAVED CUSTOMER DATA (for returning customers)
-- ============================================================================

-- Saved customer addresses
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Address fields
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(200),
    street_line1 VARCHAR(255) NOT NULL,
    street_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'US',
    phone VARCHAR(50) NOT NULL,
    is_residential BOOLEAN NOT NULL DEFAULT true,

    -- Address metadata
    is_default BOOLEAN NOT NULL DEFAULT false,
    address_type VARCHAR(20) NOT NULL DEFAULT 'both', -- 'billing', 'shipping', 'both'

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved payment methods (minimal info, actual payment methods stored in Stripe)
CREATE TABLE customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Payment method reference
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    method_type VARCHAR(50) NOT NULL,

    -- Card details for display
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,

    -- Metadata
    is_default BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(customer_id, stripe_payment_method_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Orders indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Addresses indexes
CREATE INDEX idx_addresses_order_id ON addresses(order_id);

-- Payments indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

-- Customer addresses indexes
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_is_default ON customer_addresses(customer_id, is_default);

-- Customer payment methods indexes
CREATE INDEX idx_customer_payment_methods_customer_id ON customer_payment_methods(customer_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update orders.updated_at on any change
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Update customer_addresses.updated_at on any change
CREATE OR REPLACE FUNCTION update_customer_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_addresses_updated_at
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_addresses_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Orders policies - customers can only see their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own pending orders" ON orders
    FOR UPDATE USING (auth.uid() = customer_id AND status = 'pending');

-- Order items policies - access through orders
CREATE POLICY "Users can view their order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Addresses policies
CREATE POLICY "Users can view their order addresses" ON addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = addresses.order_id
            AND orders.customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their order addresses" ON addresses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = addresses.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Payments policies
CREATE POLICY "Users can view their order payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = payments.order_id
            AND orders.customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their order payments" ON payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = payments.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Shipping info policies
CREATE POLICY "Users can view their order shipping" ON shipping_info
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = shipping_info.order_id
            AND orders.customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their order shipping" ON shipping_info
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = shipping_info.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- Customer data policies
CREATE POLICY "Users can manage their own addresses" ON customer_addresses
    FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Users can manage their own payment methods" ON customer_payment_methods
    FOR ALL USING (auth.uid() = customer_id);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    counter INTEGER;
BEGIN
    -- Get next counter value
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'NP(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM orders
    WHERE order_number ~ '^NP\d+$';

    -- Format as NP followed by 6-digit number
    new_number := 'NP' || LPAD(counter::TEXT, 6, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals(order_uuid UUID)
RETURNS VOID AS $$
DECLARE
    calculated_subtotal BIGINT;
    calculated_total BIGINT;
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(subtotal), 0)
    INTO calculated_subtotal
    FROM order_items
    WHERE order_id = order_uuid;

    -- Calculate total (subtotal + shipping + tax - discounts)
    SELECT calculated_subtotal + shipping_total + tax_total - discount_total
    INTO calculated_total
    FROM orders
    WHERE id = order_uuid;

    -- Update the order
    UPDATE orders
    SET
        subtotal = calculated_subtotal,
        total = calculated_total,
        updated_at = NOW()
    WHERE id = order_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Complete order view with all related data
CREATE VIEW order_details_view AS
SELECT
    o.*,
    -- Billing address
    ba.first_name as billing_first_name,
    ba.last_name as billing_last_name,
    ba.company as billing_company,
    ba.street_line1 as billing_street_line1,
    ba.street_line2 as billing_street_line2,
    ba.city as billing_city,
    ba.state_province as billing_state_province,
    ba.postal_code as billing_postal_code,
    ba.country as billing_country,
    ba.phone as billing_phone,

    -- Shipping address
    sa.first_name as shipping_first_name,
    sa.last_name as shipping_last_name,
    sa.company as shipping_company,
    sa.street_line1 as shipping_street_line1,
    sa.street_line2 as shipping_street_line2,
    sa.city as shipping_city,
    sa.state_province as shipping_state_province,
    sa.postal_code as shipping_postal_code,
    sa.country as shipping_country,
    sa.phone as shipping_phone,

    -- Payment info
    p.method as payment_method,
    p.card_last4,
    p.card_brand,
    p.paid_at,

    -- Shipping info
    si.method as shipping_method,
    si.carrier,
    si.tracking_number,
    si.tracking_url,
    si.shipped_at,
    si.delivered_at

FROM orders o
LEFT JOIN addresses ba ON o.id = ba.order_id AND ba.address_type = 'billing'
LEFT JOIN addresses sa ON o.id = sa.order_id AND sa.address_type = 'shipping'
LEFT JOIN payments p ON o.id = p.order_id
LEFT JOIN shipping_info si ON o.id = si.order_id;

-- Order summary for listings
CREATE VIEW order_summary_view AS
SELECT
    o.id,
    o.order_number,
    o.customer_email,
    o.total,
    o.status,
    o.payment_status,
    o.created_at,
    COUNT(oi.id) as item_count,
    COALESCE(SUM(oi.quantity), 0) as total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_email, o.total, o.status, o.payment_status, o.created_at
ORDER BY o.created_at DESC;