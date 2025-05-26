import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tab navigator root, which will show the Home tab by default
  return <Redirect href="/(tabs)" />;
}