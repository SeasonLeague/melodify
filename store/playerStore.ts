import { create } from 'zustand';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { PLAYBACK_MODE, type PlaybackMode, MIN_SONG_DURATION, AUDIO_CONFIG } from './constants';
import { LRUCache } from 'lru-cache';
import { useUserPreferencesStore } from './userPreferencesStore';

// Optimize audio settings for web
Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  shouldDuckAndroid: Platform.OS === 'android',
  ...(Platform.OS === 'android' ? {
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    playThroughEarpieceAndroid: false,
  } : {}),
});

// optimized sound cache with preloading
const soundCache = new LRUCache<string, Audio.Sound>({
  max: 3, // Limit cache size for memory optimization
  dispose: async (sound) => {
    try {
      await sound.unloadAsync();
    } catch (error) {
      console.error('Error disposing sound:', error);
    }
  },
});

interface PlayerState {
  songs: MediaLibrary.Asset[];
  currentSong: MediaLibrary.Asset | null;
  isPlaying: boolean;
  sound: Audio.Sound | null;
  position: number;
  duration: number;
  isLoading: boolean;
  volume: number;
  playbackMode: PlaybackMode;
  queue: MediaLibrary.Asset[];
  recommendations: MediaLibrary.Asset[];
  loadSongs: () => Promise<void>;
  playSong: (song: MediaLibrary.Asset) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  cyclePlaybackMode: () => void;
  playNextSong: () => Promise<void>;
  playPreviousSong: () => Promise<void>;
  updatePosition: (position: number) => void;
  updateDuration: (duration: number) => void;
  cleanup: () => Promise<void>;
  getNextSong: () => MediaLibrary.Asset | null;
  updateRecommendations: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  songs: [],
  currentSong: null,
  isPlaying: false,
  sound: null,
  position: 0,
  duration: 0,
  isLoading: false,
  volume: 1,
  playbackMode: PLAYBACK_MODE.SEQUENTIAL,
  queue: [],
  recommendations: [],

  loadSongs: async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) return;

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 2000,
        sortBy: ['creationTime'],
      });

      const filteredSongs = media.assets.filter(asset => 
        asset.duration * 1000 >= MIN_SONG_DURATION
      );

      set({ songs: filteredSongs });
      get().updateRecommendations();

      // Preload first song for instant playback
      if (filteredSongs.length > 0) {
        const firstSong = filteredSongs[0];
        if (!soundCache.has(firstSong.id)) {
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: firstSong.uri },
              AUDIO_CONFIG,
              null
            );
            soundCache.set(firstSong.id, sound);
          } catch (error) {
            console.error('Error preloading first song:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  },

  updateRecommendations: () => {
    const { songs } = get();
    const recommendations = useUserPreferencesStore.getState().getRecommendations(songs);
    set({ recommendations });
  },

  cleanup: async () => {
    const { sound } = get();
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error cleaning up sound:', error);
      }
    }
    set({ sound: null, isPlaying: false });
  },

  playSong: async (song: MediaLibrary.Asset) => {
    try {
      set({ isLoading: true });

      // Update user preferences
      useUserPreferencesStore.getState().updatePlayCount(song.id);

      // Cleanup previous sound
      await get().cleanup();

      let newSound: Audio.Sound;

      if (soundCache.has(song.id)) {
        newSound = soundCache.get(song.id)!;
        await newSound.setPositionAsync(0);
        await newSound.setVolumeAsync(get().volume);
      } else {
        const { sound: createdSound } = await Audio.Sound.createAsync(
          { uri: song.uri },
          { 
            ...AUDIO_CONFIG,
            shouldPlay: true,
            volume: get().volume,
            progressUpdateIntervalMillis: 100,
          },
          (status) => {
            if (status.isLoaded) {
              get().updatePosition(status.positionMillis);
              get().updateDuration(status.durationMillis || song.duration * 1000);

              if (status.didJustFinish) {
                const { playbackMode } = get();
                if (playbackMode === PLAYBACK_MODE.LOOP_TRACK) {
                  useUserPreferencesStore.getState().updateRepeatCount(song.id);
                  return;
                }
                get().playNextSong();
              }
            }
          }
        );
        newSound = createdSound;
        soundCache.set(song.id, newSound);
      }

      await newSound.playAsync();

      set({ 
        sound: newSound,
        currentSong: song,
        isPlaying: true,
        isLoading: false,
        position: 0,
      });

      // Preload next song
      const nextSong = get().getNextSong();
      if (nextSong && !soundCache.has(nextSong.id)) {
        try {
          const { sound: nextSound } = await Audio.Sound.createAsync(
            { uri: nextSong.uri },
            AUDIO_CONFIG,
            null
          );
          soundCache.set(nextSong.id, nextSound);
        } catch (error) {
          console.error('Error preloading next song:', error);
        }
      }

      get().updateRecommendations();
    } catch (error) {
      console.error('Error playing song:', error);
      set({ isLoading: false });
      await get().cleanup();
    }
  },

  pauseSong: async () => {
    const { sound } = get();
    if (sound) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    }
  },

  resumeSong: async () => {
    const { sound } = get();
    if (sound) {
      await sound.playAsync();
      set({ isPlaying: true });
    }
  },

  seekTo: async (position: number) => {
    const { sound } = get();
    if (sound) {
      await sound.setPositionAsync(position);
      set({ position });
    }
  },

  setVolume: async (volume: number) => {
    const { sound } = get();
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (sound) {
      await sound.setVolumeAsync(clampedVolume);
    }
    set({ volume: clampedVolume });
  },

  cyclePlaybackMode: () => {
    set(state => {
      const modes = [PLAYBACK_MODE.SEQUENTIAL, PLAYBACK_MODE.SHUFFLE, PLAYBACK_MODE.LOOP_TRACK];
      const currentIndex = modes.indexOf(state.playbackMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      
      const { sound } = state;
      if (sound) {
        sound.setIsLoopingAsync(nextMode === PLAYBACK_MODE.LOOP_TRACK);
      }
      
      return { playbackMode: nextMode };
    });
  },

  getNextSong: () => {
    const { songs, currentSong, playbackMode } = get();
    if (!currentSong || songs.length === 0) return null;

    if (playbackMode === PLAYBACK_MODE.SHUFFLE) {
      const currentIndex = songs.findIndex(song => song.id === currentSong.id);
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * songs.length);
      } while (nextIndex === currentIndex && songs.length > 1);
      return songs[nextIndex];
    } else {
      const currentIndex = songs.findIndex(song => song.id === currentSong.id);
      return songs[(currentIndex + 1) % songs.length];
    }
  },

  playNextSong: async () => {
    const nextSong = get().getNextSong();
    if (nextSong) {
      if (get().currentSong) {
        useUserPreferencesStore.getState().updateSkipCount(get().currentSong.id);
      }
      await get().playSong(nextSong);
    }
  },

  playPreviousSong: async () => {
    const { songs, currentSong, playbackMode } = get();
    if (!currentSong || songs.length === 0) return;

    let prevSong;
    if (playbackMode === PLAYBACK_MODE.SHUFFLE) {
      const currentIndex = songs.findIndex(song => song.id === currentSong.id);
      let prevIndex;
      do {
        prevIndex = Math.floor(Math.random() * songs.length);
      } while (prevIndex === currentIndex && songs.length > 1);
      prevSong = songs[prevIndex];
    } else {
      const currentIndex = songs.findIndex(song => song.id === currentSong.id);
      prevSong = songs[currentIndex === 0 ? songs.length - 1 : currentIndex - 1];
    }

    await get().playSong(prevSong);
  },

  updatePosition: (position: number) => {
    set({ position });
  },

  updateDuration: (duration: number) => {
    set({ duration });
  },
}));