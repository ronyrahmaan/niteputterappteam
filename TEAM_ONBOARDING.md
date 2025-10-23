# Team Member Onboarding Guide

Welcome to the NitePutter App development team! This guide will help you get started with the project and understand our collaborative workflow.

## 📋 Prerequisites

Before you begin, ensure you have:
- Git installed on your machine
- Node.js (16.x or later)
- GitHub account with repository access
- Code editor (VS Code recommended)

## 🚀 Getting Started

### Step 1: Clone the Repository

Once you have access to the repository, clone it to your local machine:

```bash
git clone https://github.com/ronyrahmaan/niteputterappteam.git
cd niteputterappteam
```

### Step 2: Install Dependencies

Install all project dependencies:

```bash
npm install
```

### Step 3: Environment Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your `.env` file** with the credentials provided by the team lead:
   ```bash
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Stripe Configuration
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key

   # Other configurations...
   ```

### Step 4: Verify Setup

Test that everything is working:

```bash
# Start the development server
npm start

# Run tests
npm test

# Check code formatting
npm run lint
```

## 📱 Development Environment

### Mobile Development Setup

Follow the detailed instructions in [SETUP.md](SETUP.md) for:
- iOS development (Xcode, iOS Simulator)
- Android development (Android Studio, Emulator)
- Physical device testing

### Recommended Tools

- **VS Code** with React Native extensions
- **React Native Debugger** for debugging
- **Expo Go** app for device testing

## 🔄 Development Workflow

### Daily Workflow

1. **Start with updated main branch**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Develop your feature**:
   - Write code following project standards
   - Test your changes thoroughly
   - Follow TypeScript conventions

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```
   - Go to GitHub and create a Pull Request
   - Request review from team members
   - Address any feedback

### Branch Naming Conventions

- `feature/authentication` - New features
- `fix/login-bug` - Bug fixes
- `refactor/state-management` - Code refactoring
- `docs/setup-guide` - Documentation updates

### Commit Message Format

Use clear, descriptive commit messages:
- `feat: add user authentication flow`
- `fix: resolve BLE connection timeout issue`
- `refactor: improve color wheel performance`
- `docs: update API documentation`

## 🧪 Testing & Quality

### Before Submitting Code

Always run these checks:

```bash
# TypeScript check
npm run typecheck

# Linting
npm run lint

# Unit tests
npm test

# Build verification
npm run build
```

### Code Standards

- Follow TypeScript strict mode
- Use functional components with hooks
- Implement proper error handling
- Add comments for complex logic
- Follow existing code patterns

### Testing Guidelines

- Write unit tests for utilities and services
- Test component behavior, not implementation
- Mock external dependencies
- Maintain test coverage above 80%

## 📂 Project Structure

Understanding the codebase:

```
src/
├── components/ui/     # Reusable UI components
├── features/          # Feature-specific screens and logic
│   ├── auth/         # Authentication screens
│   ├── niteControl/  # BLE golf cup control
│   ├── shop/         # E-commerce features
│   └── profile/      # User profile and settings
├── lib/              # Utilities and services
│   ├── api/          # API integrations
│   ├── ble/          # Bluetooth Low Energy
│   ├── supabase/     # Database operations
│   └── theme/        # Design system
├── navigation/       # App navigation structure
├── store/           # State management (Zustand)
└── types/           # TypeScript definitions
```

## 🎮 Key Features You'll Work With

### NiteControl (BLE System)
- Golf cup Bluetooth connections
- Color and brightness control
- Scene management
- QR code scanning

### E-commerce Platform
- Product catalog
- Shopping cart
- Payment processing (Stripe)
- Order management

### Authentication & Profiles
- User registration/login
- Profile management
- Settings and preferences

## 🤝 Collaboration Guidelines

### Pull Request Process

1. **Create descriptive PR title**:
   - ✅ "Add BLE reconnection logic for golf cups"
   - ❌ "Fix bug"

2. **Include PR description**:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Screenshots for UI changes

3. **Request appropriate reviewers**
4. **Address feedback promptly**
5. **Ensure CI checks pass**

### Code Review Guidelines

When reviewing code:
- Focus on functionality and maintainability
- Check for potential bugs or edge cases
- Verify test coverage
- Ensure coding standards are followed
- Be constructive and helpful

### Communication

- Ask questions when unclear about requirements
- Share knowledge and insights with the team
- Document complex solutions
- Communicate blockers early

## 🚨 Common Issues & Solutions

### Git Issues

**Problem**: Merge conflicts
```bash
# Solution: Rebase your branch
git checkout main
git pull origin main
git checkout your-branch
git rebase main
# Resolve conflicts and continue
git rebase --continue
```

**Problem**: Accidental commits to main
```bash
# Solution: Move commits to feature branch
git checkout -b feature/your-feature
git checkout main
git reset --hard origin/main
```

### Development Issues

**Problem**: Metro bundler cache issues
```bash
# Solution: Clear cache
npm start -- --reset-cache
```

**Problem**: iOS/Android build issues
```bash
# Solution: Clean and rebuild
npm run ios -- --reset-cache
npm run android -- --reset-cache
```

### Environment Issues

**Problem**: Missing environment variables
- Check `.env` file exists and has all required variables
- Compare with `.env.example`
- Contact team lead for missing credentials

## 📚 Learning Resources

### Project-Specific
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Detailed setup guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines

### Technology Documentation
- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [Supabase Documentation](https://supabase.com/docs)

### Tools & Extensions
- [VS Code React Native Extension](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Expo Go App](https://expo.dev/client) for device testing

## 🆘 Getting Help

### When You Need Assistance

1. **Check documentation first** (README, SETUP, CONTRIBUTING)
2. **Search existing GitHub issues**
3. **Ask in team communication channels**
4. **Create detailed GitHub issue** with:
   - Clear problem description
   - Steps to reproduce
   - Environment information
   - Screenshots or error logs

### Escalation Process

1. Try to resolve independently using documentation
2. Ask fellow team members
3. Contact team lead
4. Create GitHub issue for tracking

## ✅ Onboarding Checklist

Complete these tasks to ensure you're ready to contribute:

### Setup Verification
- [ ] Repository cloned successfully
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Development server starts (`npm start`)
- [ ] Tests run successfully (`npm test`)
- [ ] Linting passes (`npm run lint`)

### Development Environment
- [ ] iOS development setup complete (if developing for iOS)
- [ ] Android development setup complete (if developing for Android)
- [ ] VS Code with recommended extensions installed
- [ ] Git configured with your name and email

### Project Understanding
- [ ] Read README.md thoroughly
- [ ] Reviewed project structure
- [ ] Understand BLE integration concepts
- [ ] Familiar with Zustand state management
- [ ] Know how to run tests and checks

### First Contribution
- [ ] Created first feature branch
- [ ] Made a small test change
- [ ] Successfully created Pull Request
- [ ] Received and addressed code review feedback

## 🎯 Your First Tasks

### Suggested Starting Points

1. **Familiarize with codebase**:
   - Explore the component structure
   - Run the app and navigate through features
   - Read through key files in each feature folder

2. **Small improvements**:
   - Fix minor UI issues
   - Add missing TypeScript types
   - Improve documentation
   - Add unit tests

3. **Feature development**:
   - Implement new BLE commands
   - Add e-commerce features
   - Enhance user interface
   - Improve error handling

### Success Metrics

- Code quality and adherence to standards
- Test coverage for new features
- Timely completion of assigned tasks
- Effective team collaboration
- Knowledge sharing and documentation

---

Welcome to the team! We're excited to have you contribute to the NitePutter App. If you have any questions during the onboarding process, don't hesitate to reach out.

**Happy coding!** 🚀