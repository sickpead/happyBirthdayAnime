# С днём рождения! — интерактивный сайт-поздравление

> **Это шаг 1 (архитектура).** Реализация механик сцен, звука, 3D-параллакса и содержимого модалок — отдельным заданием (шаг 2).

Одностраничный десктопный сайт, в котором сцены сменяют друг друга: **Intro → Cake → Desk**. На этом шаге готов только каркас: структура проекта, роутинг между сценами, заготовки компонентов, модалки с базовой доступностью, типизированный аудиоменеджер, дизайн-токены и настроенные линтеры. Все компоненты компилируются, рендерятся и переключаются.

## Стек

| Область          | Технологии                                                                          |
| ---------------- | ----------------------------------------------------------------------------------- |
| UI               | React 19.2, TypeScript 6.0 (`strict`)                                               |
| Сборка           | Vite 8 (`base: './'`), CSS Modules                                                  |
| 3D (шаг 2)       | three 0.186, @react-three/fiber 9, @react-three/drei 10                             |
| Анимация (шаг 2) | GSAP 3                                                                              |
| Звук             | Howler 2                                                                            |
| Качество кода    | ESLint 9 (flat config), typescript-eslint, react, react-hooks, jsx-a11y, Prettier 3 |

## Требования

- Node.js `^20.19.0` или `>=22.12.0` (требование Vite 8)
- npm 10+

## Запуск

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

| Скрипт                 | Что делает                                              |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Dev-сервер с HMR (http://localhost:5173)                |
| `npm run build`        | Проверка типов (`tsc -b`) и production-сборка в `dist/` |
| `npm run preview`      | Локальный просмотр production-сборки                    |
| `npm run typecheck`    | Только проверка типов                                   |
| `npm run lint`         | ESLint без права на предупреждения (`--max-warnings 0`) |
| `npm run lint:fix`     | ESLint с автоисправлением                               |
| `npm run format`       | Форматирование всего проекта Prettier                   |
| `npm run format:check` | Проверка форматирования (для CI)                        |

Сборка использует относительный `base: './'`, поэтому `dist/` можно выложить в любой подкаталог статического хостинга. Открывать `dist/index.html` напрямую через `file://` нельзя — браузеры блокируют ES-модули; используйте `npm run preview` или хостинг.

## Структура проекта

```text
public/assets/            статические ассеты (имена файлов — kebab-case)
  images/  audio/  comic/
src/
  main.tsx                точка входа: глобальные стили, CSS-переменные, рендер <App />
  App.tsx                 состояние сцены и модалок, рендер сцены, проигрыватель, модалки, dev-панель
  scenes/
    IntroScene.tsx        сцена Intro (заглушка)
    CakeScene.tsx         сцена Cake (заглушка)
    DeskScene.tsx         сцена Desk (заглушка, отдельный lazy-чанк)
    sceneSequence.ts      чистая функция перехода getNextScene
  components/
    CornerTurntable.tsx   проигрыватель в правом верхнем углу (заглушка)
    Modal.tsx             базовая доступная модалка
    ScenePlaceholder.tsx  временное содержимое сцен шага 1
    SceneFallback.tsx     fallback'и загрузки и ошибки сцены
    ErrorBoundary.tsx     граница ошибок вокруг сцен
    modals/
      BookModal.tsx  LetterModal.tsx  DraftsModal.tsx  CakeVideoModal.tsx  PlaylistModal.tsx
      ModalHost.tsx       единая точка монтирования модалок
      ModalPlaceholder.tsx  временное содержимое модалок шага 1
  audio/audioManager.ts   типизированная обёртка над Howler
  hooks/                  useFocusTrap, useKeyDown, useModalManager, useStopAudioOnUnmount
  constants/              цвета, тайминги, layout, типографика, URL ассетов, сцены, модалки, тексты
  types/                  общие типы: SceneName, SceneProps, ModalId, ModalProps, AudioTrackId
  styles/                 global.css и мост «TS-токены → CSS-переменные»
  utils/                  assetUrl, devLog, focus
  dev/DevToolbar.tsx      dev-панель (только в режиме разработки)
```

## Архитектура

**Сцены и навигация.** `App` хранит `useState<SceneName>` (`'intro' | 'cake' | 'desk'`, старт — `'intro'`) и рендерит сцену через `switch`, полнота которого проверяется TypeScript и правилом `switch-exhaustiveness-check`. Правила переходов описаны в `NEXT_SCENE` (`src/constants/scenes.ts`) и применяются чистой функцией `getNextScene` как updater: `setScene(getNextScene)`. На шаге 1 сцены переключает временная кнопка «Далее →», а после Desk поток замыкается на Intro. На шаге 2 переходы будут инициировать сами механики сцен.

**Код-сплиттинг.** `DeskScene` подключается через `React.lazy` + `Suspense` и собирается в отдельный чанк: стартовая сцена не загружает Three.js. Сцены обёрнуты в `ErrorBoundary`, который сбрасывается при смене сцены (`key={scene}`) и показывает экран с перезагрузкой, если чанк не загрузился.

**Проигрыватель.** `CornerTurntable` всегда смонтирован и получает `visible={scene !== 'intro'}`. Видимость переключается через `data-visible` и CSS-переход `opacity`/`visibility`, с учётом `prefers-reduced-motion`. На шаге 2 сюда добавятся анимации иглы и пластинки.

**Модалки.** `Modal` рендерится порталом в `document.body`. Доступность: `role="dialog"`, `aria-modal="true"`, `aria-label`; при открытии фокус переходит в диалог и зациклен по Tab (`useFocusTrap`), при закрытии возвращается на триггер. Закрывается крестиком, кликом по фону (фон — семантическая `<button>`) и по Escape (`useKeyDown`). Какая модалка открыта, хранит `useModalManager`; все модалки смонтированы в `ModalHost` и управляются через `isOpen`, чтобы на шаге 2 можно было анимировать и закрытие.

**Звук.** Вся работа со звуком идёт через `src/audio/audioManager.ts`: `playCrackle()`, `playSong()`, `fadeAll(volume, durationMs)`, `stopAll()`. Сейчас это заглушки с DEV-логом. На шаге 2 появится ленивое создание `Howl` из `AUDIO_SOURCES`. Хук `useStopAudioOnUnmount` в корне приложения останавливает звук при размонтировании, а в dev модуль останавливает звук при HMR-замене.

**Дизайн-токены.** Цвета, тайминги, отступы, радиусы, z-index и размеры описаны в `src/constants` на TypeScript. `src/styles/cssVariables.ts` публикует их как CSS custom properties на `<html>` (через CSSOM, совместимо со строгой CSP), а CSS-модули используют только `var(--…)`. Three.js-сцены на шаге 2 берут те же значения напрямую из `COLORS`, так что у CSS и 3D один источник правды.

**Dev-панель.** Кнопки Intro / Cake / Desk переключают сцену напрямую, а кнопки модалок открывают любую модалку для проверки. Панель подключается условием `import.meta.env.DEV` через динамический импорт, поэтому её код, стили и тексты полностью отсутствуют в production-бандле (это проверено по `dist/`). Диагностика — только через `devLog()`, который тоже вырезается из production.

## Соглашения

- **Именование:** компоненты и их файлы — `PascalCase`; функции, переменные, хуки и прочие модули — `camelCase`; константы модулей — `SCREAMING_SNAKE_CASE`; файлы ассетов — `kebab-case`; классы CSS-модулей — `camelCase`.
- **Экспорты:** модули сцен и `DevToolbar` экспортируются по умолчанию (контракт `React.lazy`), всё остальное — именованными экспортами.
- **Типы:** переиспользуемые типы и пропсы лежат в `src/types`; пропсы, нужные одному компоненту, объявляются рядом с ним через `interface`. `any` не используется.
- **Побочные эффекты** (слушатели, таймеры, звук) всегда снимаются в cleanup-функции `useEffect`.
- **Логи:** `console.log` запрещён линтером, используйте `devLog()` (только DEV).
- **Документация:** TSDoc на каждом экспортируемом компоненте и нетривиальной функции.

## Линтинг и форматирование

- ESLint настроен в **`eslint.config.js` (flat config)**, а не в `.eslintrc.cjs`: формат eslintrc объявлен устаревшим в ESLint 9 (печатает предупреждение при каждом запуске) и удалён в ESLint 10. Flat config превратит будущий переход на ESLint 10 в простую смену версии.
- Наборы правил: `@eslint/js` recommended, typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` (type-aware линтинг через `projectService`), `eslint-plugin-react` recommended + jsx-runtime, `eslint-plugin-react-hooks` recommended (включая правила React Compiler), `eslint-plugin-jsx-a11y` strict.
- `eslint-config-prettier` подключён последним и выключает все стилистические правила, конфликтующие с Prettier. Проверено: `npx eslint-config-prettier src/App.tsx` конфликтов не находит.
- Переводы строк — LF везде (`.prettierrc`, `.editorconfig`, `.gitattributes`).

## Почему выбраны именно эти версии

- **React `~19.2`**: `@react-three/fiber@9.7` поддерживает только `react <19.3`.
- **TypeScript `~6.0`**: typescript-eslint 8 поддерживает TypeScript `<6.1`; TypeScript 7 он пока не поддерживает.
- **ESLint `9.39` (последняя версия 9.x)**: у `eslint-plugin-react@7.37.5` ещё нет поддержки ESLint 10 — на ESLint 10 он падает с ошибкой `contextOrFilename.getFilename is not a function`, а PR с исправлением пока не выпущен. ESLint 9 не поддерживается с 2026-08-06, поэтому `npm install` выводит deprecation-предупреждение — это ожидаемо. Когда `eslint-plugin-react` выпустит версию с поддержкой ESLint 10, достаточно поднять `eslint` и `@eslint/js` до `^10`.

## Ассеты

Файлы кладутся в `public/assets/{images,audio,comic}` с именами в `kebab-case`. URL всегда строится через `assetUrl()` (`src/utils/assetUrl.ts`) с учётом `base`. Ожидаемые звуковые файлы описаны в `AUDIO_SOURCES` (`src/constants/assets.ts`): `vinyl-crackle.mp3` и `birthday-song.mp3`.

## Шаг 2 (следующее задание)

- Механики сцен: клик по Intro и опускание иглы, задувание свечи в Cake, 3D-стол с объектами и параллаксом в Desk (R3F + drei)
- Анимации проигрывателя и переходов (GSAP), анимации открытия и закрытия модалок
- Реальный звук через Howler: загрузка, тайминги, фейды
- Содержимое модалок: комикс-ридер, письмо, галерея черновиков, видео, плейлист
- Удаление временных `ScenePlaceholder` / `ModalPlaceholder` и кнопок «Далее»
