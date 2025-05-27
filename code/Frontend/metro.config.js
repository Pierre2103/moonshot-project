const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Load .env from root directory (correct path)
const envPath = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

const config = getDefaultConfig(__dirname);

module.exports = config;
