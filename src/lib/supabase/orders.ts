import { supabase } from './client'
import {
  Order,
  OrderItem,
  Address,
  PaymentInfo,
  ShippingInfo,
  OrderDiscount,
  RefundInfo,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  OrderDetails,
  OrderSummary,
  ShippingCalculationRequest,
  ShippingCalculationResponse,
  TaxCalculationRequest,
  TaxCalculationResponse,
  ORDER_CONSTANTS
} from './order-types'

export class OrderService {
  /**
   * Create a new order with all related data
   */
  static async createOrder(orderData: CreateOrderRequest): Promise<{ order: Order | null; error: any }> {
    try {
      const orderNumber = this.generateOrderNumber()

      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + item.total, 0)
      const taxTotal = orderData.items.reduce((sum, item) => sum + item.tax_amount, 0)
      const discountTotal = orderData.items.reduce((sum, item) => sum + item.discount_amount, 0)
      const shippingTotal = orderData.shipping.cost
      const total = subtotal + taxTotal + shippingTotal - discountTotal

      // Create the order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          customer_note: orderData.customer_note,
          subtotal,
          shipping_total: shippingTotal,
          tax_total: taxTotal,
          discount_total: discountTotal,
          total,
          total_refunded: 0,
          status: OrderStatus.PENDING,
          payment_status: PaymentStatus.PENDING,
          fulfillment_status: FulfillmentStatus.UNFULFILLED,
          source: orderData.source || 'mobile_app',
          tags: [],
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderId = order.id

      // Create billing address
      const { error: billingError } = await supabase
        .from('addresses')
        .insert({
          order_id: orderId,
          address_type: 'billing',
          ...orderData.billing_address
        })

      if (billingError) throw billingError

      // Create shipping address
      const { error: shippingError } = await supabase
        .from('addresses')
        .insert({
          order_id: orderId,
          address_type: 'shipping',
          ...orderData.shipping_address
        })

      if (shippingError) throw shippingError

      // Create order items
      const itemsWithOrderId = orderData.items.map(item => ({
        ...item,
        order_id: orderId
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId)

      if (itemsError) throw itemsError

      // Create shipping info
      const { error: shippingInfoError } = await supabase
        .from('shipping_info')
        .insert({
          order_id: orderId,
          ...orderData.shipping
        })

      if (shippingInfoError) throw shippingInfoError

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          method: orderData.payment_method,
          status: PaymentStatus.PENDING,
          amount: total,
          currency: ORDER_CONSTANTS.DEFAULT_CURRENCY
        })

      if (paymentError) throw paymentError

      return { order, error: null }
    } catch (error) {
      console.error('Error creating order:', error)
      return { order: null, error }
    }
  }

  /**
   * Get order by ID with all related data
   */
  static async getOrderById(orderId: string): Promise<{ order: OrderDetails | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('order_details_view')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error

      return { order: data, error: null }
    } catch (error) {
      console.error('Error fetching order:', error)
      return { order: null, error }
    }
  }

  /**
   * Get orders for a customer
   */
  static async getCustomerOrders(
    customerEmail: string,
    options?: {
      status?: OrderStatus
      limit?: number
      offset?: number
    }
  ): Promise<{ orders: OrderSummary[]; total_count: number; error: any }> {
    try {
      let query = supabase
        .from('order_summary_view')
        .select('*', { count: 'exact' })
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false })

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return { orders: data || [], total_count: count || 0, error: null }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      return { orders: [], total_count: 0, error }
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<{ success: boolean; error: any }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (request.status) updateData.status = request.status
      if (request.payment_status) updateData.payment_status = request.payment_status
      if (request.fulfillment_status) updateData.fulfillment_status = request.fulfillment_status
      if (request.admin_notes) updateData.admin_notes = request.admin_notes

      // Set processed_at when order moves to paid status
      if (request.payment_status === PaymentStatus.COMPLETED) {
        updateData.processed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', request.order_id)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { success: false, error }
    }
  }

  /**
   * Update payment information
   */
  static async updatePayment(
    orderId: string,
    paymentData: Partial<PaymentInfo>
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('order_id', orderId)

      if (error) throw error

      return { success: true, error: null }
    } catch (error) {
      console.error('Error updating payment:', error)
      return { success: false, error }
    }
  }

  /**
   * Add tracking information
   */
  static async addTrackingInfo(
    orderId: string,
    trackingData: {
      carrier: string
      tracking_number: string
      tracking_url?: string
    }
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('shipping_info')
        .update({
          ...trackingData,
          shipped_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (error) throw error

      // Update order status to shipped
      await this.updateOrderStatus({
        order_id: orderId,
        status: OrderStatus.SHIPPED,
        fulfillment_status: FulfillmentStatus.SHIPPED
      })

      return { success: true, error: null }
    } catch (error) {
      console.error('Error adding tracking info:', error)
      return { success: false, error }
    }
  }

  /**
   * Create refund
   */
  static async createRefund(
    orderId: string,
    refundData: Omit<RefundInfo, 'id' | 'order_id' | 'created_at'>
  ): Promise<{ success: boolean; error: any }> {
    try {
      // Create refund record
      const { error: refundError } = await supabase
        .from('refunds')
        .insert({
          order_id: orderId,
          ...refundData,
          created_at: new Date().toISOString()
        })

      if (refundError) throw refundError

      // Update order totals
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('total_refunded, total')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const newTotalRefunded = order.total_refunded + refundData.amount
      const isFullyRefunded = newTotalRefunded >= order.total

      await supabase
        .from('orders')
        .update({
          total_refunded: newTotalRefunded,
          status: isFullyRefunded ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED,
          payment_status: isFullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED
        })
        .eq('id', orderId)

      return { success: true, error: null }
    } catch (error) {
      console.error('Error creating refund:', error)
      return { success: false, error }
    }
  }

  /**
   * Calculate shipping cost
   */
  static async calculateShipping(request: ShippingCalculationRequest): Promise<ShippingCalculationResponse> {
    // Basic shipping calculation - can be enhanced with real shipping APIs
    const baseCost = ORDER_CONSTANTS.SHIPPING_COSTS[request.shipping_method]

    // Apply free shipping threshold
    const itemsTotal = request.items.reduce((sum, item) => {
      return sum + (item.weight || 1) * item.quantity * 100 // Assuming $1 per unit weight
    }, 0)

    let cost = baseCost
    if (itemsTotal >= ORDER_CONSTANTS.FREE_SHIPPING_THRESHOLD) {
      cost = 0
    }

    // Estimate delivery days
    let estimatedDeliveryDays = 5
    switch (request.shipping_method) {
      case 'express':
        estimatedDeliveryDays = 2
        break
      case 'overnight':
        estimatedDeliveryDays = 1
        break
      case 'pickup':
        estimatedDeliveryDays = 0
        break
    }

    return {
      method: request.shipping_method,
      cost,
      estimated_delivery_days: estimatedDeliveryDays,
      carrier: 'Standard Shipping'
    }
  }

  /**
   * Calculate tax
   */
  static async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResponse> {
    const taxRate = ORDER_CONSTANTS.TAX_RATES[request.shipping_address.state_province] || 0

    const subtotal = request.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)

    const totalTax = Math.round(subtotal * taxRate)

    return {
      total_tax: totalTax,
      tax_rate: taxRate * 100, // Convert to percentage
      breakdown: [
        {
          type: 'state_tax',
          rate: taxRate * 100,
          amount: totalTax
        }
      ]
    }
  }

  /**
   * Generate unique order number
   */
  static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${ORDER_CONSTANTS.ORDER_NUMBER_PREFIX}${timestamp}${random}`
  }

  /**
   * Get order metrics for analytics
   */
  static async getOrderMetrics(dateRange?: { start: string; end: string }) {
    try {
      let query = supabase
        .from('orders')
        .select('status, total, created_at')

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
      }

      const { data: orders, error } = await query

      if (error) throw error

      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<OrderStatus, number>)

      // Get recent orders
      const { data: recentOrders, error: recentError } = await supabase
        .from('order_summary_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (recentError) throw recentError

      return {
        data: {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          average_order_value: averageOrderValue,
          orders_by_status: ordersByStatus,
          recent_orders: recentOrders || []
        },
        error: null
      }
    } catch (error) {
      console.error('Error getting order metrics:', error)
      return { data: null, error }
    }
  }
}

// Real-time order subscriptions
export class OrderSubscriptions {
  /**
   * Subscribe to order status changes
   */
  static subscribeToOrderUpdates(orderId: string, callback: (order: Order) => void) {
    return supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          callback(payload.new as Order)
        }
      )
      .subscribe()
  }

  /**
   * Subscribe to customer's order changes
   */
  static subscribeToCustomerOrders(customerEmail: string, callback: (order: Order, event: string) => void) {
    return supabase
      .channel(`customer-orders-${customerEmail}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_email=eq.${customerEmail}`
        },
        (payload) => {
          const order = (payload.new || payload.old) as Order
          callback(order, payload.eventType)
        }
      )
      .subscribe()
  }
}