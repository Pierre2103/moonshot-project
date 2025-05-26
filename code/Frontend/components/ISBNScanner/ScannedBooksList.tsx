import React from 'react';
import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';
import { colors, spacing } from './styles';
import { ScannedISBN } from './types';
import { formatTimestamp } from './utils';

interface ScannedBooksListProps {
  scannedISBNs: ScannedISBN[];
}

export default function ScannedBooksList({ scannedISBNs }: ScannedBooksListProps) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanned ISBNs</Text>
      
      <FlatList
        data={scannedISBNs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.isbnCard}>
            <View style={styles.isbnInfo}>
              <Text style={styles.isbnText}>{item.code}</Text>
              <Text style={styles.timestampText}>
                {formatTimestamp(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.medium,
    color: colors.text,
  },
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
  },
  listContent: {
    paddingBottom: spacing.large,
  },
  isbnCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
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
  isbnInfo: {
    flex: 1,
  },
  isbnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xsmall,
  },
  timestampText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});