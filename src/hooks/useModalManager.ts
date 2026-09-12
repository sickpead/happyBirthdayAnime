import { useCallback, useState } from 'react';

import type { ModalId } from '../types';

/** Состояние и действия менеджера модальных окон. */
export interface ModalManager {
  /** Открытая модалка или `null`, если открытых нет. Одновременно открыта максимум одна. */
  activeModal: ModalId | null;
  /** Открывает модалку (предыдущая, если была, закрывается). */
  openModal: (modalId: ModalId) => void;
  /** Закрывает открытую модалку. */
  closeModal: () => void;
}

/**
 * Хранит, какая модалка открыта. Модалки открываются из разных мест
 * (dev-панель сейчас; объекты стола и проигрыватель на шаге 2), поэтому
 * логика вынесена из компонентов. Колбэки стабильны между рендерами.
 */
export function useModalManager(): ModalManager {
  const [activeModal, setActiveModal] = useState<ModalId | null>(null);

  const openModal = useCallback((modalId: ModalId) => {
    setActiveModal(modalId);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  return { activeModal, openModal, closeModal };
}
