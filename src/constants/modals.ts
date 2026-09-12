import type { ModalId } from '../types';

/** Порядок модалок — используется dev-панелью. */
export const MODAL_ORDER = [
  'book',
  'letter',
  'drafts',
  'cakeVideo',
  'playlist',
] as const satisfies readonly ModalId[];

/** Заголовки модалок; они же — доступные имена диалогов (`aria-label`). */
export const MODAL_TITLES: Readonly<Record<ModalId, string>> = {
  book: 'Книга',
  letter: 'Письмо',
  drafts: 'Черновики',
  cakeVideo: 'Видео с тортом',
  playlist: 'Плейлист',
};
