// app/payment/[orderId].tsx
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import { formatPrice } from '@/utils/formatPrice';
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Params = { orderId: string };

// remplace les espaces insécables ou autres caractères non‑WinAnsi
function sanitize(str: string): string {
  return str.replace(/\u202F/g, ' ');
}

export default function PremiumPaymentScreen() {
  const { orderId } = useLocalSearchParams<Params>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // États formulaire
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [email, setEmail] = useState(session?.user.email || '');
  const [method, setMethod] = useState<'om' | 'momo' | 'card'>('om');
  const [countryCode, setCountryCode] = useState<CountryCode>('CM');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, created_at, total_amount,
          order_items (
            quantity, unit_price,
            product:products(name)
          )
        `)
        .eq('id', Number(orderId))
        .single();

      if (error || !data) {
        Alert.alert('Erreur', 'Commande introuvable');
        router.back();
      } else {
        setOrder(data);
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handlePay = async () => {
    // validations
    if (!fullName || !address || !city || !postalCode) {
      return Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
    }
    if (!/^[\w.+-]+@\w+\.\w+$/.test(email)) {
      return Alert.alert('Email invalide');
    }
    if ((method === 'om' || method === 'momo') && !/^\d{8,12}$/.test(phone)) {
      return Alert.alert('Numéro de téléphone invalide');
    }
    if (method === 'card') {
      if (!/^\d{16}$/.test(cardNumber.replace(/\s+/g, ''))) {
        return Alert.alert('Numéro de carte invalide');
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        return Alert.alert('Date d’expiration invalide');
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        return Alert.alert('CVV invalide');
      }
    }

    setPaying(true);
    try {
      // mise à jour statut
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'Payé' })
        .eq('id', Number(orderId))
        .eq('user_id', userId);
      if (orderErr) throw orderErr;

      // enregistrer détails paiement
      const { error: pdErr } = await supabase
        .from('payment_details')
        .insert({
          order_id: order.id,
          user_id: userId,
          full_name: fullName,
          address,
          city,
          postal_code: postalCode,
          email,
          payment_method: method,
          phone: method !== 'card' ? `+237${phone}` : null,
          card_number: method === 'card' ? cardNumber.replace(/\s+/g, '') : null,
          expiry: method === 'card' ? expiry : null,
          cvv: method === 'card' ? cvv : null,
        });
      if (pdErr) throw pdErr;

      // PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const { height } = page.getSize();

      // logo
      const logoAsset = Asset.fromModule(require('../../assets/logo.png'));
      await logoAsset.downloadAsync();
      const logoBase64 = await FileSystem.readAsStringAsync(logoAsset.localUri!, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const logoImage = await pdfDoc.embedPng(`data:image/png;base64,${logoBase64}`);
      const logoWidth = 80;
      const scale = logoWidth / logoImage.width;
      const logoHeight = logoImage.height * scale;
      page.drawImage(logoImage, {
        x: 40,
        y: height - logoHeight - 40,
        width: logoWidth,
        height: logoHeight,
      });

      // titre + infos
      let y = height - logoHeight - 60;
      page.drawText(sanitize(`Reçu #${order.id}`), {
        x: 140, y, size: 16, font: boldFont,
      });
      y -= 20;
      page.drawText(sanitize(`Client: ${fullName}`), { x: 40, y, size: 12, font });
      y -= 16;
      page.drawText(sanitize(`Adresse: ${address}, ${city} ${postalCode}`), {
        x: 40, y, size: 12, font,
      });
      y -= 16;
      page.drawText(sanitize(`Email: ${email}`), { x: 40, y, size: 12, font });
      y -= 24;

      // articles
      page.drawText(sanitize('Articles :'), { x: 40, y, size: 14, font: boldFont });
      y -= 18;
      order.order_items.forEach((oi: any) => {
        const line = sanitize(
          `• ${oi.product.name} × ${oi.quantity} = ${(oi.quantity * oi.unit_price).toFixed(
            0
          )} FCFA`
        );
        page.drawText(line, { x: 50, y, size: 12, font });
        y -= 16;
      });

      y -= 10;
      page.drawText(sanitize(`Total : ${order.total_amount.toFixed(0)} FCFA`), {
        x: 40, y, size: 14, font: boldFont,
      });
      y -= 24;
      page.drawText(sanitize('Livraison sous 3–5 jours ouvrés.'), {
        x: 40, y, size: 10, font, color: rgb(0.5, 0.5, 0.5),
      });

      // write & share
      const pdfBase64 = await pdfDoc.saveAsBase64();
      const path = `${FileSystem.cacheDirectory}recu_${order.id}.pdf`;
      await FileSystem.writeAsStringAsync(path, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(path, {
        mimeType: 'application/pdf',
        dialogTitle: 'Envoyer le reçu Velora',
      });

      Alert.alert('✅ Paiement confirmé', 'Votre reçu a été généré !');
      router.replace('/orders');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erreur', e.message || 'Impossible de finaliser.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
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
          Chargement de votre paiement...
        </Animated.Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#111111']}
      style={styles.container}
    >
      <Animated.View 
        entering={FadeInDown.duration(800).springify()}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="arrowleft" size={24} color="#00B3B3" />
        </TouchableOpacity>
        <Animated.Text 
          entering={FadeInDown.delay(100).duration(800)}
          style={styles.title}
        >
          Paiement
        </Animated.Text>
        <Animated.Text 
          entering={FadeInDown.delay(200).duration(800)}
          style={styles.subtitle}
        >
          Finalisez votre commande
        </Animated.Text>
      </Animated.View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Résumé de commande */}
        <Animated.View
          entering={SlideInLeft.duration(600).delay(300)}
          style={styles.summaryCard}
        >
          <LinearGradient
            colors={['#1A1A1A', '#111']}
            style={styles.cardGradient}
          >
            <Text style={styles.summaryHeader}>Commande #{order.id}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total :</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(order.total_amount)}
              </Text>
            </View>
            <Text style={styles.summaryInfo}>
              Livraison incluse • Paiement sécurisé
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Formulaire */}
        <Animated.View
          entering={SlideInRight.duration(600).delay(400)}
          style={styles.formCard}
        >
          <LinearGradient
            colors={['#1A1A1A', '#111']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>Informations de livraison</Text>

            <Text style={styles.label}>Nom complet</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Jean Dupont"
              placeholderTextColor="#888"
            />

            <Text style={styles.label}>Adresse complète</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Rue Exemple"
              placeholderTextColor="#888"
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.label}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Yaoundé"
                  placeholderTextColor="#888"
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>Code postal</Text>
                <TextInput
                  style={styles.input}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="1001"
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                />
              </View>
            </View>

            <Text style={styles.label}>E‑mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="exemple@mail.com"
              keyboardType="email-address"
              placeholderTextColor="#888"
            />

            <Text style={styles.sectionTitle}>Moyen de paiement</Text>
            
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  method === 'om' && styles.methodButtonActive
                ]}
                onPress={() => setMethod('om')}
              >
                <LinearGradient
                  colors={method === 'om' ? ['#FF9500', '#FF7300'] : ['#2A2A2A', '#1A1A1A']}
                  style={styles.methodGradient}
                >
                  <FontAwesome name="mobile-phone" size={24} color={method === 'om' ? "#FFF" : "#AAA"} />
                  <Text style={[styles.methodText, method === 'om' && styles.methodTextActive]}>
                    Orange Money
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  method === 'momo' && styles.methodButtonActive
                ]}
                onPress={() => setMethod('momo')}
              >
                <LinearGradient
                  colors={method === 'momo' ? ['#FFCC00', '#FFAA00'] : ['#2A2A2A', '#1A1A1A']}
                  style={styles.methodGradient}
                >
                  <FontAwesome name="mobile-phone" size={24} color={method === 'momo' ? "#FFF" : "#AAA"} />
                  <Text style={[styles.methodText, method === 'momo' && styles.methodTextActive]}>
                    MTN Mobile Money
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  method === 'card' && styles.methodButtonActive
                ]}
                onPress={() => setMethod('card')}
              >
                <LinearGradient
                  colors={method === 'card' ? ['#007AFF', '#0055FF'] : ['#2A2A2A', '#1A1A1A']}
                  style={styles.methodGradient}
                >
                  <FontAwesome name="credit-card" size={24} color={method === 'card' ? "#FFF" : "#AAA"} />
                  <Text style={[styles.methodText, method === 'card' && styles.methodTextActive]}>
                    Carte bancaire
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {(method === 'om' || method === 'momo') && (
              <Animated.View 
                entering={FadeInUp.duration(600)}
                style={styles.phoneSection}
              >
                <Text style={styles.label}>Téléphone (+237)</Text>
                <View style={styles.phoneInput}>
                  <CountryPicker
                    countryCode={countryCode}
                    withFlag
                    withCallingCode
                    onSelect={(c: Country) => setCountryCode(c.cca2)}
                    theme={{
                      fontSize: 16,
                      fontFamily: 'System',
                      onBackgroundTextColor: '#FFF',
                      backgroundColor: '#1A1A1A',
                    }}
                  />
                  <TextInput
                    style={styles.phoneField}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="6XXXXXXX"
                    keyboardType="phone-pad"
                    placeholderTextColor="#888"
                  />
                </View>
              </Animated.View>
            )}

            {method === 'card' && (
              <Animated.View 
                entering={FadeInUp.duration(600)}
              >
                <Text style={styles.label}>Numéro de carte</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="0000 0000 0000 0000"
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                />

                <View style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={styles.label}>Exp. (MM/AA)</Text>
                    <TextInput
                      style={styles.input}
                      value={expiry}
                      onChangeText={setExpiry}
                      placeholder="MM/AA"
                      placeholderTextColor="#888"
                    />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={setCvv}
                      placeholder="123"
                      keyboardType="numeric"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Bouton de paiement */}
      <Animated.View 
        entering={FadeInUp.duration(800).delay(500)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePay}
          disabled={paying}
        >
          <LinearGradient
            colors={['#00B3B3', '#008080']}
            style={styles.payGradient}
          >
            {paying ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.payText}>Payer {formatPrice(order.total_amount)}</Text>
                <Ionicons name="lock-closed" size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 24,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 179, 179, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
  },
  formCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#00B3B3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
  },
  cardGradient: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 18,
    color: '#AAA',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00B3B3',
    textShadowColor: 'rgba(0, 179, 179, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  summaryInfo: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    color: '#FFF',
    marginBottom: 20,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  flex: {
    flex: 1,
  },
  paymentMethods: {
    marginBottom: 20,
    gap: 12,
  },
  methodButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  methodButtonActive: {
    borderWidth: 2,
    borderColor: '#00B3B3',
  },
  methodGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AAA',
    marginLeft: 12,
  },
  methodTextActive: {
    color: '#FFF',
  },
  phoneSection: {
    marginBottom: 20,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  phoneField: {
    flex: 1,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#000',
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 60,
  },
  payGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  payText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
});