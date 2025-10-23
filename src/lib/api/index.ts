// Export API services
export { authAPI } from './auth';
export { productsAPI } from './products';

// Export types
export type {
  LoginRequest,
  SignupRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  AuthResponse,
} from './auth';

export type {
  ProductFilters,
  CreateOrderRequest,
} from './products';