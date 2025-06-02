/**
 * Profile Page Component
 * 
 * User profile management interface providing access to account settings,
 * personal data, and app navigation. Central hub for user-related functionality.
 * 
 * Key Features:
 * - Username management with real-time persistence
 * - Quick navigation to main app sections
 * - Profile picture display (placeholder implementation)
 * - Settings organization with disabled/future features
 * - Global event integration for data synchronization
 * - Clean, accessible interface design
 * 
 * Navigation Integration:
 * - Collections management access
 * - Scan history review
 * - Manual book addition workflow
 * - Future settings and preferences
 * 
 * Technical Notes:
 * - Uses AsyncStorage for username persistence
 * - Integrates with global event system for data sync
 * - Follows iOS design patterns for settings interfaces
 * - Prepared for future feature expansion
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight } from 'lucide-react-native';
import { globalEvents } from '../../utils/eventBus';
import { useRouter } from 'expo-router';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Profile Page Component
 * 
 * Renders the user profile interface with username management,
 * navigation options, and settings organization.
 * 
 * @returns {JSX.Element} Complete profile page interface
 */
export default function ProfilePage() {
  // ----------------------------------------------------------------------------
  // NAVIGATION AND ROUTING
  // ----------------------------------------------------------------------------
  
  const router = useRouter();

  // ----------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------------------
  
  /** Current username from storage or user input */
  const [username, setUsername] = useState('');

  // ----------------------------------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------------------------------

  /**
   * Load username from local storage on component mount.
   * Initializes the profile with existing user data.
   */
  useEffect(() => {
    const loadUsername = async (): Promise<void> => {
      try {
        const storedUsername = await AsyncStorage.getItem('ridizi_username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.error('Error loading username from storage:', error);
      }
    };

    loadUsername();
  }, []);

  // ----------------------------------------------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------------------------------------------

  /**
   * Handle username changes with real-time persistence.
   * Updates both local state and persistent storage, then notifies
   * other components of the change via global events.
   * 
   * @param {string} value - New username value
   */
  const handleUsernameChange = async (value: string): Promise<void> => {
    try {
      // Update local state immediately for responsive UI
      setUsername(value);
      
      // Persist to storage for app restarts
      await AsyncStorage.setItem('ridizi_username', value);
      
      // Notify other components to reload with new username
      globalEvents.emit('reloadHome');
    } catch (error) {
      console.error('Error saving username to storage:', error);
      // Could show user feedback here in the future
    }
  };

  /**
   * Handle navigation to different sections of the app.
   * Centralizes navigation logic with future expansion capability.
   * 
   * @param {string} page - Target page identifier
   */
  const handleNavigate = (page: string): void => {
    switch (page) {
      case 'collections':
        router.push('/(tabs)/collections');
        break;
      case 'scanHistory':
        router.push('/(tabs)/scanhistory');
        break;
      case 'addBook':
        router.push('/(tabs)/isbnscan');
        break;
      default:
        // TODO: Implement other navigation targets
        console.log('Navigation not yet implemented for:', page);
        break;
    }
  };

  // ----------------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------------

  /**
   * Render the profile header with logo and user information
   */
  const renderProfileHeader = () => (
    <>
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Profile Section with Picture and Username */}
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
          returnKeyType="done"
          maxLength={50} // Prevent excessively long usernames
        />
      </View>
    </>
  );

  /**
   * Render main navigation buttons for active features
   */
  const renderMainActions = () => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => handleNavigate('collections')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Collections</Text>
        <ChevronRight size={22} color="#888" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => handleNavigate('scanHistory')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Scan History</Text>
        <ChevronRight size={22} color="#888" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => handleNavigate('addBook')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>Add New Book</Text>
        <ChevronRight size={22} color="#888" />
      </TouchableOpacity>
    </View>
  );

  /**
   * Render disabled settings section for future features
   */
  const renderDisabledSettings = () => (
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
  );

  /**
   * Render disabled account management section for future features
   */
  const renderDisabledAccountActions = () => (
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
  );

  /**
   * Render app version information
   */
  const renderVersionInfo = () => (
    <Text style={styles.version}>Ridizi Version 0.1.2</Text>
  );

  // ----------------------------------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      {renderProfileHeader()}

      {/* Scrollable Content */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Navigation Actions */}
        {renderMainActions()}

        {/* Future Settings (Disabled) */}
        {renderDisabledSettings()}

        {/* Future Account Actions (Disabled) */}
        {renderDisabledAccountActions()}
      </ScrollView>

      {/* App Version Footer */}
      {renderVersionInfo()}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Main container
  container: {
    paddingHorizontal: 20,
    paddingTop: 64, // Account for status bar and notch
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  
  // Logo section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 90,
    marginBottom: 0,
  },
  
  // Profile information section
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
  
  // Section organization
  section: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 18,
    marginBottom: 0,
  },
  
  // Button styling
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
    // Subtle shadow for depth
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
  
  // Disabled state styling
  disabled: {
    backgroundColor: '#f7f7f7',
    opacity: 0.7,
  },
  disabledText: {
    color: '#bbb',
  },
  
  // Version information
  version: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
});
