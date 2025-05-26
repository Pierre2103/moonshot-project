import { Tabs } from 'expo-router';
import { Camera, Scan, Home, User } from 'lucide-react-native';

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
          title: 'Scan',
          tabBarIcon: ({ size, color }) => <Camera size={size} color={color} />,
          href: { pathname: '/(tabs)/camera', params: { autoScan: '1' } },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="isbnscan"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="bookdetails"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="collectiondetails"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}