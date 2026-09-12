import { useRef, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { UI_TEXT } from '../constants/copy';
import { KEYS } from '../constants/keyboard';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useKeyDown } from '../hooks/useKeyDown';
import type { ModalProps } from '../types';
import styles from './Modal.module.css';

/**
 * Базовое модальное окно: затемнённый фон и светлая карточка по центру.
 *
 * Доступность: `role="dialog"`, `aria-modal="true"`, `aria-label`. При открытии фокус
 * переводится в диалог и удерживается в нём (Tab зациклен), при закрытии возвращается
 * на элемент-триггер. Закрывается крестиком, кликом по фону и клавишей Escape.
 *
 * Рендерится порталом в `document.body`, чтобы не зависеть от контекстов наложения сцен.
 * Шаг 2: анимации открытия и закрытия.
 */
export function Modal({ isOpen, onClose, ariaLabel, children }: ModalProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);
  useKeyDown(KEYS.escape, onClose, isOpen);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.root}>
      {/* Фон — семантическая кнопка для закрытия кликом мыши. С клавиатуры окно закрывают
          крестик и Escape, поэтому фон исключён из порядка Tab. */}
      <button
        type="button"
        className={styles.backdrop}
        tabIndex={-1}
        aria-label={UI_TEXT.closeModal}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.closeButton}
          aria-label={UI_TEXT.closeModal}
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
