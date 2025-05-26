import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors, spacing } from './styles';

interface PermissionRequestProps {
  onRequestPermission: () => void;
}

export default function PermissionRequest({ onRequestPermission }: PermissionRequestProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Camera size={60} color={colors.primary} style={styles.icon} />
        
        <Text style={styles.title}>Camera Permission Required</Text>
        
        <Text style={styles.description}>
          We need camera access to scan book barcodes. Your camera will only be
          used while the app is open and you're actively scanning.
        </Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={onRequestPermission}
        >
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
        
        <Text style={styles.privacyNote}>
          Your privacy is important to us. We don't store or share any images captured 
          during scanning.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  icon: {
    marginBottom: spacing.large,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 8,
    marginBottom: spacing.large,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.large,
  },
});