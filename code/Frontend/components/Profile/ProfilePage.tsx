import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight } from 'lucide-react-native';
import { globalEvents } from '../../utils/eventBus'; // adjust path if needed

export default function ProfilePage() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Load username from local storage on mount
    AsyncStorage.getItem('ridizi_username').then(value => {
      if (value) setUsername(value);
    });
  }, []);

  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    await AsyncStorage.setItem('ridizi_username', value);
    globalEvents.emit('reloadHome'); // Notify main menu to reload
  };

  // Placeholder navigation handlers
  const handleNavigate = (page: string) => {
    // TODO: Implement navigation
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

      {/* Profile picture and username */}
      <View style={styles.profileSection}>
        <Image
          source={require('../../assets/images/profile_placeholder.png')}
          style={styles.profilePic}
        />
        <TextInput
          style={styles.usernameInput}
          placeholder="Username"
          value={username}
          onChangeText={handleUsernameChange}
          autoCapitalize="none"
        />
      </View>


    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }}>
      {/* Section: Main actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.button} onPress={() => handleNavigate('collections')}>
          <Text style={styles.buttonText}>Collections</Text>
          <ChevronRight size={22} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleNavigate('scanHistory')}>
          <Text style={styles.buttonText}>Scan History</Text>
          <ChevronRight size={22} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleNavigate('booksAdded')}>
          <Text style={styles.buttonText}>Books Added</Text>
          <ChevronRight size={22} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Section: Disabled Language/Display */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.button, styles.disabled]} disabled>
          <Text style={[styles.buttonText, styles.disabledText]}>Languages</Text>
          <ChevronRight size={22} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.disabled]} disabled>
          <Text style={[styles.buttonText, styles.disabledText]}>Display</Text>
          <ChevronRight size={22} color="#bbb" />
        </TouchableOpacity>
      </View>

      {/* Section: Disabled Clear/Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.button, styles.disabled]} disabled>
          <Text style={[styles.buttonText, styles.disabledText]}>Clear History</Text>
          <ChevronRight size={22} color="#bbb" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.disabled]} disabled>
          <Text style={[styles.buttonText, styles.disabledText]}>Log Out</Text>
          <ChevronRight size={22} color="#bbb" />
        </TouchableOpacity>
      </View>
    </ScrollView>

      {/* Version */}
      <Text style={styles.version}>Ridizi Version 0.1.2</Text>
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
    justifyContent: 'center',
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
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
    minWidth: 180,
  },
  section: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 18,
    marginBottom: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    fontSize: 17,
    color: '#222',
    fontWeight: '500',
  },
  disabled: {
    backgroundColor: '#f7f7f7',
    opacity: 0.7,
  },
  disabledText: {
    color: '#bbb',
  },
  version: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
});
