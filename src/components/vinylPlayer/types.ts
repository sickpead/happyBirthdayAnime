/** Состояние проигрывателя — одна конечная машина без параллельных флагов. */
export type VinylPlayerStatus = 'IDLE' | 'PLAYING' | 'STOPPING';

/** Публичный императивный API {@link VinylPlayer}. */
export interface VinylPlayerHandle {
  /** IDLE → тонарм к пластинке → вращение → PLAYING. */
  play: () => Promise<void>;
  /** PLAYING → диск встал → тонарм на подставку → IDLE. */
  stop: () => Promise<void>;
  /** PLAY ↔ STOP через единую функцию. */
  togglePlayback: () => Promise<void>;
  getStatus: () => VinylPlayerStatus;
}
