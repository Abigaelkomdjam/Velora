// app/favorites.tsx
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { formatPrice } from '@/utils/formatPrice';
import { AntDesign, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = 80;

export default function PremiumFavoritesScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select(`product:products (
        id, name, price, image_url, stock, category_id
      )`)
      .eq('user_id', userId);

    if (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de charger vos favoris");
    } else {
      setItems(data!.map(f => f.product));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [fetchFavorites, userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  async function removeFavorite(productId: number) {
    // Animation immédiate avant suppression
    setItems(prev => prev.filter(item => item.id !== productId));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de supprimer ce favori");
      fetchFavorites(); // Recharger si erreur
    }
  }

  const handleAddToCart = async (productId: number) => {
    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: userId, product_id: productId, quantity: 1 },
        { onConflict: 'user_id, product_id' }
      );
    
    if (error) {
      Alert.alert('Erreur', "Impossible d'ajouter au panier");
    } else {
      Alert.alert('Succès', 'Produit ajouté au panier');
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.centered}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
        <Animated.Text 
          entering={FadeIn.duration(500)}
          style={styles.loadingText}
        >
          Chargement de vos favoris...
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#111111']}
      style={styles.container}
    >
      <Animated.View 
        entering={FadeInDown.duration(800).springify()}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <Animated.Text 
            entering={FadeInDown.delay(100).duration(800)}
            style={styles.title}
          >
            Vos Favoris
          </Animated.Text>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Ionicons name="search" size={26} color="#00B3B3" />
          </TouchableOpacity>
        </View>
        <Animated.Text 
          entering={FadeInDown.delay(200).duration(800)}
          style={styles.subtitle}
        >
          {items.length} produit(s) sauvegardé(s)
        </Animated.Text>
      </Animated.View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Animated.View 
            entering={FadeInUp.duration(800)}
          >
            <View style={styles.heartCircle}>
              <AntDesign name="heart" size={64} color="#00B3B3" />
            </View>
            <Text style={styles.emptyText}>Vos favoris sont vides</Text>
            <Text style={styles.emptySubText}>
              Appuyez sur l'icône ♡ pour ajouter des produits à vos favoris
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/')}
            >
              <LinearGradient
                colors={['#00B3B3', '#008080']}
                style={styles.shopGradient}
              >
                <Text style={styles.shopButtonText}>Découvrir nos produits</Text>
                <AntDesign 
                  name="arrowright" 
                  size={20} 
                  color="#FFF" 
                  style={styles.arrowIcon} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#00B3B3"
              colors={['#00B3B3']}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index % 2 === 0 
                ? SlideInLeft.delay(index * 80).duration(600).springify().damping(10)
                : SlideInRight.delay(index * 80).duration(600).springify().damping(10)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={['#1A1A1A', '#111']}
                style={styles.card}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.productContainer}
                  onPress={() => router.push(`/products/${item.id}`)}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <View style={styles.info}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>
                        {item.category || 'Général'}
                      </Text>
                    </View>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.price}>
                      {formatPrice(item.price)}
                    </Text>
                    
                    {/* Indicateur de stock */}
                    <View style={styles.stockContainer}>
                      <MaterialIcons 
                        name="inventory" 
                        size={16} 
                        color={
                          item.stock === 0 ? '#FF3B30' : 
                          item.stock < 5 ? '#FF9500' : '#34C759'
                        } 
                      />
                      <Text style={[
                          styles.stockText,
                          { 
                            color: item.stock === 0 ? '#FF3B30' : 
                                  item.stock < 5 ? '#FF9500' : '#34C759'
                          }
                        ]}>
                        {item.stock === 0 
                          ? 'Rupture de stock' 
                          : item.stock < 5 
                            ? `Stock faible: ${item.stock}` 
                            : `Stock: ${item.stock}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => handleAddToCart(item.id)}
                  >
                    <FontAwesome name="shopping-basket" size={20} color="#00B3B3" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.favButton}
                    onPress={() => removeFavorite(item.id)}
                    activeOpacity={0.7}
                  >
                    <AntDesign name="heart" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 179, 179, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heartCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 179, 179, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 179, 179, 0.3)',
  },
  emptyText: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 24,
    lineHeight: 22,
  },
  shopButton: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  shopGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    marginLeft: 10,
  },
  shopButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  list: { 
    padding: 16, 
    paddingBottom: 0 
  },
  cardWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  productContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  categoryTag: {
    backgroundColor: 'rgba(0, 179, 179, 0.15)',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B3B3',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00B3B3',
    marginBottom: 10,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#333',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 10,
  },
  cartButton: {
    padding: 12,
    backgroundColor: 'rgba(0, 179, 179, 0.1)',
    borderRadius: 12,
    marginBottom: 10,
  },
  favButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
  },
});