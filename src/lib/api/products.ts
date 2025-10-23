import { Product, Order, OrderItem } from '../../store/shopStore';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: 'card' | 'paypal' | 'apple_pay';
    cardLast4?: string;
  };
}

// Mock delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock products database
const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Nite Putter Pro Cup',
    description: 'Premium LED golf cup with advanced color mixing and wireless charging. Perfect for professional night golf experiences.',
    price: 89.99,
    originalPrice: 109.99,
    category: 'cups',
    images: [
      'https://via.placeholder.com/400x400/00FF88/000000?text=Pro+Cup+1',
      'https://via.placeholder.com/400x400/00D4FF/000000?text=Pro+Cup+2',
      'https://via.placeholder.com/400x400/B347FF/000000?text=Pro+Cup+3',
    ],
    inStock: true,
    stockCount: 25,
    rating: 4.8,
    reviewCount: 124,
    features: [
      'RGB LED with 16 million colors',
      'Wireless charging base included',
      'Waterproof IP67 rating',
      'Battery life up to 12 hours',
      'Bluetooth 5.0 connectivity',
    ],
    specifications: {
      'Dimensions': '4.25" diameter x 4" height',
      'Weight': '1.2 lbs',
      'Battery': '2000mAh lithium-ion',
      'Charging': 'Wireless Qi + USB-C',
      'Range': 'Up to 100 feet',
    },
  },
  {
    id: 'prod-2',
    name: 'Nite Putter Standard Cup',
    description: 'Essential LED golf cup with vibrant colors and long battery life. Great for casual night golf sessions.',
    price: 49.99,
    category: 'cups',
    images: [
      'https://via.placeholder.com/400x400/FF47B3/000000?text=Standard+Cup+1',
      'https://via.placeholder.com/400x400/00FF88/000000?text=Standard+Cup+2',
    ],
    inStock: true,
    stockCount: 42,
    rating: 4.5,
    reviewCount: 89,
    features: [
      'RGB LED with preset colors',
      'USB-C charging',
      'Water resistant',
      'Battery life up to 8 hours',
    ],
    specifications: {
      'Dimensions': '4.25" diameter x 4" height',
      'Weight': '0.9 lbs',
      'Battery': '1200mAh lithium-ion',
      'Charging': 'USB-C',
    },
  },
  {
    id: 'prod-3',
    name: 'Wireless Charging Base',
    description: 'Convenient wireless charging station for your Nite Putter cups. Charges up to 4 cups simultaneously.',
    price: 79.99,
    category: 'accessories',
    images: [
      'https://via.placeholder.com/400x400/00D4FF/000000?text=Charging+Base',
    ],
    inStock: true,
    stockCount: 18,
    rating: 4.6,
    reviewCount: 34,
    features: [
      'Charges up to 4 cups',
      'LED charging indicators',
      'Non-slip base',
      'Fast charging technology',
    ],
  },
  {
    id: 'prod-4',
    name: 'Nite Golf Ball Set',
    description: 'Glow-in-the-dark golf balls designed specifically for night golf. Set of 6 balls with different colors.',
    price: 24.99,
    category: 'accessories',
    images: [
      'https://via.placeholder.com/400x400/B347FF/000000?text=Golf+Balls',
    ],
    inStock: true,
    stockCount: 67,
    rating: 4.3,
    reviewCount: 156,
    features: [
      'Set of 6 balls',
      'Multiple glow colors',
      'Standard golf ball weight',
      'Long-lasting glow',
    ],
  },
  {
    id: 'prod-5',
    name: 'Nite Putter Starter Kit',
    description: 'Complete starter kit with 2 Standard Cups, charging cables, and glow balls. Perfect for beginners.',
    price: 129.99,
    originalPrice: 149.98,
    category: 'bundles',
    images: [
      'https://via.placeholder.com/400x400/00FF88/000000?text=Starter+Kit',
    ],
    inStock: true,
    stockCount: 15,
    rating: 4.7,
    reviewCount: 78,
    features: [
      '2x Standard Cups',
      '2x USB-C charging cables',
      '6x Glow golf balls',
      'Quick start guide',
    ],
  },
  {
    id: 'prod-6',
    name: 'Premium Carrying Case',
    description: 'Durable carrying case with custom foam inserts for your Nite Putter equipment. Holds up to 6 cups.',
    price: 59.99,
    category: 'accessories',
    images: [
      'https://via.placeholder.com/400x400/FF47B3/000000?text=Carrying+Case',
    ],
    inStock: false,
    stockCount: 0,
    rating: 4.4,
    reviewCount: 23,
    features: [
      'Holds up to 6 cups',
      'Custom foam inserts',
      'Weather resistant',
      'Comfortable handle',
    ],
  },
];

class ProductsAPI {
  private static instance: ProductsAPI;
  private products: Product[] = [...mockProducts];

  static getInstance(): ProductsAPI {
    if (!ProductsAPI.instance) {
      ProductsAPI.instance = new ProductsAPI();
    }
    return ProductsAPI.instance;
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    await delay(800); // Simulate network delay

    let filteredProducts = [...this.products];

    if (filters) {
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }

      if (filters.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
      }

      if (filters.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
      }

      if (filters.inStock !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.inStock === filters.inStock);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm)
        );
      }
    }

    return filteredProducts;
  }

  async getProduct(productId: string): Promise<Product> {
    await delay(400); // Simulate network delay

    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    await delay(600); // Simulate network delay

    // Return products with high ratings or on sale
    return this.products
      .filter(p => p.rating >= 4.5 || p.originalPrice)
      .slice(0, 4);
  }

  async getCategories(): Promise<string[]> {
    await delay(300); // Simulate network delay

    const categories = [...new Set(this.products.map(p => p.category))];
    return categories;
  }

  async searchProducts(query: string): Promise<Product[]> {
    await delay(500); // Simulate network delay

    if (!query.trim()) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    );
  }

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    await delay(1500); // Simulate network delay

    // Validate items
    if (!request.items || request.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Calculate totals
    const subtotal = request.items.reduce((sum, item) => {
      const product = this.products.find(p => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const shipping = subtotal > 75 ? 0 : 9.99; // Free shipping over $75
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Create order
    const order: Order = {
      id: `order-${Date.now()}`,
      userId: 'user-123', // In real app, this would come from auth
      items: request.items,
      status: 'confirmed',
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress: request.shippingAddress,
      paymentMethod: request.paymentMethod,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    return order;
  }

  async getOrders(userId: string): Promise<Order[]> {
    await delay(600); // Simulate network delay

    // Mock orders for the user
    const mockOrders: Order[] = [
      {
        id: 'order-1',
        userId,
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            price: 89.99,
          },
        ],
        status: 'delivered',
        subtotal: 179.98,
        shipping: 0,
        tax: 14.40,
        total: 194.38,
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'US',
        },
        paymentMethod: {
          type: 'card',
          cardLast4: '4242',
        },
        createdAt: '2024-01-15T10:30:00Z',
        estimatedDelivery: '2024-01-22T10:30:00Z',
        trackingNumber: 'NP123456789',
      },
    ];

    return mockOrders;
  }

  async getOrder(orderId: string): Promise<Order> {
    await delay(400); // Simulate network delay

    const orders = await this.getOrders('user-123');
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }
}

export const productsAPI = ProductsAPI.getInstance();