import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the home page
  return <Redirect href="/(tabs)/index" />;
}