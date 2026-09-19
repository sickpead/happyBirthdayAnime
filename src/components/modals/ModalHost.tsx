import type { ReactElement } from 'react';

import type { ModalId } from '../../types';
import { BookModal } from './BookModal';
import { CakeVideoModal } from './CakeVideoModal';
import { DraftsModal } from './DraftsModal';
import { LetterModal } from './LetterModal';
import { PlaylistModal } from './PlaylistModal';

/** Пропсы {@link ModalHost}. */
export interface ModalHostProps {
  /** Открытая модалка или `null`. */
  activeModal: ModalId | null;
  /** Закрывает открытую модалку. */
  onClose: () => void;
}

/**
 * Монтирует все пять модалок; открыта не больше одной. Свой экземпляр есть у App
 * (dev-панель) и у сцены Desk (предметы на столе). Модалки остаются смонтированными
 * и переключаются через `isOpen` — на шаге 2 это позволит анимировать и закрытие.
 */
export function ModalHost({ activeModal, onClose }: ModalHostProps): ReactElement {
  return (
    <>
      <BookModal isOpen={activeModal === 'book'} onClose={onClose} />
      <LetterModal isOpen={activeModal === 'letter'} onClose={onClose} />
      <DraftsModal isOpen={activeModal === 'drafts'} onClose={onClose} />
      <CakeVideoModal isOpen={activeModal === 'cakeVideo'} onClose={onClose} />
      <PlaylistModal isOpen={activeModal === 'playlist'} onClose={onClose} />
    </>
  );
}
