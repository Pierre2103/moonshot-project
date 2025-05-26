import React, { useState } from 'react'
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Image as ImageX } from 'lucide-react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import axios from 'axios'
import { colors, spacing } from '../ISBNScanner/styles'

export default function CameraScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [altIndex, setAltIndex] = useState(0)

  const API_BASE_URL = 'http://192.168.14.162:5001'

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "La permission d'accéder à la caméra est requise.");
        return;
      }
  
      console.log("✅ Permission accordée");
  
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        quality: 0.7,
      });
  
      console.log("📸 Résultat de la caméra :", result);
  
      if (!result.canceled && result.assets?.length > 0) {
        const selectedImage = result.assets[0].uri;
        setImage(selectedImage);
        setMatch(null);
        setAltIndex(0);
        await sendImage(selectedImage);
      } else {
        console.log("❌ Aucune image sélectionnée ou annulation.");
      }
    } catch (err) {
      console.error("🔥 Erreur pickImage :", err);
      Alert.alert("Erreur", "Une erreur est survenue lors de la prise de photo.");
    }
  };
  
  
  const sendImage = async (uri: string) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('image', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any)

    try {
      const response = await axios.post(`${API_BASE_URL}/match`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setMatch({
        ...response.data,
        authors: response.data.authors.join(', '),
        coverUrl: `${API_BASE_URL}${response.data.cover_url}`,
      })
    } catch (err: any) {
      console.error('❌ Erreur sendImage:', err)
      Alert.alert('Erreur', err.message || 'Erreur lors de la requête')
    } finally {
      setLoading(false)
    }
  }

  const showNextAlternative = () => {
    if (!match || !match.alternatives || altIndex >= match.alternatives.length) return
    const nextAlt = match.alternatives[altIndex]
    setMatch({
      ...nextAlt,
      authors: nextAlt.authors.join(', '),
      coverUrl: `${API_BASE_URL}${nextAlt.cover_url}`,
      alternatives: match.alternatives,
    })
    setAltIndex(altIndex + 1)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Camera color={colors.primary} size={24} />
        <Text style={styles.headerTitle}>Book Scanner</Text>
      </View>

      <TouchableOpacity style={styles.captureButton} onPress={pickImage}>
        <Camera size={24} color="white" />
        <Text style={styles.captureButtonText}>Prendre une photo</Text>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Analyse en cours...</Text>
        </View>
      )}

      {match && (
        <View style={styles.resultContainer}>
          <Text style={styles.label}>📘 ISBN détecté :</Text>
          <Text style={styles.filename}>{match.filename}</Text>

          <Image source={{ uri: match.coverUrl }} style={styles.cover} />

          <Text style={styles.title}>{match.title}</Text>
          <Text style={styles.authors}>👤 {match.authors}</Text>
          <Text style={styles.score}>Score: {match.score?.toFixed(2)}</Text>

          {match.alternatives?.length > 0 && altIndex < match.alternatives.length && (
            <TouchableOpacity style={styles.alternativeButton} onPress={showNextAlternative}>
              <ImageX size={20} color={colors.textSecondary} />
              <Text style={styles.alternativeButtonText}>
                ❌ Mauvais livre ? Voir une autre proposition
              </Text>
            </TouchableOpacity>
          )}

          {match.alternatives?.length > 0 && (
            <View style={styles.altSection}>
              <Text style={styles.altTitle}>🔍 Alternatives :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {match.alternatives.map((alt: any, idx: number) => (
                  <View key={idx} style={styles.altCard}>
                    <Image
                      source={{ uri: `${API_BASE_URL}${alt.cover_url}` }}
                      style={styles.altImage}
                    />
                    <Text style={styles.altBookTitle} numberOfLines={2}>
                      {alt.title}
                    </Text>
                    <Text style={styles.altAuthors} numberOfLines={1}>
                      {alt.authors.join(', ')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.small,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.medium,
    margin: spacing.medium,
    borderRadius: 8,
    gap: spacing.small,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.small,
  },
  loadingContainer: {
    padding: spacing.large,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.medium,
    color: colors.textSecondary,
    fontSize: 16,
  },
  resultContainer: {
    margin: spacing.medium,
    padding: spacing.medium,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  filename: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.medium,
  },
  cover: {
    width: 180,
    height: 270,
    borderRadius: 10,
    marginBottom: spacing.medium,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  authors: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.small,
  },
  score: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.medium,
    borderRadius: 8,
    marginTop: spacing.large,
    gap: spacing.small,
  },
  alternativeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  altSection: {
    marginTop: spacing.large,
    width: '100%',
  },
  altTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.medium,
  },
  altCard: {
    marginRight: spacing.medium,
    width: 120,
    alignItems: 'center',
  },
  altImage: {
    width: 100,
    height: 150,
    borderRadius: 6,
    marginBottom: spacing.small,
  },
  altBookTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xsmall,
  },
  altAuthors: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
})
