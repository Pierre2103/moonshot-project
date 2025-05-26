import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';

const FooterButton = ({ content, tips, navigation, navigateTo, onPress, linkText, linkNavigateTo, tipsText, tipsNavigateTo }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate(navigateTo);
    }
  };

  return (
    <View style={styles.footerContainer}>
      <Button
        mode="contained"
        style={styles.button}
        labelStyle={styles.buttonText}
        onPress={handlePress}
      >
        {content}
      </Button>
      {tipsText && (
        <Text style={styles.tipsText}>
          {tips}{' '}
          <TouchableOpacity onPress={() => navigation.navigate(tipsNavigateTo)}>
            <Text style={styles.linkText}>{tipsText}</Text>
          </TouchableOpacity>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // =====================
  // Footer container
  footerContainer: {
    width: '100%',
    height: '15%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    width: '80%',
    height: 60,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Montserrat_400Regular',
    height: 60,
    lineHeight: 60,
  },
  tipsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat_400Regular',
  },
  linkText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default FooterButton;
