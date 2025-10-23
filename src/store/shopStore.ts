import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ProductsAPI,
  CartAPI,
  Product as SupabaseProduct,
  CartItem as SupabaseCartItem,
  isProductInStock,
  getProductMainImage
} from '../lib/supabase';
import { isLikelyValidPromo } from '../lib/utils/promo';

// Legacy Product interface for backward compatibility
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | undefined;
  images: string[];
  category: string;
  inStock: boolean;
  stockCount?: number;
  rating: number;
  reviewCount: number;
  features?: string[];
  specifications?: Record<string, string>;
}

// Legacy CartItem interface
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shipping: number;
  tax: number;
  total: number;
  promoCodeUsed?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'confirmed';
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod?: {
    type: 'card' | 'paypal' | 'apple_pay';
    cardLast4?: string;
  };
  createdAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

interface ShopState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  selectedProduct: Product | null;
}

interface ShopActions {
  fetchProducts: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (promoCode?: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
  clearError: () => void;
  refreshCart: () => Promise<void>;
}

type ShopStore = ShopState & ShopActions;

// Transform Supabase Product to legacy Product interface
const transformSupabaseProduct = (supabaseProduct: SupabaseProduct): Product => {
  const specifications = supabaseProduct.specifications as any;
  const inventory = supabaseProduct.inventory as any;

  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    description: supabaseProduct.short_description,
    price: supabaseProduct.price,
    originalPrice: supabaseProduct.compare_at_price ?? undefined,
    images: [getProductMainImage(supabaseProduct)],
    category: supabaseProduct.category,
    inStock: isProductInStock(supabaseProduct),
    stockCount: inventory?.quantity || 0,
    rating: supabaseProduct.average_rating,
    reviewCount: supabaseProduct.review_count,
    features: supabaseProduct.features || [],
    specifications: specifications || {}
  };
};

// Transform Supabase CartItem to legacy CartItem interface
const transformSupabaseCartItem = (supabaseCartItem: SupabaseCartItem): CartItem => ({
  product: transformSupabaseProduct(supabaseCartItem.product),
  quantity: supabaseCartItem.quantity
});

export const useShopStore = create<ShopStore>()(
  persist(
    (set, get) => ({
      // State
      products: [],
      cart: [],
      orders: [],
      isLoading: false,
      error: null,
      selectedProduct: null,

      // Actions
      fetchProducts: async () => {
        set({ isLoading: true, error: null });

        try {
          console.log('🔄 Fetching products from Supabase...');
          const { data: supabaseProducts, error } = await ProductsAPI.getProducts();

          if (error) {
            throw error;
          }

          const transformedProducts = supabaseProducts.map(transformSupabaseProduct);

          console.log(`✅ Fetched ${transformedProducts.length} products from Supabase`);

          set({
            products: transformedProducts,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('❌ Error fetching products:', error);
          set({
            isLoading: false,
            error: 'Failed to fetch products',
          });
        }
      },

      refreshCart: async () => {
        try {
          console.log('🔄 Refreshing cart from Supabase...');
          const { data: supabaseCartItems, error } = await CartAPI.getCartItems();

          if (error) {
            console.error('❌ Error refreshing cart:', error);
            return;
          }

          const transformedCartItems = supabaseCartItems.map(transformSupabaseCartItem);

          set({ cart: transformedCartItems });
          console.log(`✅ Cart refreshed with ${transformedCartItems.length} items`);
        } catch (error) {
          console.error('❌ Error refreshing cart:', error);
        }
      },

      addToCart: async (product: Product, quantity = 1) => {
        try {
          console.log(`🛒 Adding ${product.name} to cart (quantity: ${quantity})`);

          const { data, error } = await CartAPI.addToCart(product.id, quantity);

          if (error) {
            throw error;
          }

          // Refresh cart to get latest state
          await get().refreshCart();

          console.log('✅ Item added to cart successfully');
        } catch (error) {
          console.error('❌ Error adding to cart:', error);
          set({ error: 'Failed to add item to cart' });
        }
      },

      removeFromCart: async (productId: string) => {
        try {
          console.log(`🗑️ Removing product ${productId} from cart`);

          // Find the cart item by product ID
          const { cart } = get();
          const cartItem = cart.find(item => item.product.id === productId);

          if (!cartItem) {
            console.log('❌ Cart item not found');
            return;
          }

          // Find the Supabase cart item ID
          const { data: supabaseCartItems } = await CartAPI.getCartItems();
          const supabaseCartItem = supabaseCartItems.find(item => item.product.id === productId);

          if (!supabaseCartItem) {
            console.log('❌ Supabase cart item not found');
            return;
          }

          const { error } = await CartAPI.removeFromCart(supabaseCartItem.id);

          if (error) {
            throw error;
          }

          // Refresh cart to get latest state
          await get().refreshCart();

          console.log('✅ Item removed from cart successfully');
        } catch (error) {
          console.error('❌ Error removing from cart:', error);
          set({ error: 'Failed to remove item from cart' });
        }
      },

      updateCartQuantity: async (productId: string, quantity: number) => {
        try {
          console.log(`📝 Updating cart quantity for product ${productId} to ${quantity}`);

          if (quantity <= 0) {
            await get().removeFromCart(productId);
            return;
          }

          // Find the Supabase cart item ID
          const { data: supabaseCartItems } = await CartAPI.getCartItems();
          const supabaseCartItem = supabaseCartItems.find(item => item.product.id === productId);

          if (!supabaseCartItem) {
            console.log('❌ Supabase cart item not found');
            return;
          }

          const { error } = await CartAPI.updateCartItemQuantity(supabaseCartItem.id, quantity);

          if (error) {
            throw error;
          }

          // Refresh cart to get latest state
          await get().refreshCart();

          console.log('✅ Cart quantity updated successfully');
        } catch (error) {
          console.error('❌ Error updating cart quantity:', error);
          set({ error: 'Failed to update cart quantity' });
        }
      },

      clearCart: async () => {
        try {
          console.log('🧹 Clearing cart');

          const { error } = await CartAPI.clearCart();

          if (error) {
            throw error;
          }

          set({ cart: [] });
          console.log('✅ Cart cleared successfully');
        } catch (error) {
          console.error('❌ Error clearing cart:', error);
          set({ error: 'Failed to clear cart' });
        }
      },

      checkout: async (_promoCode?: string) => {
        const { cart } = get();
        set({ isLoading: true, error: null });

        try {
          console.log('💳 Starting checkout process...');

          // Calculate totals (same logic as before for now)
          const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          const isValid = _promoCode ? isLikelyValidPromo(_promoCode) : false;
          const discount = isValid ? subtotal * 0.10 : 0;
          const discountedSubtotal = Math.max(0, subtotal - discount);
          const shipping = discountedSubtotal > 50 ? 0 : 9.99;
          const tax = discountedSubtotal * 0.08;
          const total = discountedSubtotal + shipping + tax;

          // For now, create a mock order (later integrate with Supabase orders)
          const orderItems: OrderItem[] = cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          }));

          const newOrder: Order = {
            id: Date.now().toString(),
            items: orderItems,
            subtotal,
            shipping,
            tax,
            total,
            status: 'pending',
            createdAt: new Date().toISOString(),
            ...(isValid ? { discount } : {}),
            ...(isValid && _promoCode ? { promoCodeUsed: _promoCode.trim().toUpperCase() } : {}),
          };

          // Clear cart in Supabase
          await get().clearCart();

          set(state => ({
            orders: [newOrder, ...state.orders],
            cart: [],
            isLoading: false,
            error: null,
          }));

          console.log('✅ Checkout completed successfully');
        } catch (error) {
          console.error('❌ Checkout failed:', error);
          set({
            isLoading: false,
            error: 'Checkout failed',
          });
        }
      },

      fetchOrders: async () => {
        set({ isLoading: true, error: null });

        try {
          // For now, orders are stored locally
          // Later: integrate with Supabase orders table
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('❌ Error fetching orders:', error);
          set({
            isLoading: false,
            error: 'Failed to fetch orders',
          });
        }
      },

      setSelectedProduct: (product: Product | null) => {
        set({ selectedProduct: product });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'shop-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist orders locally (cart is managed by Supabase)
        orders: state.orders,
      }),
    }
  )
);