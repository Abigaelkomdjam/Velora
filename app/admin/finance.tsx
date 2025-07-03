// app/admin/finance.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Animated, { FadeIn, FadeInUp, useSharedValue, withTiming } from 'react-native-reanimated';

type OrderItem = {
  quantity: number;
  unit_price: number;
  product: { name: string };
};

type DayData = {
  day: string;
  total: number;
  items: OrderItem[];
};

const screenWidth = Dimensions.get('window').width - 48;
const chartHeight = 280;

export default function AdminFinanceScreen() {
  const { loading: authLoading } = useAuth();
  const [dataPerDay, setDataPerDay] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const chartOpacity = useSharedValue(0);

  const fetchFinance = useCallback(async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const sinceIso = since.toISOString();

    const { data: orders } = await supabase
      .from('orders')
      .select(`
        created_at,
        total_amount,
        order_items(quantity, unit_price, product:products(name))
      `)
      .gte('created_at', sinceIso)
      .eq('status', 'Payé')
      .order('created_at', { ascending: true });

    // Initialisation des 7 jours
    const dayMap: Record<string, { total: number; items: OrderItem[] }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      dayMap[label] = { total: 0, items: [] };
    }

    orders?.forEach((o) => {
      const d = new Date(o.created_at);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      const cell = dayMap[label];
      if (cell) {
        cell.total += o.total_amount;
        cell.items.push(...o.order_items);
      }
    });

    // Transformation en array trié
    const arr = Object.entries(dayMap).map(([day, { total, items }]) => ({ day, total, items }));
    setDataPerDay(arr);
    setLoading(false);
    chartOpacity.value = withTiming(1, { duration: 1000 });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFinance();
    }, [fetchFinance])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFinance();
    setRefreshing(false);
  }, [fetchFinance]);

  if (authLoading || loading) {
    return (
      <LinearGradient colors={['#000000', '#111111']} style={styles.center}>
        <ActivityIndicator size="large" color="#00B3B3" />
        <Animated.Text entering={FadeIn.duration(500)} style={styles.loadingText}>
          Chargement des finances…
        </Animated.Text>
      </LinearGradient>
    );
  }

  // Préparation du graphique
  const labels = dataPerDay.map((d) => d.day);
  const values = dataPerDay.map((d) => Math.round(d.total));

  return (
    <AnimatedScreen>
      <LinearGradient colors={['#000000', '#111111']} style={styles.container}>
        <FlatList
          data={dataPerDay}
          keyExtractor={(d) => d.day}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00B3B3"
              colors={['#00B3B3']}
            />
          }
          ListHeaderComponent={
            <Animated.View entering={FadeInUp.duration(800)}>
              <Text style={styles.title}>Revenus des 7 derniers jours</Text>
              
              <View style={styles.chartContainer}>
                <LinearGradient
                  colors={['#1A1A1A', '#111']}
                  style={styles.chartGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <BarChart
                    data={{
                      labels,
                      datasets: [{ data: values }],
                    }}
                    width={screenWidth}
                    height={chartHeight}
                    fromZero
                    yAxisSuffix="FCFA"
                    withInnerLines={false}
                    withHorizontalLabels={true}
                    withVerticalLabels={true}
                    showBarTops={false}
                    chartConfig={{
                      backgroundGradientFromOpacity: 0,
                      backgroundGradientToOpacity: 0,
                      decimalPlaces: 0,
                      color: () => '#00B3B3',
                      labelColor: () => '#FFF',
                      fillShadowGradient: '#00B3B3',
                      fillShadowGradientOpacity: 1,
                      barPercentage: 0.6,
                      propsForBackgroundLines: {
                        stroke: '#333',
                        strokeWidth: 1
                      },
                      propsForLabels: {
                        fontSize: 12,
                        fontWeight: '500'
                      },
                      style: {
                        borderRadius: 16,
                      },
                    }}
                    style={styles.chart}
                  />
                  <LinearGradient
                    colors={['rgba(0,179,179,0.3)', 'transparent']}
                    style={styles.chartOverlay}
                    pointerEvents="none"
                  />
                </LinearGradient>
                
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total hebdo</Text>
                  <Text style={styles.totalValue}>
                    {values.reduce((a, b) => a + b, 0).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              </View>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View 
              entering={FadeInUp.duration(500).delay(200 + (index * 100))} 
              style={styles.dayCard}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{item.day}</Text>
                <Text style={styles.dayTotal}>{item.total.toLocaleString('fr-FR')} FCFA</Text>
              </View>
              
              <View style={styles.itemsContainer}>
                {item.items.map((oi, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={styles.itemBullet} />
                    <Text style={styles.itemText}>
                      {oi.product.name} × {oi.quantity}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      </LinearGradient>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 24, 
    fontSize: 16, 
    color: '#AAA', 
    fontWeight: '500' 
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    margin: 24,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,179,179,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  chartContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    paddingTop: 16
  },
  chartGradient: {
    padding: 16,
    paddingTop: 0
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: chartHeight,
    borderRadius: 16,
    zIndex: -1
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#333'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AAA'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00B3B3'
  },
  dayCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#333'
  },
  dayLabel: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#00B3B3' 
  },
  dayTotal: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#FFF' 
  },
  itemsContainer: {
    marginTop: 4
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B3B3',
    marginRight: 12
  },
  itemText: { 
    color: '#CCC', 
    fontSize: 14,
    flex: 1
  },
});