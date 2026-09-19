import '@fontsource/marck-script/index.css';

import type { ReactElement } from 'react';

import { INTRO_TEXT } from '../constants/copy';
import { CloudCurtain } from './CloudCurtain';
import styles from './IntroCloudCover.module.css';

/** Пропсы {@link IntroCloudCover}. */
export interface IntroCloudCoverProps {
  /** Клик по приглашению — единственный жест пользователя в сцене, он же разблокирует звук. */
  onStart: () => void;
  /** Сцена уже запущена: кнопка блокируется от повторного нажатия. */
  hasStarted: boolean;
  /** Дополнительный класс корня (слой внутри сцены). */
  className?: string;
}

/**
 * Облачная обложка intro: экран закрыт облаками, по центру — поздравление и пульсирующее
 * приглашение «нажми, чтобы продолжить». Это отдельный экземпляр `CloudCurtain`, не общий
 * переход: он открывается один раз по клику и закрывается в финале сцены.
 *
 * Приглашение — семантическая кнопка; её невидимая область нажатия (`::after`) растянута
 * на весь экран, но видимый текст-приглашение остаётся обязательным.
 * Анимации (раскрытие, пульсация) задаёт `IntroScene` по data-атрибутам.
 */
export function IntroCloudCover({
  onStart,
  hasStarted,
  className,
}: IntroCloudCoverProps): ReactElement {
  return (
    <CloudCurtain className={className}>
      <div className={styles.greeting} data-intro-greeting>
        <h1 className={styles.title}>{INTRO_TEXT.greeting}</h1>
        <button type="button" className={styles.invite} disabled={hasStarted} onClick={onStart}>
          <span className={styles.inviteText} data-intro-invite>
            {INTRO_TEXT.invite}
          </span>
        </button>
      </div>
    </CloudCurtain>
  );
}
