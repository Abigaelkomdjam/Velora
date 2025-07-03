// app/admin/products.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

export default function AdminProducts() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, image_url')
      .order('id', { ascending: true });
    if (error) {
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const deleteProduct = (id: number) => {
    Alert.alert(
      'Supprimer le produit',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', id);
            if (error) {
              Alert.alert('Erreur', `Impossible de supprimer : ${error.message}`);
            } else {
              fetchProducts();
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!authLoading) fetchProducts();
  }, [authLoading, fetchProducts]);

  if (authLoading || loading) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.center}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </LinearGradient>
    );
  }

  return (
    <AnimatedScreen>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Gestion des Produits</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin/products/create')}
        >
          <Ionicons name="add" size={24} color="#00B3B3" />
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={products}
        keyExtractor={(p) => p.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#00B3B3"
            colors={['#00B3B3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/admin/products/create')}
            >
              <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animatable.View
            animation="fadeInUp"
            delay={index * 80}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={['#1A1A1A', '#111']}
              style={styles.card}
            >
              <Image 
                source={{ uri: item.image_url }} 
                style={styles.image} 
                resizeMode="cover"
              />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.price}>{item.price.toFixed(0)} FCFA</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => router.push(`/admin/products/${item.id}/edit`)}
                >
                  <Ionicons name="create-outline" size={20} color="#00B3B3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => deleteProduct(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
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
    alignItems: 'center' 
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#FFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 179, 179, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00B3B3',
  },
  list: { 
    padding: 16,
    paddingBottom: 32
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
  emptyButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 179, 179, 0.2)',
    borderWidth: 1,
    borderColor: '#00B3B3',
  },
  emptyButtonText: {
    color: '#00B3B3',
    fontWeight: '600',
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  image: { 
    width: 80, 
    height: 80,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  info: { 
    flex: 1, 
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  name: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#FFF',
    marginBottom: 4,
  },
  desc: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.7)', 
    marginBottom: 8,
  },
  price: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#00B3B3',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderWidth: 1,
    borderColor: '#333',
  },
});