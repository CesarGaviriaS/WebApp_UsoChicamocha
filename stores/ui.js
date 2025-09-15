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
    // CORRECCIÓN: Se renombra para reflejar que es el objeto de definición completo.
    selectedColumnDef: null,
    isSaving: false
  });

  return {
    subscribe,
    setCurrentView: (view) => update(store => ({ ...store, currentView: view })),
    // CORRECCIÓN: La función ahora espera el objeto de definición de la columna.
    openWorkOrderModal: (data, columnDef) => update(store => ({
      ...store,
      showWorkOrderModal: true,
      selectedRowData: data,
      selectedColumnDef: columnDef
    })),
    closeWorkOrderModal: () => update(store => ({ ...store, showWorkOrderModal: false, selectedRowData: null, selectedColumnDef: null })),
    setSaving: (isSaving) => update(store => ({ ...store, isSaving }))
  };
}

export const ui = createUIStore();
