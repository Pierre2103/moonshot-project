import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { API_BASE_URL } from "../../config/api";
import BackButton from "../../components/common/BackButton";
import { useFocusEffect } from "@react-navigation/native";

export default function ScanHistory() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  const loadScanHistory = useCallback(async () => {
    const username = await AsyncStorage.getItem('ridizi_username');
    if (!username) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recently_scanned/${username}`);
      setBooks(response.data);
    } catch (error) {
      setBooks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadScanHistory();
  }, [loadScanHistory]);

  useFocusEffect(
    useCallback(() => {
      loadScanHistory();
    }, [loadScanHistory])
  );

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your entire scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const username = await AsyncStorage.getItem('ridizi_username');
            if (!username) return;
            
            try {
              await axios.delete(`${API_BASE_URL}/api/user_scans/${username}`);
              setBooks([]);
            } catch (error) {
              Alert.alert('Error', 'Could not clear history');
            }
          }
        }
      ]
    );
  };

  const handleImageError = (isbn: string) => {
    setImageErrors(prev => ({ ...prev, [isbn]: true }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <BackButton />

      <View style={styles.headerRow}>
        <Text style={styles.title}>Scan History</Text>
        {books.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Trash2 size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: "#888" }}>No books scanned yet.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item, index) => `scan-${item.isbn}-${index}`}
          contentContainerStyle={{ paddingBottom: 200, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookItem}
              onPress={() => router.push({ pathname: '/(tabs)/bookdetails', params: { isbn: item.isbn } })}
            >
              <Image
                source={{ 
                  uri: imageErrors[item.isbn] && item.cover_url && item.cover_url.trim() && item.cover_url.startsWith("http")
                    ? item.cover_url 
                    : `${API_BASE_URL}/cover/${item.isbn}.jpg`
                }}
                style={styles.bookImage}
                resizeMode="cover"
                onError={() => handleImageError(item.isbn)}
              />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                {item.authors && (
                  <Text style={styles.bookAuthors} numberOfLines={1}>
                    {Array.isArray(item.authors) ? item.authors.join(", ") : item.authors}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 20,
    paddingTop: 64,
    backgroundColor: '#fff',
    flexGrow: 1,
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
  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12, 
    justifyContent: "space-between" 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    flex: 1, 
    textAlign: "center" 
  },
  centered: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingTop: 80 
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f8f8fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bookImage: {
    width: 70,
    height: 100,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: "#eee",
  },
  bookInfo: { 
    flex: 1, 
    justifyContent: "center" 
  },
  bookTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#222" 
  },
  bookAuthors: { 
    fontSize: 14, 
    color: "#666", 
    marginTop: 4 
  },
});
