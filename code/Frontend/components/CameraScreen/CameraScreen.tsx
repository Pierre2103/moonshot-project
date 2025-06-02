/**
 * Camera Screen Component
 * 
 * Main camera interface for book scanning with visual recognition.
 * Provides real-time book identification through image capture and AI matching.
 * 
 * Key Features:
 * - Camera integration with permission handling
 * - AI-powered book matching with accuracy scores
 * - Alternative book suggestions for mismatches
 * - User scan tracking and history recording
 * - Swipe gestures for alternative results navigation
 * - Auto-scan functionality on screen focus
 * - Manual re-scanning capabilities
 * - ISBN extraction and book details navigation
 * 
 * Navigation Flow:
 * - Triggered from tab navigation or home screen
 * - Auto-scan when accessed with autoScan parameter
 * - Navigates to book details upon successful match
 * - Fallback to manual ISBN scanner for edge cases
 * 
 * Technical Notes:
 * - Uses Expo ImagePicker for camera access
 * - Integrates with backend AI matching service
 * - Implements PanResponder for gesture handling
 * - Records user scanning activity for analytics
 */

import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, ChevronRight } from 'lucide-react-native'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing } from '../ISBNScanner/styles'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { API_BASE_URL } from '../../config/api'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Book match result from AI recognition service
 */
interface BookMatch {
  title: string;
  authors: string;
  score: number;
  coverUrl: string;
  isbn: string;
  filename: string;
  alternatives?: AlternativeMatch[];
}

/**
 * Alternative book match suggestion
 */
interface AlternativeMatch {
  title: string;
  authors: string[];
  score: number;
  cover_url: string;
  filename: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CameraScreen() {
  // ----------------------------------------------------------------------------
  // NAVIGATION AND PARAMS
  // ----------------------------------------------------------------------------
  
  const router = useRouter();
  const params = useLocalSearchParams();

  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // Image and scanning state
  const [image, setImage] = useState<string | null>(null);
  const [match, setMatch] = useState<BookMatch | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Alternative results state
  const [altIndex, setAltIndex] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  // User state
  const [username, setUsername] = useState<string>("");
  
  // Refs for UI interactions
  const altListScrollRef = useRef<ScrollView>(null);

  // ----------------------------------------------------------------------------
  // GESTURE HANDLING
  // ----------------------------------------------------------------------------

  /**
   * PanResponder for swipe gestures on alternative results.
   * Enables intuitive swipe-right to close alternatives view.
   */
  const panResponder = React.useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes when alternatives are shown
        return showAlternatives && Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (showAlternatives && gestureState.dx > 40) {
          setShowAlternatives(false);
        }
      },
    }), [showAlternatives]
  );

  // ----------------------------------------------------------------------------
  // CAMERA AND IMAGE HANDLING
  // ----------------------------------------------------------------------------

  /**
   * Handle image capture from camera with permission checks.
   * Automatically processes the captured image for book matching.
   */
  const pickImage = async () => {
    try {
      // Get username from AsyncStorage before scanning
      let storedUsername = username;
      if (!storedUsername) {
        storedUsername = await AsyncStorage.getItem('ridizi_username') || "";
        setUsername(storedUsername);
      }
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "La permission d'accéder à la caméra est requise.");
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, // Balanced quality for faster processing
      });
      
      if (!result.canceled && result.assets?.length > 0) {
        const selectedImage = result.assets[0].uri;
        setImage(selectedImage);
        setMatch(null);
        setAltIndex(0);
        setShowAlternatives(false);
        await sendImage(selectedImage, storedUsername);
      }
    } catch (err) {
      console.error('Error capturing image:', err);
      Alert.alert("Erreur", "Une erreur est survenue lors de la prise de photo.");
    }
  };

  /**
   * Send captured image to AI matching service.
   * Processes response and records user scan activity.
   */
  const sendImage = async (uri: string, usedUsername?: string) => {
    setLoading(true);
    
    // Prepare form data for multipart upload
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
    
    try {
      // Send image to AI matching service
      const response = await axios.post(`${API_BASE_URL}/match`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log("CameraScreen /match API response:", response.data); // Debug log
      
      // Process and format match result
      const matchData = response.data;
      setMatch({
        ...matchData,
        authors: matchData.authors.join(', '),
        coverUrl: `${API_BASE_URL}${matchData.cover_url}`,
        isbn: matchData.filename ? matchData.filename.replace(/\.[^/.]+$/, "") : "", // Extract ISBN from filename
      });
      
      // Record the scan for user analytics
      const uname = usedUsername ?? username;
      if (uname.trim() && matchData.filename) {
        try {
          await axios.post(`${API_BASE_URL}/admin/api/user_scans`, {
            username: uname.trim(),
            isbn: matchData.filename.replace(/\.[^/.]+$/, ""), // Remove file extension
          });
        } catch (err) {
          console.warn("Erreur lors de l'enregistrement du scan utilisateur :", err);
        }
      }
    } catch (err: any) {
      console.error('Error processing image:', err);
      Alert.alert('Erreur', err.message || 'Erreur lors de la requête');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Handle auto-scan functionality when screen loads.
   * Triggered by autoScan parameter from navigation.
   */
  React.useEffect(() => {
    if (params.autoScan === '1') {
      pickImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.autoScan]);

  // ----------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ----------------------------------------------------------------------------

  /**
   * Calculate and format accuracy percentage from AI confidence score.
   * Higher scores indicate lower confidence, so we invert the calculation.
   */
  const getAccuracy = (score: number | undefined): string => {
    if (typeof score !== 'number') return '-';
    return `${Math.round((1 - score) * 100)}%`;
  };

  /**
   * Navigate to book details screen with extracted ISBN.
   * Handles validation and error cases.
   */
  const navigateToBookDetails = (isbn: string, bookTitle?: string) => {
    console.log("Navigating to bookdetails with ISBN:", isbn);
    if (isbn && typeof isbn === "string" && isbn.trim() !== "") {
      router.push({ 
        pathname: '/(tabs)/bookdetails', 
        params: { isbn: isbn.trim() } 
      });
    } else {
      Alert.alert("No ISBN found for this book.");
    }
  };

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Render the main book match result with cover and metadata
   */
  const renderMainResult = () => (
    <View style={styles.resultContainer}>
      <Image source={{ uri: match!.coverUrl }} style={styles.cover} />
      <Text style={styles.accuracyText}>Accuracy: {getAccuracy(match!.score)}</Text>
      <Text style={styles.title}>{match!.title}</Text>
      <Text style={styles.authors}>{match!.authors}</Text>
      <TouchableOpacity onPress={() => navigateToBookDetails(match!.isbn, match!.title)}>
        <Text style={styles.seeMore}>See more</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render alternative book suggestions list
   */
  const renderAlternativesList = () => (
    <View style={styles.altListContainer} {...panResponder.panHandlers}>
      {/* Back to main result button */}
      <TouchableOpacity style={styles.backButton} onPress={() => setShowAlternatives(false)}>
        <Text style={styles.backButtonText}>← Back to main result</Text>
      </TouchableOpacity>
      
      <Text style={styles.notGoodBookHeader}>Similar results:</Text>
      
      <ScrollView style={styles.altListBox}>
        {match!.alternatives && match!.alternatives.slice(0, 5).map((alt: AlternativeMatch, idx: number) => {
          const altIsbn = alt.filename ? alt.filename.replace(/\.[^/.]+$/, "") : "";
          return (
            <TouchableOpacity
              key={idx}
              style={styles.altListRow}
              onPress={() => navigateToBookDetails(altIsbn, alt.title)}
            >
              <Image
                source={{ uri: `${API_BASE_URL}${alt.cover_url}` }}
                style={styles.altListImage}
              />
              <View style={styles.altListInfo}>
                <Text style={styles.altListTitle}>{alt.title}</Text>
                <Text style={styles.altListAuthors}>{alt.authors.join(', ')}</Text>
                <Text style={styles.altListAccuracy}>Accuracy: {getAccuracy(alt.score)}</Text>
              </View>
              <ChevronRight size={28} color="#888" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  /**
   * Render loading state with spinner and message
   */
  const renderLoadingState = () => (
    <View style={styles.centeredContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Please Wait...</Text>
    </View>
  );

  /**
   * Render empty state before scanning
   */
  const renderEmptyState = () => (
    <View style={styles.centeredContent}>
      {/* The scan button is fixed at bottom, so nothing here */}
    </View>
  );

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Fixed App Logo at Top */}
      <View style={styles.fixedLogoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Main Content Area */}
      <View style={{ paddingBottom: 120, paddingTop: 110 }}>
        {/* Conditional Content Based on State */}
        {!image && !match && !loading && renderEmptyState()}
        {loading && renderLoadingState()}
        {match && !loading && (
          !showAlternatives ? renderMainResult() : renderAlternativesList()
        )}
      </View>

      {/* Fixed Bottom Controls */}
      <View style={styles.fixedBottom}>
        {/* Alternative Results Toggle */}
        {match && !loading && (
          <>
            <TouchableOpacity onPress={() => setShowAlternatives(!showAlternatives)}>
              {!showAlternatives && (
                <Text style={styles.notGoodBookFixed}>Not the good book?</Text>
              )}
            </TouchableOpacity>
            
            {/* Manual ISBN Scanner Link */}
            {showAlternatives && (
              <TouchableOpacity
                style={styles.addBookTextContainer}
                onPress={() => router.push('/(tabs)/isbnscan')}
              >
                <Text style={styles.addBookText}>Add new book to dataset.</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        
        {/* Main Scan Button */}
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => {
            if (showAlternatives) setShowAlternatives(false);
            pickImage();
          }}
        >
          <Camera size={28} color="white" />
          <Text style={styles.scanButtonText}>
            {match ? "Scan again" : "Click here to scan"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 0,
    backgroundColor: '#fff',
    flexGrow: 1,
    flex: 1,
  },
  fixedLogoContainer: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: spacing.small,
    marginTop: 8,
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
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.small,
  },
  fixedBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  notGoodBookFixed: {
    color: colors.primary,
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  addBookTextContainer: {
    marginBottom: 8,
  },
  addBookText: {
    color: colors.primary,
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  loadingText: {
    marginTop: spacing.medium,
    color: colors.textSecondary,
    fontSize: 16,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 92,
    paddingHorizontal: 12,
  },
  cover: {
    width: 180,
    height: 270,
    borderRadius: 10,
    marginBottom: 12,
  },
  accuracyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  authors: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  seeMore: {
    color: colors.primary,
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  altListContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 8,
  },
  notGoodBookHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  altListBox: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    maxHeight: 400,
  },
  altListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  altListImage: {
    width: 48,
    height: 72,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  altListInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  altListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  altListAuthors: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  altListAccuracy: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
})
