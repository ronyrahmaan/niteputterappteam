import { User } from '../../store/authStore';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Mock delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock user database
const mockUsers: User[] = [
  {
    id: 'user-123',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://via.placeholder.com/150x150/00FF88/000000?text=JD',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    location: 'San Francisco, CA',
    bio: 'Night golf enthusiast and tech lover.',
    createdAt: '2023-06-15T10:30:00Z',
    updatedAt: '2024-01-20T14:22:00Z',
  },
  {
    id: 'user-456',
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    avatar: 'https://via.placeholder.com/150x150/00D4FF/000000?text=SJ',
    createdAt: '2023-08-22T16:45:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
  },
];

class AuthAPI {
  private static instance: AuthAPI;
  private users: User[] = [...mockUsers];

  static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    await delay(1000); // Simulate network delay

    // Mock validation
    if (!request.email || !request.password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = this.users.find(u => u.email.toLowerCase() === request.email.toLowerCase());
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Mock password validation (in real app, this would be hashed)
    if (request.password.length < 6) {
      throw new Error('Invalid email or password');
    }

    return {
      user,
      token: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    };
  }

  async signup(request: SignupRequest): Promise<AuthResponse> {
    await delay(1200); // Simulate network delay

    // Mock validation
    if (!request.email || !request.password || !request.firstName || !request.lastName) {
      throw new Error('All fields are required');
    }

    if (request.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = this.users.find(u => u.email.toLowerCase() === request.email.toLowerCase());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      avatar: `https://via.placeholder.com/150x150/00FF88/000000?text=${request.firstName[0]}${request.lastName[0]}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    return {
      user: newUser,
      token: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    };
  }

  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    await delay(800); // Simulate network delay

    if (!request.email) {
      throw new Error('Email is required');
    }

    // Check if user exists
    const user = this.users.find(u => u.email.toLowerCase() === request.email.toLowerCase());
    if (!user) {
      throw new Error('No account found with this email address');
    }

    return {
      message: 'Password reset instructions have been sent to your email',
    };
  }

  async updateProfile(userId: string, request: UpdateProfileRequest): Promise<User> {
    await delay(600); // Simulate network delay

    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Update user
    this.users[userIndex] = {
      ...this.users[userIndex]!,
      ...request,
      updatedAt: new Date().toISOString(),
    };

    return this.users[userIndex]!;
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    await delay(300); // Simulate network delay

    if (!refreshToken || !refreshToken.startsWith('mock_refresh_')) {
      throw new Error('Invalid refresh token');
    }

    return {
      token: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
    };
  }

  async logout(): Promise<void> {
    await delay(200); // Simulate network delay
    // In a real app, this would invalidate the token on the server
  }

  async validateToken(token: string): Promise<User> {
    await delay(300); // Simulate network delay

    if (!token || !token.startsWith('mock_token_')) {
      throw new Error('Invalid token');
    }

    // Return the first user for demo purposes
    // In a real app, this would decode the JWT and return the associated user
    return this.users[0]!;
  }
}

export const authAPI = AuthAPI.getInstance();