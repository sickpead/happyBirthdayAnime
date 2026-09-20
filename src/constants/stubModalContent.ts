import type { StubModalId } from '../types';

/** Заголовок и текст-обещание модалки-заглушки. */
export interface StubModalContent {
  /** Заголовок диалога; он же — его доступное имя. */
  title: string;
  /** Приглушённая строка вместо содержимого, пока его нет. */
  placeholder: string;
}

/**
 * Содержимое модалок-заглушек: стопка пластинок, ваза с розами, карандаши и ручка
 * уже кликабельны, но своего контента у них пока нет. Здесь его и дописывать —
 * компонент `StubObjectModal` больше ничего не знает.
 */
export const STUB_MODAL_CONTENT: Readonly<Record<StubModalId, StubModalContent>> = {
  'rose-vase': { title: 'Розы', placeholder: 'Скоро здесь будет...' },
  'colored-pencils': { title: 'Карандаши', placeholder: 'Скоро здесь будет...' },
  'fountain-pen': { title: 'Ручка', placeholder: 'Скоро здесь будет...' },
};

/** Порядок модалок-заглушек — для рендера и обхода. */
export const STUB_MODAL_IDS = [
  'rose-vase',
  'colored-pencils',
  'fountain-pen',
] as const satisfies readonly StubModalId[];
