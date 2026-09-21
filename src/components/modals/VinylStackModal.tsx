import { useSyncExternalStore, type ReactElement } from 'react';

import {
  getPlayingPlaylistTrack,
  getPlaylistStatus,
  pausePlaylistTrack,
  playPlaylistTrack,
  resumePlaylistTrack,
  subscribePlaylistTrack,
} from '../../audio/playlist';
import { VINYL_TEXT } from '../../constants/copy';
import { MODAL_TITLES } from '../../constants/modals';
import { VINYL_TRACKS } from '../../constants/vinylTracks';
import type { ContentModalProps, VinylTrack } from '../../types';
import { Modal } from '../Modal';
import styles from './VinylStackModal.module.css';

/**
 * Модалка стопки пластинок: список дорожек из `src/constants/vinylTracks.ts`.
 * Клик по дорожке включает её, повторный ставит на паузу, ещё раз — продолжает.
 * Играет не больше одной: выбранная дорожка сменяет ту, что шла фоном, и звучит громче,
 * а когда кончится — фоновая очередь сама продолжится со следующей.
 *
 * Дорожка продолжает играть, если модалку закрыть: список подписан на очередь
 * (`useSyncExternalStore`), поэтому при следующем открытии показывает, что звучит сейчас,
 * даже если дорожку включила сама очередь.
 */
export function VinylStackModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  // Что играет, знает аудио-менеджер: список подписан на него и не заводит своего состояния,
  // поэтому дорожка, кончившаяся при закрытой модалке, не оставляет ложной пометки.
  const playingSrc = useSyncExternalStore(subscribePlaylistTrack, getPlayingPlaylistTrack);
  const status = useSyncExternalStore(subscribePlaylistTrack, getPlaylistStatus);

  const toggle = (track: VinylTrack): void => {
    if (playingSrc === track.src && status === 'playing') {
      pausePlaylistTrack();
      return;
    }
    if (playingSrc === track.src && status === 'paused') {
      resumePlaylistTrack();
      return;
    }
    playPlaylistTrack(track.src);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES['vinyl-stack']}>
      <h2 className={styles.title}>{MODAL_TITLES['vinyl-stack']}</h2>
      {VINYL_TRACKS.length === 0 ? (
        <p className={styles.empty}>{VINYL_TEXT.empty}</p>
      ) : (
        <>
          <p className={styles.hint}>{VINYL_TEXT.hint}</p>
          <ul className={styles.list} aria-label={VINYL_TEXT.listLabel}>
            {VINYL_TRACKS.map((track) => {
              const isActive = playingSrc === track.src;
              const isPlaying = isActive && status === 'playing';
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    className={styles.track}
                    data-playing={isActive}
                    aria-label={
                      isPlaying
                        ? VINYL_TEXT.pause(track.title)
                        : isActive
                          ? VINYL_TEXT.resume(track.title)
                          : VINYL_TEXT.play(track.title)
                    }
                    aria-pressed={isPlaying}
                    onClick={() => {
                      toggle(track);
                    }}
                  >
                    <span className={styles.icon} aria-hidden="true">
                      {isPlaying ? '❚❚' : '▶'}
                    </span>
                    <span className={styles.titles}>
                      <span className={styles.trackTitle}>{track.title}</span>
                      {track.artist !== undefined && (
                        <span className={styles.artist}>{track.artist}</span>
                      )}
                    </span>
                    {isActive && (
                      <span className={styles.badge}>
                        {isPlaying ? VINYL_TEXT.nowPlaying : VINYL_TEXT.nowPaused}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
}
