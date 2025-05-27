// For Expo, environment variables must be prefixed with EXPO_PUBLIC_ and available at build time
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

// Debug logging to see what's being loaded
if (__DEV__) {
  console.log('API Configuration:');
  console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
  console.log('Final API_BASE_URL:', API_BASE_URL);
}

export { API_BASE_URL };
