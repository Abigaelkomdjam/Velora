//app/products/index.tsx
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { formatPrice } from '@/utils/formatPrice';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  useSharedValue
} from 'react-native-reanimated';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  favorites: { user_id: string }[];
};

type Params = { categoryId?: string };

export default function PremiumProductListScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<Params>();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchScale = useSharedValue(1);
  const searchOpacity = useSharedValue(1);

  // Fetch produits
  useEffect(() => {
    if (!authLoading && session) {
      (async () => {
        setLoading(true);
        let query = supabase
          .from('products')
          .select(`id, name, description, price, image_url, stock, favorites(user_id)`)
          .order('id', { ascending: true });
        if (categoryId) query = query.eq('category_id', Number(categoryId));
        const { data, error } = await query;
        if (error) {
          console.error(error);
          Alert.alert('Erreur', 'Impossible de charger les produits');
        } else {
          setProducts(data || []);
          setFiltered(data || []);
        }
        setLoading(false);
      })();
    }
  }, [session, authLoading, categoryId]);

  // Filtrage live
  useEffect(() => {
    if (search.trim() === '') {
      setFiltered(products);
    } else {
      const lc = search.toLowerCase();
      setFiltered(products.filter(p => p.name.toLowerCase().includes(lc)));
    }
  }, [search, products]);

  if (authLoading || loading) {
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
          Chargement des produits premium...
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#111111']}
      style={styles.container}
    >
      {/* Header animé */}
      <Animated.View 
        entering={FadeInDown.duration(800).springify().damping(15)}
        style={styles.header}
      >
        <Animated.Text 
          entering={FadeInDown.delay(100).duration(800)}
          style={styles.title}
        >
          Nos Produits
        </Animated.Text>
        <Animated.Text 
          entering={FadeInDown.delay(200).duration(800)}
          style={styles.subtitle}
        >
          Accessoires de luxe exclusifs
        </Animated.Text>
      </Animated.View>
      
      {/* Barre de recherche premium */}
      <Animated.View
        entering={SlideInDown.duration(800).springify().damping(15)}
        style={styles.searchBar}
      >
        <AntDesign name="search1" size={20} color="#AAA" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </Animated.View>

      {filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.noResultsText}>Aucun produit trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const liked = item.favorites.some(f => f.user_id === userId);
            const delay = index * 100;
            const stockStatus = item.stock === 0 
              ? 'Épuisé' 
              : item.stock < 5 
                ? `${item.stock} restants` 
                : 'Disponible';

            return (
              <Animated.View
                entering={index % 2 === 0 
                  ? SlideInLeft.delay(delay).duration(600).springify().damping(10)
                  : SlideInRight.delay(delay).duration(600).springify().damping(10)}
                style={styles.cardWrapper}
              >
                <TouchableOpacity
                  style={styles.cardTouchable}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/products/${item.id}`)}
                >
                  {/* Carte produit premium */}
                  <LinearGradient
                    colors={['#1A1A1A', '#111']}
                    style={styles.card}
                  >
                    {/* Image produit avec overlay */}
                    <View style={styles.imageContainer}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.image} />
                      ) : (
                        <View style={styles.placeholder}>
                          <MaterialIcons 
                            name="image-not-supported" 
                            size={32} 
                            color="#666" 
                          />
                        </View>
                      )}
                      <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                        style={styles.imageOverlay}
                      />
                      
                      {/* Badge stock amélioré */}
                      <View style={[
                        styles.stockBadge,
                        item.stock === 0 ? styles.stockBadgeEmpty : 
                        item.stock < 5 ? styles.stockBadgeLow : styles.stockBadgeAvailable
                      ]}>
                        <MaterialIcons 
                          name={
                            item.stock === 0 ? "block" : 
                            item.stock < 5 ? "warning" : "check-circle"
                          } 
                          size={16} 
                          color="#FFF"
                        />
                        <Text style={styles.stockText}>
                          {stockStatus}
                        </Text>
                      </View>
                      
                      {/* Bouton favori */}
                      <TouchableOpacity 
                        style={styles.favoriteButton}
                        onPress={() => toggleFavorite(item.id, liked)}
                      >
                        <Animated.View 
                          entering={FadeIn.duration(300)}
                          style={styles.favoriteIcon}
                        >
                          <AntDesign
                            name={liked ? 'heart' : 'hearto'}
                            size={24}
                            color={liked ? '#FF3B30' : '#FFF'}
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Info produit */}
                    <View style={styles.productInfo}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.name}
                      </Text>
                      
                      {/* Prix */}
                      <Text style={styles.price}>
                        {formatPrice(item.price)}
                      </Text>
                      
                      {/* Bouton panier avec indicateur de stock */}
                      <TouchableOpacity
                        style={[
                          styles.cartBtn,
                          item.stock === 0 && styles.cartBtnDisabled
                        ]}
                        onPress={() => addToCart(item.id)}
                        disabled={item.stock === 0}
                      >
                        <LinearGradient
                          colors={
                            item.stock === 0 
                              ? ['#666', '#444'] 
                              : ['#00B3B3', '#008080']
                          }
                          style={styles.cartGradient}
                          start={[0, 0]}
                          end={[1, 1]}
                        >
                          <FontAwesome name="shopping-cart" size={16} color="#FFF" />
                          <Text style={styles.stockLabel}>
                            {stockStatus}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}
    </LinearGradient>
  );

  // Fonctions
  async function toggleFavorite(productId: number, liked: boolean) {
    if (!userId) return;
    
    if (liked) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
    } else {
      await supabase.from('favorites').insert({ user_id: userId, product_id: productId });
    }
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, favorites: liked ? [] : [{ user_id: userId }] }
          : p
      )
    );
  }

  async function addToCart(productId: number) {
    if (!userId) return;
    
    const { data: existing, error: selectError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();
    if (selectError && selectError.code !== 'PGRST116') {
      console.error(selectError);
      return Alert.alert('Erreur', 'Impossible de vérifier le panier');
    }
    if (existing) {
      return Alert.alert('Panier', 'Cet article fait déjà partie de votre panier');
    }
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity: 1 });
    if (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible d’ajouter au panier');
    } else {
      Alert.alert('Panier', 'Article ajouté au panier !');
    }
  }
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 16,
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
  noResultsText: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 179, 179, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    height: 40,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  list: { 
    paddingBottom: 24 
  },
  row: { 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
  },
  cardTouchable: { 
    flex: 1 
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 1,
  },
  stockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  stockBadgeAvailable: {
    backgroundColor: '#34C759',
  },
  stockBadgeLow: {
    backgroundColor: '#FF9500',
  },
  stockBadgeEmpty: {
    backgroundColor: '#FF3B30',
  },
  stockText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  favoriteIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    minHeight: 40,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B3B3',
    textShadowColor: 'rgba(0, 179, 179, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  cartBtn: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cartGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stockLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cartBtnDisabled: {
    opacity: 0.7,
  },
});