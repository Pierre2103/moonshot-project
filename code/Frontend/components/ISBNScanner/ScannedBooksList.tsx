/**
 * Scanned Books List Component
 * 
 * Displays a chronological list of scanned ISBN codes with timestamps.
 * Provides visual feedback for scanning progress and history tracking.
 * 
 * Key Features:
 * - Chronological display of scanned ISBNs
 * - Human-readable timestamp formatting
 * - Empty state with helpful onboarding
 * - Card-based layout for clear separation
 * - Platform-specific shadow effects
 * - Responsive design for various screen sizes
 * - Scroll handling for long lists
 * 
 * Use Cases:
 * - Review recently scanned books
 * - Verify scan accuracy before submission
 * - Track scanning session progress
 * - Debugging and quality assurance
 * 
 * Technical Notes:
 * - Uses FlatList for performance with large datasets
 * - Implements platform-specific styling
 * - Formats timestamps for user readability
 * - Handles empty states gracefully
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from './styles';
import { ScannedISBN } from './types';
import { formatTimestamp } from './utils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props interface for ScannedBooksList component
 */
interface ScannedBooksListProps {
  /** Array of scanned ISBN objects with metadata */
  scannedISBNs: ScannedISBN[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Scanned Books List Component
 * 
 * Renders a list of scanned ISBN codes with timestamps, or shows an empty
 * state with onboarding instructions for new users.
 * 
 * @param {ScannedBooksListProps} props - Component configuration
 * @returns {JSX.Element} Scanned books list or empty state
 * 
 * @example
 * ```tsx
 * <ScannedBooksList 
 *   scannedISBNs={[
 *     { id: '1', code: '9781234567890', timestamp: new Date() }
 *   ]} 
 * />
 * ```
 */
export default function ScannedBooksList({ scannedISBNs }: ScannedBooksListProps) {
  // ----------------------------------------------------------------------------
  // EMPTY STATE HANDLING
  // ----------------------------------------------------------------------------

  /**
   * Render empty state with onboarding instructions.
   * Provides clear guidance for first-time users.
   */
  if (scannedISBNs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No ISBNs scanned yet</Text>
        <Text style={styles.emptySubText}>
          Scan a book's barcode to add it to your list
        </Text>
      </View>
    );
  }

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Render individual ISBN card item.
   * Displays ISBN code and formatted timestamp.
   */
  const renderISBNItem = ({ item }: { item: ScannedISBN }) => (
    <View style={styles.isbnCard}>
      <View style={styles.isbnInfo}>
        <Text style={styles.isbnText}>{item.code}</Text>
        <Text style={styles.timestampText}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.title}>Scanned ISBNs</Text>
      
      {/* ISBN List */}
      <FlatList
        data={scannedISBNs}
        keyExtractor={(item) => item.id}
        renderItem={renderISBNItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Performance optimization
        maxToRenderPerBatch={10} // Optimize for large lists
        windowSize={10} // Memory management
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
  },
  
  // Section header
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.medium,
    color: colors.text,
  },
  
  // Empty state styling
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20, // Improved readability
  },
  
  // List styling
  listContent: {
    paddingBottom: spacing.large,
  },
  
  // ISBN card styling
  isbnCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    // Platform-specific shadow effects
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  
  // ISBN information layout
  isbnInfo: {
    flex: 1,
  },
  isbnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xsmall,
    letterSpacing: 0.5, // Improved readability for numbers
  },
  timestampText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});