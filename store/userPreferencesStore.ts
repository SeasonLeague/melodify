import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

interface SongStats {
  playCount: number;
  skipCount: number;
  repeatCount: number;
  lastPlayed: number;
  averagePlayDuration: number;
  totalPlayDuration: number;
}

interface UserPreferencesState {
  songStats: Record<string, SongStats>;
  updatePlayCount: (songId: string) => void;
  updateSkipCount: (songId: string) => void;
  updateRepeatCount: (songId: string) => void;
  updatePlayDuration: (songId: string, duration: number) => void;
  getRecommendations: (songs: MediaLibrary.Asset[]) => MediaLibrary.Asset[];
}

const DEFAULT_STATS: SongStats = {
  playCount: 0,
  skipCount: 0,
  repeatCount: 0,
  lastPlayed: 0,
  averagePlayDuration: 0,
  totalPlayDuration: 0,
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      songStats: {},

      updatePlayCount: (songId: string) => {
        set((state) => {
          const stats = state.songStats[songId] || { ...DEFAULT_STATS };
          return {
            songStats: {
              ...state.songStats,
              [songId]: {
                ...stats,
                playCount: stats.playCount + 1,
                lastPlayed: Date.now(),
              },
            },
          };
        });
      },

      updateSkipCount: (songId: string) => {
        set((state) => {
          const stats = state.songStats[songId] || { ...DEFAULT_STATS };
          return {
            songStats: {
              ...state.songStats,
              [songId]: {
                ...stats,
                skipCount: stats.skipCount + 1,
              },
            },
          };
        });
      },

      updateRepeatCount: (songId: string) => {
        set((state) => {
          const stats = state.songStats[songId] || { ...DEFAULT_STATS };
          return {
            songStats: {
              ...state.songStats,
              [songId]: {
                ...stats,
                repeatCount: stats.repeatCount + 1,
              },
            },
          };
        });
      },

      updatePlayDuration: (songId: string, duration: number) => {
        set((state) => {
          const stats = state.songStats[songId] || { ...DEFAULT_STATS };
          const newTotalDuration = stats.totalPlayDuration + duration;
          const newPlayCount = stats.playCount || 1;
          return {
            songStats: {
              ...state.songStats,
              [songId]: {
                ...stats,
                totalPlayDuration: newTotalDuration,
                averagePlayDuration: newTotalDuration / newPlayCount,
              },
            },
          };
        });
      },

      getRecommendations: (songs: MediaLibrary.Asset[]) => {
        const { songStats } = get();
        
        // Calculate song scores
        const songScores = songs.map(song => {
          const stats = songStats[song.id] || DEFAULT_STATS;
          const recencyScore = stats.lastPlayed ? 
            Math.exp(-((Date.now() - stats.lastPlayed) / (1000 * 60 * 60 * 24 * 7))) : 0;
          
          const playScore = stats.playCount * 2;
          const repeatScore = stats.repeatCount * 3;
          const skipPenalty = stats.skipCount * -1;
          const completionScore = stats.averagePlayDuration / (song.duration * 1000);

          const totalScore = (
            recencyScore +
            playScore +
            repeatScore +
            skipPenalty +
            completionScore
          );

          return { song, score: totalScore };
        });

        // Sort by score and return top recommendations
        return songScores
          .sort((a, b) => b.score - a.score)
          .map(item => item.song);
      },
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);