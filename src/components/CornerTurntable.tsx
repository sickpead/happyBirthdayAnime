import { useState, type ReactElement } from 'react';

import {
  playNextPlaylistTrack,
  playPreviousPlaylistTrack,
  seekPlaylistTrack,
  setPlaylistVolume,
  stopPlaylistTrack,
  togglePlaylistPlayback,
} from '../audio/playlist';
import { PLAYER_TEXT } from '../constants/copy';
import { VINYL_TRACKS } from '../constants/vinylTracks';
import { usePlaylistMixer } from '../hooks/usePlaylistMixer';
import { VinylPlayer } from './vinylPlayer';
import styles from './CornerTurntable.module.css';

/** Пропсы {@link CornerTurntable}. */
export interface CornerTurntableProps {
  /** Показан ли проигрыватель. Скрытие — через opacity и transition, без размонтирования. */
  visible: boolean;
}

/**
 * Мини-проигрыватель в правом верхнем углу. Микшер появляется под декой при наведении
 * (и при фокусе с клавиатуры). Пока intro не доехал до угла — пластинка не крутится.
 *
 * Дека помечена `data-corner-turntable`: по её холсту intro вычисляет, куда уменьшаться.
 */
export function CornerTurntable({ visible }: CornerTurntableProps): ReactElement {
  const mixer = usePlaylistMixer(visible);
  const [isMixerOpen, setMixerOpen] = useState(false);
  const hasTracks = VINYL_TRACKS.length > 0;
  const isPlaying = mixer.status === 'playing';
  const canSeek = mixer.duration > 0;

  if (!visible && isMixerOpen) {
    setMixerOpen(false);
  }

  const showMixer = visible && isMixerOpen;

  return (
    <div
      className={styles.corner}
      data-visible={visible}
      data-mixer-open={showMixer}
      aria-hidden={visible ? undefined : true}
      onPointerEnter={() => {
        if (visible) {
          setMixerOpen(true);
        }
      }}
      onPointerLeave={() => {
        setMixerOpen(false);
      }}
    >
      <div className={styles.deck} data-corner-turntable>
        {/*
          Иконка встаёт в рабочее положение, пока ещё скрыта: к моменту, когда проигрыватель
          из intro «приземлится» в неё, тонарм уже на пластинке, а диск крутится — поэтому
          при передаче ничего не дёргается и не встаёт.
        */}
        <VinylPlayer externalPlaying={isPlaying} />
      </div>

      {visible && (
        <div className={styles.mixer} role="group" aria-label={PLAYER_TEXT.cornerLabel}>
          <p className={styles.nowPlaying}>
            {mixer.track === null ? PLAYER_TEXT.idle : mixer.track.title}
          </p>
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
          <div className={styles.transport}>
            <button
              type="button"
              className={styles.navButton}
              aria-label={PLAYER_TEXT.previous}
              disabled={!hasTracks}
              onClick={playPreviousPlaylistTrack}
            >
              ⏮
            </button>
            <button
              type="button"
              className={styles.playButton}
              aria-label={isPlaying ? PLAYER_TEXT.pause : PLAYER_TEXT.play}
              disabled={!hasTracks}
              onClick={togglePlaylistPlayback}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button
              type="button"
              className={styles.navButton}
              aria-label={PLAYER_TEXT.next}
              disabled={!hasTracks}
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
          <label className={styles.volume}>
            <span className={styles.volumeLabel}>{PLAYER_TEXT.volume}</span>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={mixer.volume}
              onChange={(event) => {
                setPlaylistVolume(Number(event.target.value));
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
