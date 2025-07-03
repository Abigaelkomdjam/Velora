// utils/uploadImage.ts
import { supabase } from '@/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickAndUploadImage(): Promise<string | null> {
  // 1) Sélection dans la galerie
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All, // ou .Images
    quality: 0.8,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const localUri = asset.uri;
  const fileExt = localUri.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  // MIME type basique, à ajuster selon l'extension
  const fileType = asset.type === 'image' ? `image/${fileExt}` : asset.type;

  // 2) Créer un "file" façon RN
  const file = {
    uri: localUri,
    name: fileName,
    type: fileType,
  } as any;

  // 3) Uploader dans Supabase Storage
  const { error: upErr } = await supabase
    .storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) {
    Alert.alert('Upload échoué', upErr.message);
    return null;
  }

  // 4) Récupérer l’URL publique
  const { data } = supabase
    .storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
