import { useEffect } from 'react';

import { stopAll } from '../audio/audioManager';

/**
 * Привязывает жизненный цикл звука к компоненту: при его размонтировании
 * останавливаются все дорожки. Используется в корне приложения, чтобы звук
 * гарантированно не «переживал» UI.
 */
export function useStopAudioOnUnmount(): void {
  // Эффект только с очисткой: stopAll вызывается при размонтировании.
  useEffect(() => stopAll, []);
}
