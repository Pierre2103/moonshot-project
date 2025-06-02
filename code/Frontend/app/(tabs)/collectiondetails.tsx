/**
 * Collection Details Screen
 * 
 * Displays books within a specific collection with multiple layout options
 * and comprehensive book management capabilities.
 * 
 * Key Features:
 * - Multiple view layouts (list, 2x2 grid, 3x3 grid) with user preference storage
 * - Book cover display with fallback image handling
 * - Book management actions (move to other collections, remove from collection)
 * - Long-press context menus for book actions
 * - Real-time collection data synchronization
 * - Move books between collections with confirmation
 * - Responsive layout that adapts to screen size
 * - Empty state handling for collections without books
 * 
 * Navigation Sources:
 * - Collections list screen
 * - Home screen collections section
 * - Search results (when adding to collections)
 */

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, ActionSheetIOS, Alert, Platform, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { List, Grid2X2, Grid3X3, ArrowLeft } from "lucide-react-native";
import { API_BASE_URL } from "../../config/api";
import BackButton from "../../components/common/BackButton";
import { useFocusEffect } from "@react-navigation/native";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Storage key for user's preferred layout setting
 */
const LAYOUT_KEY = "collection_layout_preference";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Available layout options for displaying books
 */
type LayoutType = "list" | "grid2" | "grid3";

/**
 * Book data structure within collections
 */
interface CollectionBook {
  isbn: string;
  title: string;
  authors: string | string[];
  cover_url?: string;
  added_at?: string;
}

/**
 * Collection data for move functionality
 */
interface Collection {
  id: number;
  name: string;
  icon: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CollectionDetails() {
  // ----------------------------------------------------------------------------
  // NAVIGATION AND PARAMS
  // ----------------------------------------------------------------------------
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const collectionId = params.collectionId;
  const collectionName = params.collectionName as string;

  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // Book data state
  const [books, setBooks] = useState<CollectionBook[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Layout preference state
  const [layout, setLayout] = useState<LayoutType>("grid2");
  
  // Move functionality state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<CollectionBook | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [moving, setMoving] = useState(false);
  
  // UI state for image error handling
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  // ----------------------------------------------------------------------------
  // LAYOUT MANAGEMENT
  // ----------------------------------------------------------------------------

  /**
   * Load user's preferred layout setting from storage
   */
  useEffect(() => {
    AsyncStorage.getItem(LAYOUT_KEY).then(val => {
      if (val === "list" || val === "grid2" || val === "grid3") setLayout(val);
    });
  }, []);

  /**
   * Handle layout change and persist preference to storage
   */
  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    AsyncStorage.setItem(LAYOUT_KEY, newLayout);
  };

  /**
   * Calculate grid columns and item width based on current layout
   */
  const numColumns = layout === "list" ? 1 : layout === "grid2" ? 2 : 3;
  const itemWidth = () => {
    const screenWidth = Dimensions.get("window").width - 40;
    if (layout === "list") return screenWidth;
    if (layout === "grid2") return (screenWidth - 16) / 2;
    return (screenWidth - 24) / 3;
  };

  // ----------------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------------

  /**
   * Reload books in the collection from API.
   * Fetches complete book metadata for display.
   */
  const reloadBooks = useCallback(() => {
    if (!collectionId) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/collections/${collectionId}/books`)
      .then(res => setBooks(res.data))
      .catch(error => {
        console.error('Error loading collection books:', error);
        setBooks([]);
      })
      .finally(() => setLoading(false));
  }, [collectionId]);

  /**
   * Load books on component mount
   */
  useEffect(() => {
    reloadBooks();
  }, [reloadBooks]);

  /**
   * Fetch available collections for move functionality.
   * Excludes current collection from the list.
   */
  useEffect(() => {
    if (!showMoveModal) return;
    AsyncStorage.getItem('ridizi_username').then(username => {
      if (!username) return;
      axios.get(`${API_BASE_URL}/api/collections/${username}`)
        .then(res => setCollections(res.data.filter((c: Collection) => c.id != collectionId)))
        .catch(error => {
          console.error('Error loading collections for move:', error);
          setCollections([]);
        });
    });
  }, [showMoveModal, collectionId]);

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Reload books when screen comes into focus.
   * Ensures fresh data when navigating back from book details.
   */
  useFocusEffect(
    useCallback(() => {
      reloadBooks();
    }, [reloadBooks])
  );

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS - BOOK MANAGEMENT
  // ----------------------------------------------------------------------------

  /**
   * Remove book from current collection.
   * Shows loading state during API call.
   */
  const handleRemove = async (book: CollectionBook) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/collections/${collectionId}/books/${book.isbn}`);
      reloadBooks();
    } catch (error) {
      console.error('Error removing book from collection:', error);
      Alert.alert("Error", "Could not remove book.");
      setLoading(false);
    }
  };

  /**
   * Move book to another collection.
   * Performs add to target collection and remove from current collection.
   */
  const handleMove = async (targetCollectionId: number) => {
    if (!selectedBook) return;
    setMoving(true);
    try {
      const username = await AsyncStorage.getItem('ridizi_username');
      if (!username) throw new Error("No username found");
      
      // Add to target collection
      await axios.post(`${API_BASE_URL}/api/collections/${username}/${targetCollectionId}/add`, { 
        isbn: selectedBook.isbn 
      });
      
      // Remove from current collection
      await axios.delete(`${API_BASE_URL}/api/collections/${collectionId}/books/${selectedBook.isbn}`);
      
      setShowMoveModal(false);
      setSelectedBook(null);
      reloadBooks();
    } catch (error) {
      console.error('Error moving book:', error);
      Alert.alert("Error", "Could not move book.");
    }
    setMoving(false);
  };

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS - USER INTERACTIONS
  // ----------------------------------------------------------------------------

  /**
   * Handle long press on book item.
   * Shows platform-appropriate action sheet for book management.
   */
  const handleLongPress = (book: CollectionBook) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Move to another collection", "Remove from this collection"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Move to another collection
            setSelectedBook(book);
            setShowMoveModal(true);
          } else if (buttonIndex === 2) {
            // Remove from collection
            handleRemove(book);
          }
        }
      );
    } else {
      Alert.alert(
        "Book actions",
        book.title,
        [
          { text: "Move to another collection", onPress: () => { 
            setSelectedBook(book); 
            setShowMoveModal(true); 
          }},
          { text: "Remove from this collection", style: "destructive", onPress: () => handleRemove(book) },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  /**
   * Handle image loading errors for book covers.
   * Enables fallback to alternative image sources.
   */
  const handleImageError = (isbn: string) => {
    setImageErrors(prev => ({ ...prev, [isbn]: true }));
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
      return authors.join(", ");
    }
    return authors || 'Unknown Author';
  };

  /**
   * Determine which cover image to display.
   * Uses fallback logic for image sources.
   */
  const getCoverImageSource = (item: CollectionBook) => {
    if (imageErrors[item.isbn] && item.cover_url && 
        item.cover_url.trim() && item.cover_url.startsWith("http")) {
      return { uri: item.cover_url };
    }
    return { uri: `${API_BASE_URL}/cover/${item.isbn}.jpg` };
  };

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.container}>
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

      {/* Header with Collection Name and Layout Controls */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{collectionName || "Collection"}</Text>
        <View style={styles.layoutBtns}>
          <TouchableOpacity onPress={() => handleLayoutChange("list")}>
            <List color={layout === "list" ? "#007AFF" : "#888"} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLayoutChange("grid2")}>
            <Grid2X2 color={layout === "grid2" ? "#007AFF" : "#888"} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLayoutChange("grid3")}>
            <Grid3X3 color={layout === "grid3" ? "#007AFF" : "#888"} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Area - Loading, Empty State, or Books List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: "#888" }}>No books in this collection.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          key={layout + numColumns} // Force re-render when layout changes
          numColumns={numColumns}
          keyExtractor={item => item.isbn}
          contentContainerStyle={{ paddingBottom: 192, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.bookItem,
                { width: itemWidth() },
                layout === "list" && { flexDirection: "row", alignItems: "center" }
              ]}
              onPress={() => router.push({ pathname: '/(tabs)/bookdetails', params: { isbn: item.isbn } })}
              onLongPress={() => handleLongPress(item)}
              delayLongPress={350}
            >
              <Image
                source={getCoverImageSource(item)}
                style={layout === "list" ? styles.bookImageList : styles.bookImageGrid}
                resizeMode="cover"
                onError={() => handleImageError(item.isbn)}
              />
              <View style={layout === "list" ? styles.bookInfoList : styles.bookInfoGrid}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                {item.authors && (
                  <Text style={styles.bookAuthors} numberOfLines={1}>
                    {formatAuthors(item.authors)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Move to Collection Modal */}
      <Modal visible={showMoveModal} transparent animationType="slide" onRequestClose={() => setShowMoveModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, width: 320 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>Move to collection</Text>
            {collections.length === 0 ? (
              <Text style={{ color: "#888" }}>No other collections available.</Text>
            ) : (
              collections.map((col: Collection) => (
                <TouchableOpacity
                  key={col.id}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}
                  onPress={() => handleMove(col.id)}
                  disabled={moving}
                >
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{col.icon}</Text>
                  <Text style={{ fontSize: 16 }}>{col.name}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={{ marginTop: 18, alignSelf: "center" }} onPress={() => setShowMoveModal(false)}>
              <Text style={{ color: "#007AFF", fontSize: 16, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { 
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
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "bold", flex: 1, textAlign: "center" },
  layoutBtns: { flexDirection: "row", gap: 8, marginLeft: 8 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  bookItem: {
    marginBottom: 18,
    marginHorizontal: 4,
    backgroundColor: "#f8f8fa",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  bookImageGrid: {
    width: 90,
    height: 130,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  bookImageList: {
    width: 70,
    height: 100,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: "#eee",
  },
  bookInfoGrid: { alignItems: "center" },
  bookInfoList: { flex: 1, justifyContent: "center" },
  bookTitle: { fontSize: 15, fontWeight: "600", color: "#222", textAlign: "center" },
  bookAuthors: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 2 },
});
