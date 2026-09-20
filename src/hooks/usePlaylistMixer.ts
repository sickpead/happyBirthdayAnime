import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  getPlayingPlaylistTrack,
  getPlaylistProgress,
  getPlaylistStatus,
  getPlaylistVolume,
  subscribePlaylistTrack,
} from '../audio/audioManager';
import { VINYL_TRACKS } from '../constants/vinylTracks';
import type { PlaylistStatus, VinylTrack } from '../types';

/** Как часто спрашивать Howler о позиции дорожки, мс. */
const PROGRESS_INTERVAL_MS = 200;

/** Снимок микшера для панели проигрывателя. */
export interface PlaylistMixerState {
  /** Выбранная дорожка или `null`, если проигрыватель выключен. */
  track: VinylTrack | null;
  /** Играет, на паузе или выключен. */
  status: PlaylistStatus;
  /** Текущая позиция, секунды. */
  currentTime: number;
  /** Длина дорожки, секунды. 0 — пока не известна. */
  duration: number;
  /** Громкость 0–1. */
  volume: number;
}

function trackBySrc(src: string | null): VinylTrack | null {
  if (src === null) {
    return null;
  }
  return VINYL_TRACKS.find((track) => track.src === src) ?? null;
}

/**
 * Состояние микшера: дорожка, пауза, позиция и громкость. Позиция опрашивается,
 * пока модалка открыта и дорожка играет — Howler не шлёт тики сам.
 *
 * @param active - Опрашивать позицию (открытая модалка).
 */
export function usePlaylistMixer(active: boolean): PlaylistMixerState {
  const src = useSyncExternalStore(subscribePlaylistTrack, getPlayingPlaylistTrack);
  const status = useSyncExternalStore(subscribePlaylistTrack, getPlaylistStatus);
  const volume = useSyncExternalStore(subscribePlaylistTrack, getPlaylistVolume);
  const [progress, setProgress] = useState(() => getPlaylistProgress());

  useEffect(() => {
    const syncProgress = (): void => {
      setProgress(getPlaylistProgress());
    };
    syncProgress();
    const unsubscribe = subscribePlaylistTrack(syncProgress);
    if (!active || status !== 'playing') {
      return unsubscribe;
    }
    const timerId = window.setInterval(syncProgress, PROGRESS_INTERVAL_MS);
    return () => {
      unsubscribe();
      window.clearInterval(timerId);
    };
  }, [active, src, status]);

  return {
    track: trackBySrc(src),
    status,
    currentTime: progress.currentTime,
    duration: progress.duration,
    volume,
  };
}
