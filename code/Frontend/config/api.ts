import Constants from 'expo-constants';

// Support both classic and EAS build environments
const SERVER_URL =
  Constants.expoConfig?.extra?.SERVER_URL ||
  Constants.manifest?.extra?.SERVER_URL;

const API_BASE_URL = SERVER_URL;

// Debug logging to see what's being loaded
if (__DEV__) {
  console.log('API Configuration:');
  console.log('Constants.expoConfig.extra.SERVER_URL:', Constants.expoConfig?.extra?.SERVER_URL);
  console.log('Constants.manifest.extra.SERVER_URL:', Constants.manifest?.extra?.SERVER_URL);
  console.log('Final API_BASE_URL:', API_BASE_URL);
}

export { API_BASE_URL };
