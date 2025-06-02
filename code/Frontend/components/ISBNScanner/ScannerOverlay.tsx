/**
 * Scanner Overlay Component
 * 
 * Visual overlay for camera barcode scanning with animated targeting system.
 * Provides user guidance and visual feedback during scanning operations.
 * 
 * Key Features:
 * - Focused scanning area with darkened surroundings
 * - Corner indicators for targeting guidance
 * - Animated scanning line for visual feedback
 * - Responsive design adapting to screen dimensions
 * - Smooth looping animation with proper cleanup
 * - Professional scanning interface appearance
 * 
 * Design Elements:
 * - Semi-transparent overlay for focus
 * - Corner brackets for targeting area
 * - Animated scanning line for active feedback
 * - Consistent branding with app colors
 * 
 * Technical Notes:
 * - Uses React Native Animated API for performance
 * - Automatically cleans up animations on unmount
 * - Responsive to device screen dimensions
 * - Optimized animation timing for user experience
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from './styles';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Screen dimensions for responsive layout calculations
 */
const { width } = Dimensions.get('window');

/**
 * Height of the focused scanning area
 */
const FOCUS_HEIGHT = 200;

/**
 * Width of the focused scanning area (80% of screen width)
 */
const FOCUS_WIDTH = width * 0.8;

/**
 * Animation timing configuration
 */
const ANIMATION_DURATION = 1500; // Duration for each direction of scan line
const CORNER_SIZE = 20; // Size of corner indicator brackets
const CORNER_THICKNESS = 3; // Thickness of corner brackets

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Scanner Overlay Component
 * 
 * Renders a camera overlay with a focused scanning area and animated
 * scanning line to guide users during barcode scanning.
 * 
 * @returns {JSX.Element} Scanner overlay with animations
 * 
 * @example
 * ```tsx
 * <CameraView>
 *   <ScannerOverlay />
 * </CameraView>
 * ```
 */
export default function ScannerOverlay() {
  // ----------------------------------------------------------------------------
  // ANIMATION SETUP
  // ----------------------------------------------------------------------------

  /**
   * Animated value for scanner line position (0 to 1)
   */
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Initialize animation on component mount and cleanup on unmount.
   */
  useEffect(() => {
    startAnimation();
    
    // Cleanup animation to prevent memory leaks
    return () => {
      animatedValue.stopAnimation();
    };
  }, [animatedValue]);

  // ----------------------------------------------------------------------------
  // ANIMATION FUNCTIONS
  // ----------------------------------------------------------------------------

  /**
   * Start the continuous scanning line animation.
   * Creates a smooth loop that moves the scan line up and down.
   */
  const startAnimation = (): void => {
    // Reset animation value to starting position
    animatedValue.setValue(0);
    
    // Create smooth, continuous animation loop
    Animated.loop(
      Animated.sequence([
        // Move line from top to bottom
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: false, // Required for transform properties
        }),
        // Move line from bottom to top
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // ----------------------------------------------------------------------------
  // ANIMATION INTERPOLATION
  // ----------------------------------------------------------------------------

  /**
   * Map animated value (0-1) to actual pixel position within scan area.
   */
  const linePosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FOCUS_HEIGHT], // Move within the focus area height
  });

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.overlay}>
      {/* Top darkened area */}
      <View style={styles.unfocusedArea} />
      
      {/* Middle row with focused scanning area */}
      <View style={styles.middleRow}>
        {/* Left darkened area */}
        <View style={styles.unfocusedArea} />
        
        {/* Focused scanning area with indicators */}
        <View style={styles.focusedArea}>
          {/* Corner Targeting Indicators */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          {/* Animated Scanning Line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: linePosition }],
              },
            ]}
          />
        </View>
        
        {/* Right darkened area */}
        <View style={styles.unfocusedArea} />
      </View>
      
      {/* Bottom darkened area */}
      <View style={styles.unfocusedArea} />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main overlay container
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Darkened areas outside focus zone
  unfocusedArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent dark overlay
  },
  
  // Middle row containing the focus area
  middleRow: {
    flexDirection: 'row',
    height: FOCUS_HEIGHT,
  },
  
  // Clear scanning area
  focusedArea: {
    width: FOCUS_WIDTH,
    height: FOCUS_HEIGHT,
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden', // Contain the scanning line
  },
  
  // Base corner indicator style
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  
  // Corner positioning and styling
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  
  // Animated scanning line
  scanLine: {
    position: 'absolute',
    width: FOCUS_WIDTH,
    height: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    // Add subtle glow effect
    elevation: 2,
  },
});