import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, ActionSheetIOS, Alert, Platform, Modal } from "react-native";
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
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LAYOUT_KEY).then(val => {
      if (val === "list" || val === "grid2" || val === "grid3") setLayout(val);
    });
  }, []);

  // Helper to reload books
  const reloadBooks = useCallback(() => {
    if (!collectionId) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/collections/${collectionId}/books`)
      .then(res => setBooks(res.data))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [collectionId]);

  useEffect(() => {
    reloadBooks();
  }, [reloadBooks]);

  // Fetch collections for move modal
  useEffect(() => {
    if (!showMoveModal) return;
    AsyncStorage.getItem('ridizi_username').then(username => {
      if (!username) return;
      axios.get(`${API_BASE_URL}/api/collections/${username}`)
        .then(res => setCollections(res.data.filter((c: any) => c.id != collectionId)))
        .catch(() => setCollections([]));
    });
  }, [showMoveModal, collectionId]);

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

  // Remove book from collection
  const handleRemove = async (book: any) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/collections/${collectionId}/books/${book.isbn}`);
      reloadBooks();
    } catch {
      Alert.alert("Error", "Could not remove book.");
      setLoading(false);
    }
  };

  // Move book to another collection
  const handleMove = async (targetCollectionId: number) => {
    if (!selectedBook) return;
    setMoving(true);
    try {
      const username = await AsyncStorage.getItem('ridizi_username');
      if (!username) throw new Error("No username found");
      await axios.post(`${API_BASE_URL}/api/collections/${username}/${targetCollectionId}/add`, { isbn: selectedBook.isbn });
      await axios.delete(`${API_BASE_URL}/api/collections/${collectionId}/books/${selectedBook.isbn}`);
      setShowMoveModal(false);
      setSelectedBook(null);
      reloadBooks();
    } catch {
      Alert.alert("Error", "Could not move book.");
    }
    setMoving(false);
  };

  // Show action sheet on long press
  const handleLongPress = (book: any) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Move to another collection", "Remove from this collection"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setSelectedBook(book);
            setShowMoveModal(true);
          } else if (buttonIndex === 2) {
            handleRemove(book);
          }
        }
      );
    } else {
      Alert.alert(
        "Book actions",
        book.title,
        [
          { text: "Move to another collection", onPress: () => { setSelectedBook(book); setShowMoveModal(true); } },
          { text: "Remove from this collection", style: "destructive", onPress: () => handleRemove(book) },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
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
              onLongPress={() => handleLongPress(item)}
              delayLongPress={350}
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

      {/* Move Modal */}
      <Modal visible={showMoveModal} transparent animationType="slide" onRequestClose={() => setShowMoveModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, width: 320 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>Move to collection</Text>
            {collections.length === 0 ? (
              <Text style={{ color: "#888" }}>No other collections available.</Text>
            ) : (
              collections.map((col: any) => (
                <TouchableOpacity
                  key={col.id}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}
                  onPress={() => handleMove(col.id)}
                  disabled={moving}
                >
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{col.icon}</Text>
                  <Text style={{ fontSize: 16 }}>{col.name}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={{ marginTop: 18, alignSelf: "center" }} onPress={() => setShowMoveModal(false)}>
              <Text style={{ color: "#007AFF", fontSize: 16, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 20,
    paddingTop: 64, // margin from notch
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
