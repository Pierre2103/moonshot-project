import * as React from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import AppLoading from 'expo-app-loading';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

import HeaderTexts from '../components/HeaderTexts';
import FooterButton from '../components/FooterButton';

import Saly34 from '../../assets/illustrations/saly_34.png';

const WelcomeScreen = ({ navigation }) => {
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
        <Image source={Saly34} style={styles.image} />
      </View>


        <FooterButton
          content="Create my account"
          navigation={navigation}
          navigateTo="RegisterCredentials"
          tips="Already have an account?"
          tipsText="Login"
          tipsNavigateTo="Login"
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

export default WelcomeScreen;