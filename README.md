# NitePutter App

A professional golf cup control application with modern iOS design and Bluetooth Low Energy (BLE) integration.

## 🎯 Project Overview

NitePutter App is a comprehensive mobile application that provides:

- **Golf Cup Control**: Professional BLE-enabled golf cup lighting control
- **E-commerce Integration**: Complete shopping experience with Supabase backend
- **Modern UI/UX**: Professional iOS-style glass morphism design
- **Cross-Platform**: React Native with Expo for iOS and Android

## ✨ Key Features

### 🎮 NiteControl System
- Real-time BLE connection to golf cups
- Color customization with professional color wheel
- Multiple lighting modes (static, pulse, strobe, rainbow)
- Brightness control with smooth transitions
- Multi-cup control and scene management
- QR code scanning for quick cup pairing

### 🛒 E-commerce Platform
- Product catalog with real-time inventory
- Shopping cart and secure checkout
- Stripe payment integration
- Order tracking and management
- User authentication and profiles

### 🎨 Professional Design
- iOS glass morphism authentication screens
- Animated sky background with aurora effects
- Smooth animations with React Native Reanimated
- Professional typography and spacing
- Dark theme with neon accents

## 🛠 Technology Stack

### Frontend
- **React Native** (0.81.4) - Cross-platform mobile development
- **Expo** (~54.0.13) - Development platform and build tools
- **TypeScript** (~5.9.2) - Type-safe development
- **React Navigation** (v7) - Navigation and routing
- **Zustand** (v5) - State management
- **React Native Reanimated** (v4) - Smooth animations

### Backend & Services
- **Supabase** - Database, authentication, and real-time features
- **Stripe** - Payment processing
- **SendGrid** - Email services
- **Expo Haptics** - Device haptic feedback

### Bluetooth & Hardware
- **React Native BLE** - Bluetooth Low Energy integration
- **Expo Barcode Scanner** - QR code scanning
- Custom BLE service for golf cup communication

### Development Tools
- **ESLint** & **Prettier** - Code formatting and linting
- **Husky** - Git hooks for code quality
- **Jest** & **Testing Library** - Unit and integration testing
- **Detox** - End-to-end testing

## 🚀 Getting Started

### Prerequisites

- Node.js (16.x or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ronyrahmaan/niteputterappteam.git
   cd niteputterappteam
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure your Supabase credentials
   - Configure Stripe keys
   - Set up SendGrid API key

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on devices**
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web (for testing)
   npm run web
   ```

## 📱 App Architecture

### State Management
- **Zustand stores** for each feature domain
- Persistent storage with AsyncStorage
- Real-time state synchronization

### Navigation Structure
```
TabNavigator
├── Home - Dashboard and overview
├── Shop - E-commerce features
├── NiteControl - Golf cup control
└── Profile - User settings and account
```

### Component Organization
```
src/
├── components/ui/     # Reusable UI components
├── features/          # Feature-specific screens
├── lib/              # Utilities and services
├── navigation/       # Navigation configuration
├── store/           # State management
└── types/           # TypeScript definitions
```

## 🎮 NiteControl Features

### BLE Integration
- Automatic device discovery and pairing
- Real-time connection status monitoring
- Batch commands for multiple cups
- Error handling and reconnection logic

### Golf Cup Commands
- **Color Control**: RGB color setting with smooth transitions
- **Mode Control**: Multiple lighting effects and patterns
- **Brightness**: Smooth brightness adjustment with interpolation
- **Scene Management**: Save and apply lighting configurations

### Professional Golf Features
- Course-specific lighting presets
- Tournament mode configurations
- Hazard warning colors
- Night golf optimization

## 🛒 E-commerce Features

### Product Management
- Real-time inventory tracking
- Category-based browsing
- Product search and filtering
- Professional product imagery

### Payment Processing
- Secure Stripe integration
- Multiple payment methods
- Order confirmation and tracking
- Receipt generation and email delivery

## 👥 Team Collaboration

### Development Workflow
1. Create feature branches from `main`
2. Implement features with proper testing
3. Submit pull requests for code review
4. Merge after approval and testing

### Code Standards
- TypeScript strict mode enabled
- ESLint and Prettier configurations
- Pre-commit hooks for code quality
- Component and function documentation

### Testing Strategy
- Unit tests for utilities and services
- Component testing with Testing Library
- Integration tests for key user flows
- E2E testing with Detox

## 📄 License

This project is private and proprietary.

## 👥 Team

- **Lead Developer**: ronyrahmaan
- **Team Members**: [To be added]

---

For detailed setup instructions, see [SETUP.md](SETUP.md)
For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)