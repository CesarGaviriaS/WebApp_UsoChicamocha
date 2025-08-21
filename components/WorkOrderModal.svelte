<script>
  import { createEventDispatcher } from 'svelte';
  // import { data } from '../stores/data.js'; // No longer needed if workers/areas are not used

  // --- PROPS (Svelte 4 syntax) ---
  export let rowData = null;
  export let column = '';
  export let currentUser = '';
  
  const dispatch = createEventDispatcher();

  // --- LOCAL STATE (Svelte 4 syntax) ---
  let workOrderForm = {
    areaTrabajoAsignada: '',
    quienAsigna: currentUser,
    asignadoA: '',
    maquinaInvolucrada: rowData?.maquina || '',
    componenteInvolucrado: column,
    detalles: '',
    prioridad: 'Media'
  };
  let showConfirmation = false;
  
  // --- DERIVED STATE (Svelte 4 reactive statements) ---
  let currentStatus;
  $: {
    if (!rowData || !column) {
      currentStatus = 'Desconocido';
    } else {
      const fieldMappings = {
        'Fugas Sistema': 'fugas',
        'Sistema Frenos': 'frenos',
        'Correas y Poleas': 'correas',
        'Llantas/Carriles': 'llantas',
        'Sistema Encendido': 'encendido',
        'Sistema Eléctrico': 'electrico',
        'Sistema Mecánico': 'mecanico',
        'Nivel Temperatura': 'temperatura',
        'Nivel Aceite': 'aceite',
        'Nivel Hidráulico': 'hidraulico',
        'Nivel Refrigerante': 'refrigerante',
        'Estado Estructural': 'estructural',
        'Vigencia Extintor': 'extintor'
      };
      const fieldName = fieldMappings[column];
      // El valor del estado ahora viene directamente de la prop 'value' que pasamos
      currentStatus = rowData.value || (fieldName ? rowData[fieldName] : 'Desconocido');
    }
  }

  // --- EFFECT (Svelte 4 reactive statements) ---
  $: workOrderForm.prioridad = getSuggestedPriority(currentStatus);
  $: workOrderForm.maquinaInvolucrada = rowData?.maquina || '';
  $: workOrderForm.componenteInvolucrado = column;
  $: workOrderForm.quienAsigna = currentUser;

  // --- FUNCTIONS ---
  function getStatusClass(status) {
    switch(status) {
      case 'Óptimo': return 'status-optimo';
      case 'Regular': return 'status-regular';
      case 'Malo': return 'status-malo';
      default: return 'status-unknown';
    }
  }
  
  function getSuggestedPriority(status) {
    switch(status) {
      case 'Óptimo': return 'Baja';
      case 'Regular': return 'Media';
      case 'Malo': return 'Alta';
      default: return 'Media';
    }
  }
  
  function getStatusMessage(status) {
    switch(status) {
      case 'Óptimo': return 'Funcionamiento normal';
      case 'Regular': return 'Requiere atención preventiva';
      case 'Malo': return 'Requiere atención inmediata';
      default: return 'Estado desconocido';
    }
  }
  
  function handleSubmit(event) {
    event.preventDefault();
    showConfirmation = true;
  }
  
  function confirmCreate() {
    dispatch('createWorkOrder', {
      ...workOrderForm,
      fechaCreacion: new Date().toISOString(),
      estado: 'Pendiente',
      estadoComponente: currentStatus
    });
    showConfirmation = false;
  }
  
  function cancelCreate() {
    showConfirmation = false;
  }

  function onCancel() {
      dispatch('cancel');
  }
</script>

<div class="modal-overlay" on:click={onCancel} on:keydown={(e) => e.key === 'Escape' && onCancel()}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>Crear Orden de Trabajo</h2>
      <button class="close-btn" on:click={onCancel}>×</button>
    </div>
    
    <div class="modal-body">
      <div class="machine-info">
        <h3>Información de la Máquina</h3>
        <div class="info-grid">
          <div class="info-item"><strong>Máquina:</strong> {rowData?.maquina}</div>
          <div class="info-item"><strong>Componente:</strong> {column}</div>
          <div class="info-item">
            <strong>Estado Actual:</strong> 
            <span class="status-badge {getStatusClass(currentStatus)}">{currentStatus}</span>
          </div>
          <div class="info-item">
            <strong>Descripción:</strong> 
            <span class="status-message">{getStatusMessage(currentStatus)}</span>
          </div>
        </div>
      </div>
      
      <form class="work-order-form" on:submit={handleSubmit}>
        <div class="form-row">
          <div class="form-group">
            <label for="areaTrabajoAsignada">Área de Trabajo:</label>
            <input type="text" bind:value={workOrderForm.areaTrabajoAsignada} id="areaTrabajoAsignada" placeholder="Área de Trabajo" required />
          </div>
          <div class="form-group">
            <label for="prioridad">Prioridad:</label>
            <select bind:value={workOrderForm.prioridad} id="prioridad">
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
            <small class="priority-hint">Sugerida: {getSuggestedPriority(currentStatus)}</small>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="quienAsigna">Quien Asigna:</label>
            <input type="text" bind:value={workOrderForm.quienAsigna} id="quienAsigna" readonly />
          </div>
          <div class="form-group">
            <label for="asignadoA">Asignado A:</label>
            <input type="text" bind:value={workOrderForm.asignadoA} id="asignadoA" placeholder="Asignado A" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="maquinaInvolucrada">Máquina Involucrada:</label>
            <input type="text" bind:value={workOrderForm.maquinaInvolucrada} id="maquinaInvolucrada" readonly />
          </div>
          <div class="form-group">
            <label for="componenteInvolucrado">Componente Involucrado:</label>
            <input type="text" bind:value={workOrderForm.componenteInvolucrado} id="componenteInvolucrado" readonly />
          </div>
        </div>
        <div class="form-group full-width">
          <label for="detalles">Detalles de la Orden:</label>
          <textarea bind:value={workOrderForm.detalles} id="detalles" rows="4" 
                    placeholder="Describa los detalles del trabajo a realizar..."></textarea>
        </div>
      </form>
    </div>
    
    <div class="modal-footer">
      <button class="btn-cancel" on:click={onCancel}>Cancelar</button>
      <button class="btn-create" on:click={handleSubmit}>Crear Orden de Trabajo</button>
    </div>
  </div>
</div>

{#if showConfirmation}
  <div class="confirmation-overlay" on:click={cancelCreate}>
    <div class="confirmation-modal" on:click|stopPropagation>
      <h3>Confirmar Creación</h3>
      <p>¿Está seguro que desea crear esta orden de trabajo?</p>
      <div class="confirmation-details">
        <p><strong>Máquina:</strong> {workOrderForm.maquinaInvolucrada}</p>
        <p><strong>Componente:</strong> {workOrderForm.componenteInvolucrado}</p>
        <p><strong>Estado:</strong> <span class="status-badge {getStatusClass(currentStatus)}">{currentStatus}</span></p>
        <p><strong>Asignado a:</strong> {workOrderForm.asignadoA}</p>
        <p><strong>Prioridad:</strong> {workOrderForm.prioridad}</p>
      </div>
      <div class="confirmation-buttons">
        <button class="btn-cancel" on:click={cancelCreate}>Cancelar</button>
        <button class="btn-confirm" on:click={confirmCreate}>Aceptar</button>
      </div>
    </div>
  </div>
{/if}



<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }
  
  .modal-content {
    background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
    border: 2px outset #c0c0c0;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    font-size: 11px;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(to bottom, #c0c0c0 0%, #a0a0a0 100%);
    border-bottom: 1px inset #c0c0c0;
  }
  
  .modal-header h2 {
    margin: 0;
    color: #000000;
    font-size: 12px;
    font-weight: bold;
  }
  
  .close-btn {
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border: 1px outset #c0c0c0;
    font-size: 12px;
    cursor: pointer;
    color: #000000;
    padding: 2px 6px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-btn:active {
    border: 1px inset #c0c0c0;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .machine-info {
    background-color: #f8f8f8;
    padding: 12px;
    border: 1px inset #c0c0c0;
    margin-bottom: 16px;
  }
  
  .machine-info h3 {
    margin: 0 0 12px 0;
    color: #000000;
    font-size: 11px;
    font-weight: bold;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .info-item {
    color: #000000;
    font-size: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .status-badge {
    padding: 2px 6px;
    border: 1px inset #c0c0c0;
    font-size: 9px;
    font-weight: bold;
    border-radius: 2px;
  }
  
  .status-optimo {
    background-color: #90EE90;
    color: #000000;
  }
  
  .status-regular {
    background-color: #FFD700;
    color: #000000;
  }
  
  .status-malo {
    background-color: #FF6B6B;
    color: #000000;
  }
  
  .status-unknown {
    background-color: #D3D3D3;
    color: #000000;
  }
  
  .status-message {
    font-style: italic;
    color: #404040;
  }
  
  .work-order-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .form-row {
    display: flex;
    gap: 12px;
  }
  
  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .form-group.full-width {
    width: 100%;
  }
  
  .form-group label {
    margin-bottom: 4px;
    font-weight: bold;
    color: #000000;
    font-size: 10px;
  }
  
  .priority-hint {
    font-size: 9px;
    color: #606060;
    font-style: italic;
    margin-top: 2px;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 4px 6px;
    border: 1px inset #c0c0c0;
    font-size: 10px;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    background-color: #ffffff;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: 1px dotted #000000;
  }
  
  .form-group input[readonly] {
    background-color: #f0f0f0;
    color: #404040;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #d0d0d0 100%);
    border-top: 1px inset #c0c0c0;
  }
  
  .btn-cancel,
  .btn-create {
    padding: 6px 12px;
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 10px;
    font-weight: bold;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    color: #000000;
  }
  
  .btn-cancel:hover,
  .btn-create:hover {
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
  }
  
  .btn-cancel:active,
  .btn-create:active {
    border: 1px inset #c0c0c0;
    background: linear-gradient(to bottom, #c0c0c0 0%, #e0e0e0 100%);
  }
  
  .confirmation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3000;
  }
  
  .confirmation-modal {
    background: linear-gradient(to bottom, #f0f0f0 0%, #e0e0e0 100%);
    border: 2px outset #c0c0c0;
    padding: 20px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    font-size: 11px;
  }
  
  .confirmation-modal h3 {
    margin: 0 0 12px 0;
    color: #000000;
    font-size: 12px;
    font-weight: bold;
  }
  
  .confirmation-details {
    background-color: #f8f8f8;
    padding: 12px;
    border: 1px inset #c0c0c0;
    margin: 12px 0;
    text-align: left;
  }
  
  .confirmation-details p {
    margin: 4px 0;
    color: #000000;
    font-size: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .confirmation-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
  }
  
  .btn-confirm {
    background: linear-gradient(to bottom, #90EE90 0%, #70CC70 100%);
    color: #000000;
    padding: 6px 12px;
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 10px;
    font-weight: bold;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
  }
  
  .btn-confirm:hover {
    background: linear-gradient(to bottom, #A0FFA0 0%, #80DD80 100%);
  }
  
  .btn-confirm:active {
    border: 1px inset #c0c0c0;
    background: linear-gradient(to bottom, #70CC70 0%, #90EE90 100%);
  }
</style>
