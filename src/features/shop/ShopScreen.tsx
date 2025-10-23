import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StyleSheet,
  Platform,
  RefreshControl,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ShopScreenProps } from '../../types/navigation';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SkyBackground } from '../../components/ui';
import { useShopStore } from '../../store/shopStore';
import { Product } from '../../store/shopStore';

const { width } = Dimensions.get('window');
const PRODUCT_WIDTH = (width - 50) / 2.1;

export const ShopScreen: React.FC = () => {
  const navigation = useNavigation<ShopScreenProps['navigation']>();
  const {
    products,
    cart,
    isLoading,
    fetchProducts,
    addToCart,
    setSelectedProduct,
    refreshCart,
  } = useShopStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Categories definition (needs to be before animation setup)
  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'cups', name: 'Cups', icon: 'golf' },
    { id: 'accessories', name: 'Accessories', icon: 'hardware-chip' },
    { id: 'apparel', name: 'Apparel', icon: 'shirt' },
    { id: 'equipment', name: 'Equipment', icon: 'construct' },
  ];

  // Modern animation setup
  const fadeOpacity = useSharedValue(0);
  const slideY = useSharedValue(30);
  const searchScaleAnim = useSharedValue(1);
  const productAnims = useState(() => new Map())[0];

  // Create category animations properly
  const categoryAnim1 = useSharedValue(1);
  const categoryAnim2 = useSharedValue(1);
  const categoryAnim3 = useSharedValue(1);
  const categoryAnim4 = useSharedValue(1);
  const categoryAnim5 = useSharedValue(1);
  const categoryAnims = [categoryAnim1, categoryAnim2, categoryAnim3, categoryAnim4, categoryAnim5];

  useEffect(() => {
    // Load products and cart on mount
    fetchProducts();
    refreshCart();

    fadeOpacity.value = withSpring(1, { tension: 300, friction: 10 });
    slideY.value = withSpring(0, { tension: 300, friction: 10 });
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);

    try {
      await Promise.all([fetchProducts(), refreshCart()]);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 600);
    }
  }, [fetchProducts, refreshCart]);

  const handleAddToCart = useCallback((product: Product) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(product, 1);

    const anim = productAnims.get(product.id);
    if (anim) {
      anim.value = withSpring(0.95, { tension: 300, friction: 10 }, () => {
        anim.value = withSpring(1, { tension: 300, friction: 10 });
      });
    }
  }, [addToCart, productAnims]);

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProduct(product);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate and navigate safely
    const anim = productAnims.get(product.id);
    if (anim) {
      anim.value = withSpring(0.95, { tension: 300, friction: 10 }, () => {
        anim.value = withSpring(1, { tension: 300, friction: 10 });
      });
    }

    // Navigate immediately - no delays to prevent crashes
    try {
      navigation.navigate('ProductDetail', { productId: product.id });
    } catch (error) {
      console.log('Navigation error:', error);
      // Fallback navigation
      setTimeout(() => {
        navigation.navigate('ProductDetail', { productId: product.id });
      }, 100);
    }
  }, [setSelectedProduct, navigation, productAnims]);

  const handleCategoryPress = useCallback((categoryId: string, index: number) => {
    setSelectedCategory(categoryId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const anim = categoryAnims[index];
    if (anim) {
      anim.value = withSpring(0.95, { tension: 300, friction: 10 }, () => {
        anim.value = withSpring(1, { tension: 300, friction: 10 });
      });
    }
  }, [categoryAnims]);

  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    searchScaleAnim.value = withSpring(1.02, { tension: 300, friction: 10 });
  }, [searchScaleAnim]);

  const handleSearchBlur = useCallback(() => {
    setSearchFocused(false);

    searchScaleAnim.value = withSpring(1, { tension: 300, friction: 10 });
  }, [searchScaleAnim]);

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const ProductCard = ({ product }: { product: Product }) => {
    // Create animation value for this product if it doesn't exist
    const productAnim = useSharedValue(1);

    // Store the animation in the map
    if (!productAnims.has(product.id)) {
      productAnims.set(product.id, productAnim);
    }

    const animatedStyle = useAnimatedStyle(() => {
      const anim = productAnims.get(product.id) || productAnim;
      return {
        transform: [{ scale: anim.value }],
      };
    });

    return (
      <Reanimated.View style={animatedStyle}>
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => handleProductPress(product)}
          activeOpacity={0.9}
        >
          <View style={styles.productGradient}>
            <Image source={{ uri: product.images[0] }} style={styles.productImage} />

            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={3}>{product.name}</Text>
              <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>

              {product.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(product)}
              activeOpacity={0.8}
            >
              <View style={styles.addButtonGradient}>
                <Ionicons name="add" size={16} color="#000000" />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Reanimated.View>
    );
  };

  const CategoryButton = ({ category, index }: { category: typeof categories[0]; index: number }) => {
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: categoryAnims[index]?.value || 1 }],
    }));

    return (
      <Reanimated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.selectedCategoryButton,
          ]}
          onPress={() => handleCategoryPress(category.id, index)}
          activeOpacity={0.8}
        >
        <Ionicons
          name={category.icon as any}
          size={20}
          color={
            selectedCategory === category.id
              ? '#000000'
              : 'rgba(255, 255, 255, 0.7)'
          }
        />
        <Text
          style={[
            styles.categoryText,
            selectedCategory === category.id && styles.selectedCategoryText,
          ]}
        >
          {category.name}
        </Text>
        </TouchableOpacity>
      </Reanimated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SkyBackground animated={true} />

      <SafeAreaView style={styles.safeArea}>
        <Reanimated.View
          style={[
            styles.content,
            useAnimatedStyle(() => ({
              opacity: fadeOpacity.value,
              transform: [{ translateY: slideY.value }],
            })),
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Shop</Text>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Cart');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="bag" size={24} color="#FFFFFF" />
              {getCartItemCount() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <Reanimated.View
            style={[
              styles.searchContainer,
              useAnimatedStyle(() => ({
                transform: [{ scale: searchScaleAnim.value }],
              })),
            ]}
          >
            <View style={styles.searchGradient}>
              <Ionicons name="search" size={20} color={searchFocused ? '#00FF88' : 'rgba(255, 255, 255, 0.6)'} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={'rgba(255, 255, 255, 0.5)'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                selectionColor={'#00FF88'}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={20} color={'rgba(255, 255, 255, 0.6)'} />
                </TouchableOpacity>
              )}
            </View>
          </Reanimated.View>

          {/* Categories - Redesigned Simple */}
          <View style={styles.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('all')}
              >
                <Ionicons name="grid" size={16} color={selectedCategory === 'all' ? '#000' : '#fff'} />
                <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'cups' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('cups')}
              >
                <Ionicons name="golf" size={16} color={selectedCategory === 'cups' ? '#000' : '#fff'} />
                <Text style={[styles.categoryChipText, selectedCategory === 'cups' && styles.categoryChipTextActive]}>Cups</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'accessories' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('accessories')}
              >
                <Ionicons name="hardware-chip" size={16} color={selectedCategory === 'accessories' ? '#000' : '#fff'} />
                <Text style={[styles.categoryChipText, selectedCategory === 'accessories' && styles.categoryChipTextActive]}>Accessories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'apparel' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('apparel')}
              >
                <Ionicons name="shirt" size={16} color={selectedCategory === 'apparel' ? '#000' : '#fff'} />
                <Text style={[styles.categoryChipText, selectedCategory === 'apparel' && styles.categoryChipTextActive]}>Apparel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'equipment' && styles.categoryChipActive]}
                onPress={() => setSelectedCategory('equipment')}
              >
                <Ionicons name="construct" size={16} color={selectedCategory === 'equipment' ? '#000' : '#fff'} />
                <Text style={[styles.categoryChipText, selectedCategory === 'equipment' && styles.categoryChipTextActive]}>Equipment</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Products Grid */}
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => <ProductCard product={item} />}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productsContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
            bouncesZoom={false}
            alwaysBounceVertical={true}
            decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.98}
            scrollEventThrottle={16}
            ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={'#00D4FF'}
                colors={['#00D4FF']}
                progressBackgroundColor={'rgba(30, 30, 46, 0.8)'}
                titleColor={'#FFFFFF'}
                title={'Pull to refresh'}
              />
            }
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingCard}>
                    <Ionicons name="golf" size={48} color="#00FF88" />
                    <Text style={styles.loadingText}>Loading Products...</Text>
                    <Text style={styles.loadingSubtext}>Fetching the best golf equipment for you</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="bag-outline" size={64} color={'rgba(255, 255, 255, 0.4)'} />
                  <Text style={styles.emptyText}>No products found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search or category filter</Text>
                </View>
              )
            }
          />
        </Reanimated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
    position: 'relative',
    minHeight: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00FF88',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 255, 136, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  cartButton: {
    position: 'absolute',
    right: 0,
    top: 8,
    padding: 14,
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  searchContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    borderRadius: 20,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '400',
  },
  categoriesSection: {
    marginBottom: 20,
    paddingVertical: 10,
  },
  categoriesScrollContent: {
    paddingHorizontal: 20,
    paddingRight: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 50, 70, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryChipActive: {
    backgroundColor: '#00FF88',
    borderColor: '#00FF88',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categoryChipTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  productsContainer: {
    paddingBottom: 100,
    paddingHorizontal: 0,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginHorizontal: 0,
    gap: 10,
  },
  productCard: {
    width: PRODUCT_WIDTH,
    marginBottom: 20,
    marginHorizontal: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  productGradient: {
    padding: 16,
    position: 'relative',
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 20,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  productImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productInfo: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.2,
    lineHeight: 18,
    minHeight: 36,
    textAlign: 'left',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00FF88',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 255, 136, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  addToCartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00FF88',
    borderRadius: 18,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 80,
  },
  loadingCard: {
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: -0.3,
  },
  loadingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    fontWeight: '400',
  },
});


