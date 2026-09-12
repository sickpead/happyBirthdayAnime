import type { ReactElement } from 'react';

import { MODAL_TITLES } from '../../constants/modals';
import type { ContentModalProps } from '../../types';
import { Modal } from '../Modal';
import { ModalPlaceholder } from './ModalPlaceholder';

/**
 * Модалка «Черновики». Шаг 2: галерея черновиков из `public/assets/images`.
 * Шаг 1: текст-заглушка внутри базового {@link Modal}.
 */
export function DraftsModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.drafts}>
      <ModalPlaceholder title={MODAL_TITLES.drafts} />
    </Modal>
  );
}
