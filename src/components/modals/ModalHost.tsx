import type { ReactElement } from 'react';

import { STUB_MODAL_CONTENT, STUB_MODAL_IDS } from '../../constants/stubModalContent';
import type { ModalId } from '../../types';
import { BookModal } from './BookModal';
import { CakeVideoModal } from './CakeVideoModal';
import { DraftsModal } from './DraftsModal';
import { LetterModal } from './LetterModal';
import { PlaylistModal } from './PlaylistModal';
import { StubObjectModal } from './StubObjectModal';
import { VinylStackModal } from './VinylStackModal';

/** Пропсы {@link ModalHost}. */
export interface ModalHostProps {
  /** Открытая модалка или `null`. */
  activeModal: ModalId | null;
  /** Закрывает открытую модалку. */
  onClose: () => void;
}

/**
 * Монтирует модалки предметов; открыта не больше одной. Свой экземпляр есть у App
 * (dev-панель) и у сцены Desk (предметы на столе). Модалки остаются смонтированными
 * и переключаются через `isOpen` — на шаге 2 это позволит анимировать и закрытие.
 *
 * Модалки листов-черновиков живут отдельно — у каждого листа своё содержимое.
 */
export function ModalHost({ activeModal, onClose }: ModalHostProps): ReactElement {
  return (
    <>
      <BookModal isOpen={activeModal === 'book'} onClose={onClose} />
      <LetterModal isOpen={activeModal === 'letter'} onClose={onClose} />
      <DraftsModal isOpen={activeModal === 'drafts'} onClose={onClose} />
      <CakeVideoModal isOpen={activeModal === 'cakeVideo'} onClose={onClose} />
      <PlaylistModal isOpen={activeModal === 'playlist'} onClose={onClose} />
      <VinylStackModal isOpen={activeModal === 'vinyl-stack'} onClose={onClose} />
      {STUB_MODAL_IDS.map((modalId) => (
        <StubObjectModal
          key={modalId}
          isOpen={activeModal === modalId}
          onClose={onClose}
          content={STUB_MODAL_CONTENT[modalId]}
        />
      ))}
    </>
  );
}
