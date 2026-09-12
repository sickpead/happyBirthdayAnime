import type { ReactElement } from 'react';

import { MODAL_TITLES } from '../../constants/modals';
import type { ContentModalProps } from '../../types';
import { Modal } from '../Modal';
import { ModalPlaceholder } from './ModalPlaceholder';

/**
 * Модалка «Письмо». Шаг 2: текст поздравительного письма.
 * Шаг 1: текст-заглушка внутри базового {@link Modal}.
 */
export function LetterModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.letter}>
      <ModalPlaceholder title={MODAL_TITLES.letter} />
    </Modal>
  );
}
