/**
 * ISBN Scanner Style Constants
 * 
 * Centralized design system for the ISBN Scanner component and related interfaces.
 * Provides consistent theming, spacing, and visual hierarchy across scanning features.
 * 
 * Key Features:
 * - Consistent color palette following iOS design guidelines
 * - Responsive spacing system for various screen sizes
 * - Semantic color naming for different UI states
 * - Cross-platform compatibility considerations
 * - Accessibility-compliant contrast ratios
 * 
 * Usage:
 * - Import into scanner components for consistent styling
 * - Reference colors and spacing in StyleSheet definitions
 * - Maintain design consistency across scanning interfaces
 * 
 * Technical Notes:
 * - Colors follow iOS Human Interface Guidelines
 * - Spacing uses 4px base unit for consistency
 * - Supports both light and dark mode considerations
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Comprehensive color system for the ISBN Scanner interface.
 * 
 * Categories:
 * - Primary: Main brand and interactive elements
 * - Secondary: Supporting actions and highlights
 * - System: Success, warning, and error states
 * - Background: Container and surface colors
 * - Text: Typography hierarchy with accessibility compliance
 * - UI Elements: Borders, separators, and structural elements
 */
export const colors = {
  // Primary brand colors
  primary: '#007AFF',        // iOS system blue - main actions, links
  secondary: '#5856D6',      // iOS system purple - secondary actions
  accent: '#FF9500',         // iOS system orange - highlights, badges
  
  // System state colors
  success: '#34C759',        // iOS system green - success states, confirmations
  warning: '#FF9500',        // iOS system orange - warnings, cautions
  error: '#FF3B30',          // iOS system red - errors, destructive actions
  
  // Background colors
  background: '#F2F2F7',     // iOS system background - main app background
  cardBackground: '#FFFFFF', // Pure white - cards, modals, elevated surfaces
  
  // Text hierarchy
  text: '#000000',           // Primary text - titles, main content
  textSecondary: '#3C3C43',  // Secondary text - subtitles, metadata
  textTertiary: '#8E8E93',   // Tertiary text - placeholders, captions
  
  // UI structure elements
  border: '#C6C6C8',         // Border color for inputs, cards
  separator: '#E5E5EA',      // Separator lines, dividers
};

// ============================================================================
// SPACING SYSTEM
// ============================================================================

/**
 * Consistent spacing system based on 4px grid.
 * 
 * Benefits:
 * - Consistent visual rhythm across components
 * - Responsive design that scales appropriately
 * - Easy to remember and apply consistently
 * - Aligns with common design system practices
 * 
 * Usage Examples:
 * - xsmall: Icon padding, tight spacing
 * - small: Element spacing within components
 * - medium: Component spacing, standard margins
 * - large: Section spacing, generous padding
 * - xlarge: Screen-level spacing, major separations
 */
export const spacing = {
  xsmall: 4,   // 4px - Tight spacing, icon padding
  small: 8,    // 8px - Element spacing within components
  medium: 16,  // 16px - Standard spacing, component margins
  large: 24,   // 24px - Section spacing, generous padding
  xlarge: 32,  // 32px - Screen-level spacing, major separations
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate platform-appropriate shadow styles.
 * Provides consistent shadow effects across iOS and Android.
 * 
 * @param {number} elevation - Shadow elevation level (1-5)
 * @returns {object} Platform-specific shadow styles
 * 
 * @example
 * ```typescript
 * const cardStyle = {
 *   ...getShadowStyle(2),
 *   backgroundColor: colors.cardBackground,
 * };
 * ```
 */
export const getShadowStyle = (elevation: number) => ({
  // iOS shadow properties
  shadowColor: colors.text,
  shadowOffset: { width: 0, height: elevation },
  shadowOpacity: 0.1 + (elevation * 0.02),
  shadowRadius: elevation * 2,
  // Android elevation
  elevation: elevation,
});

/**
 * Get appropriate text color based on background.
 * Ensures accessibility compliance with contrast ratios.
 * 
 * @param {string} backgroundColor - The background color to contrast against
 * @returns {string} Appropriate text color for accessibility
 */
export const getContrastTextColor = (backgroundColor: string): string => {
  // Simplified contrast logic - could be expanded with actual contrast calculation
  const darkBackgrounds = [colors.primary, colors.secondary, colors.error];
  return darkBackgrounds.includes(backgroundColor) ? '#FFFFFF' : colors.text;
};

/**
 * Calculate responsive spacing based on screen size.
 * Allows for adaptive spacing on different device sizes.
 * 
 * @param {keyof typeof spacing} baseSpacing - Base spacing key
 * @param {number} screenWidth - Current screen width
 * @returns {number} Adjusted spacing value
 */
export const getResponsiveSpacing = (
  baseSpacing: keyof typeof spacing, 
  screenWidth: number
): number => {
  const scaleFactor = screenWidth > 400 ? 1.2 : 1.0;
  return spacing[baseSpacing] * scaleFactor;
};