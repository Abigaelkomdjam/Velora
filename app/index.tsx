// app/index.tsx
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

type Category = { id: number; name: string; image_url: string | null };

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_SIZE = (width - CARD_MARGIN * 3) / 2;

export default function PremiumIndex() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { session, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-50);
  const listOpacity = useSharedValue(0);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/signin');
    }
  }, [session, authLoading]);

  useEffect(() => {
    if (session) {
      (async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, image_url')
          .order('name', { ascending: true });
          
        if (error) console.error(error);
        else setCategories(data || []);
        
        // Animation au chargement
        setTimeout(() => {
          headerOpacity.value = withTiming(1, { duration: 800 });
          headerY.value = withSpring(0, { damping: 15 });
          listOpacity.value = withTiming(1, { duration: 1000 });
          setLoading(false);
        }, 300);
      })();
    }
  }, [session]);

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
          Chargement de votre collection premium...
        </Animated.Text>
      </LinearGradient>
    );
  }

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => (
    <Animated.View
      entering={SlideInUp.delay(100 * index).duration(800).springify().damping(15)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: '/products',
            params: { categoryId: item.id.toString() },
          })
        }
      >
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={styles.imageOverlay}
        />
        
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name="image-off-outline"
              size={32}
              color="#fff"
            />
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.arrowContainer}>
            <Text style={styles.viewText}>Explorer</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#00B3B3"
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={['#000000', '#111111']}
      style={styles.container}
    >
      <Animated.View 
        style={[styles.header, {
          opacity: headerOpacity,
          transform: [{ translateY: headerY }]
        }]}
      >
        <Animated.Text 
          entering={FadeInDown.duration(800).springify()}
          style={styles.title}
        >
          Notre Collection
        </Animated.Text>
        <Animated.Text 
          entering={FadeInDown.delay(100).duration(800).springify()}
          style={styles.subtitle}
        >
          Découvrez nos accessoires exclusifs
        </Animated.Text>
      </Animated.View>
      
      <Animated.View
        style={[styles.listContainer, { opacity: listOpacity }]}
        entering={FadeInUp.delay(300).duration(800)}
      >
        <FlatList
          contentContainerStyle={styles.listContent}
          data={categories}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategoryItem}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
      
      {/* Pied de page premium */}
      <Animated.View 
        entering={FadeInUp.delay(500).duration(800)}
        style={styles.footer}
      >
        <LinearGradient
          colors={['#00B3B3', '#008080']}
          style={styles.footerGradient}
        >
          <Text style={styles.footerText}>Collection Premium 2025</Text>
          <Text style={styles.footerSubtext}>Exclusivité & Élégance</Text>
        </LinearGradient>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
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
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 179, 179, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_MARGIN,
  },
  cardWrapper: {
    width: CARD_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
    marginBottom: CARD_MARGIN,
  },
  card: {
    height: CARD_SIZE * 1.2,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 1,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B3B3',
    marginRight: 4,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#333',
  },
  footerGradient: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footerSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
});