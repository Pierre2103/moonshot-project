import { Tabs } from 'expo-router';
import { Camera, Scan, Home } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ size, color }) => <Camera size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="isbnscan"
        options={{
          title: 'ISBN Scanner',
          tabBarIcon: ({ size, color }) => <Scan size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}