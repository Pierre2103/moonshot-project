import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomChip = ({ genre, selected, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.selectedChip]}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>
        {genre}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    margin: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#F04040',
    backgroundColor: 'transparent',
  },
  selectedChip: {
    backgroundColor: '#F04040',
  },
  chipText: {
    color: 'black',
  },
  selectedChipText: {
    color: 'white',
  },
});

export default CustomChip;
