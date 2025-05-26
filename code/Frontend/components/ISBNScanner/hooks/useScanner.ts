import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { BarcodeScanningResult, CameraType, useCameraPermissions } from 'expo-camera';
import { nanoid } from './nanoid';
import { ScannedISBN } from '../types';

export function useScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedISBNs, setScannedISBNs] = useState<ScannedISBN[]>([]);

  const handleBarCodeScanned = useCallback(({ type, data }: BarcodeScanningResult) => {
    if (type === 'ean13') {
      // Add the scanned ISBN to our list
      const newISBN: ScannedISBN = {
        id: nanoid(),
        code: data,
        type: type,
        timestamp: Date.now(),
      };
      
      setScannedISBNs((prevISBNs) => [newISBN, ...prevISBNs]);
      
      // Close the scanner
      setIsScanning(false);
      
      // Provide feedback to the user
      Alert.alert(
        'ISBN Detected',
        `ISBN ${data} has been added to your list.`,
        [{ text: 'OK' }]
      );
    }
  }, []);

  const startScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  return {
    permission,
    requestPermission,
    isScanning,
    scannedISBNs,
    startScanning,
    handleBarCodeScanned,
  };
}