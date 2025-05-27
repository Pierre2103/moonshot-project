import Constants from 'expo-constants';

// Use the centralized SERVER_URL from app.config.js
const API_BASE_URL = Constants.expoConfig?.extra?.SERVER_URL;

// Debug logging to see what's being loaded
if (__DEV__) {
  console.log('API Configuration:');
  console.log('Constants.expoConfig.extra.SERVER_URL:', Constants.expoConfig?.extra?.SERVER_URL);
  console.log('Final API_BASE_URL:', API_BASE_URL);
}

export { API_BASE_URL };
