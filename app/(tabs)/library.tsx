import { View, Text, StyleSheet, FlatList, Image, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Play, Pause, MoveVertical as MoreVertical, Search, Sparkles } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { formatTime } from '@/utils/formatTime';
import { LinearGradient } from 'expo-linear-gradient';
import MiniPlayer from '@/components/MiniPlayer';

const { width } = Dimensions.get('window');
const CONTENT_WIDTH = Math.min(width * 0.9, 800);
const DEFAULT_ALBUM_ART = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80';

export default function LibraryScreen() {
  const { songs, loadSongs, playSong, currentSong, isPlaying, pauseSong, resumeSong, recommendations } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'duration'>('name');
  const [showRecommendations, setShowRecommendations] = useState(true);

  useEffect(() => {
    loadSongs();
  }, []);

  const filteredSongs = songs
    .filter(song => 
      song.filename.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      } else {
        return a.duration - b.duration;
      }
    });

  const renderItem = ({ item, index, section }) => {
    const isCurrentSong = currentSong?.id === item.id;
    const duration = item.duration * 1000;

    return (
      <TouchableOpacity 
        style={[
          styles.songItem,
          isCurrentSong && styles.activeSongItem
        ]}
        onPress={() => playSong(item)}
      >
        <Image 
          source={{ uri: item.albumCoverUrl || DEFAULT_ALBUM_ART }} 
          style={styles.thumbnail} 
        />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.filename}
          </Text>
          <Text style={styles.duration}>{formatTime(duration)}</Text>
        </View>
        <View style={styles.songActions}>
          {isCurrentSong ? (
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={isPlaying ? pauseSong : resumeSong}
            >
              {isPlaying ? (
                <Pause size={24} color="#1DB954" />
              ) : (
                <Play size={24} color="#1DB954" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={() => playSong(item)}
            >
              <Play size={24} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecommendedSection = () => {
    if (!showRecommendations || recommendations.length === 0) return null;

    return (
      <View style={styles.recommendedSection}>
        <View style={styles.recommendedHeader}>
          <Sparkles size={20} color="#1DB954" />
          <Text style={styles.recommendedTitle}>Recommended for You</Text>
        </View>
        <FlatList
          horizontal
          data={recommendations.slice(0, 5)}
          keyExtractor={(item) => `recommended-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendedList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.recommendedItem}
              onPress={() => playSong(item)}
            >
              <Image 
                source={{ uri: item.albumCoverUrl || DEFAULT_ALBUM_ART }}
                style={styles.recommendedThumbnail}
              />
              <Text style={styles.recommendedSongTitle} numberOfLines={2}>
                {item.filename}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  if (!songs.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Scanning for music...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2a1a2a', '#1a1a1a']}
      style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Library</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.sortContainer}>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'name' && styles.activeSortButton]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.activeSortButtonText]}>
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'duration' && styles.activeSortButton]}
              onPress={() => setSortBy('duration')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'duration' && styles.activeSortButtonText]}>
                Duration
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderRecommendedSection()}

        <View style={styles.allSongs}>
          <Text style={styles.sectionTitle}>All Songs ({filteredSongs.length})</Text>
          <FlatList
            data={filteredSongs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.songsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
      <MiniPlayer />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  contentContainer: {
    width: CONTENT_WIDTH,
    flex: 1,
    paddingBottom: 70,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  activeSortButton: {
    backgroundColor: '#1DB954',
  },
  sortButtonText: {
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  activeSortButtonText: {
    color: '#fff',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 20,
    marginBottom: 15,
  },
  allSongs: {
    flex: 1,
  },
  songsList: {
    paddingHorizontal: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeSongItem: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
    width: '100%',
  },
  duration: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  playButton: {
    padding: 5,
  },
  moreButton: {
    padding: 5,
  },
  recommendedSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  recommendedTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  recommendedList: {
    paddingBottom: 20,
    gap: 15,
  },
  recommendedItem: {
    width: 140,
    marginRight: 15,
  },
  recommendedThumbnail: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendedSongTitle: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});