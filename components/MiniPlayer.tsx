import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { formatTime } from '@/utils/formatTime';
import { router } from 'expo-router';

export default function MiniPlayer() {
  const { currentSong, isPlaying, position, duration, pauseSong, resumeSong } = usePlayerStore();

  if (!currentSong) return null;

  return (
    <Pressable 
      style={styles.container}
      onPress={() => router.push('/(tabs)')}
    >
      <Image
        source={{ 
          uri: currentSong.albumCoverUrl || 
               'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' 
        }}
        style={styles.albumArt}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {currentSong.filename}
        </Text>
        <Text style={styles.time}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
      <Pressable 
        style={styles.playButton}
        onPress={() => isPlaying ? pauseSong() : resumeSong()}
      >
        {isPlaying ? (
          <Pause size={24} color="#fff" />
        ) : (
          <Play size={24} color="#fff" />
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  time: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1DB954',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});