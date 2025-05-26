import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import ISBNScanner from '@/components/ISBNScanner/ISBNScanner';

export default function ISBNScannerTab() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Fixed logo at the top */}
      <View style={styles.fixedLogoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      {/* Go back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Go back</Text>
      </TouchableOpacity>
      {/* ISBNScanner fills the rest */}
      <View style={styles.scannerContainer}>
        <ISBNScanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 64,
    paddingHorizontal: 0,
  },
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
  scannerContainer: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 0,
    marginTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});