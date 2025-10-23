-- NitePutter Shop Database Schema
-- This script creates all necessary tables for the shop functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE product_category AS ENUM ('basic', 'pro', 'complete', 'accessories');
CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived', 'out_of_stock');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'confirmed', 'cancelled');

-- Categories table
CREATE TABLE public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (comprehensive schema matching website)
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category product_category NOT NULL,
    status product_status DEFAULT 'active',
    short_description TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    whats_included TEXT[] DEFAULT '{}',
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    compare_at_price DECIMAL(10,2) CHECK (compare_at_price IS NULL OR compare_at_price > 0),
    cost_per_unit DECIMAL(10,2) CHECK (cost_per_unit IS NULL OR cost_per_unit > 0),
    images JSONB DEFAULT '[]',
    video_url TEXT,
    instruction_manual_url TEXT,
    specifications JSONB NOT NULL,
    shipping JSONB NOT NULL,
    inventory JSONB NOT NULL,
    seo JSONB NOT NULL,
    average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    related_products TEXT[] DEFAULT '{}',
    cross_sells TEXT[] DEFAULT '{}'
);

-- Cart items table
CREATE TABLE public.cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest users
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT cart_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Orders table
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255), -- For guest users
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(10,2) CHECK (discount IS NULL OR discount >= 0),
    shipping DECIMAL(10,2) NOT NULL CHECK (shipping >= 0),
    tax DECIMAL(10,2) NOT NULL CHECK (tax >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    promo_code_used VARCHAR(50),
    status order_status DEFAULT 'pending',
    shipping_address JSONB,
    payment_method JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    tracking_number VARCHAR(100)
);

-- Order items table
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_cart_items_session_id ON public.cart_items(session_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Full-text search index for products
CREATE INDEX idx_products_search ON public.products USING gin(
    to_tsvector('english', name || ' ' || short_description || ' ' || description || ' ' || array_to_string(features, ' '))
);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Categories: Public read access
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

-- Products: Public read access for active products
CREATE POLICY "Active products are viewable by everyone" ON public.products
    FOR SELECT USING (status = 'active');

-- Cart items: Users can only see/modify their own cart items
CREATE POLICY "Users can view own cart items" ON public.cart_items
    FOR SELECT USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can insert own cart items" ON public.cart_items
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can update own cart items" ON public.cart_items
    FOR UPDATE USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can delete own cart items" ON public.cart_items
    FOR DELETE USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND session_id IS NOT NULL)
    );

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = user_id OR
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        (user_id IS NULL AND session_id IS NOT NULL)
    );

-- Order items: Users can view order items for their orders
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_id AND (
                auth.uid() = user_id OR
                (user_id IS NULL AND session_id IS NOT NULL)
            )
        )
    );

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
    ('Basic', 'basic', 'Essential LED lighting products for night golf'),
    ('Pro', 'pro', 'Professional-grade LED systems with advanced features'),
    ('Complete', 'complete', 'Complete practice kits with all accessories'),
    ('Accessories', 'accessories', 'Additional accessories and replacement parts');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT INSERT, SELECT, UPDATE ON public.orders TO authenticated;
GRANT INSERT, SELECT ON public.order_items TO authenticated;