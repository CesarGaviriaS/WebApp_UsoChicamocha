import { writable } from 'svelte/store';
import fetchWithAuth from './api';

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

   async function fetchGeneric(key, endpoint) {
    update(store => ({ ...store, isLoading: true, error: null }));
    try {
      let result = await fetchWithAuth(endpoint);
      console.log(`API response for ${endpoint}:`, result);
      
      let dataToStore = result;

      if (result && typeof result === 'object' && !Array.isArray(result) && result.hasOwnProperty(key)) {
        dataToStore = result[key];
      }

      update(store => ({ ...store, [key]: dataToStore, isLoading: false }));
      return dataToStore;
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      update(store => ({ ...store, error: err.message, isLoading: false }));
      throw err;
    }
  }

  return {
    subscribe,
    fetchDashboardData: () => fetchGeneric('dashboardData', 'inspection'),
 
    fetchUsers: () => fetchGeneric('users', 'user'),
    createUser: async (newUser) => {
      const createdUser = await fetchWithAuth('user', { method: 'POST', body: JSON.stringify(newUser) });
      update(store => ({ ...store, users: [...store.users, createdUser] }));
    },
    updateUser: async (userId, userData) => {
        const updatedUser = await fetchWithAuth(`user/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
        update(store => ({
            ...store,
            users: store.users.map(u => u.id === userId ? updatedUser : u)
        }));
    },
    deleteUser: async (userId) => {
      await fetchWithAuth(`user/${userId}`, { method: 'DELETE' });
      update(store => ({
        ...store,
        users: store.users.filter(u => u.id !== userId)
      }));
    },
    changeUserPassword: async (userId, newPassword) => {
      await fetchWithAuth('user/change-password', {
        method: 'PUT',
        body: JSON.stringify({ id: userId, newPassword })
      });
    },
    toggleUserStatus: async (user) => {
      const payload = { ...user, status: !user.status };
      const updatedUserFromServer = await fetchWithAuth(`user/${user.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      update(store => ({
        ...store,
        users: store.users.map(u => u.id === user.id ? updatedUserFromServer : u)
      }));
    },
    
    fetchMachines: () => fetchGeneric('machines', 'machine'),
    createMachine: async (newMachine) => {
      const createdMachine = await fetchWithAuth('machine', { method: 'POST', body: JSON.stringify(newMachine) });
      update(store => ({ ...store, machines: [...store.machines, createdMachine] }));
    },
    updateMachine: async (machine) => {
      const updatedMachine = await fetchWithAuth(`machine/${machine.id}`, { method: 'PUT', body: JSON.stringify(machine) });
      update(store => ({
          ...store,
          machines: store.machines.map(m => m.id === machine.id ? updatedMachine : m)
      }));
    },
    deleteMachine: async (machineId) => {
      await fetchWithAuth(`machine/${machineId}`, { method: 'DELETE' });
      update(store => ({
          ...store,
          machines: store.machines.filter(m => m.id !== machineId)
      }));
    },

    fetchInspections: () => fetchGeneric('inspections', 'inspection'),
    createInspection: async (newInspection) => {
      const serverInspection = await fetchWithAuth('inspection', { method: 'POST', body: JSON.stringify(newInspection) });
      update(store => ({ ...store, inspections: [...store.inspections, serverInspection] }));
    },
    updateInspection: async (inspectionId, inspectionData) => {
      const serverInspection = await fetchWithAuth(`inspection/${inspectionId}`, { method: 'PUT', body: JSON.stringify(inspectionData) });
      update(store => ({
          ...store,
          inspections: store.inspections.map(i => i.id === inspectionId ? serverInspection : i)
      }));
    },
    deleteInspection: async (inspectionId) => {
      await fetchWithAuth(`inspection/${inspectionId}`, { method: 'DELETE' });
      update(store => ({
          ...store,
          inspections: store.inspections.filter(i => i.id !== inspectionId)
      }));
    },

    fetchWorkOrders: () => fetchGeneric('workOrders', 'order/all'),
    createWorkOrder: async (newWorkOrder) => {
      console.log('Enviando payload para crear orden:', JSON.stringify(newWorkOrder, null, 2));
      const createdWorkOrder = await fetchWithAuth('order', { method: 'POST', body: JSON.stringify(newWorkOrder) });
      update(store => ({ ...store, workOrders: [...store.workOrders, createdWorkOrder] }));
    },
  };
}

export const data = createDataStore();