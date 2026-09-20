/** Идентификатор звуковой дорожки, которой управляет `audioManager`. */
export type AudioTrackId = 'needle-drop' | 'crackle' | 'song';

/** Параметры однократного воспроизведения короткого звука. */
export interface PlayOnceOptions {
  /** Громкость 0–1. По умолчанию 1. */
  volume?: number;
}

/**
 * Дорожка из стопки пластинок на столе: свой файл автора, которого нет в `AudioTrackId` —
 * список дорожек задаётся в `src/constants/vinylTracks.ts`.
 */
export interface VinylTrack {
  id: string;
  /** Название дорожки в списке. */
  title: string;
  /** Исполнитель или подпись под названием. */
  artist?: string;
  /** URL файла внутри `public/`. */
  src: string;
}

/** Параметры запуска дорожки с плавным нарастанием громкости. */
export interface FadeInOptions {
  /** Целевая громкость 0–1. По умолчанию 1. */
  volume?: number;
  /** Длительность нарастания от 0 до `volume`, мс. 0 — без фейда. По умолчанию 0. */
  fadeInMs?: number;
}
