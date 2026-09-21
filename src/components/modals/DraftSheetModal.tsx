import { useState, type ReactElement } from 'react';

import type { ComicPage, DeskDraftSheet } from '../../types';
import { ComicReader } from '../ComicReader';
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
 * Несколько картинок листаются той же читалкой, что и книга (`ComicReader`),
 * без правок самой книги.
 */
export function DraftSheetModal({ sheet, onClose }: DraftSheetModalProps): ReactElement | null {
  const [pageIndex, setPageIndex] = useState(0);
  const sheetId = sheet?.id;
  // Открыли другой лист — читалка начинается с первой страницы. Сброс прямо в рендере,
  // а не в эффекте: иначе кадр успевает показать страницу от предыдущего листа.
  const [shownSheetId, setShownSheetId] = useState(sheetId);
  if (sheetId !== shownSheetId) {
    setShownSheetId(sheetId);
    setPageIndex(0);
  }

  if (sheet === null) {
    return null;
  }

  const { title, images, caption } = sheet.modal;
  const paged = images.length > 1;
  const pages: ComicPage[] = images.map((src, index) => ({
    id: `${sheet.id}-${String(index + 1)}`,
    src,
  }));

  return (
    <Modal
      isOpen
      onClose={onClose}
      ariaLabel={title}
      wide={paged}
      frameless
    >
      {paged ? (
        <ComicReader pages={pages} pageIndex={pageIndex} onPageChange={setPageIndex} />
      ) : (
        <>
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
        </>
      )}
    </Modal>
  );
}
