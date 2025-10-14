/**
 * @fileoverview Suite de pruebas para el store de interfaz de usuario (ui).
 * @description Verifica la gestión de vistas, modales, estado de carga y notificaciones.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { ui, notificationCount, notificationMessages, addNotification, removeNotification, clearNotifications } from '../stores/ui.js';

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

/**
 * @description Grupo principal de pruebas para el store de interfaz de usuario.
 */
describe('ui store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  /**
   * @description Pruebas para las funciones básicas del store de UI.
   */
  describe('ui store', () => {
    /**
     * @test Inicializa con valores por defecto.
     */
    it('initializes with default values', () => {
      const state = get(ui);
      expect(state.currentView).toBe('dashboard');
      expect(state.showWorkOrderModal).toBe(false);
    });

    /**
     * @test Establece la vista actual y persiste en localStorage.
     */
    it('sets current view and persists to localStorage', () => {
      ui.setCurrentView('users');

      const state = get(ui);
      expect(state.currentView).toBe('users');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('currentView', 'users');
    });

    /**
     * @test Abre el modal de orden de trabajo.
     */
    it('opens work order modal', () => {
      const rowData = { id: 1 };
      const columnDef = { key: 'status' };

      ui.openWorkOrderModal(rowData, columnDef);

      const state = get(ui);
      expect(state.showWorkOrderModal).toBe(true);
      expect(state.selectedRowData).toBe(rowData);
      expect(state.selectedColumnDef).toBe(columnDef);
    });

    /**
     * @test Cierra el modal de orden de trabajo.
     */
    it('closes work order modal', () => {
      ui.openWorkOrderModal({ id: 1 }, { key: 'status' });
      ui.closeWorkOrderModal();

      const state = get(ui);
      expect(state.showWorkOrderModal).toBe(false);
      expect(state.selectedRowData).toBe(null);
      expect(state.selectedColumnDef).toBe(null);
    });

    /**
     * @test Establece el estado de guardado.
     */
    it('sets saving state', () => {
      ui.setSaving(true);

      const state = get(ui);
      expect(state.isSaving).toBe(true);
    });
  });

  /**
   * @description Pruebas para el sistema de notificaciones.
   */
  describe('notifications', () => {
    beforeEach(() => {
      clearNotifications();
    });

    /**
     * @test Agrega notificación e incrementa el contador.
     */
    it('adds notification and increments count', () => {
      const notification = { id: 1, message: 'Test notification' };

      addNotification(notification);

      expect(get(notificationCount)).toBe(1);
      expect(get(notificationMessages)).toEqual([notification]);
    });

    /**
     * @test No agrega notificación duplicada.
     */
    it('does not add duplicate notification', () => {
      const notification = { id: 1, message: 'Test notification' };

      addNotification(notification);
      addNotification(notification);

      expect(get(notificationCount)).toBe(1);
      expect(get(notificationMessages)).toEqual([notification]);
    });

    /**
     * @test Remueve notificación y decrementa el contador.
     */
    it('removes notification and decrements count', () => {
      const notification = { id: 1, message: 'Test notification' };
      addNotification(notification);

      removeNotification(1);

      expect(get(notificationCount)).toBe(0);
      expect(get(notificationMessages)).toEqual([]);
    });

    /**
     * @test Limpia todas las notificaciones.
     */
    it('clears all notifications', () => {
      addNotification({ id: 1, message: 'Test 1' });
      addNotification({ id: 2, message: 'Test 2' });

      clearNotifications();

      expect(get(notificationCount)).toBe(0);
      expect(get(notificationMessages)).toEqual([]);
    });
  });
});