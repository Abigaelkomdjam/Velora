import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { supabase } from '../supabase';

const { width } = Dimensions.get('window');

export default function PremiumSignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Références pour garder le focus
  const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // État simplifié pour le focus
  const [focusedInput, setFocusedInput] = useState('');

  const buttonScale = useSharedValue(1);
  const formScale = useSharedValue(1);
  const formOpacity = useSharedValue(1);

  const handleSignUp = async () => {
    // 1) Validation des champs
    if (!fullName || !email || !password || !confirmPassword) {
      animateError();
      Alert.alert('Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      animateError();
      Alert.alert('Les mots de passe ne sont pas identiques');
      return;
    }

    setLoading(true);
    buttonScale.value = withSequence(
      withTiming(0.97, { duration: 100 }),
      withSpring(1, { damping: 3 })
    );

    // 2) Création dans Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setLoading(false);
      animateError();
      return Alert.alert('Erreur inscription', signUpError.message);
    }

    // 3) Insertion dans profiles
    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: userId, full_name: fullName, role: 'client' }]);
      if (profileError) {
        console.warn('Profil non créé :', profileError.message);
      }
    }

    setLoading(false);
    Alert.alert(
      'Inscription réussie',
      'Un email de confirmation vous a été envoyé.',
      [{ text: 'OK', onPress: () => router.replace('/signin') }]
    );
  };

  // Animation d'erreur
  const animateError = () => {
    formScale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withSpring(1, { damping: 5 }),
      withTiming(1.01, { duration: 50 }),
      withSpring(1, { damping: 10 })
    );
    
    formOpacity.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
  };

  // Style animé du bouton
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedFormStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
    opacity: formOpacity.value,
  }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.container}
      >
        <Stack.Screen options={{ 
          title: '',
          headerTransparent: true,
          headerTintColor: '#FFF',
        }} />

        {/* Logo animé */}
        <Animated.View 
          entering={FadeInDown.duration(800).springify().damping(15)}
          style={styles.logoContainer}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={[styles.logo, { tintColor: '#00B3B3' }]}
            contentFit="contain"
          />
          <Animated.Text 
            entering={FadeInUp.delay(100).duration(800)}
            style={styles.logoText}
          >
            VELORA
          </Animated.Text>
        </Animated.View>

        {/* Titre avec animation élégante */}
        <Animated.Text 
          entering={FadeInUp.delay(200).duration(800)}
          style={styles.title}
        >
          Créer un compte
        </Animated.Text>
        
        {/* Sous-titre */}
        <Animated.Text 
          entering={FadeInUp.delay(300).duration(800)}
          style={styles.subtitle}
        >
          Accédez à notre collection exclusive
        </Animated.Text>

        {/* Formulaire */}
        <Animated.View 
          style={[styles.form, animatedFormStyle]}
          entering={FadeInUp.delay(400).duration(800)}
        >
          {/* Champ Nom complet */}
          <Animated.View 
            entering={FadeInUp.delay(500).duration(800)}
            style={[
              styles.inputContainer,
              focusedInput === 'fullName' && styles.inputFocused
            ]}
          >
            <MaterialIcons 
              name="person" 
              size={20} 
              color={focusedInput === 'fullName' ? '#00B3B3' : '#999'} 
              style={styles.inputIcon}
            />
            <TextInput
              ref={fullNameRef}
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setFocusedInput('fullName')}
              onBlur={() => setFocusedInput('')}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          </Animated.View>

          {/* Champ Email */}
          <Animated.View 
            entering={FadeInUp.delay(600).duration(800)}
            style={[
              styles.inputContainer,
              focusedInput === 'email' && styles.inputFocused
            ]}
          >
            <MaterialIcons 
              name="email" 
              size={20} 
              color={focusedInput === 'email' ? '#00B3B3' : '#999'} 
              style={styles.inputIcon}
            />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput('')}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </Animated.View>

          {/* Champ Mot de passe */}
          <Animated.View 
            entering={FadeInUp.delay(700).duration(800)}
            style={[
              styles.inputContainer,
              focusedInput === 'password' && styles.inputFocused
            ]}
          >
            <MaterialIcons 
              name="lock" 
              size={20} 
              color={focusedInput === 'password' ? '#00B3B3' : '#999'} 
              style={styles.inputIcon}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput('')}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <MaterialIcons 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#999"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Champ Confirmation mot de passe */}
          <Animated.View 
            entering={FadeInUp.delay(800).duration(800)}
            style={[
              styles.inputContainer,
              focusedInput === 'confirmPassword' && styles.inputFocused
            ]}
          >
            <MaterialIcons 
              name="lock-outline" 
              size={20} 
              color={focusedInput === 'confirmPassword' ? '#00B3B3' : '#999'} 
              style={styles.inputIcon}
            />
            <TextInput
              ref={confirmPasswordRef}
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedInput('confirmPassword')}
              onBlur={() => setFocusedInput('')}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.passwordToggle}
            >
              <MaterialIcons 
                name={showConfirmPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#999"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Bouton animé vert menthe */}
          <Animated.View 
            style={[styles.buttonContainer, animatedButtonStyle]}
            entering={FadeInUp.delay(900).duration(800)}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.fullWidth}
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={['#00B3B3', '#008080']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradientBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Animated.Text 
                    entering={FadeIn.duration(300)}
                    style={styles.buttonText}
                  >
                    Créer mon compte
                  </Animated.Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Conditions d'utilisation */}
        <Animated.View 
          entering={FadeInUp.delay(1000).duration(800)}
          style={styles.termsContainer}
        >
          <Text style={styles.termsText}>
            En créant un compte, vous acceptez nos 
          </Text>
          <TouchableOpacity onPress={() => Keyboard.dismiss()}>
            <Text style={styles.termsLink}>Conditions d'utilisation</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Ligne de séparation */}
        <Animated.View 
          entering={FadeInUp.delay(1100).duration(800)}
          style={styles.dividerContainer}
        >
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Bouton de connexion */}
        <Animated.View 
          entering={FadeInUp.delay(1200).duration(800)}
          style={styles.signinLink}
        >
          <Text style={styles.signinText}>
            Déjà inscrit ?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/signin')}>
            <Text style={styles.signinTextBold}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: (width * 0.5) / 4,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 179, 179, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#AAA',
  },
  form: {
    width: '100%',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    height: 60,
  },
  inputFocused: {
    borderColor: '#00B3B3',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
  },
  buttonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  fullWidth: {
    width: '100%',
  },
  gradientBtn: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  termsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  termsText: {
    color: '#AAA',
    fontSize: 13,
    marginBottom: 4,
  },
  termsLink: {
    color: '#00B3B3',
    fontWeight: '600',
    fontSize: 13,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#AAA',
    fontSize: 14,
  },
  signinLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signinText: {
    color: '#AAA',
    fontSize: 15,
  },
  signinTextBold: {
    color: '#00B3B3',
    fontWeight: '600',
    fontSize: 15,
  },
});