// app/forgot-password.tsx
import { supabase } from '@/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      return Alert.alert('Erreur', 'Veuillez renseigner votre e‑mail');
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'velora://reset-password', 
      // Remplacez par l'URL de votre page de reset ci‑dessous
    });
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert(
        'Vérifiez votre boîte',
        "Un lien de réinitialisation a été envoyé à votre adresse."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.desc}>
        Entrez votre adresse e‑mail pour recevoir un lien de réinitialisation.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Votre e‑mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity onPress={handleReset} disabled={loading} style={styles.buttonWrapper}>
        <LinearGradient colors={['#00B3B3', '#008080']} style={styles.button}>
          {loading
            ? <ActivityIndicator color="#fff"/>
            : <Text style={styles.buttonText}>Envoyer le lien</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:24, justifyContent:'center', backgroundColor:'#000' },
  title: { fontSize:24, fontWeight:'700', color:'#fff', marginBottom:12 },
  desc: { color:'#ccc', marginBottom:24 },
  input: {
    backgroundColor:'#111',
    color:'#fff',
    padding:12,
    borderRadius:8,
    marginBottom:16,
  },
  buttonWrapper: { borderRadius:8, overflow:'hidden' },
  button: { padding:16, alignItems:'center' },
  buttonText: { color:'#fff', fontWeight:'600' },
});
