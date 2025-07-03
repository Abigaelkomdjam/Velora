// app/admin/products/create.tsx
import { AnimatedScreen } from '@/components/AnimatedScreen';
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

type Category = { id: number; name: string };

export default function CreateProduct() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('0');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingCats(true);
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (data && data.length) {
        setCategories(data);
        setCategoryId(data[0].id);
      }
      setLoadingCats(false);
    })();
  }, []);

  const chooseImage = async () => {
    setUploadingImage(true);
    const url = await pickAndUploadImage();
    setUploadingImage(false);
    if (url) setImageUrl(url);
  };

  const handleSave = async () => {
    if (
      !name ||
      !desc ||
      !price ||
      !imageUrl ||
      !categoryId ||
      isNaN(Number(stock))
    ) {
      return Alert.alert('Erreur', 'Tous les champs sont obligatoires');
    }
    setSaving(true);
    const { error } = await supabase.from('products').insert([
      {
        name,
        description: desc,
        price: parseFloat(price),
        image_url: imageUrl,
        category_id: categoryId,
        stock: parseInt(stock, 10),
      },
    ]);
    setSaving(false);
    if (error) Alert.alert('Erreur', error.message);
    else router.back();
  };

  if (loadingCats) {
    return (
      <LinearGradient
        colors={['#000000', '#111111']}
        style={styles.center}
      >
        <ActivityIndicator size="large" color="#00B3B3" />
        <Text style={styles.loadingText}>Chargement des catégories...</Text>
      </LinearGradient>
    );
  }

  return (
    <AnimatedScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient
          colors={['#000000', '#111111']}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Nouveau Produit</Text>

            {/* Catégorie */}
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.selectContainer}>
              <View style={styles.selectInner}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.categoryOption,
                      categoryId === c.id && styles.categoryOptionActive
                    ]}
                    onPress={() => setCategoryId(c.id)}
                  >
                    <Text style={[
                      styles.categoryText,
                      categoryId === c.id && styles.categoryTextActive
                    ]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nom */}
            <Text style={styles.label}>Nom du produit</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez le nom du produit"
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décrivez le produit en détail"
              placeholderTextColor="#777"
              value={desc}
              onChangeText={setDesc}
              multiline
              numberOfLines={4}
            />

            {/* Prix */}
            <Text style={styles.label}>Prix (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="Prix en francs CFA"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            {/* Image */}
            <Text style={styles.label}>Image du produit</Text>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={chooseImage}
              disabled={uploadingImage}
            >
              <LinearGradient
                colors={['#1A1A1A', '#111']}
                style={styles.imageButtonGradient}
              >
                <Ionicons 
                  name={imageUrl ? "image" : "cloud-upload"} 
                  size={24} 
                  color="#00B3B3" 
                />
                <Text style={styles.imageButtonText}>
                  {uploadingImage
                    ? 'Téléchargement en cours…'
                    : imageUrl
                    ? 'Changer l’image'
                    : 'Choisir une image'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {imageUrl && (
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.previewImage} 
              />
            )}

            {/* Stock */}
            <Text style={styles.label}>Quantité en stock</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre disponible"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />

            {/* Bouton de création */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={['#00B3B3', '#008080']}
                style={styles.buttonGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={24} color="#FFF" />
                    <Text style={styles.buttonText}>Créer le produit</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  center: {
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
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  selectContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderRadius: 14,
    marginBottom: 20,
    padding: 4,
  },
  selectInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryOptionActive: {
    backgroundColor: 'rgba(0, 179, 179, 0.2)',
    borderColor: '#00B3B3',
  },
  categoryText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#00B3B3',
  },
  input: {
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  imageButton: {
    marginBottom: 20,
  },
  imageButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00B3B3',
    gap: 12,
  },
  imageButtonText: {
    color: '#00B3B3',
    fontWeight: '600',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
  },
});