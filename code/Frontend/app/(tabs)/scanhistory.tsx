/**
 * Scan History Screen
 * 
 * Displays a chronological list of all books scanned by the user.
 * Provides easy access to previously scanned books and collection management.
 * 
 * Key Features:
 * - Chronological list of scanned books with covers and metadata
 * - One-tap navigation to book details
 * - Bulk clear history functionality with confirmation
 * - Real-time data refresh on screen focus
 * - Fallback image handling for book covers
 * - Empty state handling for new users
 * 
 * Navigation Sources:
 * - Main tab navigation
 * - Home screen quick access
 * - Profile/settings pages
 */

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { API_BASE_URL } from "../../config/api";
import BackButton from "../../components/common/BackButton";
import { useFocusEffect } from "@react-navigation/native";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Scanned book data structure from API
 */
interface ScannedBook {
  isbn: string;
  title: string;
  authors: string | string[];
  cover_url?: string;
  timestamp?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScanHistory() {
  // ----------------------------------------------------------------------------
  // NAVIGATION AND ROUTING
  // ----------------------------------------------------------------------------
  
  const router = useRouter();

  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // Book data state
  const [books, setBooks] = useState<ScannedBook[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state for image error handling
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  // ----------------------------------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------------------------------

  /**
   * Load scan history from API for the current user.
   * Fetches chronologically ordered list of scanned books.
   */
  const loadScanHistory = useCallback(async () => {
    const username = await AsyncStorage.getItem('ridizi_username');
    if (!username) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recently_scanned/${username}`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error loading scan history:', error);
      setBooks([]);
    }
    setLoading(false);
  }, []);

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Load scan history on component mount
   */
  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  /**
   * Reload scan history when screen comes into focus.
   * Ensures fresh data when navigating back from other screens.
   */
  useFocusEffect(
    useCallback(() => {
      loadScanHistory();
    }, [loadScanHistory])
  );

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Handle clear history action with confirmation dialog.
   * Removes all scan history for the current user.
   */
  const handleClearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your entire scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const username = await AsyncStorage.getItem('ridizi_username');
            if (!username) return;
            
            try {
              await axios.delete(`${API_BASE_URL}/api/user_scans/${username}`);
              setBooks([]);
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Could not clear history');
            }
          }
        }
      ]
    );
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
   * Format scan timestamp to relative time display.
   * Shows "Just now", "X minutes ago", "X days ago", etc.
   */
  const formatScanTime = (timestamp?: string): string => {
    if (!timestamp) return 'Recently scanned';
    
    const now = new Date();
    const scanDate = new Date(timestamp);
    const diffMs = now.getTime() - scanDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // For older scans, show the actual date
    return scanDate.toLocaleDateString();
  };

  /**
   * Determine which cover image to display.
   * Uses fallback logic for image sources.
   */
  const getCoverImageSource = (item: ScannedBook) => {
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

      {/* Header with Title and Clear Button */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Scan History</Text>
        {books.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Trash2 size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Area - Loading, Empty State, or Book List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: "#888" }}>No books scanned yet.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item, index) => `scan-${item.isbn}-${index}`}
          contentContainerStyle={{ paddingBottom: 200, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookItem}
              onPress={() => router.push({ pathname: '/(tabs)/bookdetails', params: { isbn: item.isbn } })}
            >
              <Image
                source={getCoverImageSource(item)}
                style={styles.bookImage}
                resizeMode="cover"
                onError={() => handleImageError(item.isbn)}
              />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                {item.authors && (
                  <Text style={styles.bookAuthors} numberOfLines={1}>
                    {formatAuthors(item.authors)}
                  </Text>
                )}
                <Text style={styles.scanTime}>{formatScanTime(item.timestamp)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 20,
    paddingTop: 64,
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
  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12, 
    justifyContent: "space-between" 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    flex: 1, 
    textAlign: "center" 
  },
  centered: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingTop: 80 
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f8f8fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bookImage: {
    width: 70,
    height: 100,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: "#eee",
  },
  bookInfo: { 
    flex: 1, 
    justifyContent: "center" 
  },
  bookTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#222" 
  },
  bookAuthors: { 
    fontSize: 14, 
    color: "#666", 
    marginTop: 4 
  },
  scanTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontStyle: 'italic',
  },
});
