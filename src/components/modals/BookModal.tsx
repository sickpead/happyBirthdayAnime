import type { ReactElement } from 'react';

import { MODAL_TITLES } from '../../constants/modals';
import type { ContentModalProps } from '../../types';
import { Modal } from '../Modal';
import { ModalPlaceholder } from './ModalPlaceholder';

/**
 * Модалка «Книга». Шаг 2: комикс-ридер со страницами из `public/assets/comic`.
 * Шаг 1: текст-заглушка внутри базового {@link Modal}.
 */
export function BookModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.book}>
      <ModalPlaceholder title={MODAL_TITLES.book} />
    </Modal>
  );
}
