<script>
  import { onMount } from 'svelte';
  import Sidebar from './components/shared/Sidebar.svelte';
  import WorkOrderModal from './components/shared/WorkOrderModal.svelte';
  import Login from './components/views/Login.svelte';
  import UserManagement from './components/views/UserManagement.svelte';
  import MachineManagement from './components/views/MachineManagement.svelte';
  import WorkOrderManagement from './components/views/WorkOrderManagement.svelte';
  import Consolidado from './components/views/Consolidado.svelte';
  import NotificationDropdown from './components/shared/NotificationDropdown.svelte';
  import Loader from './components/shared/Loader.svelte';
  import Dashboard from './components/views/Dashboard.svelte';

  import { auth } from './stores/auth.js';
  import { ui, notificationCount, addNotification, notificationMessages, removeNotification } from './stores/ui.js';
  import { data } from './stores/data.js';

  // --- LOCAL STATE ---
  let showNotifications = false;

  // --- LIFECYCLE HOOKS ---
  onMount(async () => {
    const isAuthenticated = await auth.checkAuth();
    if (isAuthenticated) {
      data.fetchDashboardData();
    }
  });

  // --- EVENT HANDLERS ---
  function toggleNotifications() {
    showNotifications = !showNotifications;
  }

  function handleDeleteNotification(event) {
    const notificationId = event.detail;
    removeNotification(notificationId);
  }
  
  function handleNavigation(event) {
    const view = event.detail;
    ui.setCurrentView(view);
    switch (view) {
      case 'dashboard':
        data.fetchDashboardData();
        break;
      case 'users':
        data.fetchUsers();
        break;
      case 'machines':
        data.fetchMachines();
        break;
      case 'work-orders':
        data.fetchWorkOrders();
        break;
    }
  }

  // CORRECCIÓN: Esta función ahora pasa los objetos completos al store.
  function handleCellContextMenu(event) {
    const { row, column } = event.detail;
    if (column.meta?.isStatus || column.meta?.isDateStatus) {
      // Se pasa el objeto de la fila ('row') y el objeto de la columna ('column') directamente.
      ui.openWorkOrderModal(row, column);
    }
  }

  async function handleCreateWorkOrder(event) {
    ui.setSaving(true);
    try {
      await data.createWorkOrder(event.detail);
      addNotification({
        id: Date.now(),
        text: `Orden de trabajo para "${event.detail.description.split('|')[1]}" creada.`
      });
      ui.closeWorkOrderModal();
    } catch (err) {
      console.error("Error creating work order:", err);
      addNotification({
        id: Date.now(),
        text: `Error al crear orden: ${err.message}`
      });
    } finally {
      ui.setSaving(false);
    }
  }

  function handleCancelWorkOrder() {
    ui.closeWorkOrderModal();
  }
</script>

<svelte:head>
  <title>{$notificationCount > 0 ? `(${$notificationCount})` : ''} Dashboard Maquinaria</title>
</svelte:head>

<svelte:window on:click={() => (showNotifications = false)} />

{#if $ui.isSaving}
  <div class="overlay">
    <Loader />
  </div>
{/if}

{#if $auth.isRefreshing}
  <div class="overlay">
    <div class="refresh-indicator">
      <Loader />
      <p>Renovando sesión...</p>
    </div>
  </div>
{/if}

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
            {:else if $ui.currentView === 'work-orders'}
              Gestión de Órdenes de Trabajo
            {:else if $ui.currentView === 'consolidado'}
              Consolidado de Maquinaria
            {/if}
          </h2>
        </div>
        <div class="header-right">
          <div class="notification-wrapper" on:click|stopPropagation>
            <button class="notification-bell" on:click={toggleNotifications} title="Notificaciones">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,22A2,2 0 0,0 14,20H10A2,2 0 0,0 12,22M18,16V11C18,7.93 16.36,5.36 13.5,4.68V4A1.5,1.5 0 0,0 12,2.5A1.5,1.5 0 0,0 10.5,4V4.68C7.63,5.36 6,7.93 6,11V16L4,18V19H20V18L18,16Z"></path></svg>
              {#if $notificationCount > 0}
                <span class="notification-badge">{$notificationCount}</span>
              {/if}
            </button>
            {#if showNotifications}
              <NotificationDropdown messages={$notificationMessages} on:delete={handleDeleteNotification} />
            {/if}
          </div>
          <span class="user-info">Usuario: {$auth.currentUser?.name}</span>
          <button class="logout-btn" on:click={auth.logout}>Cerrar Sesión</button>
        </div>
      </header>

      <div class="content">
        {#if $data.isLoading && !$auth.isRefreshing}
          <div class="loader-container"><Loader /></div>
        {:else if $data.error}
          <p style="color: red;">Error: {$data.error}</p>
        {:else}
          {#if $ui.currentView === 'dashboard'}
            <Dashboard on:cellContextMenu={handleCellContextMenu} />
          {:else if $ui.currentView === 'users'}
            <UserManagement />
          {:else if $ui.currentView === 'machines'}
            <MachineManagement />
          {:else if $ui.currentView === 'work-orders'}
            <WorkOrderManagement />
          {:else if $ui.currentView === 'consolidado'}
            <Consolidado />
          {/if}
        {/if}
      </div>
    </main>

    {#if $ui.showWorkOrderModal}
      <WorkOrderModal 
        rowData={$ui.selectedRowData}
        
        columnDef={$ui.selectedColumnDef}
        currentUser={$auth.currentUser?.name}
        on:createWorkOrder={handleCreateWorkOrder}
        on:cancel={handleCancelWorkOrder}
      />
    {/if}
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .refresh-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    font-size: 14px;
  }
  .loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  .notification-wrapper {
    position: relative;
  }
  .notification-bell {
    position: relative;
    background: none;
    border: none;
    cursor: pointer;
    margin-right: 16px;
    padding: 0;
  }
  .notification-bell svg {
    width: 24px;
    height: 24px;
    fill: #000000;
  }
  .notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: red;
    color: white;
    border-radius: 50%;
    min-width: 16px;
    height: 16px;
    padding: 1px;
    font-size: 10px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid white;
  }
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
</style>

