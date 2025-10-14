import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import Login from '../../components/views/Login.svelte';

// Simular el store de auth
vi.mock('../../stores/auth.js', () => ({
  auth: {
    login: vi.fn(),
  },
}));

// Simular el store de data
vi.mock('../../stores/data.js', () => ({
  data: {
    fetchDashboardData: vi.fn(),
  },
}));

import { auth } from '../../stores/auth.js';
import { data as dataStore } from '../../stores/data.js';

/**
 * @description Suite de pruebas para la vista Login.
 * Verifica el renderizado del formulario de login, manejo de inputs, autenticación y estados de error.
 * Tests incluidos:
 * - renders login form with all elements: Verifica que se renderice el formulario de login con todos los elementos.
 * - updates username and password on input: Verifica que se actualicen usuario y contraseña al ingresar datos.
 * - calls auth.login and data.fetchDashboardData on successful login: Verifica que se llamen auth.login y data.fetchDashboardData en login exitoso.
 * - shows error message on login failure: Verifica que se muestre mensaje de error en fallo de login.
 * - shows loading state during login: Verifica que se muestre estado de carga durante el login.
 * - handles login error from exception: Verifica que se maneje error de login desde excepción.
 * - handles form submission: Verifica que se maneje el envío del formulario.
 * - requires username and password fields: Verifica que los campos usuario y contraseña sean requeridos.
 */
describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with all elements', async () => {
    render(Login);

    await tick();

    expect(screen.getByText('Panel de Control - Acceso')).toBeTruthy();
    expect(screen.getByLabelText('Usuario:')).toBeTruthy();
    expect(screen.getByLabelText('Contraseña:')).toBeTruthy();
    expect(screen.getByText('Ingresar')).toBeTruthy();
    expect(screen.getByAltText('Logo de Usochicamocha')).toBeTruthy();
  });

  it('updates username and password on input', async () => {
    render(Login);

    await tick();

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');

    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'testpass' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpass');
  });

  it('calls auth.login and data.fetchDashboardData on successful login', async () => {
    auth.login.mockResolvedValue({ success: true });
    dataStore.fetchDashboardData.mockResolvedValue();

    render(Login);

    await tick();

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByText('Ingresar');

    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'testpass' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('testuser', 'testpass');
      expect(dataStore.fetchDashboardData).toHaveBeenCalled();
    });
  });

  it('shows error message on login failure', async () => {
    auth.login.mockResolvedValue({ success: false, error: 'Invalid credentials' });

    render(Login);

    await tick();

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByText('Ingresar');

    await fireEvent.input(usernameInput, { target: { value: 'wronguser' } });
    await fireEvent.input(passwordInput, { target: { value: 'wrongpass' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('shows loading state during login', async () => {
    auth.login.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

    render(Login);

    await tick();

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByText('Ingresar');

    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(submitButton);

    // El botón debería mostrar texto de carga
    await waitFor(() => {
      expect(screen.getByText('Ingresando...')).toBeTruthy();
    });

    // Después de que el login se complete
    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('testuser', 'testpass');
    });
  });

  it('handles login error from exception', async () => {
    auth.login.mockRejectedValue(new Error('Network error'));

    render(Login);

    await tick();

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByText('Ingresar');

    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'testpass' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('handles form submission', async () => {
    auth.login.mockResolvedValue({ success: true });

    render(Login);

    await tick();

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');
    const submitButton = screen.getByText('Ingresar');

    await fireEvent.input(usernameInput, { target: { value: 'testuser' } });
    await fireEvent.input(passwordInput, { target: { value: 'testpass' } });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('testuser', 'testpass');
    });
  });

  it('requires username and password fields', async () => {
    render(Login);

    await tick();

    const usernameInput = screen.getByLabelText('Usuario:');
    const passwordInput = screen.getByLabelText('Contraseña:');

    expect(usernameInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });
});