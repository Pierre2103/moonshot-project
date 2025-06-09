/**
 * ISBN Scanner Component
 * 
 * Comprehensive barcode scanning interface for book ISBN recognition.
 * Provides real-time barcode detection with queue management integration.
 * 
 * Key Features:
 * - EAN-13 barcode format recognition (standard for books)
 * - Real-time duplicate detection and prevention
 * - Backend queue integration for book processing
 * - Visual feedback with toast notifications
 * - Scanner overlay with animated targeting
 * - Scanned books history management
 * - Worker error monitoring and user feedback
 * - Permission-based camera access
 * 
 * Integration Points:
 * - Backend `/barcode` API for ISBN submission
 * - Book processing queue system
 * - Dataset validation and duplicate checking
 * - Worker error monitoring system
 * 
 * Technical Notes:
 * - Uses Expo Camera for barcode detection
 * - Implements scanning cooldown to prevent duplicates
 * - Monitors backend processing errors
 * - Provides accessible UI feedback
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { Book } from 'lucide-react-native';
import { API_BASE_URL } from '../../config/api';

import ScannerOverlay from './ScannerOverlay';
import ScannedBooksList from './ScannedBooksList';
import PermissionRequest from './PermissionRequest';
import { useScanner } from './hooks/useScanner';
import { colors, spacing } from './styles';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Duration for toast notification display (in milliseconds)
 */
const TOAST_DURATION = 2000;

/**
 * Interval for checking backend worker errors (in milliseconds)
 */
const ERROR_CHECK_INTERVAL = 5000;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Toast notification structure for user feedback
 */
interface ToastNotification {
  color: string;
  message: string;
}

/**
 * Barcode scan event data from Expo Camera
 */
interface BarcodeScanEvent {
  data: string;
  type?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ISBNScanner() {
  // ----------------------------------------------------------------------------
  // HOOKS AND STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // Scanner functionality from custom hook
  const { 
    permission,
    requestPermission,
    isScanning,
    scannedISBNs,
    startScanning,
    handleBarCodeScanned: originalHandleBarCodeScanned,
  } = useScanner();

  // Local component state
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [recentlyScanned, setRecentlyScanned] = useState<string | null>(null);

  // ----------------------------------------------------------------------------
  // BARCODE PROCESSING
  // ----------------------------------------------------------------------------

  /**
   * Handle barcode scan events with duplicate prevention and backend integration.
   * Processes scanned ISBN and provides user feedback based on backend response.
   * 
   * @param {BarcodeScanEvent} scanEvent - The barcode scan event from camera
   */
  const handleBarCodeScanned = async ({ data }: BarcodeScanEvent): Promise<void> => {
    // Prevent duplicate processing
    if (scannedISBNs.includes(data) || recentlyScanned === data) {
      return;
    }
    
    // Set cooldown period for this ISBN
    setRecentlyScanned(data);

    try {
      // Submit ISBN to backend processing queue
      const response = await fetch(`http://${API_BASE_URL}:5001/barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn: data }),
      });

      if (response.ok) {
        const res = await response.json();
        
        // Provide user feedback based on backend response
        if (res.already_in_dataset) {
          setToast({ 
            color: '#FF3B30', 
            message: `Book with ISBN ${data} already exists in the dataset.`
          });
        } else if (res.already_in_queue) {
          setToast({ 
            color: '#FFA500', 
            message: `Book with ISBN ${data} is already in the queue.`
          });
        } else {
          setToast({ 
            color: '#4BB543', 
            message: `Book with ISBN ${data} added to the queue.`
          });
        }
        
        // Auto-hide toast after duration
        setTimeout(() => setToast(null), TOAST_DURATION);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'ISBN:', error);
      // Could add error toast here for network failures
    }

    // Clear cooldown after delay
    setTimeout(() => setRecentlyScanned(null), 2000);
    
    // Update local scanned list
    originalHandleBarCodeScanned({ data });
  };

  // ----------------------------------------------------------------------------
  // ERROR MONITORING
  // ----------------------------------------------------------------------------

  /**
   * Monitor backend worker for processing errors.
   * Provides user feedback when book processing fails.
   */
  useEffect(() => {
    /**
     * Check for worker processing errors and notify user.
     * Polls the backend error endpoint periodically.
     */
    const checkWorkerErrors = async (): Promise<void> => {
      try {
        const response = await fetch(`http://${API_BASE_URL}:5001/worker-errors`);
        if (response.ok) {
          const data = await response.json();
          if (data.errors && data.errors.length > 0) {
            // Show error toast for the first error
            const error = data.errors[0];
            setToast({ 
              color: '#FF3B30', 
              message: `Erreur: impossible de traiter le livre ${error.isbn}` 
            });
            setTimeout(() => setToast(null), TOAST_DURATION);
          }
        }
      } catch (error) {
        console.error('Error checking worker status:', error);
      }
    };

    // Set up periodic error checking
    const interval = setInterval(checkWorkerErrors, ERROR_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------------------------------------------
  // RENDER CONDITIONS
  // ----------------------------------------------------------------------------

  /**
   * Loading state while checking camera permissions
   */
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading camera permissions...</Text>
      </SafeAreaView>
    );
  }

  /**
   * Permission request state when camera access is denied
   */
  if (!permission.granted) {
    return <PermissionRequest onRequestPermission={requestPermission} />;
  }

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Toast Notification Overlay */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.color }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Scanner Mode - Active Camera View */}
      {isScanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13'], // Focus on book barcode format
            }}
          >
            <ScannerOverlay />
          </CameraView>
          <Text style={styles.instructionText}>
            Point camera at a book's barcode
          </Text>
        </View>
      ) : (
        /* Results Mode - Scanned Books List */
        <View style={styles.resultsContainer}>
          <ScannedBooksList scannedISBNs={scannedISBNs} />
          
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScanning}
          >
            <Text style={styles.scanButtonText}>Scan New ISBN</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 0, // Full-screen camera view
  },
  
  // Loading state
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: colors.text,
  },
  
  // Camera scanning interface
  cameraContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    aspectRatio: 3/4, // Optimized for barcode scanning
  },
  instructionText: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.medium,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Results and controls
  resultsContainer: {
    flex: 1,
    padding: spacing.medium,
  },
  scanButton: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.large,
    marginHorizontal: spacing.medium,
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
      web: {
        boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
      },
    }),
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Toast notifications
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    zIndex: 20,
    width: '90%',
    marginHorizontal: '5%',
  },
  toastText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});