import { useState, type ReactElement } from 'react';

import { COMIC_PAGES } from '../../constants/comicPages';
import { MODAL_TITLES } from '../../constants/modals';
import type { ContentModalProps } from '../../types';
import { ComicReader } from '../ComicReader';
import { Modal } from '../Modal';

/**
 * Модалка «Книга» — читалка комикса: страницы из `public/assets/comic/` по одной,
 * с листанием кнопками и стрелками.
 *
 * Номер открытой страницы живёт здесь, а не внутри читалки: модалка остаётся
 * смонтированной, поэтому книга открывается на той же странице, на которой её закрыли.
 */
export function BookModal({ isOpen, onClose }: ContentModalProps): ReactElement {
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel={MODAL_TITLES.book} wide>
      <ComicReader pages={COMIC_PAGES} pageIndex={pageIndex} onPageChange={setPageIndex} />
    </Modal>
  );
}
