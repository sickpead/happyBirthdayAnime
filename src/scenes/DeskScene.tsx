import type { ReactElement } from 'react';

import { ScenePlaceholder } from '../components/ScenePlaceholder';
import type { SceneProps } from '../types';

/**
 * Сцена «Desk» — стол с интерактивными объектами.
 * Шаг 2: 3D-сцена на Three.js / @react-three/fiber / drei с параллаксом; объекты открывают модалки.
 * Шаг 1: заглушка с временной кнопкой «Далее».
 *
 * Подключается в App через `React.lazy` и попадает в отдельный чанк вместе со своими
 * будущими 3D-зависимостями, поэтому стартовый бандл их не загружает.
 */
export default function DeskScene({ onNext }: SceneProps): ReactElement {
  return <ScenePlaceholder scene="desk" onNext={onNext} />;
}
