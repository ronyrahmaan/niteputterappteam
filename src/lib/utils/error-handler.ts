/**
 * Professional error handling system for NiteNite React Native app
 * Provides centralized error handling, logging, and user-friendly error messages
 */

import { Alert } from 'react-native';
import { appConfig, ConfigUtils } from '../config/app-config';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  PAYMENT = 'PAYMENT',
  ORDER = 'ORDER',
  PRODUCT = 'PRODUCT',
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError: Error | unknown;
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
  userAgent?: string;
}

export interface ErrorHandlerOptions {
  showAlert?: boolean;
  logError?: boolean;
  reportError?: boolean;
  context?: Record<string, any>;
  customMessage?: string;
}

export class ErrorHandler {
  private static errorCount = 0;
  private static sessionErrors: AppError[] = [];
  private static maxSessionErrors = 100;

  /**
   * Handle an error with professional error management
   */
  static handle(
    error: Error | unknown,
    type: ErrorType = ErrorType.UNKNOWN,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const appError = this.createAppError(error, type, options.context);

    // Default options
    const {
      showAlert = true,
      logError = true,
      reportError = appConfig.logging.enableRemoteLogging,
      customMessage
    } = options;

    // Log the error
    if (logError) {
      this.logError(appError);
    }

    // Report to external service if enabled
    if (reportError && ConfigUtils.isFeatureEnabled('enableCrashReporting')) {
      this.reportError(appError);
    }

    // Show user-friendly alert
    if (showAlert) {
      this.showErrorAlert(appError, customMessage);
    }

    // Store in session for debugging
    this.storeSessionError(appError);

    return appError;
  }

  /**
   * Handle network errors specifically
   */
  static handleNetworkError(error: Error | unknown, options: ErrorHandlerOptions = {}): AppError {
    return this.handle(error, ErrorType.NETWORK, {
      ...options,
      customMessage: options.customMessage || 'Network connection failed. Please check your internet connection and try again.'
    });
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: Error | unknown, options: ErrorHandlerOptions = {}): AppError {
    return this.handle(error, ErrorType.AUTHENTICATION, {
      ...options,
      customMessage: options.customMessage || 'Authentication failed. Please log in again.'
    });
  }

  /**
   * Handle payment errors
   */
  static handlePaymentError(error: Error | unknown, options: ErrorHandlerOptions = {}): AppError {
    return this.handle(error, ErrorType.PAYMENT, {
      ...options,
      customMessage: options.customMessage || 'Payment failed. Please check your payment method and try again.'
    });
  }

  /**
   * Handle order errors
   */
  static handleOrderError(error: Error | unknown, options: ErrorHandlerOptions = {}): AppError {
    return this.handle(error, ErrorType.ORDER, {
      ...options,
      customMessage: options.customMessage || 'Order processing failed. Please try again or contact support.'
    });
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error: Error | unknown, options: ErrorHandlerOptions = {}): AppError {
    return this.handle(error, ErrorType.VALIDATION, {
      ...options,
      showAlert: false, // Validation errors usually handled by forms
      customMessage: options.customMessage || 'Please check your input and try again.'
    });
  }

  /**
   * Create a standardized app error
   */
  private static createAppError(
    error: Error | unknown,
    type: ErrorType,
    context?: Record<string, any>
  ): AppError {
    this.errorCount++;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    return {
      id: `error_${Date.now()}_${this.errorCount}`,
      type,
      severity: this.determineSeverity(type, errorMessage),
      message: errorMessage,
      originalError: error,
      context: {
        ...context,
        userAgent: navigator?.userAgent,
        timestamp: new Date().toISOString(),
        appVersion: appConfig.app.version,
        environment: appConfig.app.environment
      },
      timestamp: new Date().toISOString(),
      stackTrace
    };
  }

  /**
   * Determine error severity based on type and message
   */
  private static determineSeverity(type: ErrorType, message: string): ErrorSeverity {
    // Critical errors that require immediate attention
    if (type === ErrorType.SYSTEM || message.toLowerCase().includes('critical')) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if ([ErrorType.PAYMENT, ErrorType.ORDER, ErrorType.AUTHENTICATION].includes(type)) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if ([ErrorType.NETWORK, ErrorType.AUTHORIZATION].includes(type)) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors
    return ErrorSeverity.LOW;
  }

  /**
   * Log error to console and potentially remote service
   */
  private static logError(appError: AppError): void {
    const logMessage = `[${appError.severity}] ${appError.type}: ${appError.message}`;

    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨', logMessage, appError);
        break;
      case ErrorSeverity.HIGH:
        console.error('❌', logMessage, appError);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️', logMessage, appError);
        break;
      case ErrorSeverity.LOW:
        console.log('ℹ️', logMessage, appError);
        break;
    }

    // Log to remote service if enabled
    if (appConfig.logging.enableRemoteLogging) {
      this.logToRemoteService(appError);
    }
  }

  /**
   * Report error to external crash reporting service
   */
  private static reportError(appError: AppError): void {
    try {
      // Here you would integrate with services like:
      // - Sentry
      // - Bugsnag
      // - Crashlytics
      // - Custom logging service

      if (ConfigUtils.isDevelopment()) {
        console.log('📊 Would report error to crash reporting service:', appError.id);
      }

      // Example: Send to custom endpoint
      // this.sendToAnalyticsService(appError);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Show user-friendly error alert
   */
  private static showErrorAlert(appError: AppError, customMessage?: string): void {
    const userMessage = customMessage || this.getUserFriendlyMessage(appError);
    const title = this.getErrorTitle(appError.type);

    Alert.alert(
      title,
      userMessage,
      [
        {
          text: 'OK',
          style: 'default'
        },
        ...(appError.severity === ErrorSeverity.CRITICAL ? [{
          text: 'Contact Support',
          style: 'default',
          onPress: () => this.contactSupport(appError)
        }] : [])
      ]
    );
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(appError: AppError): string {
    const errorMessages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Unable to connect to our servers. Please check your internet connection and try again.',
      [ErrorType.AUTHENTICATION]: 'Your session has expired. Please log in again to continue.',
      [ErrorType.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ErrorType.VALIDATION]: 'Please check your input and try again.',
      [ErrorType.PAYMENT]: 'Payment processing failed. Please verify your payment information and try again.',
      [ErrorType.ORDER]: 'There was an issue processing your order. Please try again or contact support.',
      [ErrorType.PRODUCT]: 'Unable to load product information. Please try again.',
      [ErrorType.USER]: 'There was an issue with your account. Please try again or contact support.',
      [ErrorType.SYSTEM]: 'We\'re experiencing technical difficulties. Our team has been notified.',
      [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    };

    return errorMessages[appError.type] || errorMessages[ErrorType.UNKNOWN];
  }

  /**
   * Get error title for alerts
   */
  private static getErrorTitle(type: ErrorType): string {
    const titles: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Connection Error',
      [ErrorType.AUTHENTICATION]: 'Authentication Required',
      [ErrorType.AUTHORIZATION]: 'Access Denied',
      [ErrorType.VALIDATION]: 'Invalid Input',
      [ErrorType.PAYMENT]: 'Payment Error',
      [ErrorType.ORDER]: 'Order Error',
      [ErrorType.PRODUCT]: 'Product Error',
      [ErrorType.USER]: 'Account Error',
      [ErrorType.SYSTEM]: 'System Error',
      [ErrorType.UNKNOWN]: 'Error'
    };

    return titles[type] || titles[ErrorType.UNKNOWN];
  }

  /**
   * Store error in session for debugging
   */
  private static storeSessionError(appError: AppError): void {
    this.sessionErrors.push(appError);

    // Keep only the most recent errors
    if (this.sessionErrors.length > this.maxSessionErrors) {
      this.sessionErrors = this.sessionErrors.slice(-this.maxSessionErrors);
    }
  }

  /**
   * Get session errors for debugging
   */
  static getSessionErrors(): AppError[] {
    return [...this.sessionErrors];
  }

  /**
   * Clear session errors
   */
  static clearSessionErrors(): void {
    this.sessionErrors = [];
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  } {
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    Object.values(ErrorType).forEach(type => {
      errorsByType[type] = 0;
    });

    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });

    this.sessionErrors.forEach(error => {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
    });

    return {
      totalErrors: this.sessionErrors.length,
      errorsByType,
      errorsBySeverity
    };
  }

  /**
   * Contact support with error details
   */
  private static contactSupport(appError: AppError): void {
    const supportEmail = appConfig.business.supportEmail;
    const subject = `Error Report - ${appError.id}`;
    const body = `
Error ID: ${appError.id}
Type: ${appError.type}
Severity: ${appError.severity}
Message: ${appError.message}
Timestamp: ${appError.timestamp}
App Version: ${appConfig.app.version}

Please describe what you were doing when this error occurred:
[Your description here]
    `;

    // In a real app, you'd open the email client or contact form
    console.log('📧 Would open email client:', { to: supportEmail, subject, body });
  }

  /**
   * Log to remote service (placeholder)
   */
  private static async logToRemoteService(appError: AppError): Promise<void> {
    try {
      // Example: Send to custom logging endpoint
      // await fetch(`${appConfig.api.baseUrl}/logs`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(appError)
      // });

      if (ConfigUtils.isDevelopment()) {
        console.log('📡 Would send to remote logging service:', appError.id);
      }
    } catch (error) {
      console.error('Failed to log to remote service:', error);
    }
  }
}

/**
 * Higher-order function for wrapping async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorType: ErrorType = ErrorType.UNKNOWN,
  options: ErrorHandlerOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      ErrorHandler.handle(error, errorType, options);
      throw error; // Re-throw so calling code can handle if needed
    }
  }) as T;
}

/**
 * Decorator for class methods (if using experimentalDecorators)
 */
export function HandleErrors(
  errorType: ErrorType = ErrorType.UNKNOWN,
  options: ErrorHandlerOptions = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        ErrorHandler.handle(error, errorType, options);
        throw error;
      }
    };

    return descriptor;
  };
}

// Export utility functions
export const handleNetworkError = ErrorHandler.handleNetworkError.bind(ErrorHandler);
export const handleAuthError = ErrorHandler.handleAuthError.bind(ErrorHandler);
export const handlePaymentError = ErrorHandler.handlePaymentError.bind(ErrorHandler);
export const handleOrderError = ErrorHandler.handleOrderError.bind(ErrorHandler);
export const handleValidationError = ErrorHandler.handleValidationError.bind(ErrorHandler);