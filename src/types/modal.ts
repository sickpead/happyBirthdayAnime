import type { ReactNode } from 'react';

/** Идентификатор модального окна с контентом. */
export type ModalId = 'book' | 'letter' | 'drafts' | 'cakeVideo' | 'playlist';

/** Пропсы базового компонента `Modal`. */
export interface ModalProps {
  /** Открыто ли окно. Закрытое окно ничего не рендерит. */
  isOpen: boolean;
  /** Запрос на закрытие: крестик, клик по фону или Escape. */
  onClose: () => void;
  /** Доступное имя диалога — попадает в `aria-label`. */
  ariaLabel: string;
  /** Содержимое карточки. */
  children: ReactNode;
}

/** Пропсы модалок с конкретным содержимым (`BookModal`, `LetterModal` и т.д.). */
export type ContentModalProps = Pick<ModalProps, 'isOpen' | 'onClose'>;
