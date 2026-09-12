import type { ReactElement } from 'react';

import { MODAL_TITLES } from '../../constants/modals';
import type { ContentModalProps } from '../../types';
import { Modal } from '../Modal';
import { ModalPlaceholder } from './ModalPlaceholder';

/**
 * Модалка «Плейлист». Шаг 2: плеер со списком треков (через audioManager).
 * Шаг 1: текст-заглушка внутри базового {@link Modal}.
 */
export function PlaylistModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.playlist}>
      <ModalPlaceholder title={MODAL_TITLES.playlist} />
    </Modal>
  );
}
