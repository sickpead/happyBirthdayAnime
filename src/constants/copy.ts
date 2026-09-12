/**
 * Тексты интерфейса. Собраны в одном месте, чтобы их было легко вычитывать
 * и при необходимости локализовать.
 *
 * Тексты dev-панели сюда намеренно не входят: они живут в `src/dev/`, чтобы не попадать
 * в production-бандл (свойства общего объекта tree-shaking не вырезает).
 */
export const UI_TEXT = {
  sceneTitle: (sceneLabel: string): string => `Сцена: ${sceneLabel}`,
  nextButton: 'Далее →',
  sceneLoading: 'Загружаем сцену…',
  sceneLoadError: 'Не удалось загрузить сцену.',
  reloadPage: 'Перезагрузить страницу',

  closeModal: 'Закрыть',
  modalPlaceholder: (modalTitle: string): string => `TODO: содержимое модалки «${modalTitle}»`,
} as const;
