import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, FlatList, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Keyboard, Dimensions } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { API_BASE_URL } from "../../config/api";

export default function Searchbar({ cameraButton, setBlockScroll }: { cameraButton?: React.ReactNode, setBlockScroll?: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      axios.get(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`)
        .then(res => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Hide results when keyboard is dismissed
  useEffect(() => {
    const hide = Keyboard.addListener("keyboardDidHide", () => setFocused(false));
    return () => hide.remove();
  }, []);

  useEffect(() => {
    if (focused) {
      setShowResults(true);
      if (setBlockScroll) setBlockScroll(true);
    } else {
      if (setBlockScroll) setBlockScroll(false);
    }
  }, [focused, setBlockScroll]);

  // Always keep results visible until user clears or selects
  useEffect(() => {
    if (!query.trim()) setShowResults(false);
  }, [query]);

  // Hide results only when user taps outside or clears input
  const handleBlur = () => {
    setFocused(false);
    // setShowResults(false); // Do NOT hide results on blur
  };

  // Overlay width should match parent width
  const screenWidth = Dimensions.get("window").width - 40; // 20px padding each side

  return (
    <View style={{ zIndex: 10 }}>
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search books by title, author, ISBN, genre..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            hitSlop={10}
          >
            <X size={22} color="#888" />
          </TouchableOpacity>
        )}
        {cameraButton}
      </View>
      {(showResults && (query.length > 0 || loading)) && (
        <View style={[styles.resultsOverlay, { width: screenWidth }]}>
          {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
          <FlatList
            data={results}
            keyExtractor={item => item.isbn}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={item.isbn}
                style={styles.resultRow}
                onPress={() => {
                  setFocused(false);
                  setShowResults(false);
                  Keyboard.dismiss();
                  router.push({ 
                    pathname: '/(tabs)/bookdetails', 
                    params: { 
                      isbn: item.isbn
                    } 
                  });
                }}
              >
                <Image
                  source={{ uri: `${API_BASE_URL}/cover/${item.isbn}.jpg` }}
                  style={styles.cover}
                  onError={() => {
                    // Fallback to cover_url if local cover fails
                    if (item.cover_url && item.cover_url.startsWith("http")) {
                      // This will need to be handled differently since we can't change source in onError
                      // We'll need to use state management for this
                    }
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.authors}>{Array.isArray(item.authors) ? item.authors.join(", ") : item.authors}</Text>
                  {item.genres && <Text style={styles.genres}>{Array.isArray(item.genres) ? item.genres.join(", ") : item.genres}</Text>}
                </View>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 340 }}
            contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={!loading && query ? <Text style={styles.noResult}>No results.</Text> : null}
            keyboardShouldPersistTaps="handled"
            scrollEnabled
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 18,
  },
  clearBtn: {
    position: 'absolute',
    right: 56, // increased margin to avoid camera button overlap
    top: 0,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    zIndex: 2,
  },
  resultsOverlay: {
    position: 'absolute',
    top: 56,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 6,
    maxHeight: 340,
    minHeight: 0,
    zIndex: 100,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 10,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  cover: { width: 44, height: 64, borderRadius: 6, marginRight: 10, backgroundColor: "#eee" },
  coverPlaceholder: { width: 44, height: 64, borderRadius: 6, marginRight: 10, backgroundColor: "#eee" },
  title: { fontWeight: "600", fontSize: 16, color: "#222" },
  authors: { color: "#666", fontSize: 14 },
  genres: { color: "#888", fontSize: 13 },
  noResult: { color: "#888", textAlign: "center", marginTop: 16 },
});
