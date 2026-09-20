/**
 * Типизированная обёртка над Howler — единственная точка работы со звуком в приложении.
 * Компоненты и хуки не создают `Howl` напрямую, а вызывают функции этого модуля.
 *
 * - Экземпляры `Howl` создаются лениво и кэшируются по дорожке. `preloadAudio()` создаёт
 *   их заранее: файлы начинают грузиться, а Howler вешает разблокировку звука на первый
 *   пользовательский жест (клик по приглашению в intro).
 * - Длинные дорожки (треск, песня) играют через HTML5 Audio потоково — без декодирования
 *   всего файла в память; короткий звук иглы — через Web Audio с минимальной задержкой.
 * - Ни одна ошибка загрузки или воспроизведения не роняет сцену: только предупреждение
 *   в dev-консоли.
 */
import { Howl } from 'howler';

import { AUDIO_SOURCES, AUDIO_TRACK_IDS } from '../constants/assets';
import type { AudioTrackId, FadeInOptions, PlayOnceOptions } from '../types';
import { devLog, devWarn } from '../utils/devLog';

const LOG_SCOPE = 'audio';
const FULL_VOLUME = 1;

/** Пока играет дорожка из плейлиста, фоновые дорожки сцен приглушаются до тишины. */
const DUCKED_VOLUME = 0;
const DUCK_FADE_MS = 400;

interface TrackSettings {
  /** Зациклить дорожку. */
  loop: boolean;
  /** Играть через HTML5 Audio (потоково) вместо Web Audio. */
  html5: boolean;
}

const TRACK_SETTINGS: Readonly<Record<AudioTrackId, TrackSettings>> = {
  'needle-drop': { loop: false, html5: false },
  crackle: { loop: true, html5: true },
  // Песня длиннее intro и дальше звучит фоном в следующих сценах — поэтому зациклена.
  song: { loop: true, html5: true },
};

/** Созданные экземпляры Howl по дорожкам. */
const tracks = new Map<AudioTrackId, Howl>();

/** Id текущего звука «фоновых» дорожек (треск, песня) — для фейдов и защиты от дублей. */
const activeSounds = new Map<AudioTrackId, number>();

/** Возвращает (при необходимости создаёт) экземпляр Howl для дорожки. */
function getTrack(trackId: AudioTrackId): Howl {
  const cached = tracks.get(trackId);
  if (cached) {
    return cached;
  }

  const { loop, html5 } = TRACK_SETTINGS[trackId];
  const src = AUDIO_SOURCES[trackId];
  const howl = new Howl({
    src: [src],
    loop,
    html5,
    preload: true,
    onloaderror: (_soundId, error) => {
      devWarn(LOG_SCOPE, `Не удалось загрузить «${trackId}» (${src})`, error);
    },
    onplayerror: (soundId, error) => {
      devWarn(
        LOG_SCOPE,
        `Браузер не дал воспроизвести «${trackId}», повтор после разблокировки`,
        error,
      );
      howl.once('unlock', () => {
        howl.play(soundId);
      });
    },
  });
  tracks.set(trackId, howl);
  return howl;
}

/** Выполняет действие со звуком так, чтобы исключение не уронило сцену. */
function safely(trackId: AudioTrackId, action: () => void): void {
  try {
    action();
  } catch (error) {
    devWarn(LOG_SCOPE, `Ошибка воспроизведения «${trackId}»`, error);
  }
}

/** Текущая громкость конкретного звука дорожки. */
function getSoundVolume(howl: Howl, soundId: number): number {
  const volume = howl.volume(soundId);
  return typeof volume === 'number' ? volume : howl.volume();
}

/**
 * Запускает фоновую дорожку с нарастанием громкости (нативный фейд Howler).
 * Если дорожка уже играет, второй экземпляр не создаётся — громкость плавно ведётся к новой.
 */
function playWithFadeIn(
  trackId: AudioTrackId,
  { volume = FULL_VOLUME, fadeInMs = 0 }: FadeInOptions = {},
): void {
  safely(trackId, () => {
    const howl = getTrack(trackId);
    const currentId = activeSounds.get(trackId);
    if (currentId !== undefined && howl.playing(currentId)) {
      howl.fade(getSoundVolume(howl, currentId), volume, fadeInMs, currentId);
      return;
    }

    // Новый звук наследует громкость группы — задаём её до play(), чтобы HTML5 Audio не успел
    // прозвучать на полной громкости. Трогать volume/fade сразу после play() нельзя: пока
    // браузер не подтвердил старт, Howler ставит их в очередь, которая после старта не
    // разбирается. Поэтому фейд запускается по событию 'play' этого звука.
    const shouldFade = fadeInMs > 0;
    howl.volume(shouldFade ? 0 : volume);
    const soundId = howl.play();
    activeSounds.set(trackId, soundId);
    if (shouldFade) {
      howl.once(
        'play',
        () => {
          howl.fade(0, volume, fadeInMs, soundId);
        },
        soundId,
      );
    }
    devLog(LOG_SCOPE, `play «${trackId}»`, { volume, fadeInMs });
  });
}

/**
 * Создаёт экземпляры всех дорожек заранее: файлы начинают грузиться, и Howler успевает
 * повесить разблокировку звука на первый пользовательский жест. Безопасно вызывать многократно.
 */
export function preloadAudio(): void {
  for (const trackId of AUDIO_TRACK_IDS) {
    safely(trackId, () => {
      getTrack(trackId);
    });
  }
}

/**
 * Воспроизводит дорожку один раз — без зацикливания и без фейда (короткие звуки вроде иглы).
 *
 * @param trackId - Дорожка, например `'needle-drop'`.
 * @param options - Громкость воспроизведения.
 */
export function playOnce(
  trackId: AudioTrackId,
  { volume = FULL_VOLUME }: PlayOnceOptions = {},
): void {
  safely(trackId, () => {
    const howl = getTrack(trackId);
    // Громкость группы — до play() (см. playWithFadeIn: volume сразу после play() ненадёжен).
    howl.volume(volume);
    const soundId = howl.play();
    howl.loop(false, soundId);
    devLog(LOG_SCOPE, `playOnce «${trackId}»`, { volume });
  });
}

/**
 * Запускает зацикленный виниловый треск.
 *
 * @param options - Целевая громкость и длительность нарастания от нуля.
 */
export function playCrackle(options?: FadeInOptions): void {
  playWithFadeIn('crackle', options);
}

/**
 * Запускает основную песню. Она зациклена: после intro продолжает звучать фоном в следующих сценах.
 *
 * @param options - Целевая громкость и длительность нарастания от нуля.
 */
export function playSong(options?: FadeInOptions): void {
  playWithFadeIn('song', options);
}

/**
 * Плавно меняет громкость всех играющих фоновых дорожек (треск, песня).
 *
 * @param volume - Целевая громкость в диапазоне 0–1.
 * @param durationMs - Длительность фейда в миллисекундах.
 */
export function fadeAll(volume: number, durationMs: number): void {
  activeSounds.forEach((soundId, trackId) => {
    safely(trackId, () => {
      const howl = tracks.get(trackId);
      if (howl?.playing(soundId)) {
        howl.fade(getSoundVolume(howl, soundId), volume, durationMs, soundId);
      }
    });
  });
  devLog(LOG_SCOPE, 'fadeAll', { volume, durationMs });
}

/* ── Дорожки из стопки пластинок ──────────────────────────────────────── */

/**
 * Дорожки плейлиста живут отдельно от дорожек сцен: их список задаёт автор в
 * `vinylTracks.ts`, поэтому они не попадают в типизированный `AudioTrackId`. Играют
 * потоково (html5) и по одной: новая дорожка останавливает предыдущую.
 */
const playlistTracks = new Map<string, Howl>();

/** Дорожка плейлиста, которая играет сейчас, и её звук. */
let playingPlaylist: { src: string; howl: Howl; soundId: number } | null = null;

/** Подписчики на смену играющей дорожки плейлиста (список дорожек в модалке). */
const playlistListeners = new Set<() => void>();

function notifyPlaylistListeners(): void {
  for (const listener of playlistListeners) {
    listener();
  }
}

/**
 * Подписывает на смену играющей дорожки плейлиста: запуск, остановку и конец дорожки.
 *
 * @param listener - Вызывается после каждой смены.
 * @returns Функция отписки.
 */
export function subscribePlaylistTrack(listener: () => void): () => void {
  playlistListeners.add(listener);
  return () => {
    playlistListeners.delete(listener);
  };
}

function getPlaylistTrack(src: string): Howl {
  const cached = playlistTracks.get(src);
  if (cached) {
    return cached;
  }
  const howl = new Howl({
    src: [src],
    html5: true,
    preload: false,
    onloaderror: (_soundId, error) => {
      devWarn(LOG_SCOPE, `Не удалось загрузить дорожку плейлиста (${src})`, error);
    },
    onplayerror: (soundId, error) => {
      devWarn(LOG_SCOPE, `Браузер не дал воспроизвести дорожку плейлиста (${src})`, error);
      howl.once('unlock', () => {
        howl.play(soundId);
      });
    },
  });
  playlistTracks.set(src, howl);
  return howl;
}

/** Возвращает фоновым дорожкам сцен их громкость после дорожки плейлиста. */
function unduckScenes(): void {
  fadeAll(FULL_VOLUME, DUCK_FADE_MS);
}

/** Дорожка плейлиста, которая играет сейчас, или `null`. */
export function getPlayingPlaylistTrack(): string | null {
  return playingPlaylist?.src ?? null;
}

/** Останавливает дорожку плейлиста и возвращает громкость фоновым дорожкам сцен. */
export function stopPlaylistTrack(): void {
  const current = playingPlaylist;
  if (current === null) {
    return;
  }
  playingPlaylist = null;
  try {
    current.howl.stop(current.soundId);
  } catch (error) {
    devWarn(LOG_SCOPE, 'Ошибка остановки дорожки плейлиста', error);
  }
  unduckScenes();
  notifyPlaylistListeners();
  devLog(LOG_SCOPE, `stop плейлист «${current.src}»`);
}

/**
 * Включает дорожку плейлиста. Предыдущая останавливается, фоновые дорожки сцен
 * приглушаются, пока она играет, и возвращаются, когда дорожка кончилась или остановлена.
 * О смене дорожки узнают подписчики {@link subscribePlaylistTrack}.
 *
 * @param src - URL файла дорожки.
 */
export function playPlaylistTrack(src: string): void {
  stopPlaylistTrack();
  try {
    const howl = getPlaylistTrack(src);
    const soundId = howl.play();
    playingPlaylist = { src, howl, soundId };
    howl.once(
      'end',
      () => {
        if (playingPlaylist?.soundId === soundId) {
          playingPlaylist = null;
          unduckScenes();
          notifyPlaylistListeners();
        }
      },
      soundId,
    );
    fadeAll(DUCKED_VOLUME, DUCK_FADE_MS);
    notifyPlaylistListeners();
    devLog(LOG_SCOPE, `play плейлист «${src}»`);
  } catch (error) {
    devWarn(LOG_SCOPE, `Ошибка воспроизведения дорожки плейлиста (${src})`, error);
  }
}

/** Немедленно останавливает все дорожки. Безопасно вызывать многократно. */
export function stopAll(): void {
  tracks.forEach((howl, trackId) => {
    safely(trackId, () => {
      howl.stop();
    });
  });
  activeSounds.clear();
  const hadPlaylist = playingPlaylist !== null;
  playingPlaylist = null;
  playlistTracks.forEach((howl) => {
    try {
      howl.stop();
    } catch (error) {
      devWarn(LOG_SCOPE, 'Ошибка остановки дорожки плейлиста', error);
    }
  });
  if (hadPlaylist) {
    notifyPlaylistListeners();
  }
}

// HMR (только dev): при горячей замене модуля старые экземпляры Howl не должны продолжать играть.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopAll();
    tracks.forEach((howl) => {
      howl.unload();
    });
    tracks.clear();
    playlistTracks.forEach((howl) => {
      howl.unload();
    });
    playlistTracks.clear();
  });
}
