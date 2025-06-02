/**
 * Home Screen - Main Dashboard
 * 
 * Central hub of the book scanning application providing:
 * - User authentication and onboarding
 * - Quick access to scanning functionality
 * - Collections overview and management
 * - Recently scanned books display
 * - Search functionality integration
 * 
 * Key Features:
 * - Username validation and creation
 * - Dynamic content based on user state
 * - Horizontal scrolling collections and books
 * - Real-time data refresh on focus
 * - Onboarding experience for new users
 * - Global event system integration
 * 
 * Navigation:
 * - Camera scanning (auto-trigger)
 * - Book details pages
 * - Collection detail pages
 * - Profile management
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, 
  ScrollView, Alert 
} from 'react-native';
import { Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { globalEvents } from '../../utils/eventBus';
import Searchbar from '../../components/Searchbar/Searchbar';
import AddModal from '../../components/Collection/AddModal';
import { API_BASE_URL } from '../../config/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Collection data structure from API
 */
interface Collection {
  id: number;
  name: string;
  icon: string;
  book_count?: number;
}

/**
 * Recently scanned book data structure
 */
interface RecentBook {
  isbn: string;
  title: string;
  authors: string | string[];
  cover_url?: string;
  timestamp?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function HomeScreen() {
  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // User authentication state
  const [username, setUsername] = useState<string>('');
  const [inputUsername, setInputUsername] = useState<string>('');
  const [checkingUser, setCheckingUser] = useState(false);
  
  // Data state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recentlyScanned, setRecentlyScanned] = useState<RecentBook[]>([]);
  
  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalLoading, setAddModalLoading] = useState(false);
  const [blockScroll, setBlockScroll] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  
  // Refs
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // ----------------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------------

  /**
   * Fetch username from storage and load user data.
   * Executes concurrent API calls for better performance.
   */
  const fetchUsernameAndData = useCallback(async (): Promise<void> => {
    try {
      // Get stored username
      const name = await AsyncStorage.getItem('ridizi_username');
      if (name) {
        setUsername(name);
        
        // Fetch user data concurrently
        const [colRes, scanRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/collections/${name}`),
          axios.get(`${API_BASE_URL}/api/recently_scanned/${name}`)
        ]);
        
        setCollections(colRes.data || []);
        setRecentlyScanned(scanRes.data || []);
      } else {
        // No username stored, reset data
        setCollections([]);
        setRecentlyScanned([]);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setCollections([]);
      setRecentlyScanned([]);
    }
  }, []);

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Reload data when screen comes into focus.
   * Sets up global event listeners for data refresh.
   */
  useFocusEffect(
    useCallback(() => {
      fetchUsernameAndData();
      
      // Listen for global events (username/collections change)
      const reload = () => fetchUsernameAndData();
      globalEvents.on('reloadHome', reload);
      
      return () => globalEvents.off('reloadHome', reload);
    }, [fetchUsernameAndData])
  );

  // ----------------------------------------------------------------------------
  // DATA PROCESSING
  // ----------------------------------------------------------------------------

  /**
   * Remove duplicate books from recently scanned list.
   * Uses ISBN as unique identifier.
   */
  const uniqueRecentlyScanned = (() => {
    const unique: RecentBook[] = [];
    const seenIsbns = new Set<string>();
    
    for (const book of recentlyScanned) {
      if (!seenIsbns.has(book.isbn)) {
        unique.push(book);
        seenIsbns.add(book.isbn);
      }
    }
    
    return unique;
  })();

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Handle username validation and account creation.
   * Creates user account on backend if doesn't exist.
   */
  const handleValidate = async (): Promise<void> => {
    if (!inputUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setCheckingUser(true);
    const uname = inputUsername.trim();
    
    try {
      // Attempt to create user (409 if already exists, which is fine)
      await axios.post(`${API_BASE_URL}/admin/api/users`, { username: uname })
        .catch(err => {
          if (!(err.response && err.response.status === 409)) throw err;
        });
      
      // Store username and update state
      await AsyncStorage.setItem('ridizi_username', uname);
      setUsername(uname);
      setInputUsername('');
      
      // Trigger global reload
      globalEvents.emit('reloadHome');
    } catch (err) {
      console.error('Error validating user:', err);
      Alert.alert('Error', 'Unable to create or check user.');
    } finally {
      setCheckingUser(false);
    }
  };

  /**
   * Navigate to camera screen with auto-scan enabled.
   * Triggers immediate barcode scanning on navigation.
   */
  const handleCameraPress = async (): Promise<void> => {
    router.push({ pathname: '/(tabs)/camera', params: { autoScan: '1' } });
  };

  /**
   * Handle collection creation from the modal.
   * Refreshes data after successful creation.
   */
  const handleCreateCollection = async (name: string, icon: string): Promise<void> => {
    if (!username) return;
    
    setAddModalLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/collections/${username}`, {
        name: name,
        icon: icon
      });
      
      setShowAddModal(false);
      fetchUsernameAndData(); // Reload data
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'Could not create collection');
    }
    setAddModalLoading(false);
  };

  /**
   * Handle image loading errors for book covers.
   * Falls back to alternative cover sources.
   */
  const handleImageError = (isbn: string): void => {
    setImageErrors(prev => ({ ...prev, [isbn]: true }));
  };

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Render the welcome section with user greeting or onboarding
   */
  const renderWelcomeSection = () => (
    <>
      <Text style={styles.welcomeText}>
        {username ? `Hello, ${username}` : 'Welcome!'}
      </Text>

      {/* Username input for new users */}
      {!username && (
        <View style={styles.usernameInputSection}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Enter your username"
            value={inputUsername}
            onChangeText={setInputUsername}
            autoCapitalize="none"
            editable={!checkingUser}
          />
          <TouchableOpacity 
            style={styles.validateButton} 
            onPress={handleValidate} 
            disabled={checkingUser}
          >
            <Text style={styles.validateButtonText}>
              {checkingUser ? 'Validating...' : 'Validate'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  /**
   * Render collections section with create option for new users
   */
  const renderCollectionsSection = () => {
    if (!username || uniqueRecentlyScanned.length === 0) return null;

    return (
      <>
        <Text style={styles.sectionTitle}>Your collections:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.horizontalScroll}
          scrollEnabled={collections.length > 0}
        >
          {collections.length === 0 ? (
            // Onboarding for collections
            <View style={styles.noCollectionsContainer}>
              <Text style={styles.noCollectionsTitle}>Create Your First Collection!</Text>
              <Text style={styles.noCollectionsSubtitle}>
                Organize your books by genre, mood, or any way you like
              </Text>
              <TouchableOpacity 
                style={styles.createCollectionButton} 
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.createCollectionButtonText}>Create Collection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Existing collections
            collections.map((col) => (
              <TouchableOpacity
                key={col.id}
                style={styles.collectionItem}
                onPress={() => router.push({ 
                  pathname: '/(tabs)/collectiondetails', 
                  params: { 
                    collectionId: col.id, 
                    collectionName: col.name
                  } 
                })}
              >
                <View style={styles.collectionSquare}>
                  <Text style={styles.collectionIcon}>{col.icon}</Text>
                </View>
                <Text style={styles.collectionLabel}>{col.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <View style={styles.divider} />
      </>
    );
  };

  /**
   * Render recently scanned books section with onboarding
   */
  const renderRecentlyScannedSection = () => {
    if (!username) return null;

    return (
      <>
        <Text style={styles.sectionTitle}>Recently Scanned:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.horizontalScroll}
        >
          {uniqueRecentlyScanned.length === 0 ? (
            // Onboarding for scanning
            <View style={styles.noScansContainer}>
              <Text style={styles.noScansTitle}>Start Scanning Books!</Text>
              <Text style={styles.noScansSubtitle}>
                Discover and organize your favorite books
              </Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleCameraPress}>
                <Camera size={20} color="#fff" />
                <Text style={styles.scanButtonText}>Scan Your First Book</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Recently scanned books
            uniqueRecentlyScanned.map((book) => (
              <TouchableOpacity
                key={book.isbn}
                style={styles.recentItem}
                onPress={() => router.push({ 
                  pathname: '/(tabs)/bookdetails', 
                  params: { isbn: book.isbn } 
                })}
              >
                <View style={styles.recentRect}>
                  <Image
                    source={{ 
                      uri: imageErrors[book.isbn] && book.cover_url && 
                           book.cover_url.trim() && book.cover_url.startsWith('http')
                        ? book.cover_url 
                        : `${API_BASE_URL}/cover/${book.isbn}.jpg`
                    }}
                    style={styles.recentImage}
                    resizeMode="cover"
                    onError={() => handleImageError(book.isbn)}
                  />
                </View>
                <Text style={styles.recentLabel} numberOfLines={2}>
                  {book.title}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </>
    );
  };

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

      {/* Search Bar with Integrated Camera Button */}
      <Searchbar
        cameraButton={
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPress}
          >
            <Camera size={32} color="#333" />
          </TouchableOpacity>
        }
        setBlockScroll={setBlockScroll}
      />

      {/* Welcome Section */}
      {renderWelcomeSection()}

      {/* Content Divider */}
      {username && uniqueRecentlyScanned.length > 0 && (
        <View style={styles.divider} />
      )}

      {/* Collections Section */}
      {renderCollectionsSection()}

      {/* Recently Scanned Section */}
      {renderRecentlyScannedSection()}

      {/* Collection Creation Modal */}
      <AddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={[]}
        onSelectCollection={() => {}}
        onCreateCollection={handleCreateCollection}
        loading={addModalLoading}
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
  },
  
  // Logo section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  
  // Camera integration
  cameraButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Welcome and user onboarding
  welcomeText: {
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 18,
  },
  usernameInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
    minWidth: 120,
    marginRight: 10,
  },
  validateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  validateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Section organization
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  horizontalScroll: {
    marginBottom: 16,
  },
  
  // Collections display
  collectionItem: {
    alignItems: 'center',
    marginRight: 22,
    width: 110,
  },
  collectionSquare: {
    width: 90,
    height: 90,
    backgroundColor: '#fafafa',
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  collectionLabel: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Recently scanned books
  recentItem: {
    alignItems: 'center',
    marginRight: 22,
    width: 140,
  },
  recentRect: {
    width: 90,
    height: 130,
    backgroundColor: '#fafafa',
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  recentImage: {
    width: 90,
    height: 130,
    borderRadius: 16,
  },
  recentLabel: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Onboarding states
  noScansContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  noScansTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noScansSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noCollectionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    width: '80%',
  },
  noCollectionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noCollectionsSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  createCollectionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createCollectionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});