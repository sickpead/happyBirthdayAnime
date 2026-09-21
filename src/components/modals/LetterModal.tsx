import type { ReactElement } from 'react';

import { MODAL_TITLES } from '../../constants/modals';
import type { ContentModalProps } from '../../types';
import { Modal } from '../Modal';
import styles from './LetterModal.module.css';

const LETTER_VIDEO_EMBED_SRC = 'https://www.youtube.com/embed/BlA36njayhE';

/**
 * Модалка «Письмо»: ролик с YouTube.
 */
export function LetterModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.letter} wide frameless>
      <div className={styles.player}>
        <iframe
          className={styles.iframe}
          src={isOpen ? LETTER_VIDEO_EMBED_SRC : undefined}
          title={MODAL_TITLES.letter}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </Modal>
  );
}
