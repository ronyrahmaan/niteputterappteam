const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hjgtvqhdzfifranfhepp.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3R2cWhkemZpZnJhbmZoZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3OTM0NSwiZXhwIjoyMDc2NjU1MzQ1fQ.Re52eQWQg8R6INAoorf_2RRwy4SIcRKuXvmARNWa7mQ'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function createTablesDirectly() {
  console.log('🚀 Creating tables directly via Supabase...')

  try {
    // First, let's create categories table with a simple insert approach
    console.log('📝 Creating and populating categories...')

    // Try to insert categories directly (table might already exist)
    const categories = [
      { name: 'Basic', slug: 'basic', description: 'Essential LED lighting products for night golf' },
      { name: 'Pro', slug: 'pro', description: 'Professional-grade LED systems with advanced features' },
      { name: 'Complete', slug: 'complete', description: 'Complete practice kits with all accessories' },
      { name: 'Accessories', slug: 'accessories', description: 'Additional accessories and replacement parts' }
    ]

    for (const category of categories) {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .upsert([category], { onConflict: 'slug' })

      if (error) {
        console.log(`ℹ️ Category table might not exist yet. Error: ${error.message}`)
      } else {
        console.log(`✅ Category ${category.name} processed successfully`)
      }
    }

    // Check if we can read from products table
    console.log('🔍 Checking if products table exists...')
    const { data: productsTest, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id')
      .limit(1)

    if (productsError) {
      console.log(`ℹ️ Products table doesn't exist yet. Error: ${productsError.message}`)
      console.log('📋 Please run the SQL schema in Supabase SQL Editor:')
      console.log('\n--- COPY THIS SQL TO SUPABASE SQL EDITOR ---')
      console.log(`
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
        CREATE TYPE product_category AS ENUM ('basic', 'pro', 'complete', 'accessories');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived', 'out_of_stock');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'confirmed', 'cancelled');
    END IF;
END$$;

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    compare_at_price DECIMAL(10,2),
    cost_per_unit DECIMAL(10,2),
    images JSONB DEFAULT '[]',
    video_url TEXT,
    instruction_manual_url TEXT,
    specifications JSONB NOT NULL DEFAULT '{}',
    shipping JSONB NOT NULL DEFAULT '{}',
    inventory JSONB NOT NULL DEFAULT '{}',
    seo JSONB NOT NULL DEFAULT '{}',
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    related_products TEXT[] DEFAULT '{}',
    cross_sells TEXT[] DEFAULT '{}'
);

-- Cart items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(10,2),
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
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Active products are viewable by everyone" ON public.products FOR SELECT USING (status = 'active');

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
    ('Basic', 'basic', 'Essential LED lighting products for night golf'),
    ('Pro', 'pro', 'Professional-grade LED systems with advanced features'),
    ('Complete', 'complete', 'Complete practice kits with all accessories'),
    ('Accessories', 'accessories', 'Additional accessories and replacement parts')
ON CONFLICT (slug) DO NOTHING;
      `)
      console.log('--- END SQL ---\n')
    } else {
      console.log('✅ Products table exists!')
    }

    console.log('🎉 Table check completed!')
    return true

  } catch (error) {
    console.error('💥 Setup failed:', error)
    throw error
  }
}

// Execute the setup
createTablesDirectly()
  .then(() => {
    console.log('✅ Setup process completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })