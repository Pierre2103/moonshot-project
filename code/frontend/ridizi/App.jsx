import 'react-native-gesture-handler';
import React from 'react';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import AppNavigator from './src/navigation/AppNavigator';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';

const App = () => {
  return <AppNavigator />;
};

export default gestureHandlerRootHOC(App);

AppRegistry.registerComponent(appName, () => App);
