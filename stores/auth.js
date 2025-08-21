import { writable } from 'svelte/store';
import { jwtDecode } from "jwt-decode"; 


const BASE_URL = import.meta.env.VITE_API_BASE_URL; 

function createAuthStore() {
  const { subscribe, set } = writable({
    isAuthenticated: false,
    currentUser: null, // Guardará { name, role }
  });

  return {
    subscribe,
    login: async (username, password) => {
      try {
        // <-- 3. URL y cuerpo de la petición actualizados
        const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, password: password }) 
        });
         // ======================= CAMBIO CLAVE =======================
    // 1. Verificamos si la respuesta NO fue exitosa (ej. 401, 403, 500)
    if (!response.ok) {
        // Imprimimos el status para saber qué error fue (ej. 401)
        console.error('Error de autenticación, Status:', response.status); 
        throw new Error('Usuario o contraseña incorrectos.');
    }
    // ====

        const data = await response.json();
        if (!data.status) {
          throw new Error(data.message || 'Error al iniciar sesión.');
        }

        const token = data.jwt;
        const decodedPayload = jwtDecode(token); // <-- 4. Decodificamos el token

        // <-- 5. Verificamos el rol desde el payload del token
        const rawRole = decodedPayload.role || '';
        const userRole = rawRole.replace(/[\[\]']+/g, '').replace('ROLE_', '');

        // <-- 6. Guardamos el nuevo token y los datos del usuario decodificados
        localStorage.setItem('accessToken', token);
        localStorage.setItem('userName', decodedPayload.sub); // El nombre de usuario está en 'sub'
        localStorage.setItem('userRole', userRole);
        
        set({ isAuthenticated: true, currentUser: { name: decodedPayload.sub, role: userRole } });
        return { success: true, error: null };

      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    logout: () => {
      // <-- 7. Es más seguro remover items específicos que limpiar todo
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      set({ isAuthenticated: false, currentUser: null });
    },
    checkAuth: () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isAuthenticated: false, currentUser: null });
        return false;
      }

      try {
        // <-- 8. Verificamos la validez y expiración del token al cargar la app
        const decodedPayload = jwtDecode(token);
        const isExpired = decodedPayload.exp * 1000 < Date.now();

        if (isExpired) {
          // Si el token ha expirado, cerramos la sesión
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userName');
          localStorage.removeItem('userRole');
          set({ isAuthenticated: false, currentUser: null });
          return false;
        }
        
        // Si el token es válido, establecemos el estado de la aplicación
        const userRole = localStorage.getItem('userRole');
        set({ isAuthenticated: true, currentUser: { name: decodedPayload.sub, role: userRole } });
        return true;

      } catch (error) {
        // Si el token es inválido por alguna razón
        set({ isAuthenticated: false, currentUser: null });
        return false;
      }
    }
  };
}

export const auth = createAuthStore();