import { writable } from 'svelte/store';
import { auth } from './auth';

function createDataStore() {
  const { subscribe, update } = writable({
    dashboardData: [],
    users: [],
    machines: [],
    inspections: [],
    workOrders: [],
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
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${BASE_URL}/api/v1/${endpoint}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });
    if (response.status === 401 || response.status === 403) { // Handle 401 and 403
      auth.logout();
      throw new Error('Sesión expirada o no autorizada.');
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
    fetchDashboardData: () => fetchGeneric('dashboardData', 'inspection'),
 
    fetchUsers: () => fetchGeneric('users', 'user'),
    createUser: async (newUser) => {
      const createdUser = await apiFetch('user', { method: 'POST', body: JSON.stringify(newUser) });
      // Ensure fullName and role are correctly mapped, assuming server might return full_name or similar
      const userToAdd = {
        ...createdUser,
        fullName: createdUser.fullName || createdUser.full_name, // Prioritize fullName, fallback to full_name
        role: createdUser.role // Assuming role is always consistent
      };
      update(store => ({ ...store, users: [...store.users, userToAdd] }));
    },
    toggleUserStatus: async (user) => {
      const updatedUser = { ...user, status: !user.status }; // Create a new user object with toggled status
      await apiFetch(`user/${user.id}`, { method: 'PUT', body: JSON.stringify(updatedUser) });
      update(store => ({
        ...store,
        users: store.users.map(u => u.id === user.id ? updatedUser : u)
      }));
    },
    updateUser: async (userId, userData) => {
        const updatedUser = await apiFetch(`user/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
        update(store => ({
            ...store,
            users: store.users.map(u => u.id === userId ? updatedUser : u)
        }));
    },
    
    fetchMachines: () => fetchGeneric('machines', 'machine'),
    createMachine: async (newMachine) => {
      const createdMachine = await apiFetch('machine', { method: 'POST', body: JSON.stringify(newMachine) });
      update(store => ({ ...store, machines: [...store.machines, createdMachine] }));
    },
    updateMachine: async (machine) => {
      const updatedMachine = await apiFetch(`machine/${machine.id}`, { method: 'PUT', body: JSON.stringify(machine) });
      update(store => ({
          ...store,
          machines: store.machines.map(m => m.id === machine.id ? updatedMachine : m)
      }));
    },
    deleteMachine: async (machineId) => {
      await apiFetch(`machine/${machineId}`, { method: 'DELETE' });
      update(store => ({
          ...store,
          machines: store.machines.filter(m => m.id !== machineId)
      }));
    },

    fetchInspections: () => fetchGeneric('inspections', 'inspection'),
    createInspection: async (newInspection) => {
      const createdInspection = await apiFetch('inspection', { method: 'POST', body: JSON.stringify(newInspection) });
      update(store => ({ ...store, inspections: [...store.inspections, createdInspection] }));
    },
    updateInspection: async (inspectionId, inspectionData) => {
      const updatedInspection = await apiFetch(`inspection/${inspectionId}`, { method: 'PUT', body: JSON.stringify(inspectionData) });
      update(store => ({
          ...store,
          inspections: store.inspections.map(i => i.id === inspectionId ? updatedInspection : i)
      }));
    },
    deleteInspection: async (inspectionId) => {
      await apiFetch(`inspection/${inspectionId}`, { method: 'DELETE' });
      update(store => ({
          ...store,
          inspections: store.inspections.filter(i => i.id !== inspectionId)
      }));
    },

    fetchWorkOrders: () => fetchGeneric('workOrders', 'work-order'),
    createWorkOrder: async (newWorkOrder) => {
      const createdWorkOrder = await apiFetch('work-order', { method: 'POST', body: JSON.stringify(newWorkOrder) });
      update(store => ({ ...store, workOrders: [...store.workOrders, createdWorkOrder] }));
    },
  };
}

export const data = createDataStore();