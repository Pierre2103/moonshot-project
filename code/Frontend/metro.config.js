const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for reading .env from parent directory
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

module.exports = config;
