// Main Supabase API exports
export { supabase, supabaseAdmin } from './client'

// Type exports
export type {
  Database,
  Product,
  ProductInsert,
  ProductUpdate,
  CartItem,
  Order,
  OrderItem,
  ProductCategory,
  ProductStatus,
  OrderStatus,
  ProductImage,
  ProductSpecification,
  ShippingInfo,
  InventoryInfo,
  SEOInfo,
  ShippingAddress,
  PaymentMethod
} from './types'

// API exports
export { ProductsAPI, ProductSubscriptions } from './products'
export { CartAPI, CartSubscriptions } from './cart'
export { CategoriesAPI, type Category } from './categories'

// Utility functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

export const calculateDiscount = (price: number, compareAtPrice?: number): number | null => {
  if (!compareAtPrice || compareAtPrice <= price) return null
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

export const isProductInStock = (product: Product): boolean => {
  const inventory = product.inventory as any
  const available = inventory.quantity - inventory.reserved_quantity
  return available > 0 || inventory.allow_backorder
}

export const isProductLowStock = (product: Product): boolean => {
  const inventory = product.inventory as any
  const available = inventory.quantity - inventory.reserved_quantity
  return available > 0 && available <= inventory.low_stock_threshold
}

export const getProductMainImage = (product: Product): string => {
  const images = product.images as ProductImage[]
  const primaryImage = images.find(img => img.is_primary)
  const firstImage = images[0]

  return primaryImage?.url || firstImage?.url || 'https://res.cloudinary.com/df8dgkln1/image/upload/v1729532341/golf-cup-light_c6ivrl.jpg'
}

export const getProductGalleryImages = (product: Product): ProductImage[] => {
  const images = product.images as ProductImage[]
  return images.sort((a, b) => a.display_order - b.display_order)
}