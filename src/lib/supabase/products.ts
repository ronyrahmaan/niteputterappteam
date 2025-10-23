import { supabase } from './client'
import { Product } from './types'

export class ProductsAPI {
  /**
   * Fetch all active products with optional filtering
   */
  static async getProducts(filters?: {
    category?: string
    search?: string
    sortBy?: 'name' | 'price' | 'rating' | 'featured'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active')

      // Apply category filter
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      // Apply search filter
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      if (filters?.sortBy) {
        const order = filters.sortOrder || 'asc'
        switch (filters.sortBy) {
          case 'name':
            query = query.order('name', { ascending: order === 'asc' })
            break
          case 'price':
            query = query.order('price', { ascending: order === 'asc' })
            break
          case 'rating':
            query = query.order('average_rating', { ascending: order === 'asc' })
            break
          case 'featured':
            query = query.order('created_at', { ascending: order === 'asc' })
            break
        }
      } else {
        // Default sort by created_at desc (newest first)
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getProducts:', error)
      return { data: [], error }
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getProductById:', error)
      return { data: null, error }
    }
  }

  /**
   * Get a single product by SKU
   */
  static async getProductBySku(sku: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error fetching product by SKU:', error)
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getProductBySku:', error)
      return { data: null, error }
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products by category:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getProductsByCategory:', error)
      return { data: [], error }
    }
  }

  /**
   * Search products by text
   */
  static async searchProducts(searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('name')

      if (error) {
        console.error('Error searching products:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in searchProducts:', error)
      return { data: [], error }
    }
  }

  /**
   * Get related products (cross-sells and related)
   */
  static async getRelatedProducts(productId: string) {
    try {
      // First get the current product to find its related product SKUs
      const { data: currentProduct, error: currentError } = await supabase
        .from('products')
        .select('related_products, cross_sells')
        .eq('id', productId)
        .single()

      if (currentError) {
        throw currentError
      }

      const relatedSkus = [
        ...(currentProduct.related_products || []),
        ...(currentProduct.cross_sells || [])
      ]

      if (relatedSkus.length === 0) {
        return { data: [], error: null }
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('sku', relatedSkus)
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching related products:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getRelatedProducts:', error)
      return { data: [], error }
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit: number = 6) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('average_rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching featured products:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getFeaturedProducts:', error)
      return { data: [], error }
    }
  }

  /**
   * Check product inventory
   */
  static async checkInventory(productId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('inventory')
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error checking inventory:', error)
        throw error
      }

      const inventory = data.inventory as any
      const available = inventory.quantity - inventory.reserved_quantity
      const isInStock = available > 0 || inventory.allow_backorder
      const isLowStock = available > 0 && available <= inventory.low_stock_threshold

      return {
        data: {
          available,
          isInStock,
          isLowStock,
          allowBackorder: inventory.allow_backorder
        },
        error: null
      }
    } catch (error) {
      console.error('Error in checkInventory:', error)
      return { data: null, error }
    }
  }
}

// Real-time subscriptions for products
export class ProductSubscriptions {
  /**
   * Subscribe to product inventory changes
   */
  static subscribeToInventoryUpdates(productId: string, callback: (product: Product) => void) {
    return supabase
      .channel(`product-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`
        },
        (payload) => {
          callback(payload.new as Product)
        }
      )
      .subscribe()
  }

  /**
   * Subscribe to all product changes
   */
  static subscribeToProductUpdates(callback: (product: Product, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    return supabase
      .channel('products-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          const product = (payload.new || payload.old) as Product
          callback(product, eventType)
        }
      )
      .subscribe()
  }
}