import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, ActionSheetIOS, Alert, Platform, Modal, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { getRandomEmoji } from '../../components/Collection/emojiUtils';
import { API_BASE_URL } from '../../config/api';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../../components/common/BackButton';

const SUGGESTED_EMOJIS = [
  "📚", "📖", "🎨", "🎵", "🎬", "🎮", "🧠", "🌍", "🌟", "🔥", "❤️", "👑", "🧙‍♂️", "🧚‍♀️", "🚀"
];

export default function Collections() {
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📚');

  const loadCollections = useCallback(async () => {
    const username = await AsyncStorage.getItem('ridizi_username');
    console.log('Collections page - Username:', username); // Debug log
    if (!username) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/collections/${username}`);
      console.log('Collections page - API response:', response.data); // Debug log
      setCollections(response.data || []);
    } catch (error) {
      console.error('Collections page - Error loading collections:', error); // Debug log
      setCollections([]);
    }
    setLoading(false);
  }, []);

  // Use useFocusEffect to reload data when page is focused
  useFocusEffect(
    useCallback(() => {
      loadCollections();
    }, [loadCollections])
  );

  // Reset modal state when opening
  useEffect(() => {
    if (showCreateModal) {
      setNewName('');
      setNewIcon(getRandomEmoji());
    }
  }, [showCreateModal]);

  useEffect(() => {
    if (!showEditModal) {
      setSelectedCollection(null);
      setNewName('');
      setNewIcon('📚');
    }
  }, [showEditModal]);

  const handleCreateCollection = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }
    
    const username = await AsyncStorage.getItem('ridizi_username');
    if (!username) return;

    try {
      await axios.post(`${API_BASE_URL}/api/collections/${username}`, {
        name: newName.trim(),
        icon: newIcon
      });
      setShowCreateModal(false);
      loadCollections(); // Reload collections after creating
    } catch (error) {
      Alert.alert('Error', 'Could not create collection');
    }
  };

  const handleEditCollection = async () => {
    if (!newName.trim() || !selectedCollection) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }
    
    const username = await AsyncStorage.getItem('ridizi_username');
    if (!username) return;

    try {
      await axios.put(`${API_BASE_URL}/api/collections/${username}/${selectedCollection.id}`, {
        name: newName.trim(),
        icon: newIcon
      });
      setShowEditModal(false);
      loadCollections(); // Reload collections after editing
    } catch (error) {
      Alert.alert('Error', 'Could not update collection');
    }
  };

  const handleDeleteCollection = async (collection: any) => {
    const username = await AsyncStorage.getItem('ridizi_username');
    if (!username) return;

    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/collections/${username}/${collection.id}`);
              loadCollections(); // Reload collections after deleting
            } catch (error) {
              Alert.alert('Error', 'Could not delete collection');
            }
          }
        }
      ]
    );
  };

  const handleLongPress = (collection: any) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Collection', 'Delete Collection'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setSelectedCollection(collection);
            setNewName(collection.name);
            setNewIcon(collection.icon);
            setShowEditModal(true);
          } else if (buttonIndex === 2) {
            handleDeleteCollection(collection);
          }
        }
      );
    } else {
      Alert.alert(
        'Collection Options',
        collection.name,
        [
          { text: 'Edit', onPress: () => {
            setSelectedCollection(collection);
            setNewName(collection.name);
            setNewIcon(collection.icon);
            setShowEditModal(true);
          }},
          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCollection(collection) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleRandomEmoji = () => setNewIcon(getRandomEmoji());

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
        <Text style={styles.title}>Collections</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Plus size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : collections.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: "#888" }}>No collections yet. Create your first one!</Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={item => `collection-${item.id}`}
          contentContainerStyle={{ paddingBottom: 200, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.collectionItem}
              onPress={() => router.push({
                pathname: '/(tabs)/collectiondetails',
                params: { 
                  collectionId: item.id, 
                  collectionName: item.name
                }
              })}
              onLongPress={() => handleLongPress(item)}
              delayLongPress={350}
            >
              <Text style={styles.collectionIcon}>{item.icon}</Text>
              <Text style={styles.collectionName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create Collection Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.header}>Create new collection</Text>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiScroll}
            >
              {SUGGESTED_EMOJIS.map((e, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setNewIcon(e)}
                  style={[
                    styles.suggestedEmojiContainer,
                    newIcon === e && styles.selectedEmoji,
                  ]}
                >
                  <Text style={styles.suggestedEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.emojiInputContainer}>
                <TouchableOpacity onPress={handleRandomEmoji}>
                  <TextInput
                    style={styles.emojiInput}
                    value={newIcon}
                    onChangeText={setNewIcon}
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
              autoFocus
            />
            
            <TouchableOpacity style={styles.createBtn} onPress={handleCreateCollection}>
              <Text style={styles.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Collection Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowEditModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.header}>Edit collection</Text>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiScroll}
            >
              {SUGGESTED_EMOJIS.map((e, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setNewIcon(e)}
                  style={[
                    styles.suggestedEmojiContainer,
                    newIcon === e && styles.selectedEmoji,
                  ]}
                >
                  <Text style={styles.suggestedEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.emojiInputContainer}>
                <TouchableOpacity onPress={handleRandomEmoji}>
                  <TextInput
                    style={styles.emojiInput}
                    value={newIcon}
                    onChangeText={setNewIcon}
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
              autoFocus
            />
            
            <TouchableOpacity style={styles.createBtn} onPress={handleEditCollection}>
              <Text style={styles.createBtnText}>Save</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  collectionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  collectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    flex: 1,
  },
  // Modal styles matching AddModal
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
