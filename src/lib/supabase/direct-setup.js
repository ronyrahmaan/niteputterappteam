const https = require('https')

const supabaseUrl = 'https://hjgtvqhdzfifranfhepp.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ3R2cWhkemZpZnJhbmZoZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA3OTM0NSwiZXhwIjoyMDc2NjU1MzQ1fQ.Re52eQWQg8R6INAoorf_2RRwy4SIcRKuXvmARNWa7mQ'

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql })

    const options = {
      hostname: 'hjgtvqhdzfifranfhepp.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: JSON.parse(data) })
        } else {
          reject({ success: false, status: res.statusCode, data: data })
        }
      })
    })

    req.on('error', (error) => {
      reject({ success: false, error: error.message })
    })

    req.write(postData)
    req.end()
  })
}

async function setupDatabaseDirect() {
  console.log('🚀 Setting up database directly via SQL commands...')

  const sqlCommands = [
    // Create enums
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_category') THEN
        CREATE TYPE product_category AS ENUM ('basic', 'pro', 'complete', 'accessories');
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
        CREATE TYPE product_status AS ENUM ('active', 'draft', 'archived', 'out_of_stock');
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'confirmed', 'cancelled');
      END IF;
    END $$;`,

    // Create categories table
    `CREATE TABLE IF NOT EXISTS public.categories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // Create products table
    `CREATE TABLE IF NOT EXISTS public.products (
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
      price DECIMAL(10,2) NOT NULL,
      compare_at_price DECIMAL(10,2),
      cost_per_unit DECIMAL(10,2),
      images JSONB DEFAULT '[]',
      video_url TEXT,
      instruction_manual_url TEXT,
      specifications JSONB DEFAULT '{}',
      shipping JSONB DEFAULT '{}',
      inventory JSONB DEFAULT '{}',
      seo JSONB DEFAULT '{}',
      average_rating DECIMAL(3,2) DEFAULT 0.0,
      review_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      published_at TIMESTAMP WITH TIME ZONE,
      related_products TEXT[] DEFAULT '{}',
      cross_sells TEXT[] DEFAULT '{}'
    );`,

    // Enable RLS
    `ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;`,

    // Create policies
    `DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;`,
    `CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);`,

    `DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;`,
    `CREATE POLICY "Active products are viewable by everyone" ON public.products FOR SELECT USING (status = 'active');`,

    // Insert categories
    `INSERT INTO public.categories (name, slug, description) VALUES
      ('Basic', 'basic', 'Essential LED lighting products for night golf'),
      ('Pro', 'pro', 'Professional-grade LED systems with advanced features'),
      ('Complete', 'complete', 'Complete practice kits with all accessories'),
      ('Accessories', 'accessories', 'Additional accessories and replacement parts')
    ON CONFLICT (slug) DO NOTHING;`
  ]

  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i]
    console.log(`📝 Executing command ${i + 1}/${sqlCommands.length}...`)

    try {
      const result = await executeSQL(sql)
      console.log(`✅ Command ${i + 1} executed successfully`)
    } catch (error) {
      console.error(`❌ Error executing command ${i + 1}:`, error)
      // Continue with other commands
    }
  }

  console.log('🎉 Database setup completed!')
  return true
}

// Run setup
setupDatabaseDirect()
  .then(() => {
    console.log('✅ Setup finished!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })