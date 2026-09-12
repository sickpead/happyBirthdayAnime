const LEADING_SLASHES = /^\/+/;

/**
 * Строит URL файла из `public/` с учётом `base` из vite.config.ts.
 * При `base: './'` путь остаётся относительным, и сборка работает из любого подкаталога.
 *
 * @param relativePath - Путь относительно `public/`, например `assets/audio/birthday-song.mp3`.
 * @returns URL, пригодный для `<img src>`, Howler, загрузчиков Three.js и т.п.
 */
export function assetUrl(relativePath: string): string {
  return `${import.meta.env.BASE_URL}${relativePath.replace(LEADING_SLASHES, '')}`;
}
