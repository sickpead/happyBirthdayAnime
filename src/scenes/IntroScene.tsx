import { gsap } from 'gsap';
import { useCallback, useLayoutEffect, useRef, useState, type ReactElement } from 'react';

import * as audioManager from '../audio/audioManager';
import { IntroCloudCover } from '../components/IntroCloudCover';
import { SkyAmbientBackdrop } from '../components/SkyAmbientBackdrop';
import { TurntableArt } from '../components/TurntableArt';
import { INTRO_TEXT } from '../constants/copy';
import {
  CLOSE_AUDIO_FADE_MS,
  CLOSE_AUDIO_TARGET_VOLUME,
  CRACKLE_FADE_IN_MS,
  CRACKLE_TARGET_VOLUME,
  INVITE_PULSE_HALF_CYCLE_MS,
  INVITE_PULSE_MIN_OPACITY,
  INVITE_PULSE_SCALE,
  NEEDLE_DROP_SFX_VOLUME,
  SONG_FADE_IN_MS,
  SONG_TARGET_VOLUME,
} from '../constants/introTimings';
import { NEXT_SCENE } from '../constants/scenes';
import { EASINGS } from '../constants/timings';
import { useSceneTransition } from '../hooks/useSceneTransition';
import type { IntroSceneProps } from '../types';
import { prefersReducedMotion } from '../utils/motion';
import { msToSeconds } from '../utils/time';
import styles from './IntroScene.module.css';
import { createIntroTimeline, INTRO_SELECTORS } from './introTimeline';

/**
 * Сцена «Intro». Экран закрыт облаками с поздравлением. Клик по приглашению — единственный
 * жест пользователя, он же разблокирует звук — запускает сценарий одним таймлайном GSAP:
 * облака расходятся, проигрыватель появляется из темноты, тонарм поворачивается к пластинке,
 * игла касается её — пластинка начинает вращаться и звучат треск и песня; затем облака
 * закрываются, проигрыватель уезжает в угол, и общий переход ведёт к следующей сцене.
 * Тайминги и громкости — в `src/constants/introTimings.ts`.
 *
 * Default export — соглашение для модулей сцен: любую из них можно подключить через `React.lazy`.
 */
export default function IntroScene({ onTurntableDocked }: IntroSceneProps): ReactElement {
  const rootRef = useRef<HTMLElement>(null);
  const animationContextRef = useRef<gsap.Context | null>(null);
  // Синхронная защита от двойного клика: состояние обновится только после ререндера.
  const hasStartedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  // Открыт ли облачный занавес: с клика (облака расходятся) до начала закрытия в финале.
  // Пока он открыт, на небе позади деки видны мягкие облака.
  const [isCurtainOpen, setCurtainOpen] = useState(false);
  const { transitionToScene } = useSceneTransition();

  // Предзагрузка звука и пульсация приглашения. Всё, что создано в GSAP-контексте
  // (включая таймлайн сценария, добавленный по клику), откатывается при размонтировании.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    audioManager.preloadAudio();

    const context = gsap.context(() => {
      if (!prefersReducedMotion()) {
        gsap.to(INTRO_SELECTORS.invite, {
          opacity: INVITE_PULSE_MIN_OPACITY,
          scale: INVITE_PULSE_SCALE,
          duration: msToSeconds(INVITE_PULSE_HALF_CYCLE_MS),
          ease: EASINGS.pulse,
          repeat: -1,
          yoyo: true,
        });
      }
    }, root);
    animationContextRef.current = context;

    return () => {
      context.revert();
      animationContextRef.current = null;
    };
  }, []);

  const handleStart = useCallback(() => {
    const root = rootRef.current;
    const context = animationContextRef.current;
    if (root === null || context === null || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    setHasStarted(true);
    setCurtainOpen(true);

    context.add(() => {
      createIntroTimeline(root, {
        onNeedleLanded: () => {
          audioManager.playOnce('needle-drop', { volume: NEEDLE_DROP_SFX_VOLUME });
          audioManager.playCrackle({ volume: CRACKLE_TARGET_VOLUME, fadeInMs: CRACKLE_FADE_IN_MS });
        },
        onSongStart: () => {
          audioManager.playSong({ volume: SONG_TARGET_VOLUME, fadeInMs: SONG_FADE_IN_MS });
        },
        onCloseStart: () => {
          audioManager.fadeAll(CLOSE_AUDIO_TARGET_VOLUME, CLOSE_AUDIO_FADE_MS);
          setCurtainOpen(false);
        },
        onDocked: onTurntableDocked,
        onComplete: () => {
          transitionToScene(NEXT_SCENE.intro);
        },
      });
    });
  }, [onTurntableDocked, transitionToScene]);

  return (
    <section ref={rootRef} className={styles.scene}>
      <SkyAmbientBackdrop visible={isCurtainOpen} />
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={styles.stage}>
        <div className={styles.deck} data-intro-deck>
          {/* Вращением пластинки в intro управляет таймлайн GSAP, поэтому CSS-вращение выключено. */}
          <TurntableArt isVinylSpinning={false} label={INTRO_TEXT.turntableLabel} />
        </div>
      </div>
      <IntroCloudCover className={styles.cover} hasStarted={hasStarted} onStart={handleStart} />
    </section>
  );
}
