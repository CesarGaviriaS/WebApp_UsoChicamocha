import { writable } from 'svelte/store';

function createUIStore() {
  const { subscribe, update } = writable({
    currentView: 'dashboard',
    showWorkOrderModal: false,
    selectedRowData: null,
    selectedColumn: null
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
    closeWorkOrderModal: () => update(store => ({ ...store, showWorkOrderModal: false, selectedRowData: null, selectedColumn: null }))
  };
}

export const ui = createUIStore();
