import React, { useState } from 'react';
import { StyleSheet, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

import HeaderTexts from '../components/HeaderTexts';
import FooterButton from '../components/FooterButton';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        navigation.navigate('RegisterGenre');
      })
      .catch((error) => {
        setError(`Firebase: ${error.message}`);
      });
  };

  return (
    <View style={styles.globalContainer}>
      <HeaderTexts title="Welcome Back 👋" subtitle="Login to your account" />

      <KeyboardAvoidingView
        style={styles.AvoidKeyboardcontainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.contentContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter Email</Text>
            <TextInput
              style={styles.input}
              placeholder="mail@mail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Enter Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? (
              <Text style={styles.error}>{error}</Text>
            ) : null}
          </View>
        </View>

        <FooterButton
          content="Login"
          navigation={navigation}
          onPress={handleLogin}
          tips="Don't have an account?"
          tipsText="Register"
          tipsNavigateTo="RegisterCredentials"
        />
      </KeyboardAvoidingView>
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
  // AvoidKeyboard container
  AvoidKeyboardcontainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },

  // =====================
  // Content container
  contentContainer: {
    width: '100%',
    height: '65%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContainer: {
    width: '80%',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  error: {
    color: 'red',
    marginTop: 5,
  },
});
