<script>
  import { onMount, onDestroy } from 'svelte';
  import Sidebar from './components/Sidebar.svelte';
  import DataGrid from './components/DataGrid.svelte';
  import WorkOrderModal from './components/WorkOrderModal.svelte';
  import Login from './components/Login.svelte';
  import UserManagement from './components/UserManagement.svelte';
  import MachineManagement from './components/MachineManagement.svelte';
  import NotificationDropdown from './components/NotificationDropdown.svelte';
  import Loader from './components/Loader.svelte'; // Importar el Loader

  import { auth } from './stores/auth.js';
  import { ui, notificationCount, addNotification, notificationMessages, removeNotification } from './stores/ui.js';
  import { data } from './stores/data.js';

  const STREAM_URL = 'https://pdxs8r4k-8080.use2.devtunnels.ms/inspections/stream';
  let eventSource;
  let showNotifications = false;
  let audioContext;

  // --- Funciones de Sonido ---
  function initAudio() {
    if (audioContext) return;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser.');
    }
  }

  function playBeep(startTime) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.25, startTime);
    oscillator.frequency.setValueAtTime(880, startTime);
    oscillator.frequency.linearRampToValueAtTime(1500, startTime + 0.15);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  }

  function playNotificationSound() {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    playBeep(now);
    playBeep(now + 0.3);
    playBeep(now + 0.6);
  }

  // --- Ciclo de Vida ---
  onMount(async () => {
    window.addEventListener('click', initAudio, { once: true });

    if (await auth.checkAuth()) {
      data.fetchDashboardData();
      
      eventSource = new EventSource(STREAM_URL);

      eventSource.onopen = () => {
        console.log('Conexión al stream de inspecciones establecida.');
      };

      eventSource.onmessage = (event) => {
        try {
          const newInspection = JSON.parse(event.data);
          console.log('¡Nueva inspección inesperada recibida!', newInspection);
          
          if ($ui.currentView === 'dashboard') {
            data.fetchDashboardData();
          }

          const machine = newInspection.machine;
          const notification = {
            id: newInspection.UUID || `fallback-${Date.now()}`,
            text: `Imprevisto: ${machine?.name || ''} - ${machine?.model || ''} - ${machine?.numInterIdentification || ''}`
          };
          addNotification(notification);
          playNotificationSound();

        } catch (error) {
          console.error('Error al parsear el dato recibido:', error, 'Dato crudo:', event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Error en la conexión con el servidor (EventSource):', error);
      };
    }
  });

  onDestroy(() => {
    if (eventSource) {
      console.log('Cerrando conexión al stream.');
      eventSource.close();
    }
    window.removeEventListener('click', initAudio);
  });

  // --- Handlers de UI ---
  function toggleNotifications() {
    showNotifications = !showNotifications;
  }

  function handleDeleteNotification(event) {
    const notificationId = event.detail;
    removeNotification(notificationId);
  }

  function handleNavigation(event) {
    const newView = event.detail;
    ui.setCurrentView(newView);
    showNotifications = false;

    // Fetch data based on the new view
    switch (newView) {
      case 'dashboard':
        data.fetchDashboardData();
        break;
      case 'users':
        data.fetchUsers();
        break;
      case 'machines':
        data.fetchMachines();
        break;
      case 'inspections': // Assuming 'inspections' is a view, though it's currently part of dashboardData
        data.fetchInspections();
        break;
      // Add other cases as needed for new sections
    }
  }

  function handleCellContextMenu(event) {
    const { data, column } = event.detail;
    ui.openWorkOrderModal(data, column);
  }

  async function handleCreateWorkOrder(workOrderData) {
    ui.setSaving(true);
    try {
      await data.createWorkOrder(workOrderData);
      console.log('Orden de trabajo creada con éxito:', workOrderData);
      ui.closeWorkOrderModal();
    } catch (error) {
      console.error('Error al crear orden de trabajo:', error);
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
        {#if $data.isLoading}
          <div class="loader-container"><Loader /></div>
        {:else if $data.error}
          <p style="color: red;">Error: {$data.error}</p>
        {:else}
          {#if $ui.currentView === 'dashboard'}
            <div class="grid-container">
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