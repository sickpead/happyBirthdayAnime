import { Component, type ReactNode } from 'react';

/** Пропсы {@link ErrorBoundary}. */
export interface ErrorBoundaryProps {
  /** UI, который показывается вместо упавшего поддерева. */
  fallback: ReactNode;
  /** Защищаемое поддерево. */
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Перехватывает ошибки рендера и загрузки ленивых чанков в поддереве и показывает `fallback`
 * вместо пустого экрана. Сбрасывается сменой `key` (App меняет его при переходе между сценами).
 *
 * Реализован классом, потому что у React нет хука — аналога error boundary.
 * Ошибки логирует сам React (`console.error`), поэтому `componentDidCatch` не переопределяется.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
