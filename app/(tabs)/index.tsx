import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function TabScreen() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted state after initial render
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only navigate if component is mounted
    if (isMounted) {
      // Small delay to ensure root layout is ready
      const timer = setTimeout(() => {
        router.replace('/(tabs)/library');
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  // Return an empty view instead of null to ensure proper mounting
  return <View />;
}