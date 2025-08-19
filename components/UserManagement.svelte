<script>
  import { data } from '../stores/data.js';

  // --- LOCAL STATE (Svelte 4 syntax) ---
  let isSubmitting = false;
  let newUser = {
    username: '',
    gmail: '',
    fullName: '',
    password: '',
    role: 'Mecanico'
  };

  // --- CRUD FUNCTIONS (llaman al store) ---
  async function handleCreateUser(event) {
    event.preventDefault();
    isSubmitting = true;
    try {
      await data.createUser(newUser);
      newUser = { username: '', gmail: '', fullName: '', password: '', role: 'Mecanico' };
    } catch (e) {
      console.error("Fallo al crear usuario:", e);
    } finally {
      isSubmitting = false;
    }
  }

  async function handleToggleStatus(user) {
    try {
      await data.toggleUserStatus(user);
    } catch (e) {
      console.error("Fallo al cambiar estado:", e);
    }
  }
</script>

<div class="management-container">
  <div class="form-container">
    <h3>Crear Nuevo Usuario</h3>
    <form class="create-form" on:submit={handleCreateUser}>
      <input type="text" placeholder="Nombre de usuario" bind:value={newUser.username} required disabled={isSubmitting} />
      <input type="email" placeholder="Gmail" bind:value={newUser.gmail} disabled={isSubmitting} />
      <input type="text" placeholder="Nombre completo" bind:value={newUser.fullName} required disabled={isSubmitting} />
      <input type="password" placeholder="Contraseña" bind:value={newUser.password} required disabled={isSubmitting} />
      <select bind:value={newUser.role} required disabled={isSubmitting}>
        <option value="Supervisor">Supervisor</option>
        <option value="Mecanico">Mecánico</option>
        <option value="Administrador">Administrador</option>
      </select>
      <button type="submit" class="btn-create" disabled={isSubmitting}>
        {isSubmitting ? 'Creando...' : 'Crear'}
      </button>
    </form>
  </div>

  <div class="table-wrapper">
    {#if $data.isLoading}
      <p>Cargando usuarios...</p>
    {:else if $data.error}
      <p class="error-message">{$data.error}</p>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Gmail</th>
            <th>Nombre Completo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each $data.users as user (user.id)}
            <tr>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.gmail}</td>
              <td>{user.full_name}</td>
              <td>{user.role}</td>
              <td>
                <span class="status-badge" class:active={user.status === 'activo'}>
                  {user.status}
                </span>
              </td>
              <td>
                <button class="btn-toggle" on:click={() => handleToggleStatus(user)}>
                  {user.status === 'activo' ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .management-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    font-size: 11px;
  }
  .form-container {
    padding: 16px;
    background: #e0e0e0;
    border: 2px outset #c0c0c0;
  }
  h3 {
    margin: 0 0 12px 0;
  }
  .create-form {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .create-form input, .create-form select {
    padding: 4px 6px;
    border: 1px inset #c0c0c0;
    font-size: 11px;
    font-family: inherit;
  }
  .btn-create, .btn-toggle {
    padding: 4px 12px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 11px;
  }
  .btn-create:hover, .btn-toggle:hover {
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
  }
  .btn-create:disabled {
    background: #c0c0c0;
    cursor: not-allowed;
  }
  .table-wrapper {
    flex: 1;
    overflow-y: auto;
    background-color: #ffffff;
    border: 2px inset #c0c0c0;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  .data-table th, .data-table td {
    border: 1px solid #808080;
    padding: 8px;
    text-align: left;
    background-color: #ffffff;
  }
  .data-table th {
    background: #c0c0c0;
  }
  .status-badge {
    padding: 2px 6px;
    border-radius: 4px;
    color: white;
    background-color: #808080; /* Inactivo */
  }
  .status-badge.active {
    background-color: #008000; /* Activo */
  }
  .error-message {
    color: red;
  }
</style>
