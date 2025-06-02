import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { globalEvents } from '../../utils/eventBus';
import Searchbar from '../../components/Searchbar/Searchbar';
import AddModal from '../../components/Collection/AddModal';
import { API_BASE_URL } from '../../config/api';

export default function HomeScreen() {
  const [username, setUsername] = useState<string>('');
  const [inputUsername, setInputUsername] = useState<string>('');
  const [checkingUser, setCheckingUser] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [recentlyScanned, setRecentlyScanned] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalLoading, setAddModalLoading] = useState(false);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [blockScroll, setBlockScroll] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  // Fetch username and data
  const fetchUsernameAndData = useCallback(async () => {
    const name = await AsyncStorage.getItem('ridizi_username');
    if (name) setUsername(name);
    if (name) {
      try {
        const [colRes, scanRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/collections/${name}`),
          axios.get(`${API_BASE_URL}/api/recently_scanned/${name}`)
        ]);
        setCollections(colRes.data);
        setRecentlyScanned(scanRes.data);
      } catch {
        setCollections([]);
        setRecentlyScanned([]);
      }
    } else {
      setCollections([]);
      setRecentlyScanned([]);
    }
  }, []);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      fetchUsernameAndData();
      // Listen for global events (username/collections change)
      const reload = () => fetchUsernameAndData();
      globalEvents.on('reloadHome', reload);
      return () => globalEvents.off('reloadHome', reload);
    }, [fetchUsernameAndData])
  );

  // Remove duplicates from recentlyScanned (by ISBN)
  const uniqueRecentlyScanned = [];
  const seenIsbns = new Set();
  for (const book of recentlyScanned) {
    if (!seenIsbns.has(book.isbn)) {
      uniqueRecentlyScanned.push(book);
      seenIsbns.add(book.isbn);
    }
  }

  const handleValidate = async () => {
    if (!inputUsername.trim()) {
      Alert.alert('Please enter a username');
      return;
    }
    setCheckingUser(true);
    const uname = inputUsername.trim();
    try {
      await axios.post(`${API_BASE_URL}/admin/api/users`, { username: uname })
        .catch(err => {
          if (!(err.response && err.response.status === 409)) throw err;
        });
      await AsyncStorage.setItem('ridizi_username', uname);
      setUsername(uname);
      setInputUsername('');
      globalEvents.emit('reloadHome');
    } catch (err) {
      Alert.alert('Error', 'Unable to create or check user.');
    } finally {
      setCheckingUser(false);
    }
  };

  const handleCameraPress = async () => {
    // Navigate to camera tab and trigger scan immediately
    router.push({ pathname: '/(tabs)/camera', params: { autoScan: '1' } });
  };

  const handleCreateCollection = async (name: string, icon: string) => {
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
      Alert.alert('Error', 'Could not create collection');
    }
    setAddModalLoading(false);
  };

  const handleImageError = (isbn: string) => {
    setImageErrors(prev => ({ ...prev, [isbn]: true }));
  };

  return (
    <View style={styles.scrollContainer}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Search Bar with Camera Icon */}
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

      {/* Welcome Message */}
      <Text style={styles.welcomeText}>
        {username ? `Hello, ${username}` : 'Welcome!'}
      </Text>

      {/* Username input if not set */}
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
          <TouchableOpacity style={styles.validateButton} onPress={handleValidate} disabled={checkingUser}>
            <Text style={styles.validateButtonText}>{checkingUser ? 'Validating...' : 'Validate'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Divider */}
      {username && uniqueRecentlyScanned.length > 0 && <View style={styles.divider} />}

      {/* Collections */}
      {username && uniqueRecentlyScanned.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Your collections:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.horizontalScroll}
            scrollEnabled={collections.length > 0}
          >
            {collections.length === 0 ? (
              <View style={styles.noCollectionsContainer}>
                <Text style={styles.noCollectionsTitle}>Create Your First Collection!</Text>
                <Text style={styles.noCollectionsSubtitle}>Organize your books by genre, mood, or any way you like</Text>
                <TouchableOpacity style={styles.createCollectionButton} onPress={() => setShowAddModal(true)}>
                  <Text style={styles.createCollectionButtonText}>Create Collection</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {collections.map((col) => (
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
                ))}
              </>
            )}
          </ScrollView>
          {/* Divider */}
          <View style={styles.divider} />
        </>
      )}

      {/* Recently Scanned */}
      {username && (
        <>
          <Text style={styles.sectionTitle}>Recently Scanned:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {uniqueRecentlyScanned.length === 0 ? (
              <View style={styles.noScansContainer}>
                <Text style={styles.noScansTitle}>Start Scanning Books!</Text>
                <Text style={styles.noScansSubtitle}>Discover and organize your favorite books</Text>
                <TouchableOpacity style={styles.scanButton} onPress={handleCameraPress}>
                  <Camera size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Scan Your First Book</Text>
                </TouchableOpacity>
              </View>
            ) : (
              uniqueRecentlyScanned.map((book) => (
                <TouchableOpacity
                  key={book.isbn}
                  style={styles.recentItem}
                  onPress={() => router.push({ 
                    pathname: '/(tabs)/bookdetails', 
                    params: { 
                      isbn: book.isbn
                    } 
                  })}
                >
                  <View style={styles.recentRect}>
                    <Image
                      source={{ 
                        uri: imageErrors[book.isbn] && book.cover_url && book.cover_url.trim() && book.cover_url.startsWith('http')
                          ? book.cover_url 
                          : `${API_BASE_URL}/cover/${book.isbn}.jpg`
                      }}
                      style={styles.recentImage}
                      resizeMode="cover"
                      onError={() => handleImageError(book.isbn)}
                    />
                  </View>
                  <Text style={styles.recentLabel} numberOfLines={2}>{book.title}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* Add Collection Modal */}
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

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 64, // margin from notch
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 18,
  },
  cameraButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
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