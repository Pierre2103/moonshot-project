/**
 * Add to Collection Modal Component
 * 
 * Modal interface for adding books to existing collections or creating new ones.
 * Provides intuitive collection selection with visual icons and creation workflow.
 * 
 * Key Features:
 * - Existing collections display with icons and names
 * - New collection creation with emoji picker
 * - Suggested emoji options with custom input
 * - Form validation and error handling
 * - Loading states during API operations
 * - Responsive design for various screen sizes
 * - Gesture-friendly touch targets
 * 
 * Usage Contexts:
 * - Book details screen (add current book to collection)
 * - Home screen (create first collection)
 * - Bulk operations (add multiple books)
 * 
 * Technical Notes:
 * - Modal overlay with slide animation
 * - Horizontal scroll for emoji selection
 * - Random emoji generation for quick creation
 * - Proper keyboard handling and focus management
 */

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

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Curated list of emoji suggestions for quick collection creation.
 * Covers common book categories and user preferences.
 */
const SUGGESTED_EMOJIS = [
  "📚", "📖", "🎨", "🎵", "🎬", "🎮", "🧠", "🌍", "🌟", "🔥", "❤️", "👑", "🧙‍♂️", "🧚‍♀️", "🚀"
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Collection data structure for display
 */
interface Collection {
  id: number;
  name: string;
  icon: string;
}

/**
 * Component props interface
 */
interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
  onCreateCollection: (name: string, icon: string) => void;
  loading: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AddModal({
  visible,
  onClose,
  collections,
  onSelectCollection,
  onCreateCollection,
  loading,
}: AddModalProps) {
  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  // Modal view state (selection vs creation)
  const [showCreate, setShowCreate] = useState(false);
  
  // Collection creation form state
  const [newName, setNewName] = useState("");
  const [emoji, setEmoji] = useState(getRandomEmoji());

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Reset modal state when closing.
   * Ensures clean state for next opening.
   */
  useEffect(() => {
    if (!visible) {
      setShowCreate(false);
      setNewName("");
      setEmoji(getRandomEmoji());
    }
  }, [visible]);

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Generate random emoji for collection icon.
   * Provides quick alternative when user doesn't like current selection.
   */
  const handleRandomEmoji = () => setEmoji(getRandomEmoji());

  /**
   * Handle collection creation with validation.
   * Validates input and calls parent creation handler.
   */
  const handleCreateCollection = () => {
    if (!newName.trim()) {
      Alert.alert("Please enter a name");
      return;
    }
    onCreateCollection(newName.trim(), emoji);
  };

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Render horizontal emoji selector with suggestions and custom input
   */
  const renderEmojiSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.emojiScroll}
    >
      {/* Suggested Emojis */}
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
      
      {/* Custom Emoji Input */}
      <View style={styles.emojiInputContainer}>
        <TouchableOpacity onPress={handleRandomEmoji}>
          <TextInput
            style={styles.emojiInput}
            value={emoji}
            onChangeText={setEmoji}
            maxLength={2} // Support emoji with modifiers
            autoCorrect={false}
            autoCapitalize="none"
            textAlign="center"
          />
        </TouchableOpacity>
        <Text style={styles.emojiInputLabel}>Custom</Text>
      </View>
    </ScrollView>
  );

  /**
   * Render collection selection list
   */
  const renderCollectionsList = () => (
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
  );

  /**
   * Render collection creation form
   */
  const renderCreationForm = () => (
    <>
      <Text style={styles.header}>Create new collection</Text>
      {renderEmojiSelector()}
      <TextInput
        style={styles.input}
        placeholder="Collection name"
        value={newName}
        onChangeText={setNewName}
        autoFocus // Immediately focus for better UX
      />
      <TouchableOpacity
        style={styles.createBtn}
        onPress={handleCreateCollection}
        disabled={loading}
      >
        <Text style={styles.createBtnText}>
          {loading ? "Creating..." : "Create"}
        </Text>
      </TouchableOpacity>
    </>
  );

  /**
   * Render collection selection view
   */
  const renderSelectionView = () => (
    <>
      <Text style={styles.header}>Select a collection</Text>
      {renderCollectionsList()}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowCreate(true)}
      >
        <Text style={styles.addBtnText}>+ New collection</Text>
      </TouchableOpacity>
    </>
  );

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          
          {/* Modal Content - Conditional Based on State */}
          {!showCreate ? renderSelectionView() : renderCreationForm()}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Modal container and overlay
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
  
  // Header and close controls
  closeBtn: { 
    position: "absolute", 
    top: 10, 
    right: 10, 
    zIndex: 2 
  },
  closeText: { 
    fontSize: 22 
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  
  // Collection list display
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  emoji: { 
    fontSize: 24, 
    marginRight: 12 
  },
  collectionName: { 
    fontSize: 16 
  },
  emptyText: { 
    color: "#888", 
    textAlign: "center", 
    marginVertical: 20 
  },
  
  // Action buttons
  addBtn: { 
    marginTop: 18, 
    alignSelf: "center" 
  },
  addBtnText: { 
    color: "#007AFF", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  
  // Emoji selection interface
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
  
  // Custom emoji input
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
  
  // Form controls
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
  createBtnText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16 
  },
});
