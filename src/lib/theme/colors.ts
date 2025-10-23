export const colors = {
  // Dark base colors
  background: {
    primary: '#0A0A0F',      // Deep dark blue-black
    secondary: '#1A1A2E',    // Dark navy
    tertiary: '#16213E',     // Slightly lighter navy
    card: '#1E1E2E',         // Card background
    modal: '#0F0F1A',        // Modal overlay
  },
  
  // Neon accent colors
  neon: {
    green: '#00FF88',        // Bright neon green (primary)
    blue: '#00D4FF',         // Electric blue
    purple: '#B347FF',       // Neon purple
    pink: '#FF47B3',         // Hot pink
    yellow: '#FFFF00',       // Electric yellow
    orange: '#FF6B00',       // Neon orange
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',      // Pure white
    secondary: '#B8B8D1',    // Light purple-gray
    tertiary: '#8A8AA8',     // Medium purple-gray
    disabled: '#5A5A6B',     // Darker gray
    inverse: '#0A0A0F',      // Dark text for light backgrounds
  },
  
  // Status colors
  status: {
    success: '#00FF88',      // Neon green
    warning: '#FFFF00',      // Electric yellow
    error: '#FF4757',        // Bright red
    info: '#00D4FF',         // Electric blue
  },
  
  // Interactive states
  interactive: {
    primary: '#00FF88',      // Neon green
    primaryHover: '#00E077', // Slightly darker green
    primaryPressed: '#00CC66', // Darker green
    secondary: '#00D4FF',    // Electric blue
    secondaryHover: '#00BFEE', // Slightly darker blue
    secondaryPressed: '#00AADD', // Darker blue
  },
  
  // Border colors
  border: {
    primary: '#2A2A3E',      // Subtle border
    secondary: '#3A3A4E',    // More visible border
    accent: '#00FF88',       // Neon accent border
    focus: '#00D4FF',        // Focus state border
  },
  
  // Glassmorphism
  glass: {
    background: 'rgba(30, 30, 46, 0.8)',
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 255, 136, 0.2)',
  },
  
  // Warning colors
  warning: {
    primary: '#FFFF00',      // Electric yellow
    secondary: '#FFD700',    // Gold
  },
  
  // Error colors
  error: {
    primary: '#FF4757',      // Bright red
    secondary: '#FF3742',    // Slightly darker red
  },
  
  // Success colors
  success: {
    primary: '#00FF88',      // Neon green
    secondary: '#00E077',    // Slightly darker green
  },
  
  // Gradients
  gradients: {
    primary: ['#00FF88', '#00D4FF'],
    secondary: ['#B347FF', '#FF47B3'],
    background: ['#0A0A0F', '#1A1A2E'],
    card: ['#1E1E2E', '#2A2A3E'],
  },
} as const;

export type Colors = typeof colors;