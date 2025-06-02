import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Heart, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import AddModal from '../../components/Collection/AddModal';
import { globalEvents } from '../../utils/eventBus';
import { API_BASE_URL } from '../../config/api';
import BackButton from '../../components/common/BackButton';

export default function BookDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isbn = params.isbn as string;
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCollectionId, setLikeCollectionId] = useState<number | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isbn) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/book/${isbn}`)
      .then(res => res.json())
      .then(data => setBook(data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [isbn]);

  useEffect(() => {
    AsyncStorage.getItem('ridizi_username').then(name => {
      if (name) setUsername(name);
    });
  }, []);

  // Vérifie si le livre est déjà dans la collection Like
  useEffect(() => {
    const checkLiked = async () => {
      if (!username || !isbn) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/collections/${username}`);
        const allCollections = res.data || [];
        const likeCol = allCollections.find(
          (c: any) => c.name && c.name.trim().toLowerCase() === "like"
        );
        if (likeCol) {
          setLikeCollectionId(likeCol.id);
          // Vérifie si le livre est dans la collection Like
          const booksRes = await axios.get(`${API_BASE_URL}/api/collections/${likeCol.id}/books`);
          const isLiked = booksRes.data.some((b: any) => b.isbn === isbn);
          setLiked(isLiked);
        } else {
          setLikeCollectionId(null);
          setLiked(false);
        }
      } catch {
        setLiked(false);
        setLikeCollectionId(null);
      }
    };
    checkLiked();
  }, [username, isbn, adding]);

  const fetchCollections = async () => {
    if (!username) return;
    setCollectionsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/collections/${username}`);
      setCollections(res.data);
    } catch {
      setCollections([]);
    }
    setCollectionsLoading(false);
  };

  const handleAddToCollection = () => {
    fetchCollections();
    setModalVisible(true);
  };

  const handleSelectCollection = async (collection: any) => {
    setAdding(true);
    try {
      await axios.post(`${API_BASE_URL}/api/collections/${username}/${collection.id}/add`, { isbn });
      Alert.alert('Success', `Book added to "${collection.name}"`);
      setModalVisible(false);
      globalEvents.emit('reloadHome'); // Refresh home/collections
    } catch {
      Alert.alert('Error', 'Could not add book to collection.');
    }
    setAdding(false);
  };

  const handleCreateCollection = async (name: string, icon: string) => {
    setAdding(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name, icon });
      setCollections([...collections, res.data]);
      setModalVisible(false);
      Alert.alert('Success', 'Collection created!');
      globalEvents.emit('reloadHome'); // Refresh home/collections
    } catch {
      Alert.alert('Error', 'Could not create collection.');
    }
    setAdding(false);
  };

  const handleLike = async () => {
    if (!username) return;
    setAdding(true);
    // Animation: scale up then down
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    try {
      if (liked && likeCollectionId) {
        // Si déjà liké, on retire le livre de la collection Like
        await axios.delete(`${API_BASE_URL}/api/collections/${likeCollectionId}/books/${isbn}`);
        setLiked(false);
        globalEvents.emit('reloadHome');
      } else {
        // Ajoute à la collection Like (comme avant)
        const res = await axios.get(`${API_BASE_URL}/api/collections/${username}`);
        const allCollections = res.data || [];
        let likeCol = allCollections.find(
          (c: any) => c.name && c.name.trim().toLowerCase() === "like"
        );
        if (!likeCol) {
          const createRes = await axios.post(`${API_BASE_URL}/api/collections/${username}`, { name: "Like", icon: "❤️" });
          likeCol = createRes.data;
        }
        await axios.post(`${API_BASE_URL}/api/collections/${username}/${likeCol.id}/add`, { isbn });
        setLiked(true);
        setLikeCollectionId(likeCol.id);
        globalEvents.emit('reloadHome');
      }
    } catch {
      Alert.alert('Error', liked ? 'Could not remove book from Like.' : 'Could not like book.');
    }
    setAdding(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleAmazonRedirect = () => {
    if (book?.isbn) {
      const amazonUrl = `https://www.amazon.fr/dp/${book.isbn}`;
      Linking.openURL(amazonUrl).catch(() => {
        Alert.alert('Error', 'Could not open Amazon link.');
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!book || book.error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Book not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scrollContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <BackButton />

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        {(book.cover_url || book.isbn) && (
          <Image
            source={{ 
              uri: imageError && book.cover_url && book.cover_url.trim() && book.cover_url.startsWith('http')
                ? book.cover_url 
                : `${API_BASE_URL}/cover/${book.isbn}.jpg`
            }}
            style={styles.cover}
            resizeMode="cover"
            onError={handleImageError}
          />
        )}

        {/* Add to collection & Like */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddToCollection}>
            <Plus size={22} color="#007AFF" />
            <Text style={styles.actionText}>Add to collection</Text>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} disabled={adding}>
              <Heart size={22} color="#007AFF" {...(liked ? { fill: "#007AFF" } : {})} />
              <Text style={styles.actionText}>{liked ? "Liked" : "Like"}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Title */}
        {book.title && (
          <Text style={styles.title}>{book.title}</Text>
        )}

        {/* Authors */}
        {book.authors && (
          <Text style={styles.authors}>{Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}</Text>
        )}

        {/* Description */}
        {book.description && (
          <Text style={styles.description}>{book.description}</Text>
        )}

        {/* Genres */}
        {book.genres && Array.isArray(book.genres) && book.genres.length > 0 && (
          <View style={styles.genresRow}>
            {book.genres.map((genre: string, idx: number) => (
              <View key={idx} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Publisher, Page Number, Date, ISBN */}
        <View style={styles.infoRow}>
          {book.publisher && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Publisher</Text>
              <Text style={styles.infoValue}>{book.publisher}</Text>
            </View>
          )}
          {book.pages && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Pages</Text>
              <Text style={styles.infoValue}>{book.pages}</Text>
            </View>
          )}
          {book.publication_date && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Published</Text>
              <Text style={styles.infoValue}>{book.publication_date}</Text>
            </View>
          )}
          {book.isbn && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>ISBN</Text>
              <Text style={styles.infoValue}>{book.isbn}</Text>
            </View>
          )}
        </View>

        {/* Amazon Redirect Button */}
        {book.isbn && (
          <TouchableOpacity style={styles.amazonButton} onPress={handleAmazonRedirect}>
            <Image
              source={require('../../assets/images/amazon_logo.png')}
              style={styles.amazonLogoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Add to collection Modal */}
      <AddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        collections={collections}
        onSelectCollection={handleSelectCollection}
        onCreateCollection={handleCreateCollection}
        loading={adding}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 64, // margin from notch
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
  },
  contentContainer: {
    paddingBottom: 150,
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: 2,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  cover: {
    width: 180,
    height: 270,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  authors: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#444',
    marginBottom: 14,
    textAlign: 'center',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  genreChip: {
    backgroundColor: '#e6eaff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    margin: 2,
  },
  genreText: {
    color: '#3a4ba0',
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  infoBox: {
    backgroundColor: '#f4f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 2,
    alignItems: 'center',
    minWidth: 90,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#c00',
    fontSize: 18,
    marginBottom: 18,
  },
  goBackBtn: {
    backgroundColor: '#f4f7fa',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  goBackText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  amazonButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f19e38',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    minWidth: 120,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amazonLogoImage: {
    width: 80,
    height: 25,
  },
  amazonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
