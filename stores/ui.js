import { writable } from 'svelte/store';

// Helper para crear un store que persiste en sessionStorage
function createPersistedStore(key, startValue) {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    return writable(startValue);
  }

  const storedValue = sessionStorage.getItem(key);
  const initialValue = storedValue ? JSON.parse(storedValue) : startValue;
  
  const store = writable(initialValue);

  store.subscribe(value => {
    sessionStorage.setItem(key, JSON.stringify(value));
  });

  return store;
}

// --- Stores de Notificaciones ---
export const notificationCount = createPersistedStore('notificationCount', 0);
// Ahora guardamos objetos {id, text} en lugar de solo strings
export const notificationMessages = createPersistedStore('notificationMessages', []);

// --- Acciones de Notificaciones ---
export function addNotification(notification) {
  notificationMessages.update(messages => [notification, ...messages]);
  notificationCount.update(n => n + 1);
}

export function removeNotification(notificationId) {
  notificationMessages.update(messages => messages.filter(msg => msg.id !== notificationId));
  notificationCount.update(n => (n > 0 ? n - 1 : 0));
}

export function clearNotifications() {
  notificationMessages.set([]);
  notificationCount.set(0);
}

// --- Store Principal de UI ---
function createUIStore() {
  const { subscribe, update } = writable({
    currentView: 'dashboard',
    showWorkOrderModal: false,
    selectedRowData: null,
    selectedColumn: null,
    isSaving: false // Estado para el loader de guardado
  });

  return {
    subscribe,
    setCurrentView: (view) => update(store => ({ ...store, currentView: view })),
    openWorkOrderModal: (data, column) => update(store => ({
      ...store,
      showWorkOrderModal: true,
      selectedRowData: data,
      selectedColumn: column
    })),
    closeWorkOrderModal: () => update(store => ({ ...store, showWorkOrderModal: false, selectedRowData: null, selectedColumn: null })),
    setSaving: (isSaving) => update(store => ({ ...store, isSaving }))
  };
}

export const ui = createUIStore();


