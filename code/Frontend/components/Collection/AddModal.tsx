import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { getRandomEmoji } from "./emojiUtils";

const SUGGESTED_EMOJIS = [
  "📚", "📖", "🎨", "🎵", "🎬", "🎮", "🧠", "🌍", "🌟", "🔥", "❤️", "👑", "🧙‍♂️", "🧚‍♀️", "🚀"
];

export default function AddModal({
  visible,
  onClose,
  collections,
  onSelectCollection,
  onCreateCollection,
  loading,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [emoji, setEmoji] = useState(getRandomEmoji());

  useEffect(() => {
    if (!visible) {
      setShowCreate(false);
      setNewName("");
      setEmoji(getRandomEmoji());
    }
  }, [visible]);

  // Handler to randomize emoji when clicking the emoji in the input
  const handleRandomEmoji = () => setEmoji(getRandomEmoji());

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {!showCreate ? (
            <>
              <Text style={styles.header}>Select a collection</Text>
              <FlatList
                data={collections}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.collectionRow}
                    onPress={() => onSelectCollection(item)}
                  >
                    <Text style={styles.emoji}>{item.icon}</Text>
                    <Text style={styles.collectionName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No collections yet.</Text>
                }
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowCreate(true)}
              >
                <Text style={styles.addBtnText}>+ New collection</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.header}>Create new collection</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiScroll}
              >
                {SUGGESTED_EMOJIS.map((e, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setEmoji(e)}
                    style={[
                      styles.suggestedEmojiContainer,
                      emoji === e && styles.selectedEmoji,
                    ]}
                  >
                    <Text style={styles.suggestedEmoji}>{e}</Text>
                  </TouchableOpacity>
                ))}
                {/* Emoji TextInput at the end */}
                <View style={styles.emojiInputContainer}>
                  <TouchableOpacity onPress={handleRandomEmoji}>
                    <TextInput
                      style={styles.emojiInput}
                      value={emoji}
                      onChangeText={setEmoji}
                      maxLength={2}
                      autoCorrect={false}
                      autoCapitalize="none"
                      textAlign="center"
                    />
                  </TouchableOpacity>
                  <Text style={styles.emojiInputLabel}>Custom</Text>
                </View>
              </ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Collection name"
                value={newName}
                onChangeText={setNewName}
              />
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => {
                  if (!newName.trim()) {
                    Alert.alert("Please enter a name");
                    return;
                  }
                  onCreateCollection(newName.trim(), emoji);
                }}
                disabled={loading}
              >
                <Text style={styles.createBtnText}>
                  {loading ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: 320,
    maxHeight: 500,
  },
  closeBtn: { position: "absolute", top: 10, right: 10, zIndex: 2 },
  closeText: { fontSize: 22 },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  emoji: { fontSize: 24, marginRight: 12 },
  collectionName: { fontSize: 16 },
  emptyText: { color: "#888", textAlign: "center", marginVertical: 20 },
  addBtn: { marginTop: 18, alignSelf: "center" },
  addBtnText: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
  emojiScroll: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  suggestedEmojiContainer: {
    padding: 4,
    borderRadius: 8,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedEmoji: {
    borderColor: "#007AFF",
    backgroundColor: "#e6f0ff",
  },
  suggestedEmoji: {
    fontSize: 32,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  emojiInputContainer: {
    alignItems: "center",
    marginLeft: 10,
    marginRight: 2,
  },
  emojiInput: {
    fontSize: 32,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    textAlign: "center",
    padding: 0,
  },
  emojiInputLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  createBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
