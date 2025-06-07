export const PLAYBACK_MODE = {
  SEQUENTIAL: 'sequential',
  SHUFFLE: 'shuffle',
  LOOP_TRACK: 'loop_track'
} as const;

export type PlaybackMode = typeof PLAYBACK_MODE[keyof typeof PLAYBACK_MODE];

export const MIN_SONG_DURATION = 30000; // 30 seconds

export const AUDIO_CONFIG = {
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  progressUpdateIntervalMillis: 100,
  shouldCorrectPitch: true,
};