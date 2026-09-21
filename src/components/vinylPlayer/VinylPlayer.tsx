import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';

import { TURNTABLE_IMAGES } from '../../constants/turntableAssets';
import {
  TONEARM_SWING_MS,
  VINYL_PLAYER_DISC_IN_IMAGE,
  VINYL_PLAYER_PLATTER,
  VINYL_PLAYER_TONEARM_PIVOT,
  VINYL_PLAYER_TONEARM_PLAY_DEG,
  VINYL_PLAYER_TONEARM_REST_DEG,
  VINYL_SPIN_MS,
} from '../../constants/vinylPlayerGeometry';
import { classNames } from '../../utils/classNames';
import { prefersReducedMotion } from '../../utils/motion';
import styles from './VinylPlayer.module.css';
import type { VinylPlayerHandle, VinylPlayerStatus } from './types';

const CANVAS_W = 1408;
const CANVAS_H = 768;

function pctW(px: number): string {
  return `${((px / CANVAS_W) * 100).toFixed(4)}%`;
}

function pctH(px: number): string {
  return `${((px / CANVAS_H) * 100).toFixed(4)}%`;
}

const platterSize = 2 * VINYL_PLAYER_PLATTER.radius;
const discDiameter = 2 * VINYL_PLAYER_DISC_IN_IMAGE.radius;

const geometryStyle = {
  '--platter-left': pctW(VINYL_PLAYER_PLATTER.centerX - VINYL_PLAYER_PLATTER.radius),
  '--platter-top': pctH(VINYL_PLAYER_PLATTER.centerY - VINYL_PLAYER_PLATTER.radius),
  '--platter-size': pctW(platterSize),
  '--vinyl-image-left': `${((-(VINYL_PLAYER_DISC_IN_IMAGE.centerX - VINYL_PLAYER_DISC_IN_IMAGE.radius) / discDiameter) * 100).toFixed(4)}%`,
  '--vinyl-image-top': `${((-(VINYL_PLAYER_DISC_IN_IMAGE.centerY - VINYL_PLAYER_DISC_IN_IMAGE.radius) / discDiameter) * 100).toFixed(4)}%`,
  '--vinyl-image-width': `${((CANVAS_W / discDiameter) * 100).toFixed(4)}%`,
  '--vinyl-image-height': `${((CANVAS_H / discDiameter) * 100).toFixed(4)}%`,
  '--pivot-left': pctW(VINYL_PLAYER_TONEARM_PIVOT.x),
  '--pivot-top': pctH(VINYL_PLAYER_TONEARM_PIVOT.y),
  '--vinyl-spin-ms': `${String(VINYL_SPIN_MS)}ms`,
  '--tonearm-swing-ms': `${String(TONEARM_SWING_MS)}ms`,
} as CSSProperties;

export interface VinylPlayerProps {
  /** Доступное имя; если задано — `role="img"`. */
  label?: string;
  className?: string;
  /**
   * Внешний «играет» (микшер в углу). `undefined` — управление только через ref.
   */
  externalPlaying?: boolean;
  /** Клик по деке = togglePlayback. */
  interactive?: boolean;
  /** После того как тонарм дошёл до пластинки и диск пошёл. */
  onPlaying?: () => void;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Чистый виниловый проигрыватель: только картинка и движение, без звука. Музыку ведёт
 * общая очередь приложения (`src/audio/playlist.ts`), поэтому она не привязана к тому,
 * жив ли этот компонент.
 *
 * VinylPlayer
 * ├── PlayerBody
 * ├── Platter → VinylRecord (+ RecordLabel на той же картинке)
 * ├── Tonearm (base + arm + head на одном PNG, pivot в основании)
 * └── InteractionLayer
 *
 * Состояния: IDLE | PLAYING | STOPPING.
 */
export const VinylPlayer = forwardRef<VinylPlayerHandle, VinylPlayerProps>(function VinylPlayer(
  { label, className, externalPlaying, interactive = false, onPlaying },
  ref,
): ReactElement {
  const [status, setStatus] = useState<VinylPlayerStatus>('IDLE');
  const [tonearmOnRecord, setTonearmOnRecord] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const statusRef = useRef<VinylPlayerStatus>('IDLE');
  const runIdRef = useRef(0);
  const onPlayingRef = useRef(onPlaying);
  onPlayingRef.current = onPlaying;
  const reduced = prefersReducedMotion();

  const setStatusSafe = useCallback((next: VinylPlayerStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const applyPlayingVisuals = useCallback(async () => {
    if (statusRef.current === 'PLAYING') {
      return;
    }
    const runId = ++runIdRef.current;
    setStatusSafe('PLAYING');
    setTonearmOnRecord(true);
    if (!reduced) {
      await wait(TONEARM_SWING_MS);
    }
    if (runId !== runIdRef.current) {
      return;
    }
    setSpinning(true);
    onPlayingRef.current?.();
  }, [reduced, setStatusSafe]);

  const applyIdleVisuals = useCallback(async () => {
    if (statusRef.current === 'IDLE') {
      return;
    }
    const runId = ++runIdRef.current;
    setStatusSafe('STOPPING');
    setSpinning(false);
    setTonearmOnRecord(false);
    if (!reduced) {
      await wait(TONEARM_SWING_MS);
    }
    if (runId !== runIdRef.current) {
      return;
    }
    setStatusSafe('IDLE');
  }, [reduced, setStatusSafe]);

  const playInternal = useCallback(async () => {
    await applyPlayingVisuals();
  }, [applyPlayingVisuals]);

  const stopInternal = useCallback(async () => {
    await applyIdleVisuals();
  }, [applyIdleVisuals]);

  const togglePlayback = useCallback(async () => {
    if (statusRef.current === 'PLAYING') {
      await stopInternal();
    } else if (statusRef.current === 'IDLE') {
      await playInternal();
    }
  }, [playInternal, stopInternal]);

  useImperativeHandle(
    ref,
    () => ({
      play: playInternal,
      stop: stopInternal,
      togglePlayback,
      getStatus: () => statusRef.current,
    }),
    [playInternal, stopInternal, togglePlayback],
  );

  // Микшер в углу ведёт проигрыватель снаружи: играет музыка — крутится пластинка.
  useEffect(() => {
    if (externalPlaying === undefined) {
      return;
    }
    if (externalPlaying) {
      void applyPlayingVisuals();
    } else {
      void applyIdleVisuals();
    }
  }, [externalPlaying, applyPlayingVisuals, applyIdleVisuals]);

  // Размонтирование обрывает незавершённые переходы состояний, звука здесь нет.
  useEffect(() => {
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  const hasLabel = label !== undefined;
  const tonearmAngle = tonearmOnRecord
    ? VINYL_PLAYER_TONEARM_PLAY_DEG
    : VINYL_PLAYER_TONEARM_REST_DEG;

  return (
    <div
      className={classNames(styles.player, className)}
      style={
        {
          ...geometryStyle,
          '--tonearm-angle': `${String(tonearmAngle)}deg`,
        } as CSSProperties
      }
      data-vinyl-player
      data-status={status}
      data-spinning={spinning ? 'true' : 'false'}
      data-turntable-canvas
      role={hasLabel ? 'img' : undefined}
      aria-label={label}
      aria-hidden={hasLabel ? undefined : true}
    >
      <img
        className={classNames(styles.layer, styles.body)}
        src={TURNTABLE_IMAGES['player-body']}
        alt=""
        decoding="async"
        draggable={false}
        data-vinyl-body
      />

      <div className={styles.platter} data-vinyl-platter>
        <div className={styles.vinyl} data-turntable-vinyl data-vinyl-record>
          <img
            className={styles.vinylImage}
            src={TURNTABLE_IMAGES.vinyl}
            alt=""
            decoding="async"
            draggable={false}
            data-vinyl-label
          />
        </div>
      </div>

      <div className={styles.tonearmPivot} data-turntable-tonearm data-vinyl-tonearm>
        <img
          className={styles.tonearmImage}
          src={TURNTABLE_IMAGES.tonearm}
          alt=""
          decoding="async"
          draggable={false}
        />
      </div>

      {interactive ? (
        <button
          type="button"
          className={styles.interaction}
          aria-label={status === 'PLAYING' ? 'Стоп' : 'Играть'}
          disabled={status === 'STOPPING'}
          onClick={() => {
            void togglePlayback();
          }}
        />
      ) : null}
    </div>
  );
});
