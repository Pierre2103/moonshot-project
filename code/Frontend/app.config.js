const path = require('path');

// Load .env from root directory (correct path)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

export default {
  expo: {
    name: 'Ridizi',
    slug: 'Ridizi',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      SERVER_URL: process.env.SERVER_URL,
    }
  }
};
