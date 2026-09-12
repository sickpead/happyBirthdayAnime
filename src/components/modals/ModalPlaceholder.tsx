import type { ReactElement } from 'react';

import { UI_TEXT } from '../../constants/copy';
import styles from './ModalPlaceholder.module.css';

/** Пропсы {@link ModalPlaceholder}. */
export interface ModalPlaceholderProps {
  /** Название модалки — выводится в заголовке и в тексте-заглушке. */
  title: string;
}

/**
 * Временное содержимое модалки для шага 1: заголовок и строка «TODO: содержимое модалки «…»».
 * На шаге 2 каждая модалка заменяет его своим контентом.
 */
export function ModalPlaceholder({ title }: ModalPlaceholderProps): ReactElement {
  return (
    <>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{UI_TEXT.modalPlaceholder(title)}</p>
    </>
  );
}
