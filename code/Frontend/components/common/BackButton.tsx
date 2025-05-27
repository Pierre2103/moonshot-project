import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface BackButtonProps {
  customStyle?: any;
  textStyle?: any;
}

export default function BackButton({ customStyle, textStyle }: BackButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity style={[styles.backButton, customStyle]} onPress={() => router.back()}>
      <ArrowLeft size={22} color="#007AFF" />
      <Text style={[styles.backButtonText, textStyle]}>Go back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: 2,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
});
