// app/orders.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { formatPrice } from '@/utils/formatPrice';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type OrderItem = {
  quantity: number;
  unit_price: number;
  product: { name: string };
};
type Order = {
  id: number;
  created_at: string;
  status: string;
  total_amount: number;
  order_items?: OrderItem[];
};

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;

export default function PremiumOrdersScreen() {
  const { session, loading: authLoading } = useAuth();
  const userId = session!.user.id;
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const headerY = useSharedValue(0);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total_amount,
        order_items (
          quantity,
          unit_price,
          product:products(name)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchOrders error:', error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
    setRefreshing(false);
    headerY.value = withSpring(0, { damping: 15 });
  };

  // À chaque focus de l'écran, on recharge les commandes
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        fetchOrders();
      }
    }, [authLoading])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

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
          Chargement de vos commandes premium...
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <AnimatedScreen>
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.container}
      >
        {/* En-tête animé */}
        <Animated.View
          style={[styles.header, { transform: [{ translateY: headerY }] }]}
          entering={FadeInDown.duration(800).springify()}
        >
          <Animated.Text
            entering={FadeInDown.delay(100).duration(800)}
            style={styles.title}
          >
            Vos Commandes
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.subtitle}
          >
            Historique et suivi
          </Animated.Text>
        </Animated.View>

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Animated.View entering={FadeInUp.duration(800)}>
              <Entypo name="box" size={96} color="#00B3B3" />
              <Text style={styles.emptyText}>Aucune commande trouvée</Text>
              <Text style={styles.emptySubText}>
                Vous n'avez pas encore passé de commande
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
            contentContainerStyle={styles.list}
            data={orders}
            keyExtractor={(o) => o.id.toString()}
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
                entering={
                  index % 2 === 0
                    ? SlideInLeft.delay(index * 80).duration(600).springify()
                    : SlideInRight.delay(index * 80).duration(600).springify()
                }
                style={styles.cardWrapper}
              >
                <LinearGradient
                  colors={['#1A1A1A', '#111']}
                  style={styles.card}
                >
                  {/* En-tête de la carte */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>Commande #{item.id}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status.toLowerCase() === 'payé'
                          ? styles.statusPaid
                          : item.status.toLowerCase() === 'expédié'
                          ? styles.statusShipped
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Date */}
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>

                  {/* Lignes d’articles */}
                  <View style={styles.itemsContainer}>
                    {(item.order_items ?? []).slice(0, 2).map((oi, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemName}>• {oi.product.name}</Text>
                        <Text style={styles.itemDetail}>
                          {oi.quantity} × {formatPrice(oi.unit_price)}
                        </Text>
                      </View>
                    ))}
                    {(item.order_items ?? []).length > 2 && (
                      <Text style={styles.moreItems}>
                        + {(item.order_items ?? []).length - 2} articles supplémentaires
                      </Text>
                    )}
                  </View>

                  {/* Total */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total :</Text>
                    <Text style={styles.totalValue}>
                      {formatPrice(item.total_amount)}
                    </Text>
                  </View>

                  {/* Bouton "Payer" */}
                  {item.status.toLowerCase() === 'en cours' && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.payButton}
                      onPress={() =>
                        router.push({
                          pathname: '/payment/[orderId]',
                          params: { orderId: item.id.toString() },
                        })
                      }
                    >
                      <LinearGradient
                        colors={['#00B3B3', '#008080']}
                        style={styles.payGradient}
                      >
                        <Text style={styles.payText}>Payer la commande</Text>
                        <AntDesign name="arrowright" size={20} color="#FFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* Bouton "Suivre mon colis" */}
                  {item.status.toLowerCase() === 'expédié' && (
                    <TouchableOpacity style={styles.trackButton}>
                      <Text style={styles.trackText}>Suivre mon colis</Text>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </Animated.View>
            )}
          />
        )}

        {/* Pied de page animé */}
        <Animated.View
          entering={FadeInUp.duration(800).delay(300)}
          style={styles.footer}
        >
          <LinearGradient
            colors={['#00B3B3', '#008080']}
            style={styles.footerGradient}
          >
            <Text style={styles.footerText}>Service Client Premium</Text>
            <Text style={styles.footerSubtext}>Assistance 24/7</Text>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,179,179,0.3)',
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
  emptyText: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: '600',
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
  shopGradient: { paddingVertical: 16, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' },
  shopButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  list: { paddingHorizontal: HORIZONTAL_PADDING, paddingVertical: 16, paddingBottom: 100 },
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
  card: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  statusPending: { backgroundColor: 'rgba(255,149,0,0.2)', borderWidth: 1, borderColor: '#FF9500' },
  statusPaid: { backgroundColor: 'rgba(52,199,89,0.2)', borderWidth: 1, borderColor: '#34C759' },
  statusShipped: { backgroundColor: 'rgba(0,122,255,0.2)', borderWidth: 1, borderColor: '#007AFF' },
  statusText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  date: { fontSize: 14, color: '#AAA', marginBottom: 16 },
  itemsContainer: { marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { flex: 2, fontSize: 14, color: '#FFF' },
  itemDetail: { flex: 1, fontSize: 14, color: '#AAA', textAlign: 'right' },
  moreItems: { fontSize: 13, color: '#00B3B3', fontStyle: 'italic', marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#333', paddingTop: 16, marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#00B3B3', textShadowColor: 'rgba(0,179,179,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  payButton: { marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  payGradient: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  payText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginRight: 10 },
  trackButton: { marginTop: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#00B3B3', alignItems: 'center' },
  trackText: { color: '#00B3B3', fontSize: 16, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 16, borderTopWidth: 1, borderColor: '#333' },
  footerGradient: { padding: 16, alignItems: 'center' },
  footerText: { fontSize: 18, fontWeight: '700', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  footerSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});
