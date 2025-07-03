// app/admin/index.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';

type Stats = {
  profile: number;
  utilisateurs: number;
  produits: number;
  commandes_en_cours: number;
  commandes_payées: number;
  tickets_ouverts: number;
  finance: number; // montant total reçu
};

// On ajoute la carte Finance
const ITEMS = [
  {
    key: 'profile',
    label: 'Mon Profil',
    icon: <Ionicons name="person-outline" size={28} color="#00B3B3" />,
    route: '/admin/profile',
  },
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    icon: <MaterialIcons name="people-outline" size={28} color="#00B3B3" />,
    route: '/admin/users',
  },
  {
    key: 'produits',
    label: 'Produits',
    icon: <FontAwesome5 name="box-open" size={28} color="#00B3B3" />,
    route: '/admin/products',
  },
  {
    key: 'commandes_en_cours',
    label: 'Commandes en cours',
    icon: <Ionicons name="time-outline" size={28} color="#00B3B3" />,
    route: '/admin/orders?status=en%20cours',
  },
  {
    key: 'commandes_payées',
    label: 'Commandes payées',
    icon: <Ionicons name="checkmark-circle-outline" size={28} color="#00B3B3" />,
    route: '/admin/orders?status=Payé',
  },
  {
    key: 'tickets_ouverts',
    label: 'Tickets ouverts',
    icon: <MaterialIcons name="support-agent" size={28} color="#00B3B3" />,
    route: '/admin/support',
  },
  {
    key: 'finance',
    label: 'Comptes Finance',
    icon: <MaterialIcons name="attach-money" size={28} color="#00B3B3" />,
    route: '/admin/finance',
  },
];

export default function PremiumAdminDashboard() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    // Nombre fixe pour "Mon Profil"
    const profileCount = 1;

    // Comptages
    const [{ count: utilisateurs }, { count: produits }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
    ]);
    const [{ count: commandes_en_cours }, { count: commandes_payées }] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'en cours'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Payé'),
    ]);
    const { count: tickets_ouverts } = await supabase
      .from('support_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ouvert');

    // Montant total reçu sur les commandes payées
    const { data: financeData } = await supabase
      .from('orders')
      .select('sum:sum(total_amount)')
      .eq('status', 'Payé')
      .single();

    setStats({
      profile: profileCount,
      utilisateurs: utilisateurs || 0,
      produits: produits || 0,
      commandes_en_cours: commandes_en_cours || 0,
      commandes_payées: commandes_payées || 0,
      tickets_ouverts: tickets_ouverts || 0,
      finance: financeData?.sum || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) fetchStats();
  }, [authLoading, fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  if (authLoading || loading || !stats) {
    return (
      <LinearGradient colors={['#000000', '#111111']} style={styles.center}>
        <ActivityIndicator size="large" color="#00B3B3" />
        <Animated.Text entering={FadeIn.duration(500)} style={styles.loadingText}>
          Chargement des statistiques premium...
        </Animated.Text>
      </LinearGradient>
    );
  }

  // Préparation des données pour les graphiques
  const barData = {
    labels: ['En cours', 'Payées'],
    datasets: [
      {
        data: [stats.commandes_en_cours, stats.commandes_payées],
      },
    ],
  };
  const pieData = [
    {
      name: 'Profil',
      count: stats.profile,
      color: '#007AFF',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
    {
      name: 'Utilisateurs',
      count: stats.utilisateurs,
      color: '#00B3B3',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
    {
      name: 'Produits',
      count: stats.produits,
      color: '#34C759',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
    {
      name: 'Tickets',
      count: stats.tickets_ouverts,
      color: '#FF9500',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
    {
      name: 'Finance',
      count: stats.finance,
      color: '#FFD60A',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
  ];

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <AnimatedScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00B3B3"
            colors={['#00B3B3']}
          />
        }
      >
        <Animated.Text entering={FadeInDown.duration(800)} style={styles.title}>
          Tableau de bord
        </Animated.Text>

        {/* GRID NAVIGATION */}
        <View style={styles.grid}>
          {ITEMS.map((item, i) => (
            <Animated.View
              key={item.key}
              entering={
                i % 2 === 0
                  ? SlideInLeft.delay(i * 100).duration(600)
                  : SlideInRight.delay(i * 100).duration(600)
              }
              style={styles.cardWrapper}
            >
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(item.route)}
              >
                <LinearGradient colors={['#1A1A1A', '#111']} style={styles.cardGradient}>
                  <View style={styles.iconContainer}>{item.icon}</View>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <Text style={styles.cardValue}>
                    {stats[item.key as keyof Stats]}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* BAR CHART */}
        <Animated.Text entering={FadeInUp.duration(800).delay(300)} style={styles.chartTitle}>
          Commandes
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(800).delay(400)}>
          <BarChart
            data={barData}
            width={screenWidth}
            height={220}
            fromZero
            chartConfig={{
              backgroundGradientFrom: '#1A1A1A',
              backgroundGradientTo: '#111',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
              labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
              style: { borderRadius: 16 },
            }}
            style={{ marginVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#333', padding: 16 }}
          />
        </Animated.View>

        {/* PIE CHART */}
        <Animated.Text entering={FadeInUp.duration(800).delay(500)} style={styles.chartTitle}>
          Répartition globale
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(800).delay(600)}>
          <PieChart
            data={pieData}
            width={screenWidth}
            height={220}
            chartConfig={{ color: (opacity = 1) => `rgba(255,255,255,${opacity})` }}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
            style={{ borderRadius: 16, borderWidth: 1, borderColor: '#333', padding: 16 }}
          />
        </Animated.View>
      </ScrollView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 24, fontSize: 16, color: '#AAA', fontWeight: '500' },
  container: { padding: 16, backgroundColor: '#000', paddingBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,179,179,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  cardWrapper: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
    height: 160,
    aspectRatio: 1,
  },
  card: { flex: 1 },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,179,179,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: { fontSize: 14, color: '#AAA', textAlign: 'center', marginTop: 8 },
  cardValue: { fontSize: 28, fontWeight: '800', color: '#FFF', marginTop: 4 },
  chartTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginTop: 16, marginBottom: 8, textAlign: 'center' },
});
