const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  // Charger le .env racine
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
  
  // Ajouter les variables d'environnement à webpack
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.SERVER_URL': JSON.stringify(process.env.SERVER_URL),
    })
  );

  return config;
};
