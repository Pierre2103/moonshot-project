import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { Book } from 'lucide-react-native';

import ScannerOverlay from './ScannerOverlay';
import ScannedBooksList from './ScannedBooksList';
import PermissionRequest from './PermissionRequest';
import { useScanner } from './hooks/useScanner';
import { colors, spacing } from './styles';

const TOAST_DURATION = 2000;

export default function ISBNScanner() {
  const { 
    permission,
    requestPermission,
    isScanning,
    scannedISBNs,
    startScanning,
    handleBarCodeScanned: originalHandleBarCodeScanned,
  } = useScanner();

  const [toast, setToast] = useState<{ color: string; message: string } | null>(null);
  const [recentlyScanned, setRecentlyScanned] = useState<string | null>(null);

  const handleBarCodeScanned = async ({ data }) => {
    if (scannedISBNs.includes(data) || recentlyScanned === data) {
      return;
    }
    setRecentlyScanned(data);

    try {
      const response = await fetch('http://192.168.14.162:5001/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn: data }),
      });

      if (response.ok) {
        const res = await response.json();
        // Gestion des cas de réponse
        if (res.already_in_dataset) {
          setToast({ color: '#FF3B30', message: `livre ${data} déjà présent dans le dataset.` });
        } else if (res.already_in_queue) {
          setToast({ color: '#FFA500', message: `livre ${data} déjà dans la liste d'attente` });
        } else {
          setToast({ color: '#4BB543', message: `livre ${data} ajouté a la liste d'attente` });
        }
        setTimeout(() => setToast(null), TOAST_DURATION);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'ISBN:', error);
    }

    setTimeout(() => setRecentlyScanned(null), 2000);
    originalHandleBarCodeScanned({ data });
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return <PermissionRequest onRequestPermission={requestPermission} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.color }]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {isScanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13'],
            }}
          >
            <ScannerOverlay />
          </CameraView>
          <Text style={styles.instructionText}>
            Point camera at a book's barcode
          </Text>
        </View>
      ) : (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 0, // Remove padding
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.small,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: colors.text,
  },
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
    aspectRatio: 3/4, // or 9/16 for portrait, adjust as needed
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