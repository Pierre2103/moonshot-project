// API configuration pour React classique (pas Expo)
export const API_BASE_URL = process.env.SERVER_URL;

// Debug logging pour vérifier le chargement
if (process.env.NODE_ENV === 'development') {
  console.log('API Configuration:');
  console.log('process.env.SERVER_URL:', process.env.SERVER_URL);
  console.log('Final API_BASE_URL:', API_BASE_URL);
}
