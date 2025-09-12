import { auth } from './auth';

async function fetchWithAuth(endpoint, options = {}) {
  console.log(`Realizando petición a: ${endpoint}`);
  await auth.checkAuth();

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

  if (response.status === 401 || response.status === 403) {
    auth.logout();
    throw new Error('Sesión expirada o no autorizada.');
  }

  const responseText = await response.text();

  if (!response.ok) {
    try {
      const errorJson = JSON.parse(responseText);
      throw new Error(errorJson.message || responseText);
    } catch (e) {
      throw new Error(responseText || `Error ${response.status}: ${response.statusText}`);
    }
  }

  if (response.status === 204 || !responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error("La respuesta del servidor no es un JSON válido a pesar de un estado OK.");
  }
}

export async function fetchWithoutV1(endpoint, options = {}) {
  console.log(`Realizando petición a: ${endpoint}`);
  await auth.checkAuth();

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
  const response = await fetch(`${BASE_URL}/api/${endpoint}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });

  if (response.status === 401 || response.status === 403) {
    auth.logout();
    throw new Error('Sesión expirada o no autorizada.');
  }

  const responseText = await response.text();

  if (!response.ok) {
    try {
      const errorJson = JSON.parse(responseText);
      throw new Error(errorJson.message || responseText);
    } catch (e) {
      throw new Error(responseText || `Error ${response.status}: ${response.statusText}`);
    }
  }

  if (response.status === 204 || !responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error("La respuesta del servidor no es un JSON válido a pesar de un estado OK.");
  }
}

export default fetchWithAuth;