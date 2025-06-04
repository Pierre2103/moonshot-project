/**
 * Search Bar Component
 * 
 * Intelligent search interface with real-time book search capabilities.
 * Provides instant search results with book covers, metadata, and navigation.
 * 
 * Key Features:
 * - Real-time search with debounced API calls for performance
 * - Rich search results with book covers and metadata
 * - Responsive overlay that adapts to screen dimensions
 * - Keyboard-aware interface with proper focus management
 * - Fallback image handling for book covers
 * - Integration with camera button for scanning workflow
 * - Search state management with loading indicators
 * 
 * Search Capabilities:
 * - Title and author search
 * - ISBN lookup (both ISBN-10 and ISBN-13)
 * - Genre-based filtering
 * - Fuzzy matching for typos and variations
 * 
 * Technical Notes:
 * - Uses debounced requests to optimize API performance
 * - Implements proper keyboard handling and dismissal
 * - Manages z-index for overlay positioning
 * - Includes accessibility features for screen readers
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  View, TextInput, FlatList, Text, TouchableOpacity, Image, 
  StyleSheet, ActivityIndicator, Keyboard, Dimensions 
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { API_BASE_URL } from "../../config/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props interface for Searchbar component
 */
interface SearchbarProps {
  /** Optional camera button component to display alongside search */
  cameraButton?: React.ReactNode;
  /** Callback to control parent scroll blocking during search */
  setBlockScroll?: (blocked: boolean) => void;
}

/**
 * Search result item structure from API
 */
interface SearchResult {
  isbn: string;
  title: string;
  authors: string | string[];
  genres?: string | string[];
  cover_url?: string;
  publication_date?: string;
  publisher?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Debounce delay for search API calls (in milliseconds)
 */
const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * Maximum number of search results to display
 */
const MAX_SEARCH_RESULTS = 10;

/**
 * Maximum height for search results overlay
 */
const MAX_OVERLAY_HEIGHT = 340;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Searchbar Component
 * 
 * Provides real-time book search functionality with intelligent result display
 * and seamless navigation integration.
 * 
 * @param {SearchbarProps} props - Component configuration
 * @returns {JSX.Element} Search interface with results overlay
 */
export default function Searchbar({ cameraButton, setBlockScroll }: SearchbarProps) {
  // ----------------------------------------------------------------------------
  // NAVIGATION AND ROUTING
  // ----------------------------------------------------------------------------
  
  const router = useRouter();

  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // Search input and results state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // UI state management
  const [focused, setFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Image error handling for book covers
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  
  // Refs for UI interactions
  const inputRef = useRef<TextInput>(null);

  // ----------------------------------------------------------------------------
  // SEARCH FUNCTIONALITY
  // ----------------------------------------------------------------------------

  /**
   * Perform search API call with debouncing for performance.
   * Handles empty queries and provides loading state management.
   */
  useEffect(() => {
    // Clear results for empty queries
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Set loading state for user feedback
    setLoading(true);
    
    // Debounce API calls to prevent excessive requests
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await axios.get(
          `http://${API_BASE_URL}:5001/api/search?q=${encodeURIComponent(query.trim())}&limit=${MAX_SEARCH_RESULTS}`
        );
        setResults(response.data || []);
      } catch (error) {
        console.error('Search API error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_DELAY);

    // Cleanup function to cancel pending requests
    return () => clearTimeout(searchTimeout);
  }, [query]);

  // ----------------------------------------------------------------------------
  // KEYBOARD AND FOCUS MANAGEMENT
  // ----------------------------------------------------------------------------

  /**
   * Handle keyboard dismissal events.
   * Maintains search state while managing UI focus.
   */
  useEffect(() => {
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setFocused(false);
    });

    return () => keyboardHideListener.remove();
  }, []);

  /**
   * Manage results overlay visibility based on focus state.
   * Coordinates with parent component scroll blocking.
   */
  useEffect(() => {
    if (focused) {
      setShowResults(true);
      if (setBlockScroll) setBlockScroll(true);
    } else {
      if (setBlockScroll) setBlockScroll(false);
    }
  }, [focused, setBlockScroll]);

  /**
   * Hide results overlay when search query is cleared.
   */
  useEffect(() => {
    if (!query.trim()) {
      setShowResults(false);
    }
  }, [query]);

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Handle input blur events.
   * Manages focus state while preserving search results.
   */
  const handleBlur = (): void => {
    setFocused(false);
    // Note: We intentionally don't hide results on blur to allow result selection
  };

  /**
   * Handle search input focus.
   * Activates search interface and shows existing results.
   */
  const handleFocus = (): void => {
    setFocused(true);
  };

  /**
   * Clear search input and results.
   * Resets search state while maintaining focus for new search.
   */
  const handleClearSearch = (): void => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setImageErrors({}); // Clear image error state
    inputRef.current?.focus();
  };

  /**
   * Handle search result selection.
   * Navigates to book details and cleans up search state.
   */
  const handleResultSelect = (book: SearchResult): void => {
    setFocused(false);
    setShowResults(false);
    Keyboard.dismiss();
    
    // Navigate to book details page
    router.push({ 
      pathname: '/(tabs)/bookdetails', 
      params: { isbn: book.isbn } 
    });
  };

  /**
   * Handle book cover image loading errors.
   * Enables fallback to alternative image sources.
   */
  const handleImageError = (isbn: string): void => {
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
   * Format genres for display.
   * Handles both string and array formats from API.
   */
  const formatGenres = (genres: string | string[] | undefined): string => {
    if (!genres) return '';
    if (Array.isArray(genres)) {
      return genres.join(", ");
    }
    return genres;
  };

  /**
   * Determine which cover image source to use.
   * Implements fallback logic for failed image loads.
   */
  const getCoverImageSource = (book: SearchResult) => {
    if (imageErrors[book.isbn] && book.cover_url && book.cover_url.startsWith("http")) {
      return { uri: book.cover_url };
    }
    return { uri: `http://${API_BASE_URL}:5001/cover/${book.isbn}.jpg` };
  };

  /**
   * Render individual search result item.
   */
  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      key={item.isbn}
      style={styles.resultRow}
      onPress={() => handleResultSelect(item)}
      activeOpacity={0.7}
    >
      <Image
        source={getCoverImageSource(item)}
        style={styles.cover}
        resizeMode="cover"
        onError={() => handleImageError(item.isbn)}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.authors} numberOfLines={1}>
          {formatAuthors(item.authors)}
        </Text>
        {item.genres && (
          <Text style={styles.genres} numberOfLines={1}>
            {formatGenres(item.genres)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  /**
   * Render empty search results state.
   */
  const renderEmptyResults = () => (
    !loading && query ? (
      <Text style={styles.noResult}>No results found.</Text>
    ) : null
  );

  // ----------------------------------------------------------------------------
  // RESPONSIVE LAYOUT CALCULATION
  // ----------------------------------------------------------------------------

  // Calculate overlay width to match parent container
  const screenWidth = Dimensions.get("window").width - 40; // Account for 20px padding each side

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.searchContainer}>
      {/* Search Input Row */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search books by title, author, ISBN, genre..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCorrect={false}
        />
        
        {/* Clear Button */}
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color="#888" />
          </TouchableOpacity>
        )}
        
        {/* Camera Button */}
        {cameraButton}
      </View>

      {/* Search Results Overlay */}
      {(showResults && (query.length > 0 || loading)) && (
        <View style={[styles.resultsOverlay, { width: screenWidth }]}>
          {/* Loading Indicator */}
          {loading && (
            <ActivityIndicator 
              style={styles.loadingIndicator} 
              size="small" 
              color="#007AFF" 
            />
          )}
          
          {/* Results List */}
          <FlatList
            data={results}
            keyExtractor={item => item.isbn}
            renderItem={renderSearchResult}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            ListEmptyComponent={renderEmptyResults()}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true} // Performance optimization
            maxToRenderPerBatch={5} // Optimize rendering
            windowSize={5} // Memory management
          />
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main container
  searchContainer: {
    zIndex: 10, // Ensure overlay appears above other content
    position: 'relative',
  },
  
  // Input row layout
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    position: 'relative',
  },
  
  // Search input styling
  searchInput: {
    flex: 1,
    height: 48,
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 18,
    // Ensure text is visible above clear button
    paddingRight: 60,
  },
  
  // Clear button positioning
  clearBtn: {
    position: 'absolute',
    right: 56, // Space for camera button
    top: 0,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    zIndex: 2,
  },
  
  // Results overlay styling
  resultsOverlay: {
    position: 'absolute',
    top: 56, // Below input row
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: MAX_OVERLAY_HEIGHT,
    minHeight: 0,
    zIndex: 100,
  },
  
  // Loading indicator
  loadingIndicator: {
    marginTop: 8,
    marginBottom: 8,
  },
  
  // Results list styling
  resultsList: {
    maxHeight: MAX_OVERLAY_HEIGHT,
  },
  resultsContent: {
    flexGrow: 1,
  },
  
  // Individual result row
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    // Ensure proper touch targets
    minHeight: 44,
  },
  
  // Book cover styling
  cover: { 
    width: 44, 
    height: 64, 
    borderRadius: 6, 
    marginRight: 10, 
    backgroundColor: "#eee" 
  },
  
  // Book information layout
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Typography hierarchy
  title: { 
    fontWeight: "600", 
    fontSize: 16, 
    color: "#222",
    marginBottom: 2,
  },
  authors: { 
    color: "#666", 
    fontSize: 14,
    marginBottom: 2,
  },
  genres: { 
    color: "#888", 
    fontSize: 13,
    fontStyle: 'italic',
  },
  
  // Empty state
  noResult: { 
    color: "#888", 
    textAlign: "center", 
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
  },
});
