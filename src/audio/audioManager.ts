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
import { VINYL_TRACKS } from '../constants/vinylTracks';
import type { AudioTrackId, FadeInOptions, PlayOnceOptions, PlaylistStatus } from '../types';
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

/* ── Дорожки проигрывателя (микшер) ───────────────────────────────────── */

/**
 * Дорожки проигрывателя живут отдельно от дорожек сцен: их список задаёт автор в
 * `vinylTracks.ts`, поэтому они не попадают в типизированный `AudioTrackId`. Играют
 * потоково (html5) и по одной: новая дорожка останавливает предыдущую.
 */
const playlistTracks = new Map<string, Howl>();

/** Дорожка проигрывателя, которая играет или стоит на паузе. */
let playingPlaylist: {
  src: string;
  howl: Howl;
  soundId: number;
  status: 'playing' | 'paused';
} | null = null;

/** Громкость проигрывателя 0–1; фоновые дорожки сцен она не трогает. */
let playlistVolume = FULL_VOLUME;

/** Подписчики на смену дорожки, паузы и выключения. */
const playlistListeners = new Set<() => void>();

function notifyPlaylistListeners(): void {
  for (const listener of playlistListeners) {
    listener();
  }
}

/**
 * Подписывает на смену дорожки проигрывателя: запуск, паузу, перемотку и выключение.
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

/** Возвращает фоновым дорожкам сцен их громкость после дорожки проигрывателя. */
function unduckScenes(): void {
  fadeAll(FULL_VOLUME, DUCK_FADE_MS);
}

function indexOfPlaylistSrc(src: string): number {
  return VINYL_TRACKS.findIndex((track) => track.src === src);
}

function playlistSrcAt(index: number): string | null {
  if (VINYL_TRACKS.length === 0) {
    return null;
  }
  const wrapped = ((index % VINYL_TRACKS.length) + VINYL_TRACKS.length) % VINYL_TRACKS.length;
  return VINYL_TRACKS[wrapped]?.src ?? null;
}

function haltPlaylistSound(): void {
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
}

/** URL выбранной дорожки проигрывателя — и когда играет, и когда на паузе. */
export function getPlayingPlaylistTrack(): string | null {
  return playingPlaylist?.src ?? null;
}

/** Играет ли проигрыватель, стоит на паузе или выключен. */
export function getPlaylistStatus(): PlaylistStatus {
  return playingPlaylist?.status ?? 'idle';
}

/** Позиция и длина текущей дорожки, секунды. Нет дорожки — нули. */
export function getPlaylistProgress(): { currentTime: number; duration: number } {
  if (playingPlaylist === null) {
    return { currentTime: 0, duration: 0 };
  }
  const duration = playingPlaylist.howl.duration();
  const seek = playingPlaylist.howl.seek(playingPlaylist.soundId);
  return {
    currentTime: typeof seek === 'number' && Number.isFinite(seek) ? seek : 0,
    duration: Number.isFinite(duration) ? duration : 0,
  };
}

/** Громкость проигрывателя 0–1. */
export function getPlaylistVolume(): number {
  return playlistVolume;
}

/**
 * Ставит громкость проигрывателя. Фоновые дорожки сцен не меняются.
 *
 * @param volume - Целевая громкость 0–1.
 */
export function setPlaylistVolume(volume: number): void {
  playlistVolume = Math.min(Math.max(volume, 0), FULL_VOLUME);
  const current = playingPlaylist;
  if (current !== null) {
    try {
      current.howl.volume(playlistVolume, current.soundId);
    } catch (error) {
      devWarn(LOG_SCOPE, 'Ошибка громкости дорожки плейлиста', error);
    }
  }
  notifyPlaylistListeners();
}

/**
 * Перематывает текущую дорожку. Без выбранной дорожки или без известной длины — ничего.
 *
 * @param seconds - Позиция в секундах.
 */
export function seekPlaylistTrack(seconds: number): void {
  const current = playingPlaylist;
  if (current === null) {
    return;
  }
  const duration = current.howl.duration();
  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }
  try {
    current.howl.seek(Math.min(Math.max(seconds, 0), duration), current.soundId);
  } catch (error) {
    devWarn(LOG_SCOPE, 'Ошибка перемотки дорожки плейлиста', error);
  }
  notifyPlaylistListeners();
}

/** Ставит текущую дорожку на паузу. Фоновые дорожки сцен остаются приглушёнными. */
export function pausePlaylistTrack(): void {
  const current = playingPlaylist;
  if (current?.status !== 'playing') {
    return;
  }
  try {
    current.howl.pause(current.soundId);
  } catch (error) {
    devWarn(LOG_SCOPE, 'Ошибка паузы дорожки плейлиста', error);
    return;
  }
  current.status = 'paused';
  notifyPlaylistListeners();
  devLog(LOG_SCOPE, `pause плейлист «${current.src}»`);
}

/** Снимает паузу с текущей дорожки. */
export function resumePlaylistTrack(): void {
  const current = playingPlaylist;
  if (current?.status !== 'paused') {
    return;
  }
  try {
    current.howl.play(current.soundId);
  } catch (error) {
    devWarn(LOG_SCOPE, 'Ошибка продолжения дорожки плейлиста', error);
    return;
  }
  current.status = 'playing';
  notifyPlaylistListeners();
  devLog(LOG_SCOPE, `resume плейлист «${current.src}»`);
}

/** Выключает проигрыватель и возвращает громкость фоновым дорожкам сцен. */
export function stopPlaylistTrack(): void {
  const current = playingPlaylist;
  if (current === null) {
    return;
  }
  haltPlaylistSound();
  unduckScenes();
  notifyPlaylistListeners();
  devLog(LOG_SCOPE, `stop плейлист «${current.src}»`);
}

/**
 * Включает дорожку проигрывателя с начала. Предыдущая останавливается, фоновые дорожки
 * сцен приглушаются, пока микшер не выключат. Конец дорожки включает следующую по кругу.
 * О смене узнают подписчики {@link subscribePlaylistTrack}.
 *
 * @param src - URL файла дорожки.
 */
export function playPlaylistTrack(src: string): void {
  haltPlaylistSound();
  try {
    const howl = getPlaylistTrack(src);
    howl.volume(playlistVolume);
    const soundId = howl.play();
    playingPlaylist = { src, howl, soundId, status: 'playing' };
    howl.once(
      'end',
      () => {
        if (playingPlaylist?.soundId !== soundId) {
          return;
        }
        const endedSrc = playingPlaylist.src;
        playingPlaylist = null;
        const index = indexOfPlaylistSrc(endedSrc);
        const nextSrc = playlistSrcAt(index + 1);
        if (nextSrc === null) {
          unduckScenes();
          notifyPlaylistListeners();
          return;
        }
        playPlaylistTrack(nextSrc);
      },
      soundId,
    );
    fadeAll(DUCKED_VOLUME, DUCK_FADE_MS);
    notifyPlaylistListeners();
    devLog(LOG_SCOPE, `play плейлист «${src}»`);
  } catch (error) {
    playingPlaylist = null;
    unduckScenes();
    notifyPlaylistListeners();
    devWarn(LOG_SCOPE, `Ошибка воспроизведения дорожки плейлиста (${src})`, error);
  }
}

/** Включает следующую дорожку по кругу. Если ничего не играет — первую в списке. */
export function playNextPlaylistTrack(): void {
  if (VINYL_TRACKS.length === 0) {
    return;
  }
  const currentSrc = playingPlaylist?.src;
  if (currentSrc === undefined) {
    const first = VINYL_TRACKS[0];
    if (first !== undefined) {
      playPlaylistTrack(first.src);
    }
    return;
  }
  const nextSrc = playlistSrcAt(indexOfPlaylistSrc(currentSrc) + 1);
  if (nextSrc !== null) {
    playPlaylistTrack(nextSrc);
  }
}

/** Включает предыдущую дорожку по кругу. Если ничего не играет — последнюю в списке. */
export function playPreviousPlaylistTrack(): void {
  if (VINYL_TRACKS.length === 0) {
    return;
  }
  const currentSrc = playingPlaylist?.src;
  if (currentSrc === undefined) {
    const last = VINYL_TRACKS[VINYL_TRACKS.length - 1];
    if (last !== undefined) {
      playPlaylistTrack(last.src);
    }
    return;
  }
  const previousSrc = playlistSrcAt(indexOfPlaylistSrc(currentSrc) - 1);
  if (previousSrc !== null) {
    playPlaylistTrack(previousSrc);
  }
}

/**
 * Играть / пауза / продолжить: если ничего не выбрано — включает первую дорожку.
 * Нет дорожек в списке — ничего не делает.
 */
export function togglePlaylistPlayback(): void {
  const status = getPlaylistStatus();
  if (status === 'playing') {
    pausePlaylistTrack();
    return;
  }
  if (status === 'paused') {
    resumePlaylistTrack();
    return;
  }
  const first = VINYL_TRACKS[0];
  if (first !== undefined) {
    playPlaylistTrack(first.src);
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
