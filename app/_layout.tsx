// app/_layout.tsx
import { SessionContextProvider } from '@/context/AuthContext';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, usePathname, useRouter } from 'expo-router';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import 'react-native-gesture-handler'; // Import crucial au tout début
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';

// Création d'un composant bouton animé réutilisable
const AnimatedIconButton = ({ icon, onPress, accent = false }: { 
  icon: React.ReactNode, 
  onPress: () => void, 
  accent?: boolean 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconButton}>
        {icon}
      </View>
    </TouchableOpacity>
  );
};

export default function Layout() {
  const router = useRouter();
  const pathname = usePathname();

  // Ne pas afficher le header client sur ces routes
  const hideHeaderOn = ['/signin', '/signup'];
  const isAuthRoute = hideHeaderOn.includes(pathname);
  const isAdminRoute = pathname.startsWith('/admin');
  const displayHeader = !isAuthRoute && !isAdminRoute;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionContextProvider>
        <SafeAreaView style={styles.safe}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {displayHeader && (
            <View style={styles.header}>
              {/* Groupe de 2 icônes à gauche */}
              <View style={styles.iconGroup}>
                <AnimatedIconButton
                  onPress={() => router.push('/favourites')}
                  accent
                  icon={<MaterialIcons name="favorite-border" size={28} color="#00B3B3" />}
                />
                <AnimatedIconButton
                  onPress={() => router.push('/cart')}
                  accent
                  icon={<FontAwesome name="shopping-cart" size={26} color="#00B3B3" />}
                />
              </View>

              {/* Logo centré */}
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/logo.png')}
                  style={[styles.logo, { tintColor: '#00B3B3' }]}
                />
              </View>

              {/* Groupe de 2 icônes à droite */}
              <View style={styles.iconGroup}>
                <AnimatedIconButton
                  onPress={() => router.push('/orders')}
                  icon={<Ionicons name="time-outline" size={26} color="rgba(255,255,255,0.7)" />}
                />
                <AnimatedIconButton
                  onPress={() => router.push('/profile')}
                  icon={<Ionicons name="person-outline" size={26} color="rgba(255,255,255,0.7)" />}
                />
              </View>
            </View>
          )}

          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: {
                backgroundColor: '#000'
              }
            }}
          />
        </SafeAreaView>
      </SessionContextProvider>
    </GestureHandlerRootView>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 40,
    resizeMode: 'contain',
  },
});