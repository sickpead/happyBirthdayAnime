import type { ReactNode } from 'react';

/**
 * Модалки-заглушки предметов стола: содержимого у них пока нет, только заголовок
 * и строка-обещание из `src/constants/stubModalContent.ts`.
 */
export type StubModalId = 'rose-vase' | 'colored-pencils' | 'fountain-pen';

/** Идентификатор модального окна с контентом. */
export type ModalId =
  'book' | 'letter' | 'drafts' | 'cakeVideo' | 'playlist' | 'vinyl-stack' | StubModalId;

/** Пропсы базового компонента `Modal`. */
export interface ModalProps {
  /** Открыто ли окно. Закрытое окно ничего не рендерит. */
  isOpen: boolean;
  /** Запрос на закрытие: крестик, клик по фону или Escape. */
  onClose: () => void;
  /** Доступное имя диалога — попадает в `aria-label`. */
  ariaLabel: string;
  /** Широкая карточка — для содержимого во всю ширину, например страниц комикса. */
  wide?: boolean;
  /** Содержимое карточки. */
  children: ReactNode;
}

/** Пропсы модалок с конкретным содержимым (`BookModal`, `LetterModal` и т.д.). */
export type ContentModalProps = Pick<ModalProps, 'isOpen' | 'onClose'>;
