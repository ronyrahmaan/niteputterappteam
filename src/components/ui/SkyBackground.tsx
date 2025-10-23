/**
 * iOS-Style Dynamic Sky Background
 * Beautiful animated sky with moving clouds, aurora effects, and atmospheric elements
 * Inspired by iOS Messages background with app's neon color scheme
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SkyBackgroundProps {
  animated?: boolean;
  style?: any;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  speed: number;
  layer: number;
  moveX: Animated.Value;
}

interface AuroraRibbon {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: Animated.Value;
  flow: Animated.Value;
  wave: Animated.Value;
}

interface AtmosphericParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  drift: Animated.Value;
  color: string;
}

export const SkyBackground: React.FC<SkyBackgroundProps> = ({
  animated = true,
  style
}) => {
  const cloudsRef = useRef<Cloud[]>([]);
  const auroraRef = useRef<AuroraRibbon[]>([]);
  const particlesRef = useRef<AtmosphericParticle[]>([]);
  const skyColorShift = useRef(new Animated.Value(0)).current;
  const atmosphericGlow = useRef(new Animated.Value(0)).current;

  const neonColors = ['#00FF88', '#00D4FF', '#B347FF', '#FF6B00', '#FFFF00', '#FF47B3'];
  const skyGradientColors = ['#0A0A0F', '#1A1A2E', '#2E1A4A', '#4A1A2E', '#0F3460'];

  useEffect(() => {
    if (!animated) return;

    // Generate cloud layers (smaller, more subtle)
    const clouds: Cloud[] = [];
    const cloudLayers = [
      { count: 2, speed: 0.3, opacity: 0.05, size: 0.6 }, // Background
      { count: 2, speed: 0.5, opacity: 0.08, size: 0.5 }, // Mid
      { count: 1, speed: 0.8, opacity: 0.1, size: 0.4 }, // Foreground
    ];

    cloudLayers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        clouds.push({
          id: layerIndex * 10 + i,
          x: Math.random() * screenWidth * 1.5 - screenWidth * 0.5,
          y: Math.random() * screenHeight * 0.6 + screenHeight * 0.1,
          width: (80 + Math.random() * 120) * layer.size,
          height: (40 + Math.random() * 60) * layer.size,
          opacity: layer.opacity + Math.random() * 0.02,
          speed: layer.speed,
          layer: layerIndex,
          moveX: new Animated.Value(0),
        });
      }
    });
    cloudsRef.current = clouds;

    // Generate aurora ribbons
    const auroras: AuroraRibbon[] = [];
    for (let i = 0; i < 5; i++) {
      auroras.push({
        id: i,
        x: Math.random() * screenWidth,
        y: Math.random() * screenHeight * 0.6,
        width: screenWidth * 0.6 + Math.random() * screenWidth * 0.8,
        height: 60 + Math.random() * 150,
        color: neonColors[i % neonColors.length],
        opacity: new Animated.Value(0),
        flow: new Animated.Value(0),
        wave: new Animated.Value(0),
      });
    }
    auroraRef.current = auroras;

    // Generate atmospheric particles
    const particles: AtmosphericParticle[] = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        id: i,
        x: Math.random() * screenWidth,
        y: Math.random() * screenHeight,
        size: 1 + Math.random() * 6,
        opacity: new Animated.Value(0.2 + Math.random() * 0.5),
        drift: new Animated.Value(0),
        color: neonColors[Math.floor(Math.random() * neonColors.length)],
      });
    }
    particlesRef.current = particles;

    // Sky color shift animation
    const skyAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(skyColorShift, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: false,
        }),
        Animated.timing(skyColorShift, {
          toValue: 0,
          duration: 15000,
          useNativeDriver: false,
        }),
      ])
    );

    // Atmospheric glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(atmosphericGlow, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(atmosphericGlow, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    );

    // Start sky animations
    skyAnimation.start();
    glowAnimation.start();

    // Animate clouds
    clouds.forEach((cloud, index) => {
      const cloudAnimation = Animated.loop(
        Animated.timing(cloud.moveX, {
          toValue: screenWidth + cloud.width,
          duration: (60000 / cloud.speed) + Math.random() * 20000,
          useNativeDriver: true,
        })
      );

      setTimeout(() => {
        cloudAnimation.start();
      }, Math.random() * 10000);
    });

    // Animate aurora ribbons
    auroras.forEach((aurora, index) => {
      // Opacity pulsing
      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(aurora.opacity, {
            toValue: 0.15 + Math.random() * 0.1,
            duration: 4000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(aurora.opacity, {
            toValue: 0.05,
            duration: 4000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ])
      );

      // Flow animation
      const flowAnimation = Animated.loop(
        Animated.timing(aurora.flow, {
          toValue: 1,
          duration: 12000 + Math.random() * 8000,
          useNativeDriver: true,
        })
      );

      // Wave animation
      const waveAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(aurora.wave, {
            toValue: 1,
            duration: 6000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(aurora.wave, {
            toValue: -1,
            duration: 6000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
        ])
      );

      setTimeout(() => {
        opacityAnimation.start();
        flowAnimation.start();
        waveAnimation.start();
      }, index * 2000);
    });

    // Animate particles
    particles.forEach((particle, index) => {
      // Floating animation
      const driftAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.drift, {
            toValue: 30 + Math.random() * 40,
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.drift, {
            toValue: -(30 + Math.random() * 40),
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
          }),
        ])
      );

      // Opacity pulsing
      const opacityAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 0.6,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0.1,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      setTimeout(() => {
        driftAnimation.start();
        opacityAnimation.start();
      }, Math.random() * 5000);
    });

    // Cleanup function
    return () => {
      skyAnimation.stop();
      glowAnimation.stop();
    };
  }, [animated]);

  return (
    <View style={[styles.container, style]}>
      {/* Dynamic sky gradient */}
      <LinearGradient
        colors={skyGradientColors}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.skyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Atmospheric glow overlay */}
      <Animated.View
        style={[
          styles.atmosphericOverlay,
          {
            opacity: atmosphericGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.25],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(0, 255, 136, 0.2)',
            'rgba(0, 212, 255, 0.15)',
            'rgba(179, 71, 255, 0.2)',
            'rgba(255, 107, 0, 0.15)',
            'rgba(255, 255, 0, 0.1)',
            'rgba(255, 71, 179, 0.15)'
          ]}
          style={styles.glowGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Aurora ribbons */}
      {auroraRef.current.map((aurora) => (
        <Animated.View
          key={aurora.id}
          style={[
            styles.auroraRibbon,
            {
              left: aurora.x,
              top: aurora.y,
              width: aurora.width,
              height: aurora.height,
              opacity: aurora.opacity,
              transform: [
                {
                  translateX: aurora.flow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-aurora.width * 0.2, aurora.width * 0.2],
                  }),
                },
                {
                  skewX: aurora.wave.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-5deg', '5deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'transparent',
              `${aurora.color}20`,
              `${aurora.color}40`,
              `${aurora.color}20`,
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.auroraGradient}
          />
        </Animated.View>
      ))}

      {/* Cloud layers */}
      {cloudsRef.current.map((cloud) => (
        <Animated.View
          key={cloud.id}
          style={[
            styles.cloud,
            {
              left: cloud.x,
              top: cloud.y,
              width: cloud.width,
              height: cloud.height,
              opacity: cloud.opacity,
              transform: [{ translateX: cloud.moveX }],
              zIndex: 10 - cloud.layer,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cloudGradient}
          />
        </Animated.View>
      ))}

      {/* Atmospheric particles */}
      {particlesRef.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.drift },
                {
                  translateY: particle.drift.interpolate({
                    inputRange: [-70, 70],
                    outputRange: [20, -20],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  atmosphericOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowGradient: {
    flex: 1,
  },
  auroraRibbon: {
    position: 'absolute',
    borderRadius: 50,
  },
  auroraGradient: {
    flex: 1,
    borderRadius: 50,
  },
  cloud: {
    position: 'absolute',
    borderRadius: 100,
  },
  cloudGradient: {
    flex: 1,
    borderRadius: 100,
  },
  particle: {
    position: 'absolute',
    borderRadius: 10,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});