// app/products/[id].tsx
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { formatPrice } from '@/utils/formatPrice';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInUp,
  SlideInRight
} from 'react-native-reanimated';

type Params = { id: string };
type ProductDetail = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_name: string;
  stock: number;
};

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 0.95;

export default function PremiumProductDetailScreen() {
  const { id } = useLocalSearchParams<Params>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session!.user.id;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [qty, setQty] = useState(1); // Changé en nombre
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [favorite, setFavorite] = useState(false);

  // Fetch produit et état favori
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Récupérer les détails du produit
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            id, name, description, price, image_url, stock,
            categories(name)
          `)
          .eq('id', Number(id))
          .single();

        if (productError || !productData) {
          console.error(productError);
          Alert.alert('Erreur', 'Produit introuvable');
          return router.back();
        }

        // Récupérer l'état favori
        const { data: favData, error: favError } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', Number(id))
          .single();

        setProduct({
          id: productData.id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          image_url: productData.image_url,
          stock: productData.stock,
          category_name: (productData as any).categories.name,
        });
        
        setFavorite(!!favData);
      } catch (error) {
        console.error(error);
        Alert.alert('Erreur', 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, userId]);

  const toggleFavorite = async () => {
    if (!userId || !product) return;
    
    try {
      if (favorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', product.id);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: userId, product_id: product.id });
      }
      setFavorite(!favorite);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de modifier les favoris");
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Validation
    if (product.stock === 0) {
      return Alert.alert(
        'Rupture de stock',
        'Désolé, ce produit est en rupture de stock.'
      );
    }
    if (qty < 1) {
      return Alert.alert('Quantité invalide', 'Veuillez entrer une quantité valide.');
    }
    if (qty > product.stock) {
      return Alert.alert(
        'Stock insuffisant',
        `La quantité demandée (${qty}) dépasse le stock disponible (${product.stock}).`
      );
    }

    setAdding(true);
    try {
      // Vérifier si le produit est déjà dans le panier
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .single();

      let error;
      if (existing) {
        // Mettre à jour la quantité si déjà dans le panier
        ({ error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + qty })
          .eq('id', existing.id));
      } else {
        // Ajouter au panier
        ({ error } = await supabase
          .from('cart_items')
          .insert({ user_id: userId, product_id: product.id, quantity: qty }));
      }

      if (error) throw error;
      Alert.alert('Panier', 'Article ajouté au panier !');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible d’ajouter au panier');
    } finally {
      setAdding(false);
    }
  };

  if (loading || !product) {
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
          Chargement du produit premium...
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContainer}
    >
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.gradientBackground}
      >
        {/* Image produit avec animations */}
        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.imageContainer}
        >
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#1A1A1A', '#111']}
              style={styles.imagePlaceholder}
            >
              <FontAwesome name="picture-o" size={64} color="#666" />
            </LinearGradient>
          )}
          
          {/* Overlay avec boutons */}
          <Animated.View 
            entering={FadeInDown.duration(800)}
            style={styles.overlay}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                style={styles.backGradient}
              >
                <AntDesign name="arrowleft" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.favoriteBtn}
              onPress={toggleFavorite}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={favorite 
                  ? ['rgba(255,59,48,0.7)', 'rgba(255,59,48,0.5)'] 
                  : ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                style={styles.favoriteGradient}
              >
                <AntDesign 
                  name={favorite ? "heart" : "hearto"} 
                  size={24} 
                  color={favorite ? "#FFF" : "#FFF"} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Badge prix animé */}
          <Animated.View
            entering={SlideInRight.duration(800).springify()}
            style={styles.priceBadge}
          >
            <Text style={styles.priceText}>{formatPrice(product.price)}</Text>
          </Animated.View>
        </Animated.View>

        {/* Détails produit avec animations */}
        <Animated.View
          entering={FadeInUp.duration(800).delay(200)}
          style={styles.infoCard}
        >
          <LinearGradient
            colors={['#1A1A1A', '#111']}
            style={styles.cardGradient}
          >
            {/* En-tête catégorie */}
            <Animated.View 
              entering={FadeInLeft.duration(600).delay(300)}
              style={styles.categoryContainer}
            >
              <Text style={styles.category}>
                {product.category_name.toUpperCase()}
              </Text>
              <View style={[
                styles.stockBadge,
                product.stock === 0 ? styles.stockBadgeEmpty : 
                product.stock < 5 ? styles.stockBadgeLow : styles.stockBadgeAvailable
              ]}>
                <Text style={styles.stockText}>
                  {product.stock === 0 
                    ? 'ÉPUISÉ' 
                    : product.stock < 5 
                      ? `STOCK FAIBLE` 
                      : `EN STOCK`}
                </Text>
              </View>
            </Animated.View>
            
            {/* Nom produit */}
            <Animated.Text 
              entering={FadeInLeft.duration(600).delay(400)}
              style={styles.name}
            >
              {product.name}
            </Animated.Text>
            
            {/* Description */}
            <Animated.Text 
              entering={FadeInLeft.duration(600).delay(500)}
              style={styles.desc}
            >
              {product.description}
            </Animated.Text>
            
            {/* Détails stock */}
            <Animated.View 
              entering={FadeInLeft.duration(600).delay(600)}
              style={styles.stockContainer}
            >
              <FontAwesome name="cube" size={16} color="#00B3B3" />
              <Text style={styles.stockDetail}>
                Stock disponible: <Text style={styles.stockCount}>{product.stock}</Text>
              </Text>
            </Animated.View>
            
            {/* Contrôle quantité */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(700)}
              style={styles.qtyContainer}
            >
              <Text style={styles.label}>Quantité</Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(prev => Math.max(1, prev - 1))} // Changé pour nombre
                  disabled={qty === 1}
                >
                  <AntDesign name="minus" size={20} color="#FFF" />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.qtyInput}
                  keyboardType="numeric"
                  value={qty.toString()} // Converti en chaîne pour affichage
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num)) {
                      setQty(num);
                    } else if (text === '') {
                      setQty(1);
                    }
                  }}
                  selectTextOnFocus
                />
                
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(prev => Math.min(product.stock, prev + 1))} // Changé pour nombre
                  disabled={qty >= product.stock}
                >
                  <AntDesign name="plus" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
            
            {/* Bouton d'action principal */}
            <Animated.View 
              entering={FadeInUp.duration(600).delay(800)}
              style={styles.actionContainer}
            >
              <TouchableOpacity
                style={[
                  styles.cartBtn,
                  product.stock === 0 && styles.cartBtnDisabled
                ]}
                onPress={handleAddToCart}
                disabled={adding || product.stock === 0}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    product.stock === 0 
                      ? ['#666', '#444'] 
                      : ['#00B3B3', '#008080']
                  }
                  style={styles.cartGradient}
                  start={[0, 0]}
                  end={[1, 1]}
                >
                  {adding ? (
                    <ActivityIndicator color="#FFF" />
                  ) : product.stock === 0 ? (
                    <Text style={styles.cartBtnText}>RUPTURE DE STOCK</Text>
                  ) : (
                    <>
                      <FontAwesome name="shopping-cart" size={20} color="#FFF" />
                      <Text style={styles.cartBtnText}>AJOUTER AU PANIER</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => {
                  handleAddToCart();
                  router.push('/cart');
                }}
                disabled={adding || product.stock === 0}
              >
                <Text style={styles.buyBtnText}>ACHETER MAINTENANT</Text>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
        
        {/* Pied de page premium */}
        <Animated.View 
          entering={FadeInUp.duration(800).delay(900)}
          style={styles.footer}
        >
          <LinearGradient
            colors={['#00B3B3', '#008080']}
            style={styles.footerGradient}
          >
            <Text style={styles.footerText}>Produit Premium Exclusif</Text>
            <Text style={styles.footerSubtext}>Garantie Qualité</Text>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  gradientBackground: {
    flex: 1,
    minHeight: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    position: 'relative',
    marginBottom: 20,
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backBtn: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  backGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBtn: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  favoriteGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#00B3B3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
  },
  cardGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00B3B3',
    letterSpacing: 1.5,
  },
  stockBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  stockBadgeAvailable: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  stockBadgeEmpty: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
    lineHeight: 32,
  },
  desc: {
    fontSize: 16,
    lineHeight: 24,
    color: '#AAA',
    marginBottom: 24,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: 'rgba(0, 179, 179, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 179, 179, 0.3)',
  },
  stockDetail: {
    fontSize: 16,
    color: '#AAA',
    marginLeft: 10,
  },
  stockCount: {
    fontWeight: '700',
    color: '#FFF',
  },
  qtyContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  qtyBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  qtyInput: {
    width: 60,
    height: 50,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: '#1A1A1A',
  },
  actionContainer: {
    marginTop: 16,
  },
  cartBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    height: 56,
  },
  cartBtnDisabled: {
    opacity: 0.7,
  },
  cartGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cartBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  buyBtn: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00B3B3',
  },
  buyBtnText: {
    color: '#00B3B3',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  footerGradient: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
});