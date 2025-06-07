import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Music4 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)/library');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSequence(
          withSpring(1.2),
          withDelay(500, withSpring(1))
        ),
      },
    ],
    opacity: withSpring(1),
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withDelay(300, withSpring(0)),
      },
    ],
    opacity: withDelay(300, withSpring(1)),
  }));

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Music4 size={80} color="#fff" />
        </Animated.View>
        <Animated.Text style={[styles.title, textStyle]}>
          Melodify
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, textStyle]}>
          Your music, your way
        </Animated.Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    opacity: 0,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 42,
    color: '#fff',
    marginTop: 20,
    opacity: 0,
    transform: [{ translateY: 20 }],
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    opacity: 0,
    transform: [{ translateY: 20 }],
  },
});