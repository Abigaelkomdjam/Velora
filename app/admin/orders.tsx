// app/admin/orders.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

type OrderItem = {
  quantity: number;
  unit_price: number;
  product: { name: string };
};

type Order = {
  id: number;
  user_id: string;
  user: { full_name: string } | null;      // jointure profils
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
};

type FilterType = 'all' | 'Payé' | 'en cours';

export default function AdminOrders() {
  const { loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        total_amount,
        created_at,
        order_items (
          quantity,
          unit_price,
          product:products ( name )
        ),
        user:profiles (
          full_name
        )
      `)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setFilteredOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) fetch();
  }, [authLoading, fetch]);

  // Filtrage
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(o => o.status === activeFilter));
    }
  }, [activeFilter, orders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  }, [fetch]);

  if (authLoading || loading) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.center}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
      </LinearGradient>
    );
  }

  return (
    <AnimatedScreen>
      <FlatList
        data={filteredOrders}
        keyExtractor={o => o.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00B3B3"
            colors={['#00B3B3']}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Historique des Commandes</Text>
              <Text style={styles.subtitle}>
                {filteredOrders.length} commande{filteredOrders.length !== 1 ? 's' : ''}
                {activeFilter !== 'all'
                  ? ` (${activeFilter === 'Payé' ? 'payées' : 'en cours'})`
                  : ''}
              </Text>
            </View>
            <View style={styles.filterContainer}>
              {(['all', 'Payé', 'en cours'] as FilterType[]).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterButton,
                    activeFilter === f && styles.activeFilter,
                  ]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === f && styles.activeFilterText,
                    ]}
                  >
                    {f === 'all' ? 'Toutes' : f === 'Payé' ? 'Payées' : 'En cours'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all'
                ? 'Aucune commande trouvée'
                : activeFilter === 'Payé'
                ? 'Aucune commande payée'
                : 'Aucune commande en cours'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animatable.View
            animation="fadeInUp"
            duration={600}
            delay={index * 100}
            style={styles.cardWrapper}
          >
            <LinearGradient colors={['#1A1A1A', '#111']} style={styles.card}>
              {/* En‑tête */}
              <View style={styles.cardHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.id}>Commande #{item.id}</Text>
                  <Text style={styles.clientName}>
                    Client : {item.user?.full_name ?? item.user_id}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Payé' ? styles.paid : styles.pending,
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              {/* Articles */}
              <View style={styles.itemsContainer}>
                {item.order_items.slice(0, 3).map((oi, i) => (
                  <Text key={i} style={styles.line}>
                    • {oi.product.name} × {oi.quantity}
                  </Text>
                ))}
                {item.order_items.length > 3 && (
                  <Text style={styles.moreItems}>
                    + {item.order_items.length - 3} autres produits
                  </Text>
                )}
              </View>

              {/* Total */}
              <View style={styles.footer}>
                <Text style={styles.totalLabel}>Montant total</Text>
                <Text style={styles.total}>
                  {item.total_amount.toFixed(0)} FCFA
                </Text>
              </View>
            </LinearGradient>
          </Animatable.View>
        )}
      />
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  center: {
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
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    backgroundColor: 'rgba(30,30,30,0.5)',
    borderRadius: 14,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: 'rgba(0,179,179,0.2)',
  },
  filterText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#00B3B3',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    textAlign: 'center',
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
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  id: {
    fontWeight: '700',
    color: '#FFF',
    fontSize: 18,
  },
  clientName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    marginTop: 2,
  },
  date: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  paid: {
    backgroundColor: 'rgba(76,175,80,0.15)',
  },
  pending: {
    backgroundColor: 'rgba(255,149,0,0.15)',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#FFF',
  },
  itemsContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  line: {
    color: '#FFF',
    fontSize: 15,
    marginBottom: 6,
  },
  moreItems: {
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  total: {
    fontWeight: '800',
    color: '#FFF',
    fontSize: 20,
  },
});
