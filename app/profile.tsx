// app/profile.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { pickAndUploadImage } from '@/utils/uploadImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, withSpring } from 'react-native-reanimated';

export default function PremiumProfileScreen() {
  const { session, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  // 1) Tant que l’auth est en cours, on ne montre rien (loader)
  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00B3B3" />
      </View>
    );
  }

  // 2) Si pas de session, on ne rend rien ici. La redirection vers /signin
  //    se fera via le useEffect ci-dessous.
  if (!session) {
    return null;
  }

  // 3) Rediriger vers signin si session devient null
  useEffect(() => {
    if (!session) {
      router.replace('/signin');
    }
  }, [session, router]);

  // === À partir d'ici, session est garanti non-null ===
  const user = session.user;
  const userId = user.id;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const headerY = useSharedValue(-50);

  // Fetch des données du profil
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', userId)
        .single();
      if (error) {
        Alert.alert('Erreur', 'Impossible de charger votre profil');
      } else if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
      headerY.value = withSpring(0, { damping: 15 });
    })();
  }, [userId, headerY]);

  const changeAvatar = async () => {
    setUploading(true);
    const url = await pickAndUploadImage();
    setUploading(false);
    if (url) setAvatarUrl(url);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      return Alert.alert('Erreur', 'Le nom complet ne peut pas être vide');
    }
    setSaving(true);
    const updates: any = { full_name: fullName.trim() };
    if (phone.trim()) updates.phone = phone.trim();
    if (avatarUrl) updates.avatar_url = avatarUrl;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    setSaving(false);
    if (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre profil');
    } else {
      Alert.alert('Succès', 'Profil mis à jour');
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.centered}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
        <Animated.Text entering={FadeIn.duration(500)} style={styles.loadingText}>
          Chargement de votre profil premium...
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <AnimatedScreen>
      <LinearGradient colors={['#000000', '#111111']} style={styles.container}>
        <Animated.View
          style={[styles.header, { transform: [{ translateY: headerY.value }] }]}
          entering={FadeInDown.duration(800).springify()}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#00B3B3" />
          </TouchableOpacity>
          <Animated.Text entering={FadeInDown.delay(100).duration(800)} style={styles.title}>
            Mon Profil
          </Animated.Text>
          <TouchableOpacity onPress={() => router.push('/support')} style={styles.supportBtn}>
            <Ionicons name="headset-outline" size={28} color="#00B3B3" />
          </TouchableOpacity>
        </Animated.View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Avatar */}
            <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatarWrapper} onPress={changeAvatar}>
                {uploading ? (
                  <ActivityIndicator color="#00B3B3" size="large" />
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <LinearGradient colors={['#1A1A1A', '#111']} style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={48} color="#00B3B3" />
                  </LinearGradient>
                )}
                <LinearGradient
                  colors={['rgba(0,179,179,0.3)', 'transparent']}
                  style={styles.avatarBorder}
                  start={[0, 0]}
                  end={[1, 1]}
                />
                <TouchableOpacity style={styles.cameraButton} onPress={changeAvatar}>
                  <LinearGradient colors={['#00B3B3', '#008080']} style={styles.cameraGradient}>
                    <Ionicons name="camera" size={20} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>{uploading ? 'Chargement...' : 'Modifier la photo'}</Text>
            </Animated.View>

            {/* Informations personnelles */}
            <Animated.View entering={FadeInUp.duration(800).delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
              <Text style={styles.label}>E‑mail (non modifiable)</Text>
              <View style={styles.emailContainer}>
                <Text style={styles.emailText}>{user.email}</Text>
              </View>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Jean Dupont" placeholderTextColor="#888" />
              <Text style={styles.label}>Téléphone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="6XXXXXXXX" placeholderTextColor="#888" keyboardType="phone-pad" />
            </Animated.View>

            {/* Boutons Enregistrer / Déconnexion */}
            <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.actions}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                <LinearGradient colors={['#00B3B3', '#008080']} style={styles.saveGradient}>
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color="#FFF" />
                      <Text style={styles.saveText}>Enregistrer</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                <Ionicons name="log-out" size={24} color="#FF3B30" />
                <Text style={styles.logoutText}>Déconnexion</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 24, fontSize: 16, color: '#AAA', fontWeight: '500' },
  header: { padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFF', textShadowColor: 'rgba(0,179,179,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  supportBtn: { padding: 8 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 16 },
  avatar: { width: '100%', height: '100%', borderRadius: 75 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 75, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  avatarBorder: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 80, zIndex: -1 },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, borderRadius: 20, overflow: 'hidden' },
  cameraGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarLabel: { fontSize: 14, color: '#00B3B3', fontWeight: '500' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  emailContainer: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  emailText: { fontSize: 16, color: '#AAA' },
  input: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#333', color: '#FFF', marginBottom: 20, fontSize: 16 },
  actions: { marginBottom: 32 },
  saveButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  saveGradient: { padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 12 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600', marginLeft: 12 },
});
