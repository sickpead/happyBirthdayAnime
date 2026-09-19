import { gsap } from 'gsap';
import { useEffect, useEffectEvent, useRef, type CSSProperties, type ReactElement } from 'react';

import { DESK_VIDEO_FADE_MS, DESK_VIDEO_START_TIMEOUT_MS } from '../constants/deskTimings';
import { EASINGS } from '../constants/timings';
import { classNames } from '../utils/classNames';
import { msToSeconds } from '../utils/time';
import styles from './DeskTransitionVideo.module.css';

/**
 * Этап видео-перехода: `playing` — ролик идёт; `last-frame` — доиграл и стоит на последнем
 * кадре, пока картинку стадии показывает её собственный переход (затемнение, облака);
 * `finishing` — стадия уже подменена под роликом, и он гаснет.
 */
export type DeskVideoPhase = 'playing' | 'last-frame' | 'finishing';

/** Пропсы {@link DeskTransitionVideo}. */
export interface DeskTransitionVideoProps {
  /** URL ролика. */
  src: string;
  /** Этап перехода (см. {@link DeskVideoPhase}). */
  phase: DeskVideoPhase;
  /**
   * Пропорции кадра, к которому ведёт ролик, — те же, что у картинки новой стадии, чтобы
   * последний кадр ролика и картинка были кадрированы одинаково.
   */
  frameAspectRatio: number;
  /** Ролик доиграл до конца: пора показывать картинку новой стадии. */
  onEnded: () => void;
  /** Ролик догорел поверх новой стадии — можно убирать. */
  onFinished: () => void;
  /** Ролик не смог начаться (нет файла, ошибка, заблокированный автоплей) — нужен запасной переход. */
  onUnavailable: () => void;
  /** Класс корня: положение и слой наложения задаёт владелец. */
  className?: string;
}

type FrameStyle = CSSProperties & Record<'--frame-aspect-ratio', string>;

/**
 * Ролик-переход между стадиями сцены Desk: полноэкранное видео поверх текущей картинки.
 * Играет один раз от начала до конца; его длительность и есть длительность перехода.
 * Дальше — по `transitionIn` стадии, к которой он ведёт: если ролик заканчивается её кадром,
 * стадия подменяется прямо под ним, а ролик коротко гаснет (`DESK_VIDEO_FADE_MS`, страховка
 * от рывка на стыке; так же коротко он и появляется); если стадию показывает затемнение или
 * облака, ролик стоит на последнем кадре, пока они закрывают экран.
 *
 * Если воспроизведение не началось за `DESK_VIDEO_START_TIMEOUT_MS` или случилась ошибка,
 * компонент сообщает об этом через `onUnavailable`, и сцена делает переход запасным путём —
 * перетеканием. Звука у ролика нет (`muted`), управления тоже.
 */
export function DeskTransitionVideo({
  src,
  phase,
  frameAspectRatio,
  onEnded,
  onFinished,
  onUnavailable,
  className,
}: DeskTransitionVideoProps): ReactElement {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const notifyFinished = useEffectEvent(onFinished);
  const notifyUnavailable = useEffectEvent(onUnavailable);
  const style: FrameStyle = { '--frame-aspect-ratio': String(frameAspectRatio) };

  // Запуск ролика и страховка: не начался вовремя — сцена идёт запасным путём.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== 'playing') {
      return;
    }

    let isActive = true;
    const giveUp = window.setTimeout(() => {
      if (isActive) {
        notifyUnavailable();
      }
    }, DESK_VIDEO_START_TIMEOUT_MS);
    const cancelGiveUp = (): void => {
      window.clearTimeout(giveUp);
    };
    video.addEventListener('playing', cancelGiveUp, { once: true });
    void video.play().catch(() => {
      // Автоплей заблокирован или файл не проигрывается.
      if (isActive) {
        notifyUnavailable();
      }
    });

    return () => {
      isActive = false;
      window.clearTimeout(giveUp);
      video.removeEventListener('playing', cancelGiveUp);
    };
  }, [phase, src]);

  // Появление поверх текущей стадии и уход с последнего кадра — у кадра целиком,
  // на нём же стоит начальная прозрачность в CSS-модуле.
  // На `last-frame` ролик просто стоит: его закрывает переход самой стадии.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || phase === 'last-frame') {
      return;
    }

    const duration = msToSeconds(DESK_VIDEO_FADE_MS);
    const fade =
      phase === 'finishing'
        ? gsap.to(frame, {
            autoAlpha: 0,
            duration,
            ease: EASINGS.fade,
            onComplete: () => {
              notifyFinished();
            },
          })
        : gsap.fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: EASINGS.fade });

    return () => {
      fade.kill();
    };
  }, [phase]);

  return (
    <div
      ref={frameRef}
      className={classNames(styles.frame, className)}
      style={style}
      data-desk-transition-video
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        muted
        autoPlay
        playsInline
        preload="auto"
        aria-hidden="true"
        onEnded={onEnded}
        onError={onUnavailable}
      />
    </div>
  );
}
