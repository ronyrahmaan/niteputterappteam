export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          sku: string
          name: string
          slug: string
          category: ProductCategory
          status: ProductStatus
          short_description: string
          description: string
          features: string[]
          whats_included: string[]
          price: number
          compare_at_price: number | null
          cost_per_unit: number | null
          images: ProductImage[]
          video_url: string | null
          instruction_manual_url: string | null
          specifications: ProductSpecification
          shipping: ShippingInfo
          inventory: InventoryInfo
          seo: SEOInfo
          average_rating: number
          review_count: number
          created_at: string
          updated_at: string
          published_at: string | null
          related_products: string[]
          cross_sells: string[]
        }
        Insert: {
          id?: string
          sku: string
          name: string
          slug?: string
          category: ProductCategory
          status?: ProductStatus
          short_description: string
          description: string
          features?: string[]
          whats_included?: string[]
          price: number
          compare_at_price?: number | null
          cost_per_unit?: number | null
          images?: ProductImage[]
          video_url?: string | null
          instruction_manual_url?: string | null
          specifications: ProductSpecification
          shipping: ShippingInfo
          inventory: InventoryInfo
          seo: SEOInfo
          average_rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
          related_products?: string[]
          cross_sells?: string[]
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          slug?: string
          category?: ProductCategory
          status?: ProductStatus
          short_description?: string
          description?: string
          features?: string[]
          whats_included?: string[]
          price?: number
          compare_at_price?: number | null
          cost_per_unit?: number | null
          images?: ProductImage[]
          video_url?: string | null
          instruction_manual_url?: string | null
          specifications?: ProductSpecification
          shipping?: ShippingInfo
          inventory?: InventoryInfo
          seo?: SEOInfo
          average_rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
          related_products?: string[]
          cross_sells?: string[]
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          subtotal: number
          discount: number | null
          shipping: number
          tax: number
          total: number
          promo_code_used: string | null
          status: OrderStatus
          shipping_address: ShippingAddress | null
          payment_method: PaymentMethod | null
          created_at: string
          updated_at: string
          estimated_delivery: string | null
          tracking_number: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          subtotal: number
          discount?: number | null
          shipping: number
          tax: number
          total: number
          promo_code_used?: string | null
          status?: OrderStatus
          shipping_address?: ShippingAddress | null
          payment_method?: PaymentMethod | null
          created_at?: string
          updated_at?: string
          estimated_delivery?: string | null
          tracking_number?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          subtotal?: number
          discount?: number | null
          shipping?: number
          tax?: number
          total?: number
          promo_code_used?: string | null
          status?: OrderStatus
          shipping_address?: ShippingAddress | null
          payment_method?: PaymentMethod | null
          created_at?: string
          updated_at?: string
          estimated_delivery?: string | null
          tracking_number?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product_category: ProductCategory
      product_status: ProductStatus
      order_status: OrderStatus
    }
  }
}

// Product related types
export type ProductCategory = 'basic' | 'pro' | 'complete' | 'accessories'
export type ProductStatus = 'active' | 'draft' | 'archived' | 'out_of_stock'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'confirmed' | 'cancelled'

export interface ProductImage {
  url: string
  alt_text: string
  is_primary: boolean
  display_order: number
}

export interface ProductSpecification {
  battery_life: string
  charging_time: string
  led_brightness: string
  weight: string
  material: string
  water_resistance: string
  warranty: string
}

export interface ShippingInfo {
  weight: number
  length: number
  width: number
  height: number
  ships_separately: boolean
}

export interface InventoryInfo {
  quantity: number
  reserved_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  allow_backorder: boolean
}

export interface SEOInfo {
  meta_title: string | null
  meta_description: string | null
  url_slug: string
  keywords: string[]
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay'
  cardLast4?: string
}

// App-specific types that extend the database types
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type CartItem = Database['public']['Tables']['cart_items']['Row'] & {
  product: Product
}

export type Order = Database['public']['Tables']['orders']['Row'] & {
  items: OrderItem[]
}

export type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  product: Product
}