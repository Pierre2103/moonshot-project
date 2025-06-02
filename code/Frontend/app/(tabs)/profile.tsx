/**
 * Profile Screen - User Management Hub
 * 
 * Main user profile interface providing access to account settings,
 * personal data management, and app-wide user preferences.
 * 
 * Key Features:
 * - User account information display and editing
 * - Personal book statistics and reading insights
 * - Privacy and data management controls
 * - App settings and preferences configuration
 * - Account linking and social features
 * - Data export and backup functionality
 * 
 * Navigation Sources:
 * - Main tab navigation
 * - Settings links from various screens
 * - User avatar/name taps throughout the app
 * 
 * Technical Notes:
 * - Delegates main functionality to ProfilePage component
 * - Serves as routing layer for profile-related features
 * - Maintains tab navigation context and state
 */

import React from 'react';
import ProfilePage from '../../components/Profile/ProfilePage';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Profile Screen Container
 * 
 * Simple wrapper component that renders the main ProfilePage component.
 * This separation allows for:
 * - Clean tab navigation structure
 * - Potential screen-level logic in the future
 * - Consistent routing patterns across the app
 * - Easy testing and component isolation
 */
export default function ProfileScreen() {
  return <ProfilePage />;
}
