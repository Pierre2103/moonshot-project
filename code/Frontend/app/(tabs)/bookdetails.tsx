/**
 * Book Details Screen
 * 
 * Comprehensive book information display with collection management.
 * Shows detailed metadata, cover images, and provides actions for
 * organizing books into collections.
 * 
 * Key Features:
 * - Complete book metadata display (title, authors, description, etc.)
 * - High-quality cover image with fallback handling
 * - Collection management (add to collections, like functionality)
 * - Amazon redirect for book purchasing
 * - Genre/category display with visual chips
 * - Publication information and book statistics
 * - Animated like button with visual feedback
 * - Real-time collection synchronization
 * 
 * Navigation Sources:
 * - Search results
 * - Recently scanned books
 * - Collection book lists
 * - Barcode/camera scanning
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Animated, Linking 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Heart, Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import AddModal from '../../components/Collection/AddModal';
import { globalEvents } from '../../utils/eventBus';
import { API_BASE_URL } from '../../config/api';
import BackButton from '../../components/common/BackButton';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Complete book data structure from API
 */
interface BookDetails {
  isbn: string;
  isbn13?: string;
  title: string;
  authors: string | string[];
  description?: string;
  genres?: string[];
  pages?: number;
  publication_date?: string;
  publisher?: string;
  language_code?: string;
  cover_url?: string;
  external_links?: string[];
  average_rating?: number;
  ratings_count?: number;
}

/**
 * Collection data for modal display
 */
interface Collection {
  id: number;
  name: string;
  icon: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BookDetails() {
  // ----------------------------------------------------------------------------
  // NAVIGATION AND PARAMS
  // ----------------------------------------------------------------------------
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const isbn = params.isbn as string;

  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // Book data state
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  // User and collections state
  const [username, setUsername] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // Like functionality state
  const [liked, setLiked] = useState(false);
  const [likeCollectionId, setLikeCollectionId] = useState<number | null>(null);
  
  // Modal and UI state
  const [modalVisible, setModalVisible] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ----------------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------------

  /**
   * Fetch book details from API by ISBN.
   * Handles both ISBN-10 and ISBN-13 formats.
   */
  useEffect(() => {
    if (!isbn) return;
    
    setLoading(true);
    fetch(`http://${API_BASE_URL}:5001/api/book/${isbn}`)
      .then(res => res.json())
      .then(data => setBook(data))
      .catch(error => {
        console.error('Error fetching book details:', error);
        setBook(null);
      })
      .finally(() => setLoading(false));
  }, [isbn]);

  /**
   * Load username from storage on component mount.
   */
  useEffect(() => {
    AsyncStorage.getItem('ridizi_username').then(name => {
      if (name) setUsername(name);
    });
  }, []);

  /**
   * Check if book is already in user's "Like" collection.
   * Auto-creates Like collection if it doesn't exist.
   */
  useEffect(() => {
    const checkLiked = async (): Promise<void> => {
      if (!username || !isbn) return;
      
      try {
        // Get all user collections
        const res = await axios.get(`http://${API_BASE_URL}:5001/api/collections/${username}`);
        const allCollections = res.data || [];
        
        // Find the "Like" collection (case-insensitive)
        const likeCol = allCollections.find(
          (c: any) => c.name && c.name.trim().toLowerCase() === "like"
        );
        
        if (likeCol) {
          setLikeCollectionId(likeCol.id);
          
          // Check if current book is in Like collection
          const booksRes = await axios.get(`http://${API_BASE_URL}:5001/api/collections/${likeCol.id}/books`);
          const isLiked = booksRes.data.some((b: any) => b.isbn === isbn);
          setLiked(isLiked);
        } else {
          setLikeCollectionId(null);
          setLiked(false);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
        setLiked(false);
        setLikeCollectionId(null);
      }
    };
    
    checkLiked();
  }, [username, isbn, adding]); // Re-check when adding state changes

  /**
   * Fetch user collections for the add-to-collection modal.
   */
  const fetchCollections = async (): Promise<void> => {
    if (!username) return;
    
    setCollectionsLoading(true);
    try {
      const res = await axios.get(`http://${API_BASE_URL}:5001/api/collections/${username}`);
      setCollections(res.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
    setCollectionsLoading(false);
  };

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Open the add-to-collection modal and load collections.
   */
  const handleAddToCollection = (): void => {
    fetchCollections();
    setModalVisible(true);
  };

  /**
   * Add book to selected collection.
   * Shows success message and refreshes related screens.
   */
  const handleSelectCollection = async (collection: Collection): Promise<void> => {
    setAdding(true);
    try {
      await axios.post(
        `http://${API_BASE_URL}:5001/api/collections/${username}/${collection.id}/add`, 
        { isbn }
      );
      
      Alert.alert('Success', `Book added to "${collection.name}"`);
      setModalVisible(false);
      globalEvents.emit('reloadHome'); // Refresh home/collections
    } catch (error) {
      console.error('Error adding book to collection:', error);
      Alert.alert('Error', 'Could not add book to collection.');
    }
    setAdding(false);
  };

  /**
   * Create new collection and optionally add book to it.
   */
  const handleCreateCollection = async (name: string, icon: string): Promise<void> => {
    setAdding(true);
    try {
      const res = await axios.post(`http://${API_BASE_URL}:5001/api/collections/${username}`, { 
        name, 
        icon 
      });
      
      setCollections([...collections, res.data]);
      setModalVisible(false);
      Alert.alert('Success', 'Collection created!');
      globalEvents.emit('reloadHome'); // Refresh home/collections
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'Could not create collection.');
    }
    setAdding(false);
  };

  /**
   * Handle like/unlike functionality with animation.
   * Auto-creates "Like" collection if it doesn't exist.
   */
  const handleLike = async (): Promise<void> => {
    if (!username) return;
    
    setAdding(true);
    
    // Animate like button (scale up then down)
    Animated.sequence([
      Animated.timing(scaleAnim, { 
        toValue: 1.25, 
        duration: 120, 
        useNativeDriver: true 
      }),
      Animated.timing(scaleAnim, { 
        toValue: 1, 
        duration: 120, 
        useNativeDriver: true 
      }),
    ]).start();
    
    try {
      if (liked && likeCollectionId) {
        // Remove from Like collection
        await axios.delete(
          `http://${API_BASE_URL}:5001/api/collections/${likeCollectionId}/books/${isbn}`
        );
        setLiked(false);
        globalEvents.emit('reloadHome');
      } else {
        // Add to Like collection (create if needed)
        const res = await axios.get(`http://${API_BASE_URL}:5001/api/collections/${username}`);
        const allCollections = res.data || [];
        
        let likeCol = allCollections.find(
          (c: any) => c.name && c.name.trim().toLowerCase() === "like"
        );
        
        if (!likeCol) {
          // Create Like collection
          const createRes = await axios.post(
            `http://${API_BASE_URL}:5001/api/collections/${username}`, 
            { name: "Like", icon: "❤️" }
          );
          likeCol = createRes.data;
        }
        
        // Add book to Like collection
        await axios.post(
          `http://${API_BASE_URL}:5001/api/collections/${username}/${likeCol.id}/add`, 
          { isbn }
        );
        
        setLiked(true);
        setLikeCollectionId(likeCol.id);
        globalEvents.emit('reloadHome');
      }
    } catch (error) {
      console.error('Error handling like:', error);
      Alert.alert(
        'Error', 
        liked ? 'Could not remove book from Like.' : 'Could not like book.'
      );
    }
    setAdding(false);
  };

  /**
   * Handle cover image loading errors.
   * Enables fallback to alternative image sources.
   */
  const handleImageError = (): void => {
    setImageError(true);
  };

  /**
   * Open Amazon page for book purchase.
   * Uses ISBN to construct Amazon URL.
   */
  const handleAmazonRedirect = (): void => {
    if (book?.isbn) {
      const amazonUrl = `https://www.amazon.fr/dp/${book.isbn}`;
      Linking.openURL(amazonUrl).catch(() => {
        Alert.alert('Error', 'Could not open Amazon link.');
      });
    }
  };

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Format authors for display.
   * Handles both string and array formats from API.
   */
  const formatAuthors = (authors: string | string[]): string => {
    if (Array.isArray(authors)) {
      return authors.join(', ');
    }
    return authors || 'Unknown Author';
  };

  /**
   * Determine which cover image to display.
   * Uses fallback logic for image sources.
   */
  const getCoverImageSource = () => {
    if (imageError && book?.cover_url && 
        book.cover_url.trim() && book.cover_url.startsWith('http')) {
      return { uri: book.cover_url };
    }
    return { uri: `http://${API_BASE_URL}:5001/cover/${book?.isbn}.jpg` };
  };

  // ----------------------------------------------------------------------------
  // LOADING AND ERROR STATES
  // ----------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!book || (book as any).error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Book not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.scrollContainer}>
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Back Navigation */}
      <BackButton />

      <ScrollView 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Book Cover */}
        {(book.cover_url || book.isbn) && (
          <Image
            source={getCoverImageSource()}
            style={styles.cover}
            resizeMode="cover"
            onError={handleImageError}
          />
        )}

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddToCollection}>
            <Plus size={22} color="#007AFF" />
            <Text style={styles.actionText}>Add to collection</Text>
          </TouchableOpacity>
          
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={handleLike} 
              disabled={adding}
            >
              <Heart 
                size={22} 
                color="#007AFF" 
                {...(liked ? { fill: "#007AFF" } : {})} 
              />
              <Text style={styles.actionText}>
                {liked ? "Liked" : "Like"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Book Title */}
        {book.title && (
          <Text style={styles.title}>{book.title}</Text>
        )}

        {/* Authors */}
        {book.authors && (
          <Text style={styles.authors}>
            {formatAuthors(book.authors)}
          </Text>
        )}

        {/* Description */}
        {book.description && (
          <Text style={styles.description}>{book.description}</Text>
        )}

        {/* Genre Tags */}
        {book.genres && Array.isArray(book.genres) && book.genres.length > 0 && (
          <View style={styles.genresRow}>
            {book.genres.map((genre: string, idx: number) => (
              <View key={idx} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Book Information Grid */}
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

        {/* Amazon Purchase Button */}
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

      {/* Add to Collection Modal */}
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

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Container styles
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 64, // Account for status bar and notch
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
  },
  contentContainer: {
    paddingBottom: 150,
    alignItems: 'center',
    marginTop: 20,
  },
  
  // Logo section
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  
  // Book cover
  cover: {
    width: 180,
    height: 270,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  
  // Action buttons
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
  
  // Book information
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
  
  // Genre display
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
  
  // Information grid
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
  
  // Error and loading states
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
  
  // Amazon integration
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
});
