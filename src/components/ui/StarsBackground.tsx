import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  brightness: number;
  blinkPattern: 'fast' | 'slow' | 'pulse' | 'random';
  moveX: Animated.Value;
  moveY: Animated.Value;
  driftSpeed: number;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  moveX: Animated.Value;
}

interface StarsBackgroundProps {
  starCount?: number;
  animated?: boolean;
  showClouds?: boolean;
  showNebula?: boolean;
  dynamicMotion?: boolean;
  style?: any;
}

export const StarsBackground: React.FC<StarsBackgroundProps> = ({ 
  starCount = 50, 
  animated = true,
  showClouds = true,
  showNebula = true,
  dynamicMotion = true,
  style
}) => {
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);
  const cloudAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    // Clear previous animations
    animationsRef.current.forEach(animation => animation.stop());
    cloudAnimationsRef.current.forEach(animation => animation.stop());
    animationsRef.current = [];
    cloudAnimationsRef.current = [];

    // Generate stars with enhanced properties
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const brightness = Math.random();
      const size = brightness > 0.9 ? 3 + Math.random() * 2 : 1 + Math.random() * 2;
      const blinkPatterns = ['fast', 'slow', 'pulse', 'random'] as const;
      
      stars.push({
        id: i,
        x: Math.random() * screenWidth,
        y: Math.random() * screenHeight,
        size,
        opacity: new Animated.Value(0.3 + Math.random() * 0.7),
        brightness,
        blinkPattern: blinkPatterns[Math.floor(Math.random() * blinkPatterns.length)] || 'fast',
        moveX: new Animated.Value(0),
        moveY: new Animated.Value(0),
        driftSpeed: 0.5 + Math.random() * 1.5,
      });
    }
    starsRef.current = stars;

    // Generate clouds
    const clouds: Cloud[] = [];
    if (showClouds) {
      const cloudCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < cloudCount; i++) {
        clouds.push({
          id: i,
          x: Math.random() * screenWidth,
          y: Math.random() * (screenHeight * 0.6),
          width: 80 + Math.random() * 120,
          height: 40 + Math.random() * 60,
          opacity: 0.1 + Math.random() * 0.2,
          moveX: new Animated.Value(0),
        });
      }
    }
    cloudsRef.current = clouds;

    if (animated) {
      // Animate stars with dynamic motion
       stars.forEach((star) => {
        if (dynamicMotion) {
          // Create drift animation for X and Y movement
          const driftX = Animated.loop(
            Animated.sequence([
              Animated.timing(star.moveX, {
                toValue: -20 + Math.random() * 40,
                duration: 8000 + Math.random() * 4000,
                useNativeDriver: true,
              }),
              Animated.timing(star.moveX, {
                toValue: 0,
                duration: 8000 + Math.random() * 4000,
                useNativeDriver: true,
              }),
            ])
          );

          const driftY = Animated.loop(
            Animated.sequence([
              Animated.timing(star.moveY, {
                toValue: -15 + Math.random() * 30,
                duration: 10000 + Math.random() * 5000,
                useNativeDriver: true,
              }),
              Animated.timing(star.moveY, {
                toValue: 0,
                duration: 10000 + Math.random() * 5000,
                useNativeDriver: true,
              }),
            ])
          );

          animationsRef.current.push(driftX, driftY);
          driftX.start();
          driftY.start();
        }

        // Enhanced blinking patterns
        let blinkAnimation: Animated.CompositeAnimation;
        
        switch (star.blinkPattern) {
          case 'fast':
            blinkAnimation = Animated.loop(
              Animated.sequence([
                Animated.timing(star.opacity, {
                  toValue: 0.2,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(star.opacity, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ])
            );
            break;
          case 'slow':
            blinkAnimation = Animated.loop(
              Animated.sequence([
                Animated.timing(star.opacity, {
                  toValue: 0.3,
                  duration: 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(star.opacity, {
                  toValue: 0.9,
                  duration: 2000,
                  useNativeDriver: true,
                }),
              ])
            );
            break;
          case 'pulse':
            blinkAnimation = Animated.loop(
              Animated.sequence([
                Animated.timing(star.opacity, {
                  toValue: 0.4,
                  duration: 1000,
                  useNativeDriver: true,
                }),
                Animated.timing(star.opacity, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(star.opacity, {
                  toValue: 0.4,
                  duration: 1000,
                  useNativeDriver: true,
                }),
              ])
            );
            break;
          case 'random':
            blinkAnimation = Animated.loop(
              Animated.sequence([
                Animated.timing(star.opacity, {
                  toValue: 0.2 + Math.random() * 0.3,
                  duration: 500 + Math.random() * 1500,
                  useNativeDriver: true,
                }),
                Animated.timing(star.opacity, {
                  toValue: 0.7 + Math.random() * 0.3,
                  duration: 500 + Math.random() * 1500,
                  useNativeDriver: true,
                }),
              ])
            );
            break;
        }

        animationsRef.current.push(blinkAnimation);
        
        // Start with random delay
        setTimeout(() => {
          blinkAnimation.start();
        }, Math.random() * 2000);
      });

      // Animate clouds
       clouds.forEach((cloud) => {
        const cloudAnimation = Animated.loop(
          Animated.timing(cloud.moveX, {
            toValue: screenWidth + cloud.width,
            duration: 60000 + Math.random() * 30000,
            useNativeDriver: true,
          })
        );
        
        cloudAnimationsRef.current.push(cloudAnimation);
        
        setTimeout(() => {
          cloudAnimation.start();
        }, Math.random() * 10000);
      });
    }

    return () => {
      animationsRef.current.forEach(animation => animation.stop());
      cloudAnimationsRef.current.forEach(animation => animation.stop());
    };
  }, [starCount, animated, showClouds, dynamicMotion, showNebula]);

  const renderStar = (star: Star) => (
    <Animated.View
      key={star.id}
      style={[
        star.brightness > 0.9 ? styles.brightStar : styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          opacity: star.opacity,
          transform: [
            { translateX: star.moveX },
            { translateY: star.moveY },
          ],
        },
      ]}
    />
  );

  const renderCloud = (cloud: Cloud) => (
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
        },
      ]}
    />
  );

  const renderNebula = () => (
    <>
      <View style={styles.nebula1} />
      <View style={styles.nebula2} />
      <View style={styles.nebula3} />
    </>
  );

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {showNebula && renderNebula()}
      {showClouds && cloudsRef.current.map(renderCloud)}
      {starsRef.current.map(renderStar)}
      <ShootingStars />
    </View>
  );
};

const ShootingStars: React.FC = () => {
  const shootingStarsRef = useRef<{ id: number; animatedValue: Animated.Value }[]>([]);

  useEffect(() => {
    const createShootingStar = () => {
      const id = Date.now();
      const animatedValue = new Animated.Value(0);
      
      shootingStarsRef.current.push({ id, animatedValue });

      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        shootingStarsRef.current = shootingStarsRef.current.filter(star => star.id !== id);
      });
    };

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        createShootingStar();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {shootingStarsRef.current.map(({ id, animatedValue }) => (
        <Animated.View
          key={id}
          style={[
            styles.shootingStar,
            {
              transform: [
                {
                  translateX: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenWidth * 0.2, screenWidth * 0.8],
                  }),
                },
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight * 0.1, screenHeight * 0.4],
                  }),
                },
              ],
              opacity: animatedValue.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    // removed elevation to avoid overlaying interactive content
  },
  brightStar: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    // removed elevation to avoid overlaying interactive content
  },
  nebula1: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: '60%',
    height: '40%',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 200,
    transform: [{ rotate: '45deg' }],
  },
  nebula2: {
    position: 'absolute',
    top: '30%',
    right: '10%',
    width: '40%',
    height: '30%',
    backgroundColor: 'rgba(75, 0, 130, 0.08)',
    borderRadius: 150,
    transform: [{ rotate: '-30deg' }],
  },
  nebula3: {
    position: 'absolute',
    bottom: '20%',
    left: '10%',
    width: '50%',
    height: '35%',
    backgroundColor: 'rgba(25, 25, 112, 0.06)',
    borderRadius: 180,
    transform: [{ rotate: '15deg' }],
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  shootingStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    // removed elevation to avoid overlaying interactive content
  },
});