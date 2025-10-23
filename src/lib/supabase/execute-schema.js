const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://hjgtvqhdzfifranfhepp.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3R2cWhkemZpZnJhbmZoZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3OTM0NSwiZXhwIjoyMDc2NjU1MzQ1fQ.Re52eQWQg8R6INAoorf_2RRwy4SIcRKuXvmARNWa7mQ'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function executeSchemaStepByStep() {
  console.log('🚀 Setting up Supabase database schema step by step...')

  try {
    // Step 1: Create ENUM types
    console.log('📝 Creating ENUM types...')

    const enums = [
      "CREATE TYPE product_category AS ENUM ('basic', 'pro', 'complete', 'accessories');",
      "CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived', 'out_of_stock');",
      "CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'confirmed', 'cancelled');"
    ]

    for (const enumSql of enums) {
      try {
        await supabaseAdmin.rpc('exec', { sql: enumSql })
        console.log('✅ Enum created successfully')
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️ Enum already exists, skipping...')
        } else {
          console.error('❌ Error creating enum:', error)
        }
      }
    }

    // Step 2: Create categories table
    console.log('📝 Creating categories table...')
    const categoriesTable = `
      CREATE TABLE IF NOT EXISTS public.categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: categoriesError } = await supabaseAdmin.rpc('exec', { sql: categoriesTable })
    if (categoriesError) {
      console.error('❌ Error creating categories table:', categoriesError)
    } else {
      console.log('✅ Categories table created successfully')
    }

    // Step 3: Create products table
    console.log('📝 Creating products table...')
    const productsTable = `
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
    `

    const { error: productsError } = await supabaseAdmin.rpc('exec', { sql: productsTable })
    if (productsError) {
      console.error('❌ Error creating products table:', productsError)
    } else {
      console.log('✅ Products table created successfully')
    }

    // Step 4: Insert default categories
    console.log('📝 Inserting default categories...')
    const categories = [
      { name: 'Basic', slug: 'basic', description: 'Essential LED lighting products for night golf' },
      { name: 'Pro', slug: 'pro', description: 'Professional-grade LED systems with advanced features' },
      { name: 'Complete', slug: 'complete', description: 'Complete practice kits with all accessories' },
      { name: 'Accessories', slug: 'accessories', description: 'Additional accessories and replacement parts' }
    ]

    for (const category of categories) {
      const { error } = await supabaseAdmin
        .from('categories')
        .upsert([category], { onConflict: 'slug' })

      if (error) {
        console.error(`❌ Error inserting category ${category.name}:`, error)
      } else {
        console.log(`✅ Category ${category.name} inserted successfully`)
      }
    }

    console.log('🎉 Database schema setup completed successfully!')
    return true

  } catch (error) {
    console.error('💥 Schema setup failed:', error)
    throw error
  }
}

// Execute the setup
executeSchemaStepByStep()
  .then(() => {
    console.log('✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })