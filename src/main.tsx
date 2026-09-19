// Порядок важен: цветовые токены → глобальные стили и утилиты → CSS-модули компонентов (через App).
import './styles/tokens.css';
import './styles/global.css';
import './styles/buttons.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { applyCssVariables } from './styles/cssVariables';

const ROOT_ELEMENT_ID = 'root';

const rootElement = document.getElementById(ROOT_ELEMENT_ID);
if (rootElement === null) {
  throw new Error(`Не найден корневой элемент #${ROOT_ELEMENT_ID} в index.html`);
}

// Дизайн-токены должны быть объявлены до первого рендера.
applyCssVariables(document.documentElement);

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
