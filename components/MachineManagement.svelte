<script>
  import { data } from '../stores/data.js';

  // --- LOCAL STATE (Svelte 4 syntax) ---
  // Se leen los datos directamente del store en el HTML usando '$data'
  let isSubmitting = false;
  let errorMessage = ''; // New error message variable
  const initialMachineState = {
    name: '', model: '', numEngine: '', numInterIdentification: '',
    brand: '', soat: '', runt: ''
  };
  let newMachine = { ...initialMachineState };
  let editingMachine = null;
  let showEditModal = false;
  let machineToDelete = null;

  // --- CRUD FUNCTIONS (llaman al store) ---
  async function handleCreateMachine(event) {
    event.preventDefault();
    isSubmitting = true;
    errorMessage = ''; // Clear previous errors
    try {
      await data.createMachine(newMachine);
      newMachine = { ...initialMachineState };
    } catch (e) {
      console.error("Fallo al crear máquina:", e);
      errorMessage = e.message || 'Error al crear máquina.'; // Set error message
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUpdateMachine(event) {
    event.preventDefault();
    if (!editingMachine) return;
    isSubmitting = true;
    errorMessage = ''; // Clear previous errors
    try {
      await data.updateMachine(editingMachine);
      closeEditModal();
    } catch (e) {
      console.error("Fallo al actualizar máquina:", e);
      errorMessage = e.message || 'Error al actualizar máquina.'; // Set error message
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDeleteMachine() {
    if (!machineToDelete) return;
    errorMessage = ''; // Clear previous errors
    try {
      await data.deleteMachine(machineToDelete.id);
      machineToDelete = null;
    } catch (e) {
      console.error("Fallo al eliminar máquina:", e);
      errorMessage = e.message || 'Error al eliminar máquina.'; // Set error message
    }
  }

  // --- MODAL FUNCTIONS ---
  function openEditModal(machine) {
    editingMachine = { ...machine };
    showEditModal = true;
  }
  function closeEditModal() {
    showEditModal = false;
    editingMachine = null;
    errorMessage = ''; // Clear error when closing modal
  }
</script>

<div class="management-container">
  <div class="form-container">
    <h3>Crear Nueva Máquina</h3>
    <form class="create-form" on:submit={handleCreateMachine}>
      <input type="text" placeholder="Nombre" bind:value={newMachine.name} required disabled={isSubmitting} />
      <input type="text" placeholder="Marca" bind:value={newMachine.brand} disabled={isSubmitting} />
      <input type="text" placeholder="Modelo" bind:value={newMachine.model} required disabled={isSubmitting} />
      <input type="text" placeholder="Núm. Motor" bind:value={newMachine.numEngine} disabled={isSubmitting} />
      <input type="text" placeholder="Núm. Identificación" bind:value={newMachine.numInterIdentification} disabled={isSubmitting} />
      <div class="form-group">
        <label for="newSoat">SOAT:</label>
        <input type="date" id="newSoat" bind:value={newMachine.soat} disabled={isSubmitting} />
      </div>
      <div class="form-group">
        <label for="newRunt">RUNT:</label>
        <input type="date" id="newRunt" bind:value={newMachine.runt} disabled={isSubmitting} />
      </div>
      <button type="submit" class="btn-create" disabled={isSubmitting}>
        {isSubmitting ? 'Creando...' : 'Crear'}
      </button>
    </form>
    {#if errorMessage}
      <p class="error-message">{errorMessage}</p>
    {/if}
  </div>

  <div class="table-wrapper">
    {#if $data.isLoading}
      <p>Cargando máquinas...</p>
    {:else if $data.error}
      <p class="error-message">{$data.error}</p>
    {:else}
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Núm. Motor</th>
            <th>ID Interno</th>
            <th>SOAT</th>
            <th>RUNT</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each $data.machines as machine (machine.id)}
            <tr>
              <td>{machine.id}</td>
              <td>{machine.name}</td>
              <td>{machine.brand}</td>
              <td>{machine.model}</td>
              <td>{machine.numEngine}</td>
              <td>{machine.numInterIdentification}</td>
              <td>{machine.soat}</td>
              <td>{machine.runt}</td>
              <td class="actions">
                <button class="btn-action btn-edit" on:click={() => openEditModal(machine)}>Editar</button>
                <button class="btn-action btn-delete" on:click={() => machineToDelete = machine}>Eliminar</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<!-- Modal de Edición -->
{#if showEditModal}
  <div class="modal-overlay" on:click={closeEditModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Editar Máquina</h3>
        <button class="close-btn" on:click={closeEditModal}>×</button>
      </div>
      <form class="modal-form" on:submit={handleUpdateMachine}>
        <label>Nombre: <input type="text" bind:value={editingMachine.name} required /></label>
        <label>Marca: <input type="text" bind:value={editingMachine.brand} /></label>
        <label>Modelo: <input type="text" bind:value={editingMachine.model} required /></label>
        <label>Núm. Motor: <input type="text" bind:value={editingMachine.numEngine} /></label>
        <label>Núm. Identificación: <input type="text" bind:value={editingMachine.numInterIdentification} /></label>
        <label>SOAT: <input type="date" bind:value={editingMachine.soat} /></label>
        <label>RUNT: <input type="date" bind:value={editingMachine.runt} /></label>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" on:click={closeEditModal}>Cancelar</button>
          <button type="submit" class="btn-save" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
        {#if errorMessage}
          <p class="error-message">{errorMessage}</p>
        {/if}
      </form>
    </div>
  </div>
{/if}

<!-- Modal de Confirmación de Eliminación -->
{#if machineToDelete}
  <div class="modal-overlay" on:click={() => machineToDelete = null}>
    <div class="modal-content confirmation" on:click|stopPropagation>
      <h3>Confirmar Eliminación</h3>
      <p>¿Está seguro que desea eliminar la máquina "{machineToDelete.name} {machineToDelete.model}"?</p>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" on:click={() => machineToDelete = null}>Cancelar</button>
        <button type="button" class="btn-delete" on:click={handleDeleteMachine}>Sí, Eliminar</button>
      </div>
    </div>
  </div>
{/if}



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
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .create-form input, .create-form select {
    padding: 4px 6px;
    border: 1px inset #c0c0c0;
    font-size: 11px;
    font-family: inherit;
    flex: 1;
    min-width: 150px;
  }
  .btn-create {
    padding: 4px 12px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 11px;
  }
  .btn-create:hover {
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
  }
  .btn-create:disabled, .btn-save:disabled {
    background: #c0c0c0;
    cursor: not-allowed;
  }
  .table-wrapper {
    flex: 1;
    overflow-y: auto;
    background-color: #ffffff;
    border: 2px outset #c0c0c0;
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
  .actions {
    display: flex;
    gap: 8px;
  }
  .btn-action {
    padding: 2px 8px;
    border: 1px outset #c0c0c0;
    cursor: pointer;
  }
  .btn-edit { background-color: #f0f0f0; }
  .btn-delete { background-color: #ffbaba; }
  .error-message { color: red; }
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
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
  .modal-form input, .modal-form select {
    padding: 4px 6px;
    border: 1px inset #c0c0c0;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  .btn-cancel, .btn-save {
    padding: 4px 12px;
    border: 1px outset #c0c0c0;
    cursor: pointer;
  }
  .btn-save { font-weight: bold; }
</style>