import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { List, Grid2X2, Grid3X3, ArrowLeft } from "lucide-react-native";

const API_BASE_URL = "http://192.168.14.162:5001";
const LAYOUT_KEY = "collection_layout_preference";

export default function CollectionDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const collectionId = params.collectionId;
  const collectionName = params.collectionName as string;
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<"list" | "grid2" | "grid3">("grid2");

  useEffect(() => {
    AsyncStorage.getItem(LAYOUT_KEY).then(val => {
      if (val === "list" || val === "grid2" || val === "grid3") setLayout(val);
    });
  }, []);

  useEffect(() => {
    if (!collectionId) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/collections/${collectionId}/books`)
      .then(res => setBooks(res.data))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [collectionId]);

  const handleLayoutChange = (newLayout: "list" | "grid2" | "grid3") => {
    setLayout(newLayout);
    AsyncStorage.setItem(LAYOUT_KEY, newLayout);
  };

  const numColumns = layout === "list" ? 1 : layout === "grid2" ? 2 : 3;
  const itemWidth = () => {
    const screenWidth = Dimensions.get("window").width - 40;
    if (layout === "list") return screenWidth;
    if (layout === "grid2") return (screenWidth - 16) / 2;
    return (screenWidth - 24) / 3;
  };

  return (
    <View style={styles.container}>
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
      {/* Title and layout buttons */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{collectionName || "Collection"}</Text>
        <View style={styles.layoutBtns}>
          <TouchableOpacity onPress={() => handleLayoutChange("list")}>
            <List color={layout === "list" ? "#007AFF" : "#888"} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLayoutChange("grid2")}>
            <Grid2X2 color={layout === "grid2" ? "#007AFF" : "#888"} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLayoutChange("grid3")}>
            <Grid3X3 color={layout === "grid3" ? "#007AFF" : "#888"} size={24} />
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : books.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: "#888" }}>No books in this collection.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          key={layout + numColumns}
          numColumns={numColumns}
          keyExtractor={item => item.isbn}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.bookItem,
                { width: itemWidth() },
                layout === "list" && { flexDirection: "row", alignItems: "center" }
              ]}
              onPress={() => router.push({ pathname: '/(tabs)/bookdetails', params: { isbn: item.isbn } })}
            >
              <Image
                source={{ uri: item.cover_url?.startsWith("http") ? item.cover_url : `${API_BASE_URL}${item.cover_url}` }}
                style={layout === "list" ? styles.bookImageList : styles.bookImageGrid}
                resizeMode="cover"
              />
              <View style={layout === "list" ? styles.bookInfoList : styles.bookInfoGrid}>
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
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 48 },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 180,
    height: 70,
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
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "bold", flex: 1, textAlign: "center" },
  layoutBtns: { flexDirection: "row", gap: 8, marginLeft: 8 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  bookItem: {
    marginBottom: 18,
    marginHorizontal: 4,
    backgroundColor: "#f8f8fa",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  bookImageGrid: {
    width: 90,
    height: 130,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#eee",
  },
  bookImageList: {
    width: 70,
    height: 100,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: "#eee",
  },
  bookInfoGrid: { alignItems: "center" },
  bookInfoList: { flex: 1, justifyContent: "center" },
  bookTitle: { fontSize: 15, fontWeight: "600", color: "#222", textAlign: "center" },
  bookAuthors: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 2 },
});
