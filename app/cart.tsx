// app/cart.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { formatPrice } from '@/utils/formatPrice';
import { AntDesign, FontAwesome, MaterialIcons } from '@expo/vector-icons';
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
  SlideInRight,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = 90;

// Composant pour un item du panier
const CartItem = ({
  item,
  index,
  updateQty,
  removeItem
}: {
  item: any;
  index: number;
  updateQty: (productId: number, newQty: number) => void;
  removeItem: (productId: number) => void;
}) => {
  const delay = index * 100;
  return (
    <Animated.View
      entering={
        index % 2 === 0
          ? SlideInLeft.delay(delay).duration(600).springify().damping(10)
          : SlideInRight.delay(delay).duration(600).springify().damping(10)
      }
      style={styles.cardWrapper}
    >
      <LinearGradient colors={['#1A1A1A', '#111']} style={styles.card}>
        <Image source={{ uri: item.product.image_url }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.product.name}
          </Text>

          <View style={styles.qtyRow}>
            <TouchableOpacity
              onPress={() => updateQty(item.product.id, item.quantity - 1)}
              style={styles.qtyButton}
            >
              <AntDesign name="minus" size={18} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.qtyText}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={() => updateQty(item.product.id, item.quantity + 1)}
              style={styles.qtyButton}
            >
              <AntDesign name="plus" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.priceText}>
              {formatPrice(item.product.price)} / unité
            </Text>
          </View>

          <Text style={styles.subtotalText}>
            Sous‑total : {formatPrice(item.quantity * item.product.price)}
          </Text>

          {/* Affichage du stock */}
          <View style={styles.stockContainer}>
            <MaterialIcons
              name="inventory"
              size={16}
              color={
                item.product.stock === 0
                  ? '#FF3B30'
                  : item.product.stock < 5
                  ? '#FF9500'
                  : '#34C759'
              }
            />
            <Text
              style={[
                styles.stockText,
                {
                  color:
                    item.product.stock === 0
                      ? '#FF3B30'
                      : item.product.stock < 5
                      ? '#FF9500'
                      : '#34C759'
                }
              ]}
            >
              {item.product.stock === 0
                ? 'Rupture de stock'
                : item.product.stock < 5
                ? `Stock faible : ${item.product.stock}`
                : `Stock disponible : ${item.product.stock}`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => removeItem(item.product.id)}
          style={styles.removeBtn}
        >
          <FontAwesome name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

export default function PremiumCartScreen() {
  const { session } = useAuth();
  const userId = session?.user.id || '';
  const router = useRouter();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const footerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(items.length > 0 ? 0 : 100, { damping: 15 }) }
    ]
  }));

  const fetchCart = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        quantity,
        product:products (
          id, name, price, image_url, stock
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de charger le panier");
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchCart();
  }, [fetchCart, userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  }, [fetchCart]);

  const updateQty = async (productId: number, newQty: number) => {
    if (newQty < 1) return;
    const item = items.find(i => i.product.id === productId);
    if (!item) return;
    if (newQty > item.product.stock) {
      return Alert.alert(
        'Stock insuffisant',
        `Il ne reste que ${item.product.stock} exemplaire(s).`
      );
    }
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      fetchCart();
    }
  };

  const removeItem = async (productId: number) => {
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    fetchCart();
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    const total = items.reduce(
      (sum, i) => sum + i.quantity * i.product.price,
      0
    );

    // 1) Création de la commande
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert([{ user_id: userId, total_amount: total, status: 'en cours' }])
      .select()
      .single();

    if (orderErr || !order) {
      console.error(orderErr);
      return Alert.alert('Erreur', "Impossible de créer la commande");
    }

    // 2) Insertion des order_items
    const itemsToInsert = items.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.product.price
    }));
    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert);
    if (itemsErr) {
      console.error(itemsErr);
      return Alert.alert('Erreur', "Impossible d’enregistrer les articles");
    }

    // 3) **Mise à jour du stock** : pour chaque produit, on décrémente
    for (const i of items) {
      const newStock = i.product.stock - i.quantity;
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', i.product.id);
    }

    // 4) Vider le panier
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);
    fetchCart();

    // 5) Redirection vers l'historique
    router.push('/orders');
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
          Chargement de votre panier premium…
        </Animated.Text>
      </LinearGradient>
    );
  }

  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.product.price,
    0
  );

  return (
    <AnimatedScreen>
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.container}
      >
        {/* En‑tête */}
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          style={styles.header}
        >
          <Animated.Text
            entering={FadeInDown.delay(100).duration(800)}
            style={styles.title}
          >
            Votre Panier
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.subtitle}
          >
            Récapitulatif de vos articles
          </Animated.Text>
        </Animated.View>

        {/* Liste */}
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Animated.View entering={FadeInUp.duration(800)}>
              <MaterialIcons name="shopping-cart" size={96} color="#00B3B3" />
              <Text style={styles.emptyText}>Votre panier est vide</Text>
              <Text style={styles.emptySubText}>
                Explorez notre collection et ajoutez vos produits préférés
              </Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.push('/')}
              >
                <LinearGradient
                  colors={['#00B3B3', '#008080']}
                  style={styles.shopGradient}
                >
                  <Text style={styles.shopButtonText}>
                    Découvrir nos produits
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={i => i.product.id.toString()}
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
              <CartItem
                item={item}
                index={index}
                updateQty={updateQty}
                removeItem={removeItem}
              />
            )}
            ListFooterComponent={<View style={{ height: 160 }} />}
          />
        )}

        {/* Résumé & bouton */}
        <Animated.View style={[styles.footer, footerStyle]}>
          <LinearGradient
            colors={['#1A1A1A', '#111']}
            style={styles.footerGradient}
          >
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous‑total</Text>
                <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Livraison</Text>
                <Text style={styles.summaryValue}>Gratuite</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              style={styles.checkoutBtn}
              disabled={items.length === 0}
            >
              <LinearGradient
                colors={
                  items.length === 0
                    ? ['#666', '#444']
                    : ['#00B3B3', '#008080']
                }
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradient}
              >
                <FontAwesome name="credit-card" size={20} color="#fff" />
                <Text style={styles.checkoutText}>
                  {items.length === 0 ? 'Panier vide' : 'Passer commande'}
                </Text>  
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex:1, justifyContent:'center', alignItems:'center' },
  loadingText: { marginTop:24, fontSize:16, color:'#AAA', fontWeight:'500' },
  header: {
    padding:24, paddingBottom:16,
    borderBottomWidth:1, borderColor:'#333'
  },
  title: {
    fontSize:32, fontWeight:'800',
    color:'#FFF', marginBottom:4,
    textShadowColor:'rgba(0,179,179,0.3)',
    textShadowOffset:{width:0,height:0},
    textShadowRadius:10
  },
  subtitle: { fontSize:16, color:'#AAA', fontWeight:'500' },
  emptyContainer: { flex:1,justifyContent:'center',alignItems:'center',padding:24 },
  emptyText: { marginTop:24, fontSize:20, fontWeight:'600', color:'#FFF', textAlign:'center' },
  emptySubText: { marginTop:8, fontSize:16, color:'#AAA', textAlign:'center', maxWidth:300, marginBottom:24 },
  shopButton:{ marginTop:16, borderRadius:14, overflow:'hidden',
    shadowColor:'#00B3B3',shadowOffset:{width:0,height:6},shadowOpacity:0.3,shadowRadius:12,elevation:10 },
  shopGradient:{ paddingVertical:16,paddingHorizontal:32,justifyContent:'center',alignItems:'center' },
  shopButtonText:{ color:'#FFF',fontWeight:'600',fontSize:16 },
  list:{ padding:16,paddingBottom:0 },
  cardWrapper:{ marginBottom:20,borderRadius:20,overflow:'hidden',
    shadowColor:'#00B3B3',shadowOffset:{width:0,height:8},shadowOpacity:0.2,shadowRadius:15,elevation:12 },
  card:{ flexDirection:'row',borderRadius:20,overflow:'hidden',alignItems:'center',padding:16,borderWidth:1,borderColor:'#333' },
  image:{ width:IMAGE_SIZE, height:IMAGE_SIZE, borderRadius:12 },
  info:{ flex:1,paddingHorizontal:16 },
  name:{ fontSize:16,fontWeight:'700',color:'#FFF',marginBottom:8 },
  qtyRow:{ flexDirection:'row',alignItems:'center',marginBottom:8,
    backgroundColor:'#222',borderRadius:10,alignSelf:'flex-start',paddingVertical:4,paddingHorizontal:8,borderWidth:1,borderColor:'#333' },
  qtyButton:{ width:30,height:30,justifyContent:'center',alignItems:'center',backgroundColor:'#333',borderRadius:8 },
  qtyText:{ marginHorizontal:12,fontSize:16,fontWeight:'600',color:'#FFF',minWidth:20,textAlign:'center' },
  detailsRow:{ flexDirection:'row',justifyContent:'space-between',marginBottom:8 },
  priceText:{ fontSize:14,color:'#AAA',fontWeight:'500' },
  subtotalText:{ fontSize:15,color:'#FFF',fontWeight:'700',marginBottom:8 },
  stockContainer:{ flexDirection:'row',alignItems:'center',
    backgroundColor:'#222',borderRadius:8,paddingVertical:6,paddingHorizontal:10,alignSelf:'flex-start',borderWidth:1,borderColor:'#333' },
  stockText:{ fontSize:13,fontWeight:'600',marginLeft:6 },
  removeBtn:{ padding:10 },
  footer:{ position:'absolute', bottom:0, width:'100%',
    borderTopWidth:1, borderColor:'#333',
    shadowColor:'#00B3B3',shadowOffset:{width:0,height:-4},shadowOpacity:0.2,shadowRadius:20,elevation:12 },
  footerGradient:{ padding:16, borderTopLeftRadius:24, borderTopRightRadius:24 },
  summary:{ marginBottom:16 },
  summaryRow:{ flexDirection:'row',justifyContent:'space-between',marginBottom:8 },
  summaryLabel:{ fontSize:16,color:'#AAA',fontWeight:'500' },
  summaryValue:{ fontSize:16,color:'#FFF',fontWeight:'600' },
  totalLabel:{ fontSize:18,color:'#FFF',fontWeight:'700' },
  totalValue:{ fontSize:20,fontWeight:'800',color:'#00B3B3',
    textShadowColor:'rgba(0,179,179,0.3)',textShadowOffset:{width:0,height:0},textShadowRadius:10 },
  checkoutBtn:{ borderRadius:14,overflow:'hidden',
    shadowColor:'#00B3B3',shadowOffset:{width:0,height:6},shadowOpacity:0.4,shadowRadius:15,elevation:12 },
  gradient:{ flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:16 },
  checkoutText:{ color:'#fff',fontWeight:'700',fontSize:18,marginLeft:12,
    textShadowColor:'rgba(0,0,0,0.3)',textShadowOffset:{width:0,height:1},textShadowRadius:2 },
});
