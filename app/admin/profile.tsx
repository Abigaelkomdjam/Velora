// app/admin/profile.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function AdminProfile() {
  const { session, role, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  // Guard admin
  if (!authLoading && (!session || role !== 'admin')) {
    router.replace('/signin');
    return null;
  }

  const [fullName, setFullName] = useState<string>('');
  const [recentCount, setRecentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    (async () => {
      setLoading(true);

      // 1) Récupération du nom complet
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      if (profileErr) {
        Alert.alert('Erreur', "Impossible de charger le profil admin");
      } else {
        setFullName(profileData?.full_name ?? '');
      }

      // 2) Comptage des produits créés dans les 30 derniers jours
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString();
      const { count: prodCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      setRecentCount(prodCount || 0);

      setLoading(false);
    })();
  }, [session]);

  if (authLoading || loading) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.center}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
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
          entering={FadeInDown.duration(500).springify()} 
          style={styles.header}
        >
          <Text style={styles.title}>Profil Administrateur</Text>
          <Text style={styles.subtitle}>Gestion de votre compte</Text>
        </Animated.View>

        {/* Carte d'information premium */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(200)}
          style={styles.card}
        >
          <LinearGradient
            colors={['#1A1A1A', '#111']}
            style={styles.cardGradient}
          >
            <View style={styles.infoItem}>
              <Ionicons name="person" size={24} color="#00B3B3" />
              <View style={styles.infoText}>
                <Text style={styles.label}>Nom complet</Text>
                <Text style={styles.value}>{fullName || 'Non renseigné'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="mail" size={24} color="#00B3B3" />
              <View style={styles.infoText}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{session.user.email}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="cube" size={24} color="#00B3B3" />
              <View style={styles.infoText}>
                <Text style={styles.label}>Produits créés (30 derniers jours)</Text>
                <Text style={styles.value}>{recentCount}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bouton de déconnexion */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(400)}
          style={styles.actions}
        >
          <TouchableOpacity 
            style={styles.button} 
            onPress={signOut}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00B3B3', '#008080']}
              style={styles.buttonGradient}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Se déconnecter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Pied de page premium */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(600)}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Compte administrateur</Text>
          <Text style={styles.footerSubtext}>Accès complet au panel de gestion</Text>
        </Animated.View>
      </LinearGradient>
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
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  actions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 179, 179, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 179, 179, 0.3)',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00B3B3',
  },
  footerSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
});