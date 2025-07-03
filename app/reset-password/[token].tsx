// app/reset-password/[token].tsx
import { supabase } from '@/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Params = { token: string };

export default function ResetPassword() {
  const { token } = useLocalSearchParams<Params>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!password || password !== confirm) {
      return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      accessToken: token,
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Succès', 'Votre mot de passe a été mis à jour.');
      router.replace('/signin');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouveau mot de passe</Text>
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmer mot de passe"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <TouchableOpacity onPress={handleUpdate} disabled={loading} style={styles.buttonWrapper}>
        <LinearGradient colors={['#00B3B3', '#008080']} style={styles.button}>
          {loading
            ? <ActivityIndicator color="#fff"/>
            : <Text style={styles.buttonText}>Mettre à jour</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:24, justifyContent:'center', backgroundColor:'#000' },
  title: { fontSize:24, fontWeight:'700', color:'#fff', marginBottom:24 },
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
