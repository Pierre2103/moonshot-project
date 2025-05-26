import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterCredentialsScreen from '../screens/RegisterCredentialsScreen';
import Login from '../screens/Login';
import RegisterGenreScreen from '../screens/RegisterGenreScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="RegisterCredentials" component={RegisterCredentialsScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="RegisterGenre" component={RegisterGenreScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


export default AppNavigator;
