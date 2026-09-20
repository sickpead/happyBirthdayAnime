import type { ModalId } from '../types';
import { STUB_MODAL_CONTENT } from './stubModalContent';

/** Порядок модалок — используется dev-панелью. Модалки-заглушки в неё не выносим. */
export const MODAL_ORDER = [
  'book',
  'letter',
  'drafts',
  'cakeVideo',
  'playlist',
] as const satisfies readonly ModalId[];

/**
 * Заголовки модалок; они же — доступные имена диалогов (`aria-label`). У модалок-заглушек
 * заголовок лежит рядом с их текстом, в `stubModalContent.ts`, чтобы правка была в одном месте.
 */
export const MODAL_TITLES: Readonly<Record<ModalId, string>> = {
  book: 'Книга',
  letter: 'Письмо',
  drafts: 'Черновики',
  cakeVideo: 'Видео с тортом',
  playlist: 'Плейлист',
  'vinyl-stack': 'Пластинки',
  'rose-vase': STUB_MODAL_CONTENT['rose-vase'].title,
  'colored-pencils': STUB_MODAL_CONTENT['colored-pencils'].title,
  'fountain-pen': STUB_MODAL_CONTENT['fountain-pen'].title,
};
