import * as React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import AppLoading from 'expo-app-loading';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

import HeaderTexts from '../components/HeaderTexts';
import FooterButton from '../components/FooterButton';
import DatabaseManager from '../components/DatabaseManager';

const testDatabase = ({ navigation }) => {
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <View style={styles.globalContainer}>
      <HeaderTexts title="Nice to see you on Ridizi !"/>

      <View style={styles.contentContainer}>
        <DatabaseManager />
      </View>

      <FooterButton
        content="Create my account" 
        tips={<Text style={styles.tipsText}>Already have an account? <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>Login</Text></Text>}
        navigation={navigation}
        navigateTo="RegisterEnterName"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // =====================
  // Full screen container
  globalContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  // =====================
  // Content container
  contentContainer: {
    width: '100%',
    height: '65%',
    alignItems: 'center',
    justifyContent: 'center',
    // borderColor: '#0F0',  // Debug
    // borderWidth: 1,
  },

  image: {
    width: '100%',
    resizeMode: 'contain',
  },

  // =====================
  // Header container
  tipsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat_400Regular',
  },
  loginLink: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default testDatabase;