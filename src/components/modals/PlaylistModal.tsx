import { type ReactElement } from 'react';

import {
  pausePlaylistTrack,
  playNextPlaylistTrack,
  playPlaylistTrack,
  playPreviousPlaylistTrack,
  resumePlaylistTrack,
  seekPlaylistTrack,
  setPlaylistVolume,
  stopPlaylistTrack,
  togglePlaylistPlayback,
} from '../../audio/audioManager';
import { PLAYER_TEXT, VINYL_TEXT } from '../../constants/copy';
import { KEYS } from '../../constants/keyboard';
import { MODAL_TITLES } from '../../constants/modals';
import { VINYL_TRACKS } from '../../constants/vinylTracks';
import { useKeyDown } from '../../hooks/useKeyDown';
import { usePlaylistMixer } from '../../hooks/usePlaylistMixer';
import type { ContentModalProps, VinylTrack } from '../../types';
import { formatPlaybackTime } from '../../utils/time';
import { Modal } from '../Modal';
import styles from './PlaylistModal.module.css';

/**
 * Модалка проигрывателя на столе: микшер — листание дорожек, пауза, выключение,
 * перемотка и громкость. Список тот же, что у стопки пластинок (`vinylTracks.ts`).
 */
export function PlaylistModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  const mixer = usePlaylistMixer(isOpen);
  const hasTracks = VINYL_TRACKS.length > 0;
  const isPlaying = mixer.status === 'playing';
  const canSeek = mixer.duration > 0;

  useKeyDown(
    KEYS.arrowLeft,
    (event) => {
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      event.preventDefault();
      playPreviousPlaylistTrack();
    },
    isOpen && hasTracks,
  );
  useKeyDown(
    KEYS.arrowRight,
    (event) => {
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      event.preventDefault();
      playNextPlaylistTrack();
    },
    isOpen && hasTracks,
  );

  const togglePlay = (): void => {
    togglePlaylistPlayback();
  };

  const selectTrack = (track: VinylTrack): void => {
    if (mixer.track?.src === track.src && mixer.status === 'playing') {
      pausePlaylistTrack();
      return;
    }
    if (mixer.track?.src === track.src && mixer.status === 'paused') {
      resumePlaylistTrack();
      return;
    }
    playPlaylistTrack(track.src);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.playlist}>
      <div className={styles.mixer}>
        <h2 className={styles.title}>{MODAL_TITLES.playlist}</h2>

        {hasTracks ? (
          <>
            <div className={styles.nowPlaying}>
              <span className={styles.label}>
                {mixer.track === null ? PLAYER_TEXT.idle : PLAYER_TEXT.nowPlaying}
              </span>
              {mixer.track !== null && (
                <>
                  <span className={styles.trackTitle}>{mixer.track.title}</span>
                  {mixer.track.artist !== undefined && (
                    <span className={styles.artist}>{mixer.track.artist}</span>
                  )}
                </>
              )}
            </div>

            <div className={styles.seek}>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={canSeek ? mixer.duration : 1}
                step={0.1}
                value={canSeek ? mixer.currentTime : 0}
                disabled={!canSeek}
                aria-label={PLAYER_TEXT.seek}
                onChange={(event) => {
                  seekPlaylistTrack(Number(event.target.value));
                }}
              />
              <span className={styles.time}>
                {PLAYER_TEXT.time(
                  formatPlaybackTime(mixer.currentTime),
                  formatPlaybackTime(mixer.duration),
                )}
              </span>
            </div>

            <div className={styles.transport} role="group" aria-label={MODAL_TITLES.playlist}>
              <button
                type="button"
                className={styles.navButton}
                aria-label={PLAYER_TEXT.previous}
                onClick={playPreviousPlaylistTrack}
              >
                ⏮
              </button>
              <button
                type="button"
                className={styles.playButton}
                aria-label={isPlaying ? PLAYER_TEXT.pause : PLAYER_TEXT.play}
                onClick={togglePlay}
              >
                {isPlaying ? PLAYER_TEXT.pause : PLAYER_TEXT.play}
              </button>
              <button
                type="button"
                className={styles.navButton}
                aria-label={PLAYER_TEXT.next}
                onClick={playNextPlaylistTrack}
              >
                ⏭
              </button>
              <button
                type="button"
                className={styles.navButton}
                aria-label={PLAYER_TEXT.stop}
                disabled={mixer.status === 'idle'}
                onClick={stopPlaylistTrack}
              >
                ⏹
              </button>
            </div>

            <div className={styles.volume}>
              <span className={styles.volumeLabel} id="playlist-volume-label">
                {PLAYER_TEXT.volume}
              </span>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={mixer.volume}
                aria-labelledby="playlist-volume-label"
                onChange={(event) => {
                  setPlaylistVolume(Number(event.target.value));
                }}
              />
            </div>

            <ul className={styles.list} aria-label={VINYL_TEXT.listLabel}>
              {VINYL_TRACKS.map((track) => {
                const isActive = mixer.track?.src === track.src;
                const isThisPlaying = isActive && isPlaying;
                return (
                  <li key={track.id}>
                    <button
                      type="button"
                      className={styles.track}
                      data-active={isActive}
                      aria-label={
                        isThisPlaying
                          ? VINYL_TEXT.pause(track.title)
                          : isActive
                            ? VINYL_TEXT.resume(track.title)
                            : VINYL_TEXT.play(track.title)
                      }
                      aria-pressed={isThisPlaying}
                      onClick={() => {
                        selectTrack(track);
                      }}
                    >
                      <span className={styles.icon} aria-hidden="true">
                        {isThisPlaying ? '❚❚' : '▶'}
                      </span>
                      <span className={styles.titles}>
                        <span>{track.title}</span>
                        {track.artist !== undefined && (
                          <span className={styles.artist}>{track.artist}</span>
                        )}
                      </span>
                      {isActive && (
                        <span className={styles.badge}>
                          {isThisPlaying ? VINYL_TEXT.nowPlaying : VINYL_TEXT.nowPaused}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className={styles.empty}>{VINYL_TEXT.empty}</p>
        )}
      </div>
    </Modal>
  );
}
