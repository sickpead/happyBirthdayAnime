/**
 * Диагностический лог, который существует только в dev-сборке.
 * Vite статически заменяет `import.meta.env.DEV` на `false` в production,
 * поэтому тело функции вырезается минификатором и в бандл не попадает ни одного вызова console.
 *
 * @param scope - Подсистема-источник сообщения, например `'audio'`.
 * @param details - Произвольные данные для вывода.
 */
export function devLog(scope: string, ...details: readonly unknown[]): void {
  if (!import.meta.env.DEV) {
    return;
  }
  console.info(`[${scope}]`, ...details);
}
