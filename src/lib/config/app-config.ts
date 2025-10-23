/**
 * Professional app configuration for NiteNite React Native app
 * Manages environment variables and app settings
 */

export interface AppConfig {
  // App Information
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    buildNumber: string;
  };

  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };

  // Stripe Configuration
  stripe: {
    publishableKey: string;
    merchantId?: string;
    urlScheme: string;
  };

  // Email Configuration
  email: {
    sendgridApiKey?: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
  };

  // Cloud Storage Configuration
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret?: string;
  };

  // Feature Flags
  features: {
    enablePushNotifications: boolean;
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enableDeepLinking: boolean;
    enableInAppPurchases: boolean;
    enableBiometricAuth: boolean;
    enableOfflineMode: boolean;
    enableReferralSystem: boolean;
  };

  // Business Configuration
  business: {
    currency: string;
    taxRate: number;
    shippingThreshold: number; // Free shipping threshold in cents
    supportEmail: string;
    supportPhone?: string;
    websiteUrl: string;
    privacyPolicyUrl: string;
    termsOfServiceUrl: string;
  };

  // Cache Configuration
  cache: {
    ttl: number; // Time to live in seconds
    maxSize: number; // Max cache size in MB
  };

  // Logging Configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableRemoteLogging: boolean;
    maxLogFiles: number;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  app: {
    name: 'NiteNite',
    version: '1.0.0',
    environment: 'development',
    buildNumber: '1'
  },

  api: {
    baseUrl: 'https://api.nitenite.com',
    timeout: 30000,
    retryAttempts: 3
  },

  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    merchantId: process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID,
    urlScheme: 'nitenite'
  },

  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: 'noreply@nitenite.com',
    fromName: 'NiteNite',
    replyToEmail: 'support@nitenite.com'
  },

  cloudinary: {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },

  features: {
    enablePushNotifications: true,
    enableAnalytics: true,
    enableCrashReporting: true,
    enableDeepLinking: true,
    enableInAppPurchases: false,
    enableBiometricAuth: true,
    enableOfflineMode: true,
    enableReferralSystem: true
  },

  business: {
    currency: 'USD',
    taxRate: 0.08, // 8% default tax rate
    shippingThreshold: 5000, // $50.00 free shipping
    supportEmail: 'support@nitenite.com',
    supportPhone: '+1-555-NITE-NITE',
    websiteUrl: 'https://nitenite.com',
    privacyPolicyUrl: 'https://nitenite.com/privacy',
    termsOfServiceUrl: 'https://nitenite.com/terms'
  },

  cache: {
    ttl: 3600, // 1 hour
    maxSize: 100 // 100MB
  },

  logging: {
    level: 'info',
    enableRemoteLogging: false,
    maxLogFiles: 5
  }
};

// Environment-specific overrides
const developmentConfig: Partial<AppConfig> = {
  app: {
    ...defaultConfig.app,
    environment: 'development'
  },
  logging: {
    ...defaultConfig.logging,
    level: 'debug'
  },
  features: {
    ...defaultConfig.features,
    enableAnalytics: false,
    enableCrashReporting: false
  }
};

const stagingConfig: Partial<AppConfig> = {
  app: {
    ...defaultConfig.app,
    environment: 'staging'
  },
  api: {
    ...defaultConfig.api,
    baseUrl: 'https://staging-api.nitenite.com'
  },
  logging: {
    ...defaultConfig.logging,
    level: 'info',
    enableRemoteLogging: true
  }
};

const productionConfig: Partial<AppConfig> = {
  app: {
    ...defaultConfig.app,
    environment: 'production'
  },
  api: {
    ...defaultConfig.api,
    baseUrl: 'https://api.nitenite.com'
  },
  logging: {
    ...defaultConfig.logging,
    level: 'warn',
    enableRemoteLogging: true
  }
};

// Get current environment
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging' ? 'staging' : 'production';
  }
  return 'development';
};

// Merge configurations based on environment
const mergeConfig = (baseConfig: AppConfig, overrides: Partial<AppConfig>): AppConfig => {
  return {
    ...baseConfig,
    ...overrides,
    app: { ...baseConfig.app, ...overrides.app },
    api: { ...baseConfig.api, ...overrides.api },
    supabase: { ...baseConfig.supabase, ...overrides.supabase },
    stripe: { ...baseConfig.stripe, ...overrides.stripe },
    email: { ...baseConfig.email, ...overrides.email },
    cloudinary: { ...baseConfig.cloudinary, ...overrides.cloudinary },
    features: { ...baseConfig.features, ...overrides.features },
    business: { ...baseConfig.business, ...overrides.business },
    cache: { ...baseConfig.cache, ...overrides.cache },
    logging: { ...baseConfig.logging, ...overrides.logging }
  };
};

// Create the final configuration
const createConfig = (): AppConfig => {
  const environment = getEnvironment();

  let config = defaultConfig;

  switch (environment) {
    case 'development':
      config = mergeConfig(defaultConfig, developmentConfig);
      break;
    case 'staging':
      config = mergeConfig(defaultConfig, stagingConfig);
      break;
    case 'production':
      config = mergeConfig(defaultConfig, productionConfig);
      break;
  }

  // Validate required configuration
  validateConfig(config);

  return config;
};

// Configuration validation
const validateConfig = (config: AppConfig): void => {
  const requiredFields = [
    'supabase.url',
    'supabase.anonKey',
    'stripe.publishableKey',
    'email.fromEmail',
    'business.supportEmail'
  ];

  const missingFields: string[] = [];

  requiredFields.forEach(field => {
    const keys = field.split('.');
    let value: any = config;

    for (const key of keys) {
      value = value?.[key];
    }

    if (!value) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    console.warn(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }
};

// Export the configuration
export const appConfig = createConfig();

// Configuration utilities
export class ConfigUtils {
  /**
   * Check if a feature is enabled
   */
  static isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return appConfig.features[feature];
  }

  /**
   * Get API URL with path
   */
  static getApiUrl(path: string = ''): string {
    return `${appConfig.api.baseUrl}${path}`;
  }

  /**
   * Get formatted currency amount
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: appConfig.business.currency
    }).format(amount / 100); // Amount is in cents
  }

  /**
   * Check if amount qualifies for free shipping
   */
  static qualifiesForFreeShipping(amount: number): boolean {
    return amount >= appConfig.business.shippingThreshold;
  }

  /**
   * Get environment-specific log level
   */
  static shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(appConfig.logging.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Get current environment
   */
  static getEnvironment(): string {
    return appConfig.app.environment;
  }

  /**
   * Check if running in development
   */
  static isDevelopment(): boolean {
    return appConfig.app.environment === 'development';
  }

  /**
   * Check if running in production
   */
  static isProduction(): boolean {
    return appConfig.app.environment === 'production';
  }

  /**
   * Get app version info
   */
  static getVersionInfo(): string {
    return `${appConfig.app.name} v${appConfig.app.version} (${appConfig.app.buildNumber})`;
  }
}

// Development helper to log configuration (only in development)
if (ConfigUtils.isDevelopment()) {
  console.log('🔧 App Configuration Loaded:', {
    environment: appConfig.app.environment,
    version: ConfigUtils.getVersionInfo(),
    features: Object.entries(appConfig.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature)
  });
}