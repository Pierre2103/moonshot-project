import React from 'react';
import { View, StyleSheet } from 'react-native';
import ISBNScanner from '@/components/ISBNScanner/ISBNScanner';

export default function ISBNScannerTab() {
  return (
    <View style={styles.container}>
      <ISBNScanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});