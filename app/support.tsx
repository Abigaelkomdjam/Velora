// app/support.tsx
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function SupportScreen() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const userId = session?.user.id;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/signin');
    }
  }, [authLoading, session]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      return Alert.alert('Erreur', 'Merci de renseigner objet et message.');
    }
    setSending(true);

    const { error } = await supabase
      .from('support_requests')
      .insert({
        user_id: userId,
        subject: subject.trim(),
        message: message.trim(),
      });

    setSending(false);

    if (error) {
      Alert.alert('Erreur', "Votre demande n'a pas pu être envoyée.");
    } else {
      Alert.alert('Envoyé', 'Votre demande a bien été enregistrée.');
      setSubject('');
      setMessage('');
    }
  };

  if (authLoading) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.centered}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
      </LinearGradient>
    );
  }

  return (
    <AnimatedScreen>
      <LinearGradient colors={['#000000', '#111111']} style={styles.container}>
        {/* Header animé avec bouton retour */}
        <Animated.View
          style={styles.header}
          entering={FadeInDown.duration(800).springify()}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#00B3B3" />
          </TouchableOpacity>
          <Animated.Text 
            entering={FadeInDown.delay(100).duration(800)} 
            style={styles.title}
          >
            Support Premium
          </Animated.Text>
          <View style={styles.supportBtnPlaceholder} />
        </Animated.View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section d'en-tête animée */}
          <Animated.View 
            style={styles.section}
            entering={FadeInUp.duration(800).delay(200)}
          >
            <Text style={styles.headerText}>Service Client Premium</Text>
            <Text style={styles.infoText}>
              Bonjour {session?.user.email}, comment pouvons-nous vous aider ?
            </Text>
          </Animated.View>

          {/* Champ Objet animé */}
          <Animated.View entering={FadeInUp.duration(800).delay(300)}>
            <Text style={styles.label}>Objet</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Objet de votre demande"
              placeholderTextColor="#888"
            />
          </Animated.View>

          {/* Champ Message animé */}
          <Animated.View entering={FadeInUp.duration(800).delay(400)}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Décrivez votre problème ou question"
              placeholderTextColor="#888"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Bouton Envoyer animé avec dégradé */}
          <Animated.View 
            style={styles.buttonContainer}
            entering={FadeInUp.duration(800).delay(500)}
          >
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
            >
              <LinearGradient 
                colors={sending ? ['#1A1A1A', '#1A1A1A'] : ['#00B3B3', '#008080']}
                style={[styles.button, sending && styles.buttonDisabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {sending ? (
                  <ActivityIndicator color="#00B3B3" />
                ) : (
                  <Text style={styles.buttonText}>
                    <Ionicons name="paper-plane" size={18} color="#FFF" />{' '}
                    Envoyer la demande
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Section d'assistance animée */}
          <Animated.View 
            style={styles.supportSection}
            entering={FadeInUp.duration(800).delay(600)}
          >
            <View style={styles.supportCard}>
              <Ionicons name="time" size={24} color="#00B3B3" style={styles.supportIcon} />
              <View>
                <Text style={styles.supportTitle}>Réponse sous 24h</Text>
                <Text style={styles.supportText}>
                  Notre équipe premium s'engage à vous répondre dans les 24 heures
                </Text>
              </View>
            </View>
            
            <View style={styles.supportCard}>
              <Ionicons name="star" size={24} color="#00B3B3" style={styles.supportIcon} />
              <View>
                <Text style={styles.supportTitle}>Support prioritaire</Text>
                <Text style={styles.supportText}>
                  Votre statut premium vous donne accès à un traitement prioritaire
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: { 
    padding: 8 
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,179,179,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  supportBtnPlaceholder: {
    width: 44,
    height: 44
  },
  scrollContent: { 
    padding: 24,
    paddingBottom: 60 
  },
  section: {
    marginBottom: 32
  },
  headerText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8
  },
  infoText: {
    fontSize: 16,
    color: '#AAA',
    lineHeight: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
    marginTop: 8
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333',
    color: '#FFF',
    fontSize: 16
  },
  textArea: {
    height: 180,
    paddingTop: 18,
    textAlignVertical: 'top'
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 40
  },
  button: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonDisabled: {
    opacity: 0.8
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  supportSection: {
    borderTopWidth: 1,
    borderColor: '#333',
    paddingTop: 32
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(26,26,26,0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  supportIcon: {
    marginRight: 16,
    marginTop: 2
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6
  },
  supportText: {
    fontSize: 14,
    color: '#AAA',
    lineHeight: 20
  }
});