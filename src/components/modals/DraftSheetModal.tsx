import type { ReactElement } from 'react';

import type { DeskDraftSheet } from '../../types';
import { Modal } from '../Modal';
import styles from './DraftSheetModal.module.css';

/** Пропсы {@link DraftSheetModal}. */
export interface DraftSheetModalProps {
  /** Открытый лист или `null`, если модалка закрыта. */
  sheet: DeskDraftSheet | null;
  /** Закрывает модалку. */
  onClose: () => void;
}

/**
 * Модалка одного листа-черновика: у каждого листа на столе своё содержимое (`sheet.modal`) —
 * заголовок, галерея картинок и подпись. Каркас — общий {@link Modal}: портал в `body`,
 * ловушка фокуса, закрытие крестиком, кликом по фону и Escape.
 *
 * Пока у листа нет картинок, показываются только заголовок и подпись-заглушка.
 */
export function DraftSheetModal({ sheet, onClose }: DraftSheetModalProps): ReactElement | null {
  if (sheet === null) {
    return null;
  }

  const { title, images, caption } = sheet.modal;

  return (
    <Modal isOpen onClose={onClose} ariaLabel={title}>
      <h2 className={styles.title}>{title}</h2>
      {images.length > 0 && (
        <ul className={styles.gallery}>
          {images.map((src) => (
            <li key={src}>
              <img className={styles.image} src={src} alt="" decoding="async" draggable={false} />
            </li>
          ))}
        </ul>
      )}
      {caption !== undefined && <p className={styles.caption}>{caption}</p>}
    </Modal>
  );
}
