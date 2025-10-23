import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StyleSheet,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useShopStore } from '../../store/shopStore';
import { ProductDetailScreenProps } from '../../types/navigation';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = ({ route, navigation }: ProductDetailScreenProps) => {
  const { productId } = route.params;
  const { products, addToCart } = useShopStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  // Find the product by ID from the store
  const product = products.find(p => p.id === productId);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      // Show success feedback
      navigation.goBack();
    }
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const productImages = product.images.length > 0 ? product.images : [product.images[0]];


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {productImages.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.productImage} />
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {productImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {product.rating || 4.8}</Text>
            <Text style={styles.reviewCount}>({product.reviewCount || 0} reviews)</Text>
          </View>

          <Text style={styles.description}>
            {product.description || 'Experience the ultimate night golf with our premium glow-in-the-dark accessories. Engineered for performance and style.'}
          </Text>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Features</Text>
              {product.features.map((feature, index) => (
                <View key={index} style={styles.feature}>
                  <Text style={styles.featureText}>• {feature}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Specifications</Text>
              {Object.entries(product.specifications).map(([key, value], index) => (
                <View key={index} style={styles.feature}>
                  <Text style={styles.featureText}>• {key}: {value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.reviewsContainer}>
            <Text style={styles.reviewsTitle}>Reviews</Text>
            <View style={styles.review}>
              <Text style={styles.reviewComment}>
                Customer reviews will be available soon. Be the first to review this product!
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Add to Cart Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handleAddToCart}>
          <LinearGradient
            colors={['#00FF88', '#00D4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addToCartButton}
          >
            <Text style={styles.addToCartText}>
              Add to Cart • ${(product.price * quantity).toFixed(2)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  productImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#00FF88',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FF88',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#888888',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  feature: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#333333',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 20,
  },
  reviewsContainer: {
    marginBottom: 100,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  review: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reviewRating: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#888888',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  addToCartButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: 50,
  },
});