<script>
  import { onMount } from 'svelte';
  import Sidebar from './components/Sidebar.svelte';
  import DataGrid from './components/DataGrid.svelte';
  import WorkOrderModal from './components/WorkOrderModal.svelte';
  import Login from './components/Login.svelte';
  import UserManagement from './components/UserManagement.svelte';
  import MachineManagement from './components/MachineManagement.svelte';
  
  import { auth } from './stores/auth.js';
  import { ui } from './stores/ui.js';
  import { data } from './stores/data.js';

  onMount(() => {
    if (auth.checkAuth()) {
      data.fetchDashboardData();
    }
  });

  function handleNavigation(event) {
    const newView = event.detail;
    ui.setCurrentView(newView);

    if (newView === 'dashboard') {
      data.fetchDashboardData();
    } else if (newView === 'users') {
      data.fetchUsers(); 
    } else if (newView === 'machines') {
      data.fetchMachines();
    }
  }

  function handleCellContextMenu(event) {
    const { data, column } = event.detail;
    ui.openWorkOrderModal(data, column);
  }

  async function handleCreateWorkOrder(workOrderData) {
    try {
      await data.createWorkOrder(workOrderData);
      console.log('Orden de trabajo creada con éxito:', workOrderData);
      ui.closeWorkOrderModal();
    } catch (error) {
      console.error('Error al crear orden de trabajo:', error);
      // Optionally, display an error message to the user
    }
  }

  function handleCancelWorkOrder() {
    ui.closeWorkOrderModal();
  }
</script>

{#if !$auth.isAuthenticated}
  <Login />
{:else}
  <div class="app-container">
    <Sidebar activeView={$ui.currentView} on:navigate={handleNavigation} />
    
    <main class="main-content">
      <header class="header">
        <div class="header-left">
          <div class="logo">
            <img src="https://usochicamocha.com.co/wp-content/uploads/2024/02/Usochicamocha-v2.png" alt="Logo de Usochicamocha" class="logo-image" />
          </div>
        </div>
        <div class="header-center">
          <h2>
            {#if $ui.currentView === 'dashboard'}
              Panel de Control - Estado de Equipos
            {:else if $ui.currentView === 'users'}
              Gestión de Usuarios
            {:else if $ui.currentView === 'machines'}
              Gestión de Máquinas
            {/if}
          </h2>
        </div>
        <div class="header-right">
          <span class="user-info">Usuario: {$auth.currentUser?.name}</span>
          <button class="logout-btn" on:click={auth.logout}>Cerrar Sesión</button>
        </div>
      </header>

      <div class="content">
        {#if $data.isLoading}
          <p>Cargando datos...</p>
        {:else if $data.error}
          <p style="color: red;">Error: {$data.error}</p>
        {:else}
          {#if $ui.currentView === 'dashboard'}
            <div class="grid-container">
              <!-- <<< CORREGIDO: Se eliminó la prop 'tableType' >>> -->
              <DataGrid 
                data={$data.dashboardData} 
                on:cellContextMenu={handleCellContextMenu}
              />
            </div>
            <div class="footer-controls">
              <div class="download-buttons">
                <button class="download-btn">Descargar Hoja</button>
                <button class="download-btn">Descargar Tabla</button>
                <button class="download-btn">Descargar Libro</button>
              </div>
            </div>
          {:else if $ui.currentView === 'users'}
            <UserManagement />
          {:else if $ui.currentView === 'machines'}
            <MachineManagement />
          {/if}
        {/if}
      </div>
    </main>

    {#if $ui.showWorkOrderModal}
      <WorkOrderModal 
        rowData={$ui.selectedRowData}
        column={$ui.selectedColumn}
        currentUser={$auth.currentUser?.name}
        on:createWorkOrder={handleCreateWorkOrder}
        on:cancel={handleCancelWorkOrder}
      />
    {/if}
  </div>
{/if}
<style>
  /* Tus estilos no necesitan cambios */
  .logout-btn {
    padding: 4px 8px;
    margin-left: 12px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 10px;
    font-family: inherit;
    color: #000000;
  }
  .logout-btn:hover {
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
  }
  :global(body) {
    margin: 0;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    background-color: #c0c0c0;
    font-size: 11px;
    overflow-x: hidden;
  }
  .app-container {
    display: flex;
    height: 100vh;
    background-color: #c0c0c0;
  }
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: 60px;
    transition: margin-left 0.3s ease;
    min-width: 0;
  }
  .header {
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px inset #c0c0c0;
    border-top: 1px solid #ffffff;
  }
  .header-right {
    display: flex;
    align-items: center;
  }
  .header-left, .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-image {
    height: 40px;
    width: auto;
  }
  .header-center h2 {
    margin: 0;
    font-size: 14px;
    font-weight: normal;
  }
  .user-info {
    font-weight: bold;
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
    padding: 4px 8px;
    border: 1px inset #c0c0c0;
    font-size: 10px;
  }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px;
    background-color: #c0c0c0;
  }
  .grid-container {
    flex: 1;
    background-color: white;
    border: 2px inset #c0c0c0;
    border-top-color: #808080;
    border-left-color: #808080;
    border-right-color: #dfdfdf;
    border-bottom-color: #dfdfdf;
    overflow: hidden;
  }
  .footer-controls {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 16px;
    padding: 8px 0;
  }
  .download-buttons {
    display: flex;
    gap: 8px;
  }
  .download-btn {
    padding: 6px 12px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    color: #000000;
  }
  .download-btn:hover {
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
  }
</style>