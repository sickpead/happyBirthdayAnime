import type { ReactElement } from 'react';

import type { StubModalContent } from '../../constants/stubModalContent';
import type { ContentModalProps } from '../../types';
import { Modal } from '../Modal';
import styles from './StubObjectModal.module.css';

/** Пропсы {@link StubObjectModal}. */
export interface StubObjectModalProps extends ContentModalProps {
  /** Заголовок и текст-обещание из `stubModalContent.ts`. */
  content: StubModalContent;
}

/**
 * Модалка предмета, у которого содержимого пока нет: заголовок и приглушённая строка
 * «Скоро здесь будет…». Каркас — общий {@link Modal}: портал в `body`, ловушка фокуса,
 * закрытие крестиком, кликом по фону и Escape.
 *
 * Появится контент — заменить заглушку своей модалкой; тексты правятся в
 * `src/constants/stubModalContent.ts`, код трогать не нужно.
 */
export function StubObjectModal({ isOpen, onClose, content }: StubObjectModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={content.title}>
      <h2 className={styles.title}>{content.title}</h2>
      <p className={styles.placeholder}>{content.placeholder}</p>
    </Modal>
  );
}
