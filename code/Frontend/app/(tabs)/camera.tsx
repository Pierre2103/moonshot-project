/**
 * Camera Tab Wrapper Component
 * 
 * Simple wrapper that renders the main CameraScreen component.
 * This follows the tab navigation structure and provides clean
 * separation between navigation and camera functionality.
 * 
 * The actual camera logic is implemented in the CameraScreen component
 * which handles image capture, barcode scanning, and book matching.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import CameraScreen from '@/components/CameraScreen/CameraScreen';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CameraTab() {
  return (
    <View style={styles.container}>
      {/* Main camera functionality component */}
      <CameraScreen />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1, // Fill entire tab screen
    backgroundColor: '#000', // Black background for camera
  },
});