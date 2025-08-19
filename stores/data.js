import { writable } from 'svelte/store';
import { auth } from './auth';

function createDataStore() {
  const { subscribe, update } = writable({
    dashboardData: [],
    users: [],
    machines: [],
    isLoading: false,
    error: null
  });

  async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      auth.logout();
      throw new Error('No autenticado.');
    }
    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(`https://pdxs8r4k-8000.use2.devtunnels.ms/${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });
    if (response.status === 401) {
      auth.logout();
      throw new Error('Sesión expirada.');
    }
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Error en la petición a ${endpoint}`);
    }
    return data;
  }

  async function fetchGeneric(key, endpoint) {
    update(store => ({ ...store, isLoading: true, error: null }));
    try {
      const result = await apiFetch(endpoint);
      update(store => ({ ...store, [key]: result, isLoading: false }));
    } catch (err) {
      update(store => ({ ...store, error: err.message, isLoading: false }));
    }
  }

  return {
    subscribe,
    fetchDashboardData: () => fetchGeneric('dashboardData', 'dashboard/estados'),
    fetchUsers: () => fetchGeneric('users', 'users'),
    fetchMachines: () => fetchGeneric('machines', 'equipos'),
    
    createUser: async (newUser) => {
      await apiFetch('users', { method: 'POST', body: JSON.stringify(newUser) });
      await fetchGeneric('users', 'users');
    },
    toggleUserStatus: async (user) => {
      const newStatus = user.status === 'activo' ? 'inactivo' : 'activo';
      await apiFetch(`users/${user.id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      update(store => ({
        ...store,
        users: store.users.map(u => u.id === user.id ? { ...u, status: newStatus } : u)
      }));
    },
    updateUser: async (userId, userData) => {
        await apiFetch(`users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
        await fetchGeneric('users', 'users');
    },
    
    createMachine: async (newMachine) => {
      await apiFetch('equipos', { method: 'POST', body: JSON.stringify(newMachine) });
      await fetchGeneric('machines', 'equipos');
    },
    updateMachine: async (machine) => {
      await apiFetch(`equipos/${machine.id}`, { method: 'PUT', body: JSON.stringify(machine) });
      await fetchGeneric('machines', 'equipos');
    },
    deleteMachine: async (machineId) => {
      await apiFetch(`equipos/${machineId}`, { method: 'DELETE' });
      await fetchGeneric('machines', 'equipos');
    }
  };
}

export const data = createDataStore();
