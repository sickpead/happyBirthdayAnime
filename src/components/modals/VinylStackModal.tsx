import { useSyncExternalStore, type ReactElement } from 'react';

import {
  getPlayingPlaylistTrack,
  playPlaylistTrack,
  stopPlaylistTrack,
  subscribePlaylistTrack,
} from '../../audio/audioManager';
import { VINYL_TEXT } from '../../constants/copy';
import { MODAL_TITLES } from '../../constants/modals';
import { VINYL_TRACKS } from '../../constants/vinylTracks';
import type { ContentModalProps, VinylTrack } from '../../types';
import { Modal } from '../Modal';
import styles from './VinylStackModal.module.css';

/**
 * Модалка стопки пластинок: список дорожек из `src/constants/vinylTracks.ts`.
 * Клик по дорожке включает её, повторный — останавливает; играет не больше одной,
 * фоновая песня сцены на это время приглушается и возвращается, когда дорожка кончилась.
 *
 * Дорожка продолжает играть, если модалку закрыть: при следующем открытии список
 * подхватывает её и показывает, что именно звучит.
 */
export function VinylStackModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  // Что играет, знает аудио-менеджер: список подписан на него и не заводит своего состояния,
  // поэтому дорожка, кончившаяся при закрытой модалке, не оставляет ложной пометки.
  const playingSrc = useSyncExternalStore(subscribePlaylistTrack, getPlayingPlaylistTrack);

  const toggle = (track: VinylTrack): void => {
    if (playingSrc === track.src) {
      stopPlaylistTrack();
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
              const isPlaying = playingSrc === track.src;
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    className={styles.track}
                    data-playing={isPlaying}
                    aria-label={
                      isPlaying ? VINYL_TEXT.stop(track.title) : VINYL_TEXT.play(track.title)
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
                    {isPlaying && <span className={styles.badge}>{VINYL_TEXT.nowPlaying}</span>}
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
