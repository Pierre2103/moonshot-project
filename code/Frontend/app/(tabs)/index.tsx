import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [username, setUsername] = useState<string>('');
  const [inputUsername, setInputUsername] = useState<string>('');
  const [checkingUser, setCheckingUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('ridizi_username').then(name => {
      if (name) setUsername(name);
    });
  }, []);

  const handleValidate = async () => {
    if (!inputUsername.trim()) {
      Alert.alert('Please enter a username');
      return;
    }
    setCheckingUser(true);
    const uname = inputUsername.trim();
    try {
      // Try to create user directly, ignore 409 error if user already exists
      await axios.post('http://192.168.14.162:5001/admin/api/users', { username: uname })
        .catch(err => {
          if (!(err.response && err.response.status === 409)) throw err;
        });
      await AsyncStorage.setItem('ridizi_username', uname);
      setUsername(uname);
      setInputUsername('');
    } catch (err) {
      Alert.alert('Error', 'Unable to create or check user.');
    } finally {
      setCheckingUser(false);
    }
  };

  const handleCameraPress = async () => {
    // Navigate to camera tab and trigger scan immediately
    router.push({ pathname: '/(tabs)/camera', params: { autoScan: '1' } });
  };

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

      {/* Search Bar with Camera Icon */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCameraPress}
        >
          <Camera size={32} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Welcome Message */}
      <Text style={styles.welcomeText}>
        {username ? `Hello, ${username}` : 'Welcome!'}
      </Text>

      {/* Username input if not set */}
      {!username && (
        <View style={styles.usernameInputSection}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Enter your username"
            value={inputUsername}
            onChangeText={setInputUsername}
            autoCapitalize="none"
            editable={!checkingUser}
          />
          <TouchableOpacity style={styles.validateButton} onPress={handleValidate} disabled={checkingUser}>
            <Text style={styles.validateButtonText}>{checkingUser ? 'Validating...' : 'Validate'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Collections */}
      {username ? (
        <>
          <Text style={styles.sectionTitle}>Your collections:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.collectionItem}>
              <View style={styles.collectionSquare} />
              <Text style={styles.collectionLabel}>Liked</Text>
            </View>
            <View style={styles.collectionItem}>
              <View style={styles.collectionSquare} />
              <Text style={styles.collectionLabel}>Comics</Text>
            </View>
            <View style={styles.collectionItem}>
              <View style={styles.collectionSquare} />
              <Text style={styles.collectionLabel}>Science</Text>
            </View>
            <View style={styles.collectionItem}>
              <View style={styles.collectionSquare} />
              <Text style={styles.collectionLabel}>History</Text>
            </View>
            <View style={styles.collectionItem}>
              <View style={styles.collectionSquare} />
              <Text style={styles.collectionLabel}>Fantasy</Text>
            </View>
          </ScrollView>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Recently Scanned */}
          <Text style={styles.sectionTitle}>Recently Scanned:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            <View style={styles.recentItem}>
              <View style={styles.recentRect} />
              <Text style={styles.recentLabel}>Harry potter</Text>
            </View>
            <View style={styles.recentItem}>
              <View style={styles.recentRect} />
              <Text style={styles.recentLabel}>Spider-Man</Text>
            </View>
            <View style={styles.recentItem}>
              <View style={styles.recentRect} />
              <Text style={styles.recentLabel}>C# for beginners</Text>
            </View>
            <View style={styles.recentItem}>
              <View style={styles.recentRect} />
              <Text style={styles.recentLabel}>Dune</Text>
            </View>
            <View style={styles.recentItem}>
              <View style={styles.recentRect} />
              <Text style={styles.recentLabel}>The Hobbit</Text>
            </View>
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
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
  cameraButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 18,
  },
  usernameInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
    minWidth: 120,
    marginRight: 10,
  },
  validateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  validateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  horizontalScroll: {
    marginBottom: 16,
  },
  collectionItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 90,
  },
  collectionSquare: {
    width: 70,
    height: 70,
    backgroundColor: '#fafafa',
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  collectionLabel: {
    fontSize: 15,
    textAlign: 'center',
  },
  recentItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 120,
  },
  recentRect: {
    width: 70,
    height: 100,
    backgroundColor: '#fafafa',
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  recentLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
});