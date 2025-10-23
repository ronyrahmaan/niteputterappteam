# Contributing to NitePutter App

Thank you for your interest in contributing to the NitePutter App! This document provides guidelines and best practices for team collaboration.

## 🚀 Getting Started

### Prerequisites
- Ensure you have completed the setup process outlined in [SETUP.md](SETUP.md)
- Familiarize yourself with the project structure and technologies
- Read through the [README.md](README.md) for project overview

### Development Environment
- Use VS Code with recommended extensions
- Ensure ESLint and Prettier are configured
- Install React Native debugger for debugging

## 🔄 Development Workflow

### Branch Strategy
```
main              # Production-ready code
├── feature/auth  # Authentication features
├── feature/ble   # Bluetooth Low Energy features
├── feature/shop  # E-commerce features
└── hotfix/bug    # Critical bug fixes
```

### Creating a New Feature
1. **Create branch from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Implement your feature**
   - Write clean, documented code
   - Follow existing code patterns
   - Add appropriate tests

3. **Test your changes**
   ```bash
   npm run lint          # Check code style
   npm run typecheck     # TypeScript validation
   npm test              # Run unit tests
   npm run test:e2e      # Run end-to-end tests
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new authentication flow"
   ```

5. **Push and create pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Code Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type - use proper typing
- Export types alongside components

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Bad
const user: any = getData();
```

### React Native Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize performance with React.memo when needed
- Use proper prop typing

```typescript
// Good
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled = false }) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```

### State Management with Zustand
- Keep stores focused on specific domains
- Use proper TypeScript interfaces
- Implement persistence when needed

```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  login: async (credentials) => {
    set({ isLoading: true });
    // Implementation
  },
  logout: () => set({ user: null }),
}));
```

### Styling Guidelines
- Use StyleSheet.create for performance
- Follow design system spacing and colors
- Implement responsive design patterns
- Use theme constants from `src/lib/theme`

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    color: theme.colors.text.primary,
  },
});
```

## 🧪 Testing Guidelines

### Unit Testing
- Test utility functions thoroughly
- Mock external dependencies
- Use descriptive test names

```typescript
describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('should convert valid hex color to RGB object', () => {
      const result = hexToRgb('#FF0000');
      expect(result).toEqual({ red: 255, green: 0, blue: 0 });
    });
  });
});
```

### Component Testing
- Test component behavior, not implementation
- Mock navigation and external services
- Test user interactions

```typescript
describe('LoginScreen', () => {
  it('should call login function when form is submitted', async () => {
    const mockLogin = jest.fn();
    render(<LoginScreen onLogin={mockLogin} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(screen.getByText('Login'));

    expect(mockLogin).toHaveBeenCalledWith('test@example.com');
  });
});
```

## 🎨 UI/UX Guidelines

### Design System
- Use established color palette from `theme/colors.ts`
- Follow spacing guidelines from `theme/spacing.ts`
- Maintain consistency with iOS design principles

### Animation Standards
- Use React Native Reanimated for complex animations
- Keep animations smooth (60fps)
- Provide appropriate haptic feedback
- Consider accessibility and reduced motion preferences

### Accessibility
- Add proper accessibility labels
- Ensure sufficient color contrast
- Support screen readers
- Test with accessibility tools

## 🔌 BLE Integration Guidelines

### Connection Management
- Always handle connection errors gracefully
- Implement proper cleanup on component unmount
- Use connection pooling for multiple devices
- Provide clear user feedback for connection states

### Command Structure
- Follow established BLE command patterns
- Implement proper timeouts and retries
- Validate data before sending commands
- Log BLE interactions for debugging

## 📱 Platform Considerations

### iOS Specific
- Test on real devices for BLE functionality
- Follow iOS Human Interface Guidelines
- Handle background app states properly
- Test haptic feedback on device

### Android Specific
- Handle different Android versions
- Test permission flows
- Consider various screen sizes
- Test back button behavior

## 🐛 Bug Reports and Issues

### Reporting Bugs
1. Check existing issues first
2. Provide clear reproduction steps
3. Include device and OS information
4. Add screenshots or videos if applicable
5. Include relevant logs

### Bug Fix Process
1. Create branch: `hotfix/issue-description`
2. Implement minimal fix
3. Add regression tests
4. Create pull request with clear description

## 📋 Pull Request Guidelines

### PR Checklist
- [ ] Code follows project conventions
- [ ] Tests added/updated as needed
- [ ] TypeScript types are properly defined
- [ ] Documentation updated if needed
- [ ] No console.log statements left in code
- [ ] Performance impact considered
- [ ] Accessibility standards met

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested on iOS
- [ ] Tested on Android

## Screenshots
Include screenshots for UI changes
```

## 🔍 Code Review Process

### As a Reviewer
- Focus on code quality and maintainability
- Check for potential security issues
- Verify test coverage
- Ensure documentation is updated
- Test the changes locally

### As an Author
- Respond to feedback constructively
- Make requested changes promptly
- Update tests as needed
- Resolve merge conflicts

## 📞 Communication

### Team Communication
- Use clear, descriptive commit messages
- Comment complex code logic
- Ask questions when unclear
- Share knowledge and learnings

### Code Comments
```typescript
// Good: Explains why, not what
// Smooth interpolation reduces flicker during brightness changes
const steps = 8;
const duration = 240;

// Bad: Explains what the code does
// Set steps to 8 and duration to 240
```

## 🚨 Emergency Procedures

### Critical Bugs
1. Create hotfix branch immediately
2. Implement minimal fix
3. Test thoroughly
4. Deploy as soon as possible
5. Follow up with comprehensive fix

### Security Issues
1. Do not commit sensitive data
2. Report security vulnerabilities privately
3. Follow responsible disclosure practices
4. Update dependencies regularly

## 📚 Resources

### Learning Materials
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

### Development Tools
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [VS Code React Native Extensions](https://marketplace.visualstudio.com/items?itemName=msjsdiag.vscode-react-native)

---

Questions? Reach out to the team lead or create an issue for clarification.