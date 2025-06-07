import { View, Text, StyleSheet, Switch, Platform, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ChevronRight, Volume2, Bell, CircleHelp as HelpCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const FREQUENCIES = [
  { freq: 60, label: '60Hz' },
  { freq: 170, label: '170Hz' },
  { freq: 310, label: '310Hz' },
  { freq: 600, label: '600Hz' },
  { freq: 1000, label: '1kHz' },
  { freq: 3000, label: '3kHz' },
  { freq: 6000, label: '6kHz' },
  { freq: 12000, label: '12kHz' },
  { freq: 14000, label: '14kHz' },
  { freq: 16000, label: '16kHz' },
];

const EQ_HEIGHT = 200;

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [equalizerEnabled, setEqualizerEnabled] = useState(false);
  const eqValues = FREQUENCIES.map(() => useSharedValue(0));

  // Handle notifications toggle
  const handleNotifications = useCallback(async (value: boolean) => {
    try {
      if (Platform.OS !== 'web') {
        if (value) {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please enable notifications in your device settings.');
            return;
          }
        }
      }
      setNotifications(value);
      Alert.alert('Success', `Notifications ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to toggle notifications');
    }
  }, []);

  // Handle equalizer toggle
  const handleEqualizerToggle = useCallback(async (value: boolean) => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Equalizer is not available on web platform');
        return;
      }

      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      setEqualizerEnabled(value);
      
      // Reset EQ values when disabled
      if (!value) {
        eqValues.forEach(value => {
          value.value = withSpring(0);
        });
      }
    } catch (error) {
      console.error('Error toggling equalizer:', error);
      Alert.alert('Error', 'Failed to toggle equalizer');
    }
  }, []);

  // Create gesture handlers for each frequency slider
  const createEQGesture = (index: number) => {
    return Gesture.Pan()
      .onUpdate((event) => {
        const newValue = Math.max(-12, Math.min(12, -event.y / (EQ_HEIGHT / 24)));
        eqValues[index].value = withSpring(newValue);
      });
  };

  // Create animated styles for each frequency slider
  const createEQStyle = (index: number) => {
    return useAnimatedStyle(() => ({
      height: 4,
      width: '80%',
      backgroundColor: '#1DB954',
      transform: [
        { translateY: eqValues[index].value * (EQ_HEIGHT / 24) },
      ],
    }));
  };

  // Handle help & support
  const openHelpSupport = useCallback(() => {
    Alert.alert(
      'Help & Support',
      'Contact support at support@melodify.com\n\nOr visit our help center at melodify.com/help'
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sound</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Volume2 size={24} color="#fff" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Equalizer</Text>
            <Switch
              value={equalizerEnabled}
              onValueChange={handleEqualizerToggle}
              trackColor={{ false: '#333', true: '#1DB954' }}
              thumbColor="#fff"
            />
          </View>
        </TouchableOpacity>

        {equalizerEnabled && (
          <View style={styles.equalizerContainer}>
            <View style={styles.frequencyBands}>
              {FREQUENCIES.map((freq, index) => (
                <View key={freq.freq} style={styles.frequencyBand}>
                  <Text style={styles.frequencyLabel}>{freq.label}</Text>
                  <View style={styles.sliderContainer}>
                    <GestureDetector gesture={createEQGesture(index)}>
                      <Animated.View style={[styles.slider, createEQStyle(index)]} />
                    </GestureDetector>
                  </View>
                  <Text style={styles.dbValue}>{Math.round(eqValues[index].value)}dB</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Bell size={24} color="#fff" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={handleNotifications}
              trackColor={{ false: '#333', true: '#1DB954' }}
              thumbColor="#fff"
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingItem} onPress={openHelpSupport}>
          <View style={styles.settingIcon}>
            <HelpCircle size={24} color="#fff" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Help & Support</Text>
            <ChevronRight size={20} color="#666" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  equalizerContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  frequencyBands: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: EQ_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  frequencyBand: {
    alignItems: 'center',
    flex: 1,
  },
  frequencyLabel: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  sliderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    width: 4,
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  dbValue: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 30,
  },
  versionText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});