// app/signin.tsx 
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
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

const { width } = Dimensions.get('window');

export default function PremiumSignInScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [focusedInput, setFocusedInput] = useState('');

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session]);

  const buttonScale = useSharedValue(1);
  const formScale = useSharedValue(1);
  const formOpacity = useSharedValue(1);

  const handleSignIn = async () => {
    if (!email || !password) {
      animateError();
      Alert.alert('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    buttonScale.value = withSequence(
      withTiming(0.97, { duration: 100 }),
      withSpring(1, { damping: 3 })
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      animateError();
      Alert.alert('Erreur de connexion', error.message);
    }
  };

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
        <Stack.Screen options={{ headerShown: false }} />

        <Animated.View 
          entering={FadeInDown.duration(800).springify().damping(15)}
          style={styles.logoContainer}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Animated.Text 
            entering={FadeInUp.delay(100).duration(800)}
            style={styles.logoText}
          >
            VELORA
          </Animated.Text>
        </Animated.View>

        <Animated.Text 
          entering={FadeInUp.delay(200).duration(800)}
          style={styles.title}
        >
          Connexion à votre compte
        </Animated.Text>
        
        <Animated.Text 
          entering={FadeInUp.delay(300).duration(800)}
          style={styles.subtitle}
        >
          Accédez à votre collection premium
        </Animated.Text>

        <Animated.View 
          style={[styles.form, animatedFormStyle]}
          entering={FadeInUp.delay(400).duration(800)}
        >
          <Animated.View 
            entering={FadeInUp.delay(500).duration(800)}
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

          <Animated.View 
            entering={FadeInUp.delay(600).duration(800)}
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
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
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

          <Animated.View 
            style={[styles.buttonContainer, animatedButtonStyle]}
            entering={FadeInUp.delay(700).duration(800)}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.fullWidth}
              onPress={handleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={['#00B3B3', '#008080']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.gradientBtn}
              >
                {loading 
                  ? <ActivityIndicator size="small" color="#FFF" /> 
                  : <Animated.Text 
                      entering={FadeIn.duration(300)}
                      style={styles.buttonText}
                    >
                      Se connecter
                    </Animated.Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Lien vers la page Reset Password */}
        <Animated.View 
          entering={FadeInUp.delay(800).duration(800)}
          style={styles.optionsContainer}
        >
          <TouchableOpacity 
            onPress={() => router.push('/reset-password')}
            style={styles.optionButton}
          >
            <Text style={styles.optionText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(900).duration(800)}
          style={styles.dividerContainer}
        >
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(1000).duration(800)}
          style={styles.signupContainer}
        >
          <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => router.push('/signup')}
          >
            <LinearGradient
              colors={['#1A1A1A', '#000']}
              style={styles.signupGradient}
            >
              <Text style={styles.signupButtonText}>Créer un compte</Text>
            </LinearGradient>
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
    tintColor: '#00B3B3',
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
  optionsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  optionButton: {
    paddingVertical: 8,
  },
  optionText: {
    color: '#00B3B3',
    fontWeight: '600',
    fontSize: 15,
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
  signupContainer: {
    width: '100%',
  },
  signupButton: {
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
  },
  signupGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
