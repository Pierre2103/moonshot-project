/**
 * Back Button Component
 * 
 * Reusable navigation component for consistent back button behavior across screens.
 * Provides standardized styling and intuitive navigation patterns.
 * 
 * Key Features:
 * - Consistent visual design with app branding
 * - Customizable styling through props
 * - Automatic router-based navigation
 * - Touch-friendly target size for accessibility
 * - Icon and text combination for clarity
 * 
 * Usage:
 * - Detail screens (book details, collection details)
 * - Modal overlays and secondary screens
 * - Settings and configuration pages
 * - Any screen requiring back navigation
 * 
 * Design Notes:
 * - Uses Lucide React Native icons for consistency
 * - Follows iOS/Android native navigation patterns
 * - Accessible touch targets (44pt minimum)
 * - Brand color integration (#007AFF)
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props interface for BackButton component
 */
interface BackButtonProps {
  /** Custom styles to override default button container styles */
  customStyle?: any;
  /** Custom styles to override default text styles */
  textStyle?: any;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Back Button Component
 * 
 * Renders a consistent back navigation button with icon and text.
 * Automatically handles navigation using Expo Router's back function.
 * 
 * @param {BackButtonProps} props - Component configuration
 * @returns {JSX.Element} Rendered back button component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <BackButton />
 * 
 * // With custom styling
 * <BackButton 
 *   customStyle={{ marginTop: 20 }}
 *   textStyle={{ fontSize: 18 }}
 * />
 * ```
 */
export default function BackButton({ customStyle, textStyle }: BackButtonProps) {
  // ----------------------------------------------------------------------------
  // NAVIGATION SETUP
  // ----------------------------------------------------------------------------
  
  const router = useRouter();

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Handle back navigation when button is pressed.
   * Uses Expo Router's back function for proper navigation stack management.
   */
  const handleBackPress = () => {
    router.back();
  };

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <TouchableOpacity 
      style={[styles.backButton, customStyle]} 
      onPress={handleBackPress}
      activeOpacity={0.7} // Visual feedback on press
    >
      {/* Back Arrow Icon */}
      <ArrowLeft size={22} color="#007AFF" />
      
      {/* Back Button Text */}
      <Text style={[styles.backButtonText, textStyle]}>
        Go back
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Button container
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // Align to left side
    marginBottom: 16,
    marginTop: 2,
    paddingVertical: 8, // Increase touch target
    paddingHorizontal: 4,
  },
  
  // Button text styling
  backButtonText: {
    color: '#007AFF', // iOS system blue for consistency
    fontSize: 16,
    marginLeft: 6, // Spacing between icon and text
    fontWeight: '500', // Medium weight for readability
  },
});
