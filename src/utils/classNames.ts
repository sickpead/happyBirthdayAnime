/**
 * Склеивает имена CSS-классов, пропуская пустые значения. Удобно для сочетания
 * классов CSS-модулей (тип `string | undefined`) с классами из пропсов и условными классами.
 *
 * @param classes - Имена классов; `false`, `null`, `undefined` и пустые строки пропускаются.
 * @returns Строка для атрибута `className`.
 */
export function classNames(...classes: readonly (string | false | null | undefined)[]): string {
  return classes
    .filter((name): name is string => typeof name === 'string' && name !== '')
    .join(' ');
}
