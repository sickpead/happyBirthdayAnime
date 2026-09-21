/**
 * Типизированная обёртка над Howler для звуков сцен — иглы и винилового треска.
 * Компоненты и хуки не создают `Howl` напрямую, а вызывают функции этого модуля.
 *
 * Музыка здесь не живёт: она общая для всего приложения и лежит в `./playlist.ts`,
 * поэтому смена сцены её не касается.
 *
 * - Экземпляры `Howl` создаются лениво и кэшируются по дорожке. `preloadAudio()` создаёт
 *   их заранее: файлы начинают грузиться, а Howler вешает разблокировку звука на первый
 *   пользовательский жест (клик по приглашению в intro).
 * - Длинный треск играет через HTML5 Audio потоково — без декодирования всего файла
 *   в память; короткий звук иглы — через Web Audio с минимальной задержкой.
 * - Ни одна ошибка загрузки или воспроизведения не роняет сцену: только предупреждение
 *   в dev-консоли.
 */
import { Howl } from 'howler';

import { AUDIO_SOURCES, AUDIO_TRACK_IDS } from '../constants/assets';
import type { AudioTrackId, FadeInOptions, PlayOnceOptions } from '../types';
import { devLog, devWarn } from '../utils/devLog';
import { stopPlaylist } from './playlist';

const LOG_SCOPE = 'audio';
const FULL_VOLUME = 1;

interface TrackSettings {
  /** Зациклить дорожку. */
  loop: boolean;
  /** Играть через HTML5 Audio (потоково) вместо Web Audio. */
  html5: boolean;
}

const TRACK_SETTINGS: Readonly<Record<AudioTrackId, TrackSettings>> = {
  'needle-drop': { loop: false, html5: false },
  crackle: { loop: true, html5: true },
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
 * Плавно меняет громкость всех играющих дорожек сцены (сейчас это треск).
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

/** Останавливает дорожки сцен (треск, игла), не трогая фоновую музыку. */
function stopSceneTracks(): void {
  tracks.forEach((howl, trackId) => {
    safely(trackId, () => {
      howl.stop();
    });
  });
  activeSounds.clear();
}

/**
 * Плавно уводит дорожки сцены в тишину и останавливает их: приглушённый, но всё ещё
 * играющий зацикленный треск — это звук, который «никогда не кончается». Фоновой музыки
 * это не касается, она живёт своей жизнью в `./playlist.ts`.
 *
 * @param durationMs - Длительность затухания.
 */
export function fadeOutSceneTracks(durationMs: number): void {
  fadeAll(0, durationMs);
  window.setTimeout(() => {
    stopSceneTracks();
    devLog(LOG_SCOPE, 'fadeOutSceneTracks: дорожки сцены остановлены');
  }, durationMs);
}

/**
 * Немедленно останавливает весь звук, включая фоновую музыку. Вызывается, только когда
 * уходит всё приложение. Безопасно вызывать многократно.
 */
export function stopAll(): void {
  stopSceneTracks();
  stopPlaylist();
}

// HMR (только dev): при горячей замене модуля старые экземпляры Howl не должны продолжать играть.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopAll();
    tracks.forEach((howl) => {
      howl.unload();
    });
    tracks.clear();
  });
}
