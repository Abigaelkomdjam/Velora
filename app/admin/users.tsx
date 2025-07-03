// app/admin/users.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export default function AdminUsers() {
  const { loading: authLoading } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name', { ascending: true });
    if (error) {
      Alert.alert('Erreur', "Impossible de charger les utilisateurs");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) fetchUsers();
  }, [authLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const updateRole = (id: string, newRole: string) => {
    const action = newRole === 'banned' ? 'bannir' : 'débanir';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} l’utilisateur`,
      `Êtes‑vous sûr de vouloir ${action} cet utilisateur ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(id);
            const { error } = await supabase
              .from('profiles')
              .update({ role: newRole })
              .eq('id', id);
            setActionLoading(null);
            if (error) {
              Alert.alert('Erreur', `Échec de l’opération : ${error.message}`);
            } else {
              fetchUsers();
            }
          },
        },
      ]
    );
  };

  const deleteUser = (id: string) => {
    Alert.alert(
      'Supprimer définitivement',
      "Êtes‑vous sûr de supprimer cet utilisateur définitivement ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(id);
            const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', id);
            setActionLoading(null);
            if (error) {
              Alert.alert('Erreur', `Impossible de supprimer le profil : ${error.message}`);
            } else {
              fetchUsers();
            }
          },
        },
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.center}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
        <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
      </LinearGradient>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#00B3B3';
      case 'banned': return '#FF9500';
      default: return '#34C759';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'shield-checkmark';
      case 'banned': return 'ban';
      default: return 'person';
    }
  };

  const renderItem = ({ item, index }: { item: Profile; index: number }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 80}
      style={styles.cardWrapper}
    >
      <LinearGradient
        colors={['#1A1A1A', '#111']}
        style={styles.card}
      >
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) }]}>
            <Ionicons 
              name={getRoleIcon(item.role)} 
              size={24} 
              color="#FFF" 
            />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(item.role)}20` }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, item.role === 'banned' ? styles.unbanBtn : styles.banBtn]}
            onPress={() => updateRole(item.id, item.role === 'banned' ? 'client' : 'banned')}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons
                name={item.role === 'banned' ? 'lock-open' : 'block'}
                size={20}
                color="#fff"
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => deleteUser(item.id)}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="delete" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  return (
    <AnimatedScreen>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
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
            <Text style={styles.title}>Gestion des Utilisateurs</Text>
            <Text style={styles.subtitle}>{users.length} utilisateurs inscrits</Text>
          </View>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        }
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  roleBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  roleText: {
    fontWeight: '600',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderWidth: 1,
    borderColor: '#333',
  },
  banBtn: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderColor: '#FF9500',
  },
  unbanBtn: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: '#4CAF50',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
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