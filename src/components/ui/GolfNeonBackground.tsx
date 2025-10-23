/**
 * Golf Neon Background Animation Component
 * Beautiful neon golf-themed animations with particles and glowing effects
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface GolfNeonBackgroundProps {
  animated?: boolean;
}

export const GolfNeonBackground: React.FC<GolfNeonBackgroundProps> = ({
  animated = true
}) => {
  // Animation values
  const floatingOrb1 = useRef(new Animated.Value(0)).current;
  const floatingOrb2 = useRef(new Animated.Value(0)).current;
  const floatingOrb3 = useRef(new Animated.Value(0)).current;
  const golfBallMove = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const starTwinkle = useRef(new Animated.Value(0)).current;
  const diamondMove = useRef(new Animated.Value(0)).current;
  const hexagonMove = useRef(new Animated.Value(0)).current;
  const triangleMove = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    // Floating orbs animation
    const createFloatingAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Golf ball rolling animation
    const golfBallAnimation = Animated.loop(
      Animated.timing(golfBallMove, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );

    // Glow pulse animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Star twinkle animation
    const starAnimation = Animated.loop(
      Animated.timing(starTwinkle, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    // Geometric shape movement animations
    const diamondAnimation = Animated.loop(
      Animated.timing(diamondMove, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    );

    const hexagonAnimation = Animated.loop(
      Animated.timing(hexagonMove, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    );

    const triangleAnimation = Animated.loop(
      Animated.timing(triangleMove, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    );

    // Start all animations
    createFloatingAnimation(floatingOrb1, 4000).start();
    createFloatingAnimation(floatingOrb2, 6000).start();
    createFloatingAnimation(floatingOrb3, 5000).start();
    golfBallAnimation.start();
    glowAnimation.start();
    starAnimation.start();
    diamondAnimation.start();
    hexagonAnimation.start();
    triangleAnimation.start();
  }, [animated]);

  return (
    <View style={styles.container}>
      {/* Modern gradient background */}
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302b63', '#0f3460']}
        style={styles.baseGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Subtle overlay for depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.2)']}
        style={styles.overlayGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating neon orbs */}
      <Animated.View
        style={[
          styles.neonOrb,
          styles.orb1,
          {
            opacity: glowPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.8],
            }),
            transform: [
              {
                translateY: floatingOrb1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
              {
                scale: floatingOrb1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#64B5F6', '#42A5F5', '#2196F3']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.neonOrb,
          styles.orb2,
          {
            opacity: glowPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 0.7],
            }),
            transform: [
              {
                translateY: floatingOrb2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -40],
                }),
              },
              {
                translateX: floatingOrb2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#81C784', '#66BB6A', '#4CAF50']}
          style={styles.orbGradient}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.neonOrb,
          styles.orb3,
          {
            opacity: glowPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
            }),
            transform: [
              {
                translateY: floatingOrb3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
              {
                translateX: floatingOrb3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#BA68C8', '#AB47BC', '#9C27B0']}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Golf ball animation */}
      <Animated.View
        style={[
          styles.golfBall,
          {
            opacity: starTwinkle.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
            transform: [
              {
                translateX: golfBallMove.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, width + 50],
                }),
              },
              {
                rotate: golfBallMove.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#E0E0E0']}
          style={styles.golfBallGradient}
        />
      </Animated.View>

      {/* Enhanced twinkling stars */}
      {Array.from({ length: 30 }, (_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              left: Math.random() * width,
              top: Math.random() * height,
              opacity: starTwinkle.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 1],
              }),
              transform: [
                {
                  scale: starTwinkle.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Floating sparkles */}
      {Array.from({ length: 15 }, (_, i) => (
        <Animated.View
          key={`sparkle-${i}`}
          style={[
            styles.sparkle,
            {
              left: (Math.random() * width * 0.8) + (width * 0.1),
              top: (Math.random() * height * 0.7) + (height * 0.15),
              opacity: glowPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.8],
              }),
              transform: [
                {
                  rotate: starTwinkle.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
                {
                  scale: glowPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Floating geometric shapes for visual appeal */}
      <Animated.View
        style={[
          styles.geometricShape,
          styles.diamond,
          {
            opacity: starTwinkle.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.8],
            }),
            transform: [
              {
                translateX: diamondMove.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, width * 0.3, width * 0.7, width * 0.2, 0],
                }),
              },
              {
                translateY: diamondMove.interpolate({
                  inputRange: [0, 0.25, 0.5, 0.75, 1],
                  outputRange: [0, -height * 0.2, height * 0.3, height * 0.1, 0],
                }),
              },
              {
                rotate: glowPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.geometricShape,
          styles.hexagon,
          {
            opacity: glowPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.6],
            }),
            transform: [
              {
                translateX: hexagonMove.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [0, width * 0.5, -width * 0.2, 0],
                }),
              },
              {
                translateY: hexagonMove.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: [0, height * 0.15, -height * 0.25, 0],
                }),
              },
              {
                rotate: starTwinkle.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['360deg', '0deg'],
                }),
              },
              {
                scale: glowPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.1],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.geometricShape,
          styles.triangle,
          {
            opacity: floatingOrb1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 0.9],
            }),
            transform: [
              {
                translateX: triangleMove.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -width * 0.4, width * 0.6],
                }),
              },
              {
                translateY: triangleMove.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, height * 0.2, -height * 0.1],
                }),
              },
              {
                rotate: triangleMove.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          },
        ]}
      />

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
  },
  baseGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  neonOrb: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 12,
  },
  orb1: {
    width: 100,
    height: 100,
    top: height * 0.2,
    right: -30,
  },
  orb2: {
    width: 80,
    height: 80,
    top: height * 0.3,
    left: width * 0.1,
  },
  orb3: {
    width: 60,
    height: 60,
    top: height * 0.4,
    right: width * 0.3,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  golfBall: {
    position: 'absolute',
    width: 20,
    height: 20,
    top: height * 0.7,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  golfBallGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  geometricShape: {
    position: 'absolute',
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  diamond: {
    width: 20,
    height: 20,
    backgroundColor: '#64B5F6',
    top: height * 0.25,
    right: width * 0.2,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  hexagon: {
    width: 30,
    height: 30,
    backgroundColor: '#BA68C8',
    top: height * 0.4,
    left: width * 0.15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#AB47BC',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#81C784',
    top: height * 0.6,
    right: width * 0.3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
});