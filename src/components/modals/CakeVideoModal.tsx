import type { ReactElement } from 'react';

import { MODAL_TITLES } from '../../constants/modals';
import type { ContentModalProps } from '../../types';
import { Modal } from '../Modal';
import { ModalPlaceholder } from './ModalPlaceholder';

/**
 * Модалка «Видео с тортом». Шаг 2: видеоплеер.
 * Шаг 1: текст-заглушка внутри базового {@link Modal}.
 */
export function CakeVideoModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.cakeVideo}>
      <ModalPlaceholder title={MODAL_TITLES.cakeVideo} />
    </Modal>
  );
}
