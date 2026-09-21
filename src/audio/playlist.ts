/**
 * Фоновая музыка приложения: очередь дорожек из `src/constants/vinylTracks.ts`.
 *
 * Очередь не принадлежит ни одной сцене — она запускается во вступлении (первая дорожка,
 * та самая песня) и дальше играет сама: дорожка кончилась — начинается следующая по списку,
 * после последней круг повторяется без открывающей песни (она звучит один раз, в начале).
 * Сцены только меняют громкость (`setBackgroundMusicVolume`), а гость может выбрать дорожку
 * в стопке пластинок (`playPlaylistTrack`) — после неё очередь продолжается со следующей.
 *
 * Дорожки играют потоково (html5) и по одной. Экземпляры `Howl` создаются лениво и только
 * для той дорожки, которая нужна прямо сейчас: весь список в память не тянется. Дорожка,
 * которая не загрузилась, пропускается — очередь на ней не встаёт.
 */
import { Howl } from 'howler';

import {
  BACKGROUND_MUSIC_VOLUME,
  SELECTED_TRACK_VOLUME,
  TRACK_CROSSFADE_MS,
} from '../constants/audioMix';
import { VINYL_TRACKS } from '../constants/vinylTracks';
import type { PlaylistStatus, VinylTrack } from '../types';
import { devLog, devWarn } from '../utils/devLog';

const LOG_SCOPE = 'playlist';

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;

/** Открывающая дорожка — песня вступления. Звучит один раз, в начале сессии. */
const OPENING_TRACK_INDEX = 0;

/** С какой дорожки начинается следующий круг: открывающую второй раз не играем. */
const LOOP_START_INDEX = OPENING_TRACK_INDEX + 1;

/** Дорожка, которая звучит прямо сейчас (или стоит на паузе). */
interface ActiveTrack {
  /** Индекс в `VINYL_TRACKS` — от него считается следующая дорожка очереди. */
  index: number;
  src: string;
  howl: Howl;
  soundId: number;
  status: 'playing' | 'paused';
  /** Дорожку выбрал гость в стопке пластинок, а не очередь. */
  selected: boolean;
  /** Последняя прочитанная позиция, секунды: её показывает микшер на паузе. */
  position: number;
}

/** Параметры запуска дорожки. */
interface StartOptions {
  /** Громкость в момент старта. По умолчанию — тишина, дорожка нарастает. */
  fromVolume?: number;
  /** Громкость, на которую дорожка выходит. По умолчанию — текущая громкость музыки. */
  toVolume?: number;
  /** За сколько дорожка выходит на свою громкость. */
  fadeMs?: number;
  /** Дорожку выбрал гость. */
  selected?: boolean;
  /** Сколько дорожек подряд уже не загрузилось — защита от бесконечного перебора. */
  attempt?: number;
}

/** Параметры запуска фоновой музыки во вступлении. */
export interface BackgroundMusicOptions {
  /** Громкость первых секунд: песня начинает звучать тихо. */
  fromVolume: number;
  /** Громкость, на которую песня выходит. */
  toVolume: number;
  /** За сколько песня выходит на основную громкость. */
  fadeMs: number;
}

/** Созданные экземпляры Howl по URL дорожки. */
const howls = new Map<string, Howl>();

/** Подписчики на смену дорожки, паузу, перемотку и громкость. */
const listeners = new Set<() => void>();

let active: ActiveTrack | null = null;

/** Громкость музыки сейчас: её ведут сцены и ползунок микшера. */
let volume = BACKGROUND_MUSIC_VOLUME;

/** Громкость, на которую очередь возвращается после выбранной гостем дорожки. */
let queueVolume = BACKGROUND_MUSIC_VOLUME;

/** Запущена ли очередь: второй раз с начала её не заводят. */
let isStarted = false;

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function clampVolume(value: number): number {
  return Math.min(Math.max(value, MIN_VOLUME), MAX_VOLUME);
}

function trackAt(index: number): VinylTrack | null {
  return VINYL_TRACKS[index] ?? null;
}

/**
 * Следующая дорожка очереди. Круг замыкается на `LOOP_START_INDEX`, поэтому открывающая
 * песня больше не повторяется. `null` — играть больше нечего.
 */
function nextQueueIndex(from: number): number | null {
  const total = VINYL_TRACKS.length;
  const next = from + 1;
  if (next < total) {
    return next;
  }
  return total > LOOP_START_INDEX ? LOOP_START_INDEX : null;
}

/** Предыдущая дорожка списка, по кругу. */
function previousQueueIndex(from: number): number | null {
  const total = VINYL_TRACKS.length;
  if (total === 0) {
    return null;
  }
  return from > 0 ? from - 1 : total - 1;
}

/** Возвращает (при необходимости создаёт) Howl дорожки. Файл грузится только по запросу. */
function getHowl(src: string): Howl {
  const cached = howls.get(src);
  if (cached) {
    return cached;
  }
  const howl = new Howl({
    src: [src],
    html5: true,
    preload: false,
    onplayerror: (soundId, error) => {
      devWarn(LOG_SCOPE, `Браузер не дал воспроизвести дорожку (${src})`, error);
      howl.once('unlock', () => {
        howl.play(soundId);
      });
    },
  });
  howls.set(src, howl);
  return howl;
}

/** Забывает дорожку, которая не загрузилась: второй раз её файл дёргать незачем. */
function forgetHowl(src: string): void {
  const howl = howls.get(src);
  howls.delete(src);
  try {
    howl?.unload();
  } catch (error) {
    devWarn(LOG_SCOPE, `Ошибка выгрузки дорожки (${src})`, error);
  }
}

/** Текущая громкость конкретного звука. */
function volumeOf(track: ActiveTrack): number {
  const value = track.howl.volume(track.soundId);
  return typeof value === 'number' ? value : volume;
}

/** Уводит дорожку в тишину и останавливает её — пересменка без щелчка. */
function releaseTrack(track: ActiveTrack, fadeMs: number): void {
  const { howl, soundId } = track;
  try {
    if (fadeMs <= 0) {
      howl.stop(soundId);
      return;
    }
    howl.fade(volumeOf(track), MIN_VOLUME, fadeMs, soundId);
    howl.once(
      'fade',
      () => {
        try {
          howl.stop(soundId);
        } catch (error) {
          devWarn(LOG_SCOPE, `Ошибка остановки дорожки (${track.src})`, error);
        }
      },
      soundId,
    );
  } catch (error) {
    devWarn(LOG_SCOPE, `Ошибка затухания дорожки (${track.src})`, error);
  }
}

/** Снимает текущую дорожку: очередь после этого молчит, пока её не запустят снова. */
function releaseActive(fadeMs: number): ActiveTrack | null {
  const current = active;
  active = null;
  if (current !== null) {
    releaseTrack(current, fadeMs);
  }
  return current;
}

/** Дорожка доиграла до конца — очередь идёт дальше. */
function handleTrackEnd(finished: ActiveTrack): void {
  active = null;
  const nextIndex = nextQueueIndex(finished.index);
  if (nextIndex === null) {
    notifyListeners();
    devLog(LOG_SCOPE, 'очередь закончилась');
    return;
  }
  // После выбранной гостем дорожки очередь возвращается на фоновую громкость.
  playIndex(nextIndex, {
    toVolume: finished.selected ? queueVolume : volume,
    fadeMs: TRACK_CROSSFADE_MS,
  });
}

/** Дорожка не загрузилась — пропускаем её и идём дальше по очереди. */
function skipBrokenTrack(failed: ActiveTrack, attempt: number): void {
  devWarn(LOG_SCOPE, `Дорожка не загрузилась, пропускаем (${failed.src})`);
  active = null;
  forgetHowl(failed.src);
  const nextIndex = nextQueueIndex(failed.index);
  if (nextIndex === null || attempt + 1 >= VINYL_TRACKS.length) {
    notifyListeners();
    devWarn(LOG_SCOPE, 'Ни одна дорожка не загрузилась — очередь остановлена');
    return;
  }
  playIndex(nextIndex, {
    toVolume: failed.selected ? queueVolume : volume,
    fadeMs: TRACK_CROSSFADE_MS,
    attempt: attempt + 1,
  });
}

/**
 * Запускает дорожку по индексу: предыдущая уходит с затуханием, новая нарастает.
 * Громкость нового звука задаётся до `play()`, а фейд вешается на событие `play`: иначе
 * в html5-режиме Howler ставит `volume`/`fade` в очередь, которая после старта не разбирается.
 */
function playIndex(index: number, options: StartOptions = {}): void {
  const track = trackAt(index);
  if (track === null) {
    return;
  }
  const {
    fromVolume = MIN_VOLUME,
    toVolume = volume,
    fadeMs = TRACK_CROSSFADE_MS,
    selected = false,
    attempt = 0,
  } = options;

  releaseActive(fadeMs);
  volume = clampVolume(toVolume);
  const startVolume = clampVolume(fromVolume);

  try {
    const howl = getHowl(track.src);
    howl.volume(startVolume);
    const soundId = howl.play();
    const current: ActiveTrack = {
      index,
      src: track.src,
      howl,
      soundId,
      status: 'playing',
      selected,
      position: 0,
    };
    active = current;

    if (fadeMs > 0 && startVolume !== volume) {
      howl.once(
        'play',
        () => {
          howl.fade(startVolume, volume, fadeMs, soundId);
        },
        soundId,
      );
    }
    howl.once(
      'end',
      () => {
        if (active?.soundId === soundId) {
          handleTrackEnd(current);
        }
      },
      soundId,
    );
    // Битый или отсутствующий файл не должен подвесить очередь: пропускаем дорожку.
    howl.once('loaderror', () => {
      if (active?.soundId === soundId) {
        skipBrokenTrack(current, attempt);
      }
    });
    notifyListeners();
    devLog(LOG_SCOPE, `play «${track.title}»`, { fromVolume: startVolume, toVolume: volume });
  } catch (error) {
    active = null;
    notifyListeners();
    devWarn(LOG_SCOPE, `Ошибка воспроизведения дорожки (${track.src})`, error);
  }
}

/**
 * Подписывает на смену дорожки: запуск, паузу, перемотку, громкость и выключение.
 *
 * @param listener - Вызывается после каждой смены.
 * @returns Функция отписки.
 */
export function subscribePlaylistTrack(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** URL дорожки, которая звучит или стоит на паузе. */
export function getPlayingPlaylistTrack(): string | null {
  return active?.src ?? null;
}

/** Играет дорожка, стоит на паузе или музыки нет. */
export function getPlaylistStatus(): PlaylistStatus {
  return active?.status ?? 'idle';
}

/**
 * Позиция и длина текущей дорожки, секунды. Нет дорожки — нули.
 *
 * Позицию спрашиваем только у играющего звука: единственный числовой аргумент
 * `Howl.seek()` — это id звука, но если такого звука уже нет, Howler понимает его как
 * позицию в секундах и перематывает дорожку в конец (а конец — это переход к следующей).
 * `playing(id)` такого не делает и для чужого id возвращает `false`.
 */
export function getPlaylistProgress(): { currentTime: number; duration: number } {
  const current = active;
  if (current === null) {
    return { currentTime: 0, duration: 0 };
  }
  if (current.howl.playing(current.soundId)) {
    const seek = current.howl.seek(current.soundId);
    if (typeof seek === 'number' && Number.isFinite(seek)) {
      current.position = seek;
    }
  }
  const duration = current.howl.duration();
  return {
    currentTime: current.position,
    duration: Number.isFinite(duration) ? duration : 0,
  };
}

/** Громкость музыки 0–1. */
export function getPlaylistVolume(): number {
  return volume;
}

/**
 * Ставит громкость музыки мгновенно — ползунок микшера. Пока играет выбранная гостем
 * дорожка, фоновый уровень очереди не трогаем: очередь вернётся на него сама.
 *
 * @param nextVolume - Целевая громкость 0–1.
 */
export function setPlaylistVolume(nextVolume: number): void {
  volume = clampVolume(nextVolume);
  if (active?.selected !== true) {
    queueVolume = volume;
  }
  if (active !== null) {
    try {
      active.howl.volume(volume, active.soundId);
    } catch (error) {
      devWarn(LOG_SCOPE, 'Ошибка громкости дорожки', error);
    }
  }
  notifyListeners();
}

/**
 * Плавно уводит фоновую музыку на другой уровень — например, на фоновый при входе
 * в сцену стола. Выбранную гостем дорожку не трогает: она звучит на своей громкости,
 * а очередь после неё вернётся уже на новый уровень.
 *
 * @param nextVolume - Целевая громкость 0–1.
 * @param fadeMs - Длительность перехода, мс.
 */
export function setBackgroundMusicVolume(nextVolume: number, fadeMs: number): void {
  queueVolume = clampVolume(nextVolume);
  if (active?.selected === true) {
    return;
  }
  const from = volume;
  volume = queueVolume;
  if (active !== null) {
    try {
      if (fadeMs > 0) {
        active.howl.fade(from, volume, fadeMs, active.soundId);
      } else {
        active.howl.volume(volume, active.soundId);
      }
    } catch (error) {
      devWarn(LOG_SCOPE, 'Ошибка громкости фоновой музыки', error);
    }
  }
  notifyListeners();
  devLog(LOG_SCOPE, 'громкость фона', { volume, fadeMs });
}

/**
 * Начинает грузить открывающую дорожку, не запуская её: к моменту, когда игла опустится
 * на пластинку, песня уже готова. Остальные дорожки грузятся, только когда до них дойдёт
 * очередь. Безопасно вызывать многократно.
 */
export function preloadBackgroundMusic(): void {
  const opening = trackAt(OPENING_TRACK_INDEX);
  if (opening === null) {
    return;
  }
  try {
    getHowl(opening.src).load();
  } catch (error) {
    devWarn(LOG_SCOPE, `Ошибка предзагрузки дорожки (${opening.src})`, error);
  }
}

/**
 * Запускает фоновую музыку с открывающей песни: она начинает звучать тихо и выходит
 * на основную громкость. Дальше очередь идёт сама и переживает все смены сцен.
 * Повторный вызов (например, вступление проиграли заново) музыку не перезапускает —
 * только возвращает её на громкость вступления.
 *
 * @param options - Громкость старта, целевая громкость и длительность выхода.
 */
export function startBackgroundMusic({ fromVolume, toVolume, fadeMs }: BackgroundMusicOptions): void {
  if (VINYL_TRACKS.length === 0) {
    devWarn(LOG_SCOPE, 'Список дорожек пуст — фоновую музыку включать нечем');
    return;
  }
  if (isStarted) {
    setBackgroundMusicVolume(toVolume, fadeMs);
    return;
  }
  isStarted = true;
  queueVolume = clampVolume(toVolume);
  playIndex(OPENING_TRACK_INDEX, { fromVolume, toVolume, fadeMs });
}

/**
 * Включает дорожку, выбранную гостем в стопке пластинок: очередь уступает ей место,
 * громкость — «слушаем», а не «фоном». Когда дорожка кончится или её остановят,
 * очередь продолжится со следующей на фоновой громкости.
 *
 * @param src - URL файла дорожки.
 */
export function playPlaylistTrack(src: string): void {
  const index = VINYL_TRACKS.findIndex((track) => track.src === src);
  if (index < 0) {
    devWarn(LOG_SCOPE, `Дорожки нет в списке (${src})`);
    return;
  }
  isStarted = true;
  playIndex(index, {
    toVolume: SELECTED_TRACK_VOLUME,
    fadeMs: TRACK_CROSSFADE_MS,
    selected: true,
  });
}

/** Ставит текущую дорожку на паузу. */
export function pausePlaylistTrack(): void {
  const current = active;
  if (current?.status !== 'playing') {
    return;
  }
  try {
    current.howl.pause(current.soundId);
  } catch (error) {
    devWarn(LOG_SCOPE, 'Ошибка паузы дорожки', error);
    return;
  }
  current.status = 'paused';
  notifyListeners();
  devLog(LOG_SCOPE, `pause «${current.src}»`);
}

/** Снимает паузу с текущей дорожки. */
export function resumePlaylistTrack(): void {
  const current = active;
  if (current?.status !== 'paused') {
    return;
  }
  try {
    current.howl.play(current.soundId);
  } catch (error) {
    devWarn(LOG_SCOPE, 'Ошибка продолжения дорожки', error);
    return;
  }
  current.status = 'playing';
  notifyListeners();
  devLog(LOG_SCOPE, `resume «${current.src}»`);
}

/**
 * Выключает текущую дорожку. Выбранную гостем сменяет следующая дорожка очереди
 * на фоновой громкости — музыка не пропадает; дорожку самой очереди выключают совсем
 * (кнопка «стоп» в микшере).
 */
export function stopPlaylistTrack(): void {
  const current = releaseActive(TRACK_CROSSFADE_MS);
  if (current === null) {
    return;
  }
  devLog(LOG_SCOPE, `stop «${current.src}»`);
  if (!current.selected) {
    isStarted = false;
    notifyListeners();
    return;
  }
  const nextIndex = nextQueueIndex(current.index);
  if (nextIndex === null) {
    volume = queueVolume;
    notifyListeners();
    return;
  }
  playIndex(nextIndex, { toVolume: queueVolume, fadeMs: TRACK_CROSSFADE_MS });
}

/** Включает следующую дорожку очереди. Если музыки нет — открывающую. */
export function playNextPlaylistTrack(): void {
  if (VINYL_TRACKS.length === 0) {
    return;
  }
  isStarted = true;
  const current = active;
  if (current === null) {
    playIndex(OPENING_TRACK_INDEX, { fadeMs: TRACK_CROSSFADE_MS });
    return;
  }
  const nextIndex = nextQueueIndex(current.index);
  if (nextIndex !== null) {
    playIndex(nextIndex, { fadeMs: TRACK_CROSSFADE_MS, selected: current.selected });
  }
}

/** Включает предыдущую дорожку списка. Если музыки нет — последнюю. */
export function playPreviousPlaylistTrack(): void {
  const total = VINYL_TRACKS.length;
  if (total === 0) {
    return;
  }
  isStarted = true;
  const current = active;
  if (current === null) {
    playIndex(total - 1, { fadeMs: TRACK_CROSSFADE_MS });
    return;
  }
  const previousIndex = previousQueueIndex(current.index);
  if (previousIndex !== null) {
    playIndex(previousIndex, { fadeMs: TRACK_CROSSFADE_MS, selected: current.selected });
  }
}

/** Играть / пауза / продолжить. Если ничего не выбрано — включает открывающую дорожку. */
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
  playNextPlaylistTrack();
}

/**
 * Перематывает текущую дорожку. Без дорожки или без известной длины — ничего.
 *
 * @param seconds - Позиция в секундах.
 */
export function seekPlaylistTrack(seconds: number): void {
  const current = active;
  if (current === null) {
    return;
  }
  const duration = current.howl.duration();
  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }
  const position = Math.min(Math.max(seconds, 0), duration);
  try {
    current.howl.seek(position, current.soundId);
    current.position = position;
  } catch (error) {
    devWarn(LOG_SCOPE, 'Ошибка перемотки дорожки', error);
  }
  notifyListeners();
}

/**
 * Немедленно останавливает фоновую музыку целиком. Вызывается, только когда уходит всё
 * приложение (размонтирование корня, горячая замена модуля) — сцены музыку не трогают.
 */
export function stopPlaylist(): void {
  active = null;
  isStarted = false;
  howls.forEach((howl, src) => {
    try {
      howl.stop();
    } catch (error) {
      devWarn(LOG_SCOPE, `Ошибка остановки дорожки (${src})`, error);
    }
  });
  notifyListeners();
}

// HMR (только dev): при горячей замене модуля старые экземпляры Howl не должны продолжать играть.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopPlaylist();
    howls.forEach((howl) => {
      howl.unload();
    });
    howls.clear();
    listeners.clear();
  });
}
