# Development Setup Guide

This guide will help you set up the NitePutter App development environment on your local machine.

## 📋 Prerequisites

### Required Software
- **Node.js** (16.x or later) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

### Mobile Development Tools

#### For iOS Development
- **macOS** (required for iOS development)
- **Xcode** (latest version) - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **iOS Simulator** (included with Xcode)
- **Expo CLI** (we'll install this below)

#### For Android Development
- **Android Studio** - [Download here](https://developer.android.com/studio)
- **Android SDK** (included with Android Studio)
- **Android Emulator** or physical Android device

## 🚀 Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/ronyrahmaan/niteputterappteam.git
cd niteputterappteam
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Install Expo CLI
```bash
npm install -g @expo/cli
```

### 4. Verify Installation
```bash
# Check Node.js version
node --version  # Should be 16.x or later

# Check npm version
npm --version

# Check Expo CLI
expo --version
```

## 🔧 Environment Configuration

### 1. Environment Variables
Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

### 2. Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > API
4. Copy Project URL and anon public key
5. Update `.env` file with your credentials

### 3. Stripe Setup
1. Create account at [stripe.com](https://stripe.com)
2. Go to Developers > API keys
3. Copy Publishable key (starts with `pk_test_`)
4. Update `.env` file with your key

## 📱 Device Setup

### iOS Setup
1. **Install Xcode**
   ```bash
   # Install from App Store or download from developer.apple.com
   ```

2. **Install iOS Simulator**
   - Open Xcode
   - Go to Preferences > Components
   - Download desired iOS versions

3. **Test iOS Setup**
   ```bash
   npm run ios
   ```

### Android Setup
1. **Install Android Studio**
   - Download and install Android Studio
   - Follow setup wizard
   - Install Android SDK

2. **Configure Environment Variables**
   Add to your shell profile (`.bashrc`, `.zshrc`, etc.):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Create Android Virtual Device (AVD)**
   - Open Android Studio
   - Go to Tools > AVD Manager
   - Create new virtual device
   - Choose device and system image

4. **Test Android Setup**
   ```bash
   npm run android
   ```

## 🛠 VS Code Configuration

### Recommended Extensions
Install these VS Code extensions for the best development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-react-native",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### Settings Configuration
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 🧪 Running the App

### Development Server
```bash
# Start Expo development server
npm start

# Start with specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser (for testing)
```

### Development Options
When you run `npm start`, you'll see a QR code and options:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on physical device

## 📋 Testing Setup

### Running Tests
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Run TypeScript check
npm run typecheck
```

### End-to-End Testing
```bash
# Install Detox CLI (if not already installed)
npm install -g detox-cli

# Build for testing
npm run build:e2e

# Run E2E tests
npm run test:e2e
```

## 🔍 Development Tools

### React Native Debugger
1. **Install React Native Debugger**
   ```bash
   # macOS
   brew install --cask react-native-debugger

   # Or download from GitHub releases
   ```

2. **Usage**
   - Start React Native Debugger
   - In app, shake device or press Cmd+D (iOS) / Cmd+M (Android)
   - Select "Debug" option

### Expo Development Tools
- **Expo Dev Tools**: Automatic when running `expo start`
- **React DevTools**: Browser-based component inspector
- **Network Inspector**: Monitor API calls and responses

## 🚨 Troubleshooting

### Common Issues

#### Metro bundler issues
```bash
# Clear Metro cache
npx expo start --clear

# Or
npm start -- --reset-cache
```

#### iOS Simulator issues
```bash
# Reset iOS Simulator
Device > Erase All Content and Settings

# Or restart simulator
sudo killall Simulator
```

#### Android Emulator issues
```bash
# Cold boot AVD
emulator -avd YourAVDName -cold-boot

# Wipe data
emulator -avd YourAVDName -wipe-data
```

#### Node modules issues
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force
```

### Performance Optimization
1. **Enable Hermes** (already configured)
2. **Use Flipper** for debugging (optional)
3. **Profile with React DevTools Profiler**

## 📱 Physical Device Testing

### iOS Device
1. Install Expo Go from App Store
2. Ensure device and computer are on same network
3. Scan QR code from terminal or Expo Dev Tools

### Android Device
1. Install Expo Go from Play Store
2. Enable Developer Options
3. Enable USB Debugging (for USB connection)
4. Scan QR code or connect via USB

## 🔐 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use different keys for development and production
- Rotate API keys regularly

### Local Development
- Use HTTPS in production
- Test with real devices for BLE functionality
- Validate all user inputs
- Keep dependencies updated

## 📚 Additional Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)

### Learning Resources
- [React Native Tutorial](https://reactnative.dev/docs/tutorial)
- [Expo Tutorial](https://docs.expo.dev/tutorial/overview/)
- [TypeScript for React Native](https://reactnative.dev/docs/typescript)

## 🆘 Getting Help

### Team Support
1. Check existing documentation first
2. Search project issues on GitHub
3. Ask team members in project channels
4. Create detailed issue with reproduction steps

### Community Resources
- [React Native Community](https://reactnative.dev/community)
- [Expo Forums](https://forums.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

## ✅ Verification Checklist

After completing setup, verify everything works:

- [ ] Project clones successfully
- [ ] Dependencies install without errors
- [ ] Environment variables configured
- [ ] App starts with `npm start`
- [ ] iOS Simulator launches app
- [ ] Android Emulator launches app
- [ ] Tests run successfully with `npm test`
- [ ] Linting passes with `npm run lint`
- [ ] TypeScript check passes

If all items are checked, you're ready to start developing! 🎉

---

Need help? Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines or reach out to the team.