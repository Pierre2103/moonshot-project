import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HeaderTexts = ({ title, subtitle }) => {
  return (
    <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    // =====================
    // Header container
    headerContainer: {
      width: '100%',
      height: '20%',
      alignItems: 'center',
    //   borderColor: '#F00',  // Debug
    //   borderWidth: 1,
    },
    headerTitle: {
      width: '85%',
      marginTop: 60,
      textAlign: 'left',
      fontSize: 36,
      fontFamily: 'Montserrat_400Regular',
    },
    headerSubtitle: {
      width: '85%',
      textAlign: 'left',
      fontSize: 16,
      fontFamily: 'Montserrat_400Regular',
      color: '#333',
    },
});

export default HeaderTexts;
