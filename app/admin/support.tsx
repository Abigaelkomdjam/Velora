// app/admin/support.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

type Ticket = {
  id: number; 
  user_id: string; 
  subject: string; 
  message: string;
  status: string; 
  created_at: string;
};

export default function AdminSupport() {
  const { loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      Alert.alert('Erreur','Impossible de charger les tickets');
    } else {
      setTickets((data || []).map(t => ({
        ...t,
        status: t.status || 'inconnu'
      })));
    }
    setLoading(false);
  }, []);

  const closeTicket = async (id: number) => {
    const { error } = await supabase
      .from('support_requests')
      .update({ status: 'clos' })
      .eq('id', id);
    
    if (error) {
      Alert.alert('Erreur', `Échec de la clôture: ${error.message}`);
    } else {
      fetch();
    }
  };

  useEffect(() => {
    if (!authLoading) fetch();
  }, [authLoading, fetch]);

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
        <Text style={styles.loadingText}>Chargement des tickets...</Text>
      </LinearGradient>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ouvert': return '#FF9500';
      case 'clos': return '#4CAF50';
      default: return '#AEAEB2';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ouvert': return 'alert-circle';
      case 'clos': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  return (
    <AnimatedScreen>
      <FlatList
        data={tickets}
        keyExtractor={t => t.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#00B3B3"
            colors={['#00B3B3']}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Support Client</Text>
            <Text style={styles.subtitle}>
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>Aucun ticket de support</Text>
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
              <View style={styles.cardHeader}>
                <View style={styles.statusBadge}>
                  <Ionicons 
                    name={getStatusIcon(item.status)} 
                    size={20} 
                    color={getStatusColor(item.status)} 
                    style={styles.statusIcon}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.ticketId}>#{item.id}</Text>
              </View>
              
              <Text style={styles.subject}>{item.subject}</Text>
              
              <Text style={styles.message} numberOfLines={3}>
                {item.message}
              </Text>
              
              <Text style={styles.userId}>
                <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.5)" /> 
                {item.user_id.substring(0, 8)}...
              </Text>
              
              <Text style={styles.date}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.5)" /> 
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
              
              {item.status.toLowerCase() === 'ouvert' && (
                <TouchableOpacity 
                  onPress={() => closeTicket(item.id)} 
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Clôturer le ticket</Text>
                  <Ionicons name="lock-closed" size={18} color="#00B3B3" />
                </TouchableOpacity>
              )}
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
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
  list: { 
    padding: 16,
    paddingBottom: 32
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
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  ticketId: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  subject: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    marginBottom: 16,
  },
  userId: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 179, 179, 0.1)',
    borderWidth: 1,
    borderColor: '#00B3B3',
  },
  closeButtonText: {
    color: '#00B3B3',
    fontWeight: '600',
    marginRight: 8,
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
});