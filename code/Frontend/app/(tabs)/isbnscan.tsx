/**
 * ISBN Scanner Screen
 * 
 * Dedicated manual ISBN scanning interface with barcode recognition.
 * Provides fallback scanning when camera auto-scan doesn't work optimally.
 * 
 * Key Features:
 * - Manual barcode scanning with camera viewfinder
 * - ISBN-10 and ISBN-13 format recognition
 * - Real-time barcode detection and validation
 * - Immediate navigation to book details upon successful scan
 * - Error handling for invalid or unrecognized barcodes
 * - Clean, focused scanning interface without distractions
 * 
 * Navigation Sources:
 * - Camera screen (when auto-scan fails)
 * - Manual entry from search
 * - Backup scanning option from various screens
 * 
 * Technical Notes:
 * - Uses ISBNScanner component for core functionality
 * - Maintains app branding with logo display
 * - Provides clear navigation path back to previous screen
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import ISBNScanner from '@/components/ISBNScanner/ISBNScanner';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ISBNScannerTab() {
  // ----------------------------------------------------------------------------
  // NAVIGATION AND ROUTING
  // ----------------------------------------------------------------------------
  
  const router = useRouter();

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Handle back navigation to previous screen.
   * Returns user to the screen they came from (usually camera or search).
   */
  const handleGoBack = () => {
    router.back();
  };

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* App Logo - Fixed at top for brand consistency */}
      <View style={styles.fixedLogoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Back Navigation Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>← Go back</Text>
      </TouchableOpacity>

      {/* Scanner Component - Takes remaining screen space */}
      <View style={styles.scannerContainer}>
        <ISBNScanner />
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main container with safe area handling
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 64, // Account for status bar and notch
    paddingHorizontal: 0, // Full width for scanner
  },
  
  // Logo section - maintains brand presence
  fixedLogoContainer: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
    paddingBottom: 0,
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  
  // Navigation controls
  backButton: {
    marginTop: 0,
    marginLeft: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Scanner area - optimized for camera view
  scannerContainer: {
    flex: 1,
    backgroundColor: '#e5e5e5', // Neutral background
    marginHorizontal: 0,
    marginTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});