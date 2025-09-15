<script>
  import { data } from "../../stores/data.js";
  import { onDestroy } from "svelte";
  import DataGrid from '../shared/DataGrid.svelte';
  import { userColumns } from '../../config/table-definitions.js';

  // --- LOCAL STATE ---
  let isSubmitting = false;
  let errorMessage = "";
  const initialUserState = {
    username: "",
    email: "",
    fullName: "",
    password: "",
    role: "Mecanico",
  };
  let newUser = { ...initialUserState };

  // --- MODAL STATE ---
  let userToDelete = null;
  let showDeleteModal = false;
  let isDeleteConfirmEnabled = false;
  let deleteConfirmTimer = null;

  let userToEdit = null;
  let showEditModal = false;
  let newPassword = "";

  // --- LIFECYCLE ---
  onDestroy(() => {
    if (deleteConfirmTimer) clearTimeout(deleteConfirmTimer);
  });

  // --- CRUD FUNCTIONS ---
  async function handleCreateUser(event) {
    event.preventDefault();
    isSubmitting = true;
    errorMessage = "";
    try {
      await data.createUser(newUser);
      newUser = { ...initialUserState };
    } catch (e) {
      errorMessage = e.message || "Error al crear usuario.";
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUpdateUser(event) {
    event.preventDefault();
    if (!userToEdit) return;
    isSubmitting = true;
    errorMessage = "";
    try {
      const updatePromises = [];
      // Check if user data (non-password) has changed
      const originalUser = $data.users.find((u) => u.id === userToEdit.id);
      if (
        originalUser.username !== userToEdit.username ||
        originalUser.email !== userToEdit.email
      ) {
        updatePromises.push(
          data.updateUser(userToEdit.id, {
            username: userToEdit.username,
            email: userToEdit.email,
          })
        );
      }

      // Check if a new password was entered
      if (newPassword) {
        updatePromises.push(
          data.changeUserPassword(userToEdit.id, newPassword)
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      closeEditModal();
    } catch (e) {
      errorMessage = e.message || "Error al actualizar usuario.";
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    errorMessage = "";
    try {
      await data.deleteUser(userToDelete.id);
      closeDeleteModal();
    } catch (e) {
      errorMessage = e.message || "Error al eliminar usuario.";
    }
  }

  // --- MODAL LOGIC ---
  function handleAction(event) {
    const { type, data: userData } = event.detail;
    if (type === 'edit') {
      openEditModal(userData);
    } else if (type === 'delete') {
      openDeleteModal(userData);
    }
  }

  function openDeleteModal(user) {
    userToDelete = user;
    showDeleteModal = true;
    isDeleteConfirmEnabled = false;
    deleteConfirmTimer = setTimeout(() => {
      isDeleteConfirmEnabled = true;
    }, 3000);
  }

  function closeDeleteModal() {
    if (deleteConfirmTimer) clearTimeout(deleteConfirmTimer);
    showDeleteModal = false;
    userToDelete = null;
  }

  function openEditModal(user) {
    userToEdit = { ...user };
    newPassword = "";
    errorMessage = "";
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    userToEdit = null;
  }
</script>

<div class="management-container">
  <!-- Formulario de Creación (sin cambios) -->
  <div class="form-container">
    <h3>Crear Nuevo Usuario</h3>
    <form class="create-form" on:submit={handleCreateUser}>
      <input
        type="text"
        placeholder="Nombre de usuario"
        bind:value={newUser.username}
        required
        disabled={isSubmitting}
      />
      <input
        type="email"
        placeholder="Gmail"
        bind:value={newUser.email}
        disabled={isSubmitting}
      />
      <input
        type="text"
        placeholder="Nombre completo"
        bind:value={newUser.fullName}
        required
        disabled={isSubmitting}
      />
      <input
        type="password"
        placeholder="Contraseña"
        bind:value={newUser.password}
        required
        disabled={isSubmitting}
      />
      <select bind:value={newUser.role} required disabled={isSubmitting}>
        <option value="Supervisor">Supervisor</option>
        <option value="Mecanico">Mecánico</option>
        <option value="Administrador">Administrador</option>
      </select>
      <button type="submit" class="btn-create" disabled={isSubmitting}>
        {isSubmitting ? "Creando..." : "Crear"}
      </button>
    </form>
  </div>

  <!-- Tabla de Usuarios (actualizada) -->
  <div class="table-wrapper">
    <DataGrid columns={userColumns} data={$data.users} on:action={handleAction} />
  </div>
</div>

<!-- Modal de Edición -->
{#if showEditModal}
  <div class="modal-overlay" on:click={closeEditModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Editar Usuario</h3>
        <button class="close-btn" on:click={closeEditModal}>×</button>
      </div>
      <form class="modal-form" on:submit={handleUpdateUser}>
        <label
          >Usuario: <input
            type="text"
            bind:value={userToEdit.username}
            required
          /></label
        >
        <label
          >Gmail: <input type="email" bind:value={userToEdit.email} /></label
        >
        <label
          >Nueva Contraseña: <input
            type="password"
            bind:value={newPassword}
            placeholder="Dejar en blanco para no cambiar"
          /></label
        >

        {#if errorMessage}
          <p class="error-message">{errorMessage}</p>
        {/if}

        <div class="modal-actions">
          <button type="button" class="btn-cancel" on:click={closeEditModal}
            >Cancelar</button
          >
          <button type="submit" class="btn-save" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal de Confirmación de Eliminación -->
{#if showDeleteModal}
  <div class="modal-overlay" on:click={closeDeleteModal}>
    <div class="modal-content confirmation" on:click|stopPropagation>
      <h3>Confirmar Eliminación</h3>
      <p>
        ¿Está seguro que desea eliminar al usuario "{userToDelete.fullName}"?
      </p>
      {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
      {/if}
      <div class="modal-actions">
        <button type="button" class="btn-cancel" on:click={closeDeleteModal}
          >Cancelar</button
        >
        <button
          type="button"
          class="btn-delete"
          on:click={handleDeleteUser}
          disabled={!isDeleteConfirmEnabled}
        >
          {isDeleteConfirmEnabled ? "Sí, Eliminar" : "Espere 3 segundos"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .management-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    font-family: "MS Sans Serif", "Tahoma", sans-serif;
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
  .create-form input,
  .create-form select {
    padding: 4px 6px;
    border: 1px inset #c0c0c0;
    font-size: 11px;
    font-family: inherit;
  }
  .btn-create {
    padding: 4px 12px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 11px;
  }
  .table-wrapper {
    flex: 1;
    overflow-y: auto;
    background-color: #ffffff;
    border: 2px inset #c0c0c0;
  }
  .error-message {
    color: red;
    margin-top: 10px;
  }
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .modal-content {
    background: #e0e0e0;
    padding: 20px;
    border: 2px outset #c0c0c0;
    min-width: 400px;
  }
  .modal-content.confirmation {
    font-size: medium;
    text-align: center;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
  }
  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .modal-form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .modal-form input {
    padding: 4px 6px;
    border: 1px inset #c0c0c0;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  .btn-cancel,
  .btn-save {
    padding: 4px 12px;
    border: 1px outset #c0c0c0;
    cursor: pointer;
  }
  .btn-save {
    font-weight: bold;
  }
  .btn-delete[disabled] {
    background: #d3d3d3;
    cursor: not-allowed;
  }
  .loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px; /* O una altura adecuada */
  }
</style>
