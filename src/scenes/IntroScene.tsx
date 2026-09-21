import { gsap } from 'gsap';
import { useCallback, useLayoutEffect, useRef, useState, type ReactElement } from 'react';

import * as audioManager from '../audio/audioManager';
import { preloadBackgroundMusic, startBackgroundMusic } from '../audio/playlist';
import { IntroCloudCover } from '../components/IntroCloudCover';
import { SkyAmbientBackdrop } from '../components/SkyAmbientBackdrop';
import { VinylPlayer, type VinylPlayerHandle } from '../components/vinylPlayer';
import { INTRO_TEXT } from '../constants/copy';
import {
  CLOSE_AUDIO_FADE_MS,
  CRACKLE_FADE_IN_MS,
  CRACKLE_TARGET_VOLUME,
  INVITE_PULSE_HALF_CYCLE_MS,
  INVITE_PULSE_MIN_OPACITY,
  INVITE_PULSE_SCALE,
  NEEDLE_DROP_SFX_VOLUME,
  SONG_FADE_IN_MS,
  SONG_START_VOLUME,
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
 * Сцена Intro. Облака / переход — как раньше.
 * Проигрыватель — новый VinylPlayer: тонарм, диск и Happy Birthday внутри него.
 */
export default function IntroScene({ onTurntableDocked }: IntroSceneProps): ReactElement {
  const rootRef = useRef<HTMLElement>(null);
  const playerRef = useRef<VinylPlayerHandle>(null);
  const animationContextRef = useRef<gsap.Context | null>(null);
  const hasStartedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCurtainOpen, setCurtainOpen] = useState(false);
  const [isDeckInFront, setDeckInFront] = useState(false);
  const { transitionToScene } = useSceneTransition();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    audioManager.preloadAudio();
    // Песня вступления — первая дорожка фоновой очереди: её файл нужен уже через несколько
    // секунд, остальные дорожки подгружаются, только когда до них дойдёт очередь.
    preloadBackgroundMusic();

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
        onCurtainOpened: () => {
          setDeckInFront(true);
        },
        onStartPlayer: () => {
          void playerRef.current?.play();
        },
        onNeedleLanded: () => {
          audioManager.playOnce('needle-drop', { volume: NEEDLE_DROP_SFX_VOLUME });
          audioManager.playCrackle({ volume: CRACKLE_TARGET_VOLUME, fadeInMs: CRACKLE_FADE_IN_MS });
        },
        onSongStart: () => {
          // Музыка принадлежит приложению, а не сцене: очередь заводится здесь один раз
          // и дальше играет сама — вступление её уже не останавливает.
          startBackgroundMusic({
            fromVolume: SONG_START_VOLUME,
            toVolume: SONG_TARGET_VOLUME,
            fadeMs: SONG_FADE_IN_MS,
          });
        },
        onCloseStart: () => {
          // Проигрыватель не останавливаем: музыка продолжается, значит и пластинка должна
          // крутиться — он уезжает в угол играющим и таким же «приземляется» в иконку.
          // Затихает только виниловый треск, звук самой сцены.
          audioManager.fadeOutSceneTracks(CLOSE_AUDIO_FADE_MS);
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
      <div className={styles.stage} data-deck-front={isDeckInFront}>
        <div className={styles.deck} data-intro-deck>
          <VinylPlayer ref={playerRef} label={INTRO_TEXT.turntableLabel} />
        </div>
      </div>
      <IntroCloudCover className={styles.cover} hasStarted={hasStarted} onStart={handleStart} />
    </section>
  );
}
