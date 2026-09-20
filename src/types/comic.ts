/** Страница комикса в модалке «Книга». */
export interface ComicPage {
  /** Номер страницы из имени файла — он же ключ списка. */
  id: string;
  /** URL картинки страницы внутри `public/assets/comic/`. */
  src: string;
}
