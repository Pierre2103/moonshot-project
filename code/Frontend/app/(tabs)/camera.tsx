import React from 'react';
import { View, StyleSheet } from 'react-native';
import CameraScreen from '@/components/CameraScreen/CameraScreen';

export default function CameraTab() {
  return (
    <View style={styles.container}>
      <CameraScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});