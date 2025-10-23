/**
 * NitePutter Professional Logo Component
 * Modern, clean logo that works well over animated backgrounds
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText, Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';

interface NitePutterLogoProps {
  size?: number;
  color?: 'light' | 'dark';
}

export const NitePutterLogo: React.FC<NitePutterLogoProps> = ({
  size = 120,
  color = 'light'
}) => {
  const isLight = color === 'light';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop
              offset="0%"
              stopColor={isLight ? "#ffffff" : "#007AFF"}
              stopOpacity="1"
            />
            <Stop
              offset="50%"
              stopColor={isLight ? "#f8f8f8" : "#34C759"}
              stopOpacity="1"
            />
            <Stop
              offset="100%"
              stopColor={isLight ? "#e8e8e8" : "#5856D6"}
              stopOpacity="1"
            />
          </LinearGradient>
          <LinearGradient id="putterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop
              offset="0%"
              stopColor={isLight ? "rgba(0,0,0,0.9)" : "#ffffff"}
              stopOpacity="1"
            />
            <Stop
              offset="100%"
              stopColor={isLight ? "rgba(0,0,0,0.7)" : "#f0f0f0"}
              stopOpacity="1"
            />
          </LinearGradient>
        </Defs>

        {/* Outer circle with professional gradient */}
        <Circle
          cx="60"
          cy="60"
          r="58"
          fill="url(#logoGradient)"
          stroke={isLight ? "rgba(255,255,255,0.4)" : "rgba(52,199,89,0.4)"}
          strokeWidth="3"
        />

        {/* Golf putter club design */}
        <G>
          {/* Putter shaft */}
          <Path
            d="M60 25 L60 75"
            stroke="url(#putterGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Putter head */}
          <Path
            d="M45 75 L75 75"
            stroke="url(#putterGradient)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Golf ball */}
          <Circle
            cx="60"
            cy="85"
            r="6"
            fill={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.9)"}
            stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)"}
            strokeWidth="1"
          />

          {/* Golf ball dimples */}
          <Circle cx="58" cy="83" r="0.5" fill={isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"} />
          <Circle cx="62" cy="83" r="0.5" fill={isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"} />
          <Circle cx="60" cy="87" r="0.5" fill={isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)"} />
        </G>

        {/* Modern "N" letterform */}
        <Path
          d="M35 45 L35 65 L45 45 L45 65"
          stroke="url(#putterGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Modern "P" letterform */}
        <Path
          d="M75 45 L75 65 M75 45 L85 45 Q90 45 90 50 Q90 55 85 55 L75 55"
          stroke="url(#putterGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
});