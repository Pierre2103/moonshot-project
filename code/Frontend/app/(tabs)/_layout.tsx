/**
 * Tab Navigation Layout Configuration
 * 
 * Defines the main tab bar navigation structure for the application.
 * Configures primary user flows and navigation patterns.
 * 
 * Key Features:
 * - Three main tabs: Home, Scan, Profile
 * - Hidden screens for detailed views (bookdetails, collections, etc.)
 * - Consistent tab bar styling with app brand colors
 * - Integrated camera scanning with auto-scan parameter
 * - Scalable architecture for adding new tabs/screens
 * 
 * Navigation Architecture:
 * - Home: Main dashboard and entry point
 * - Scan: Quick access to camera scanning
 * - Profile: User management and settings
 * - Hidden screens: Detailed views accessible via navigation
 * 
 * Technical Notes:
 * - Uses Expo Router tabs for native navigation
 * - Lucide React Native icons for consistent design
 * - Auto-scan parameter for seamless camera integration
 */

import { Tabs } from 'expo-router';
import { Camera, Scan, Home, User } from 'lucide-react-native';

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

/**
 * Tab Layout Configuration
 * 
 * Configures the main tab navigation structure with:
 * - Visual tab bar with icons
 * - Screen options and navigation behavior
 * - Hidden screens for detailed views
 * - Consistent styling across all tabs
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Use custom headers in individual screens
        tabBarActiveTintColor: '#007AFF', // App brand blue for active tabs
      }}
    >
      {/* ========================================================================
          PRIMARY TABS - Visible in tab bar
          ======================================================================== */}
      
      {/* Home Tab - Main dashboard and entry point */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      
      {/* Camera/Scan Tab - Quick access to book scanning */}
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Scan',
          tabBarIcon: ({ size, color }) => <Camera size={size} color={color} />,
          // Auto-trigger scanning when tab is pressed
          href: { pathname: '/(tabs)/camera', params: { autoScan: '1' } },
        }}
      />
      
      {/* Profile Tab - User settings and account management */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />

      {/* ========================================================================
          HIDDEN SCREENS - Accessible via navigation but not in tab bar
          ======================================================================== */}
      
      {/* Manual ISBN Scanner - Fallback scanning interface */}
      <Tabs.Screen
        name="isbnscan"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      
      {/* Book Details - Individual book information and actions */}
      <Tabs.Screen
        name="bookdetails"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      
      {/* Collection Details - Books within a specific collection */}
      <Tabs.Screen
        name="collectiondetails"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      
      {/* Scan History - Chronological list of scanned books */}
      <Tabs.Screen
        name="scanhistory"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      
      {/* Collections Management - Create, edit, and organize collections */}
      <Tabs.Screen
        name="collections"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}