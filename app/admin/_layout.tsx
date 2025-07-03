// app/admin/_layout.tsx
import { useAuth } from '@/context/AuthContext';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

// Composant réutilisable pour les boutons
const AnimatedIconButton = ({ 
  icon, 
  onPress, 
  accent = false 
}: { 
  icon: React.ReactNode; 
  onPress: () => void; 
  accent?: boolean; 
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View style={styles.iconButton}>
      {icon}
    </View>
  </TouchableOpacity>
);

export default function AdminLayout() {
  const { session, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!session) router.replace('/signin');
      else if (role !== 'admin') router.replace('/');
    }
  }, [session, role, loading, router]);

  const showHeader = pathname.startsWith('/admin');

  if (loading || !session || role !== 'admin') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00B3B3" />
        <Text style={styles.text}>Vérification des droits…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {showHeader && (
        <View style={styles.header}>
          {/* Groupe gauche */}
          <View style={styles.iconGroup}>
            <AnimatedIconButton
              accent
              onPress={() => router.push('/admin/products')}
              icon={<FontAwesome name="list" size={24} color="#00B3B3" />}
            />
            <AnimatedIconButton
              accent
              onPress={() => router.push('/admin/orders')}
              icon={<Ionicons name="receipt-outline" size={26} color="#00B3B3" />}
            />
          </View>

          {/* Logo central */}
          <Image
            source={require('../../assets/images/logo.png')}
            style={[styles.logo, { tintColor: '#00B3B3' }]}
          />

          {/* Groupe droit */}
          <View style={styles.iconGroup}>
            <AnimatedIconButton
              onPress={() => router.push('/admin/users')}
              icon={<Ionicons name="people-outline" size={26} color="rgba(255,255,255,0.7)" />}
            />
            <AnimatedIconButton
              onPress={() => router.push('/admin/support')}
              icon={<MaterialIcons name="support-agent" size={26} color="rgba(255,255,255,0.7)" />}
            />
          </View>
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#000' }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
    zIndex: 10,
  },
  iconGroup: {
    flexDirection: 'row',
    width: 90,
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
  },
  logo: {
    width: 140,
    height: 40,
    resizeMode: 'contain',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
});