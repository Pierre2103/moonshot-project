/**
 * Camera Permission Request Component
 * 
 * User-friendly interface for requesting camera permissions required for barcode scanning.
 * Provides clear explanation of permission usage and privacy considerations.
 * 
 * Key Features:
 * - Clear permission rationale with privacy explanation
 * - Accessible design with proper contrast and typography
 * - Visual camera icon for immediate context
 * - Privacy-focused messaging to build user trust
 * - Single-action permission request flow
 * - Responsive layout for various screen sizes
 * 
 * Design Principles:
 * - Transparency about data usage
 * - Clear call-to-action
 * - Professional and trustworthy appearance
 * - Accessibility-compliant text sizing
 * 
 * Technical Notes:
 * - Uses SafeAreaView for proper device spacing
 * - Integrates with Expo Camera permission system
 * - Follows platform-specific permission patterns
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors, spacing } from './styles';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props interface for PermissionRequest component
 */
interface PermissionRequestProps {
  /** Callback function to trigger camera permission request */
  onRequestPermission: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Camera Permission Request Component
 * 
 * Renders an informative permission request screen that explains why camera
 * access is needed and provides assurance about privacy protection.
 * 
 * @param {PermissionRequestProps} props - Component configuration
 * @returns {JSX.Element} Permission request interface
 * 
 * @example
 * ```tsx
 * <PermissionRequest 
 *   onRequestPermission={() => requestCameraPermission()} 
 * />
 * ```
 */
export default function PermissionRequest({ onRequestPermission }: PermissionRequestProps) {
  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Handle permission request button press.
   * Triggers the camera permission request flow.
   */
  const handleRequestPress = (): void => {
    onRequestPermission();
  };

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Visual Camera Icon */}
        <Camera size={60} color={colors.primary} style={styles.icon} />
        
        {/* Permission Request Title */}
        <Text style={styles.title}>Camera Permission Required</Text>
        
        {/* Detailed Explanation */}
        <Text style={styles.description}>
          We need camera access to scan book barcodes. Your camera will only be
          used while the app is open and you're actively scanning.
        </Text>
        
        {/* Primary Action Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRequestPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
        
        {/* Privacy Assurance */}
        <Text style={styles.privacyNote}>
          Your privacy is important to us. We don't store or share any images captured 
          during scanning.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main container with safe area handling
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Content layout and spacing
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  
  // Visual elements
  icon: {
    marginBottom: spacing.large,
  },
  
  // Typography hierarchy
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24, // Improved readability
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  
  // Interactive elements
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 8,
    marginBottom: spacing.large,
    // Minimum touch target size for accessibility
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Privacy and legal text
  privacyNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.large,
    lineHeight: 18, // Improved readability for small text
  },
});