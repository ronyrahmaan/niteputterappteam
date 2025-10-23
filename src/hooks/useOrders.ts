import { useState, useEffect, useCallback } from 'react'
import { OrderService, OrderSubscriptions } from '../lib/supabase/orders'
import {
  Order,
  OrderDetails,
  OrderSummary,
  OrderStatus,
  PaymentStatus,
  UseOrdersOptions,
  UseOrdersResult,
  UseOrderResult,
  CreateOrderRequest
} from '../lib/supabase/order-types'

/**
 * Hook for managing multiple orders
 */
export function useOrders(options: UseOrdersOptions = {}): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchOrders = useCallback(async () => {
    if (!options.customer_id) return

    setLoading(true)
    setError(null)

    try {
      const { orders: fetchedOrders, total_count, error: fetchError } =
        await OrderService.getCustomerOrders(options.customer_id, {
          status: options.status,
          limit: options.limit,
          offset: options.offset
        })

      if (fetchError) throw fetchError

      setOrders(fetchedOrders)
      setTotalCount(total_count)
    } catch (err) {
      setError(err)
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }, [options.customer_id, options.status, options.limit, options.offset])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    error,
    total_count: totalCount,
    refetch: fetchOrders
  }
}

/**
 * Hook for managing a single order
 */
export function useOrder(orderId: string | null): UseOrderResult {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { order: fetchedOrder, error: fetchError } =
        await OrderService.getOrderById(orderId)

      if (fetchError) throw fetchError

      setOrder(fetchedOrder)
    } catch (err) {
      setError(err)
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  // Set up real-time subscription
  useEffect(() => {
    if (!orderId) return

    const subscription = OrderSubscriptions.subscribeToOrderUpdates(
      orderId,
      (updatedOrder) => {
        setOrder(updatedOrder)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  return {
    order,
    loading,
    error,
    refetch: fetchOrder
  }
}

/**
 * Hook for creating orders
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const createOrder = useCallback(async (orderData: CreateOrderRequest) => {
    setLoading(true)
    setError(null)

    try {
      const { order, error: createError } = await OrderService.createOrder(orderData)

      if (createError) throw createError

      return { order, error: null }
    } catch (err) {
      setError(err)
      console.error('Error creating order:', err)
      return { order: null, error: err }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createOrder,
    loading,
    error
  }
}

/**
 * Hook for order status management
 */
export function useOrderStatus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const updateStatus = useCallback(async (
    orderId: string,
    status?: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { success, error: updateError } = await OrderService.updateOrderStatus({
        order_id: orderId,
        status,
        payment_status: paymentStatus
      })

      if (updateError) throw updateError

      return { success, error: null }
    } catch (err) {
      setError(err)
      console.error('Error updating order status:', err)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [])

  const addTracking = useCallback(async (
    orderId: string,
    carrier: string,
    trackingNumber: string,
    trackingUrl?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { success, error: trackingError } = await OrderService.addTrackingInfo(
        orderId,
        { carrier, tracking_number: trackingNumber, tracking_url: trackingUrl }
      )

      if (trackingError) throw trackingError

      return { success, error: null }
    } catch (err) {
      setError(err)
      console.error('Error adding tracking info:', err)
      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    updateStatus,
    addTracking,
    loading,
    error
  }
}

/**
 * Hook for customer order history with real-time updates
 */
export function useCustomerOrders(customerEmail: string) {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchOrders = useCallback(async () => {
    if (!customerEmail) return

    setLoading(true)
    setError(null)

    try {
      const { orders: fetchedOrders, error: fetchError } =
        await OrderService.getCustomerOrders(customerEmail, { limit: 50 })

      if (fetchError) throw fetchError

      setOrders(fetchedOrders)
    } catch (err) {
      setError(err)
      console.error('Error fetching customer orders:', err)
    } finally {
      setLoading(false)
    }
  }, [customerEmail])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Set up real-time subscription for customer orders
  useEffect(() => {
    if (!customerEmail) return

    const subscription = OrderSubscriptions.subscribeToCustomerOrders(
      customerEmail,
      (updatedOrder, event) => {
        if (event === 'INSERT') {
          // Add new order
          setOrders(prev => [updatedOrder as OrderSummary, ...prev])
        } else if (event === 'UPDATE') {
          // Update existing order
          setOrders(prev =>
            prev.map(order =>
              order.id === updatedOrder.id
                ? { ...order, ...updatedOrder } as OrderSummary
                : order
            )
          )
        } else if (event === 'DELETE') {
          // Remove order
          setOrders(prev => prev.filter(order => order.id !== updatedOrder.id))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [customerEmail])

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
}

/**
 * Hook for calculating order totals
 */
export function useOrderCalculations() {
  const [loading, setLoading] = useState(false)

  const calculateShipping = useCallback(async (
    items: Array<{ product_id: string; quantity: number; weight?: number }>,
    shippingAddress: { country: string; state_province: string; postal_code: string },
    shippingMethod: 'standard' | 'express' | 'overnight' | 'pickup'
  ) => {
    setLoading(true)
    try {
      const result = await OrderService.calculateShipping({
        items,
        shipping_address: shippingAddress,
        shipping_method: shippingMethod
      })
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateTax = useCallback(async (
    items: Array<{ product_id: string; price: number; quantity: number; tax_category?: string }>,
    shippingAddress: { country: string; state_province: string; postal_code: string; city: string }
  ) => {
    setLoading(true)
    try {
      const result = await OrderService.calculateTax({
        items,
        shipping_address: shippingAddress
      })
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    calculateShipping,
    calculateTax,
    loading
  }
}