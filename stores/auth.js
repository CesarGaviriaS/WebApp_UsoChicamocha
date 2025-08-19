import { writable } from 'svelte/store';

function createAuthStore() {
  const { subscribe, set } = writable({
    isAuthenticated: false,
    currentUser: null,
  });

  return {
    subscribe,
    login: async (username, password) => {
      try {
        const response = await fetch('https://pdxs8r4k-8000.use2.devtunnels.ms/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: username, pass: password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Error al iniciar sesión.');
        }

        const allowedRoles = ['Administrador', 'Supervisor'];
        if (!allowedRoles.includes(data.rol)) {
          throw new Error('No tiene permisos para acceder a esta aplicación.');
        }

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('userName', data.name);
        
        set({ isAuthenticated: true, currentUser: { name: data.name } });
        return { success: true, error: null };

      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    logout: () => {
      localStorage.clear();
      set({ isAuthenticated: false, currentUser: null });
    },
    checkAuth: () => {
      const token = localStorage.getItem('accessToken');
      const userName = localStorage.getItem('userName');
      if (token && userName) {
        set({ isAuthenticated: true, currentUser: { name: userName } });
        return true;
      }
      set({ isAuthenticated: false, currentUser: null });
      return false;
    }
  };
}

export const auth = createAuthStore();
