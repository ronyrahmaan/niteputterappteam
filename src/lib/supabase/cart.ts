import { supabase } from './client'
import { CartItem } from './types'
import AsyncStorage from '@react-native-async-storage/async-storage'

export class CartAPI {
  /**
   * Get current session ID for guest users
   */
  static async getSessionId(): Promise<string> {
    try {
      let sessionId = await AsyncStorage.getItem('cart_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await AsyncStorage.setItem('cart_session_id', sessionId)
      }
      return sessionId
    } catch (error) {
      console.error('Error getting session ID:', error)
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Get current user's cart items
   */
  static async getCartItems() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const sessionId = await this.getSessionId()

      let query = supabase
        .from('cart_items')
        .select(`
          *,
          product:products (*)
        `)

      if (user) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('session_id', sessionId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching cart items:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getCartItems:', error)
      return { data: [], error }
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(productId: string, quantity: number = 1) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const sessionId = await this.getSessionId()

      // Check if item already exists in cart
      let existingQuery = supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', productId)

      if (user) {
        existingQuery = existingQuery.eq('user_id', user.id)
      } else {
        existingQuery = existingQuery.eq('session_id', sessionId)
      }

      const { data: existing, error: existingError } = await existingQuery.single()

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError
      }

      if (existing) {
        // Update existing cart item quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({
            quantity: existing.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select(`
            *,
            product:products (*)
          `)
          .single()

        if (error) {
          console.error('Error updating cart item:', error)
          throw error
        }

        return { data, error: null }
      } else {
        // Create new cart item
        const cartItem = {
          product_id: productId,
          quantity,
          user_id: user?.id || null,
          session_id: user ? null : sessionId
        }

        const { data, error } = await supabase
          .from('cart_items')
          .insert([cartItem])
          .select(`
            *,
            product:products (*)
          `)
          .single()

        if (error) {
          console.error('Error adding to cart:', error)
          throw error
        }

        return { data, error: null }
      }
    } catch (error) {
      console.error('Error in addToCart:', error)
      return { data: null, error }
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItemQuantity(cartItemId: string, quantity: number) {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(cartItemId)
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId)
        .select(`
          *,
          product:products (*)
        `)
        .single()

      if (error) {
        console.error('Error updating cart item quantity:', error)
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in updateCartItemQuantity:', error)
      return { data: null, error }
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(cartItemId: string) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (error) {
        console.error('Error removing from cart:', error)
        throw error
      }

      return { error: null }
    } catch (error) {
      console.error('Error in removeFromCart:', error)
      return { error }
    }
  }

  /**
   * Clear entire cart
   */
  static async clearCart() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const sessionId = await this.getSessionId()

      let query = supabase.from('cart_items').delete()

      if (user) {
        query = query.eq('user_id', user.id)
      } else {
        query = query.eq('session_id', sessionId)
      }

      const { error } = await query

      if (error) {
        console.error('Error clearing cart:', error)
        throw error
      }

      return { error: null }
    } catch (error) {
      console.error('Error in clearCart:', error)
      return { error }
    }
  }

  /**
   * Get cart totals
   */
  static async getCartTotals() {
    try {
      const { data: cartItems } = await this.getCartItems()

      const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity)
      }, 0)

      const shipping = subtotal > 50 ? 0 : 9.99 // Free shipping over $50
      const tax = subtotal * 0.08 // 8% tax
      const total = subtotal + shipping + tax

      return {
        data: {
          subtotal,
          shipping,
          tax,
          total,
          itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        },
        error: null
      }
    } catch (error) {
      console.error('Error in getCartTotals:', error)
      return { data: null, error }
    }
  }

  /**
   * Transfer guest cart to user account (after login)
   */
  static async transferGuestCartToUser(userId: string) {
    try {
      const sessionId = await this.getSessionId()

      // Get guest cart items
      const { data: guestItems, error: guestError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId)
        .is('user_id', null)

      if (guestError) {
        throw guestError
      }

      if (!guestItems || guestItems.length === 0) {
        return { data: [], error: null }
      }

      // Get user's existing cart items
      const { data: userItems, error: userError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)

      if (userError) {
        throw userError
      }

      // Merge items
      for (const guestItem of guestItems) {
        const existingUserItem = userItems?.find(item => item.product_id === guestItem.product_id)

        if (existingUserItem) {
          // Update existing user item quantity
          await supabase
            .from('cart_items')
            .update({
              quantity: existingUserItem.quantity + guestItem.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUserItem.id)
        } else {
          // Update guest item to belong to user
          await supabase
            .from('cart_items')
            .update({
              user_id: userId,
              session_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', guestItem.id)
        }
      }

      // Delete any remaining guest items that were merged
      await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId)
        .is('user_id', null)

      return { data: guestItems, error: null }
    } catch (error) {
      console.error('Error in transferGuestCartToUser:', error)
      return { data: [], error }
    }
  }
}

// Real-time cart subscriptions
export class CartSubscriptions {
  /**
   * Subscribe to cart changes for current user
   */
  static async subscribeToCartUpdates(callback: (cartItems: CartItem[]) => void) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const sessionId = await CartAPI.getSessionId()

      const channel = supabase.channel('cart-updates')

      if (user) {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          async () => {
            const { data } = await CartAPI.getCartItems()
            callback(data)
          }
        )
      } else {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `session_id=eq.${sessionId}`
          },
          async () => {
            const { data } = await CartAPI.getCartItems()
            callback(data)
          }
        )
      }

      return channel.subscribe()
    } catch (error) {
      console.error('Error in subscribeToCartUpdates:', error)
      return null
    }
  }
}