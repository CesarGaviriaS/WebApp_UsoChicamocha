import { writable } from 'svelte/store';
import { jwtDecode } from "jwt-decode";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to manage tokens and user data in one place
function setSession(accessToken, refreshToken, decodedPayload) {
  const userRole = (decodedPayload.role || '').replace(/[\[\]']+/g, '').replace('ROLE_', '');
  
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  localStorage.setItem('userName', decodedPayload.sub);
  localStorage.setItem('userRole', userRole);

  return { name: decodedPayload.sub, role: userRole };
}

// Helper function to clear session data
function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
}

function createAuthStore() {
  const { subscribe, set } = writable({
    isAuthenticated: false,
    currentUser: null,
  });

  // --- Refresh Token Logic ---
  async function refreshToken() {
    console.log("Intentando renovar el token de acceso...");
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      if (!data.status || !data.jwt) {
        throw new Error('Invalid refresh response');
      }

      const newAccessToken = data.jwt;
      const newDecodedPayload = jwtDecode(newAccessToken);
      
      // Set the new session with the new access token, keeping the same refresh token
      const currentUser = setSession(newAccessToken, storedRefreshToken, newDecodedPayload);
      set({ isAuthenticated: true, currentUser });
      
      return true;

    } catch (error) {
      console.error("Refresh token failed:", error);
      // If refresh fails, clear everything to force re-login
      clearSession();
      set({ isAuthenticated: false, currentUser: null });
      return false;
    }
  }

  return {
    subscribe,
    login: async (username, password) => {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          console.error('Authentication error, Status:', response.status);
          throw new Error('Incorrect username or password.');
        }

        const data = await response.json();
        if (!data.status || !data.jwt || !data.refreshToken) {
          throw new Error(data.message || 'Login failed.');
        }

        const accessToken = data.jwt;
        const newRefreshToken = data.refreshToken;
        const decodedPayload = jwtDecode(accessToken);

        const currentUser = setSession(accessToken, newRefreshToken, decodedPayload);
        set({ isAuthenticated: true, currentUser });

        return { success: true, error: null };

      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    logout: () => {
      clearSession();
      set({ isAuthenticated: false, currentUser: null });
    },
    checkAuth: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isAuthenticated: false, currentUser: null });
        return false;
      }

      try {
        const decodedPayload = jwtDecode(token);
        const isExpired = decodedPayload.exp * 1000 < Date.now();

        if (isExpired) {
          console.log("Token de acceso expirado, intentando renovar...");
          // Token is expired, try to refresh it
          const refreshed = await refreshToken();
          return refreshed; // Returns true on success, false on failure
        }
        
        // Token is valid, set the application state
        const userRole = localStorage.getItem('userRole');
        set({ isAuthenticated: true, currentUser: { name: decodedPayload.sub, role: userRole } });
        return true;

      } catch (error) {
        // If the token is invalid for any reason
        clearSession();
        set({ isAuthenticated: false, currentUser: null });
        return false;
      }
    },
    // Expose the refreshToken function in case it needs to be called manually
    // or from an API interceptor in the future.
    refreshToken,
  };
}

export const auth = createAuthStore();
