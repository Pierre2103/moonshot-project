import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from './styles';

const { width } = Dimensions.get('window');

export default function ScannerOverlay() {
  // Create animated value for scanner line animation
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();
    
    return () => {
      // Clean up animation if component unmounts
      animatedValue.stopAnimation();
    };
  }, []);

  const startAnimation = () => {
    // Reset animation when it completes
    animatedValue.setValue(0);
    
    // Create scanner line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // Map animated value to the position of the line
  const linePosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.unfocusedArea} />
      <View style={styles.middleRow}>
        <View style={styles.unfocusedArea} />
        <View style={styles.focusedArea}>
          {/* Corner indicators */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          {/* Scanner line animation */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: linePosition }],
              },
            ]}
          />
        </View>
        <View style={styles.unfocusedArea} />
      </View>
      <View style={styles.unfocusedArea} />
    </View>
  );
}

const FOCUS_HEIGHT = 200;
const FOCUS_WIDTH = width * 0.8;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  unfocusedArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: FOCUS_HEIGHT,
  },
  focusedArea: {
    width: FOCUS_WIDTH,
    height: FOCUS_HEIGHT,
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    width: FOCUS_WIDTH,
    height: 2,
    backgroundColor: colors.primary,
  },
});