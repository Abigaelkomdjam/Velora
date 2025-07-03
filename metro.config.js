// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Récupère la config Expo/Metro par défaut
const config = getDefaultConfig(__dirname);

// On redirige tous les imports de "@react-native-picker/picker" 
// vers la même copie dans node_modules
config.resolver.extraNodeModules = {
  '@react-native-picker/picker': path.resolve(__dirname, 'node_modules/@react-native-picker/picker'),
};

module.exports = config;
