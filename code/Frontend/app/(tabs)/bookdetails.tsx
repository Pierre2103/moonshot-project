import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Heart, Plus, ArrowLeft } from 'lucide-react-native';

const API_BASE_URL = 'http://192.168.14.162:5001';

export default function BookDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isbn = params.isbn as string;
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isbn) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/book/${isbn}`)
      .then(res => res.json())
      .then(data => {
        setBook(data);
      })
      .catch((err) => {
        setBook(null);
      })
      .finally(() => setLoading(false));
  }, [isbn]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!book || book.error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Book not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
          <Text style={styles.goBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Go Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={22} color="#007AFF" />
        <Text style={styles.backButtonText}>Go back</Text>
      </TouchableOpacity>

      {/* Cover */}
      {book.cover_url && (
        <Image
          source={{ uri: book.cover_url.startsWith('http') ? book.cover_url : `${API_BASE_URL}${book.cover_url}` }}
          style={styles.cover}
          resizeMode="cover"
        />
      )}

      {/* Add to collection & Like */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Plus size={22} color="#007AFF" />
          <Text style={styles.actionText}>Add to collection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Heart size={22} color="#007AFF" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      {book.title && (
        <Text style={styles.title}>{book.title}</Text>
      )}

      {/* Authors */}
      {book.authors && (
        <Text style={styles.authors}>{Array.isArray(book.authors) ? book.authors.join(', ') : book.authors}</Text>
      )}

      {/* Description */}
      {book.description && (
        <Text style={styles.description}>{book.description}</Text>
      )}

      {/* Genres */}
      {book.genres && Array.isArray(book.genres) && book.genres.length > 0 && (
        <View style={styles.genresRow}>
          {book.genres.map((genre: string, idx: number) => (
            <View key={idx} style={styles.genreChip}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Publisher, Page Number, Date, ISBN */}
      <View style={styles.infoRow}>
        {book.publisher && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Publisher</Text>
            <Text style={styles.infoValue}>{book.publisher}</Text>
          </View>
        )}
        {book.pages && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Pages</Text>
            <Text style={styles.infoValue}>{book.pages}</Text>
          </View>
        )}
        {book.publication_date && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Published</Text>
            <Text style={styles.infoValue}>{book.publication_date}</Text>
          </View>
        )}
        {book.isbn && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ISBN</Text>
            <Text style={styles.infoValue}>{book.isbn}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 64, // margin from notch
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: 2,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  cover: {
    width: 180,
    height: 270,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f7fa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
  },
  actionText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  authors: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#444',
    marginBottom: 14,
    textAlign: 'center',
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  genreChip: {
    backgroundColor: '#e6eaff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    margin: 2,
  },
  genreText: {
    color: '#3a4ba0',
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  infoBox: {
    backgroundColor: '#f4f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 2,
    alignItems: 'center',
    minWidth: 90,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#c00',
    fontSize: 18,
    marginBottom: 18,
  },
  goBackBtn: {
    backgroundColor: '#f4f7fa',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  goBackText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
