<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
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
  import { EventSourcePolyfill } from 'event-source-polyfill';
  import OilManagement from './components/views/OilManagement.svelte';
  import { auth } from './stores/auth.js';
  import { ui, notificationCount, addNotification, notificationMessages, removeNotification } from './stores/ui.js';
  import { data } from './stores/data.js';
  import {
    initializeWebSocketNotifications,
    disconnectFromWebSocket,
    getWebSocketConnectionStatus,
    wsNotificationService,
    getWebSocketSoundNeedsActivation,
    setWebSocketSoundNeedsActivation,
    soundNeedsActivation,
    activateSound as activateWebSocketSound,
    playNotificationSound
  } from './composables/useWebSocketNotifications.js';
  import ImageCarouselModal from './components/shared/ImageCarouselModal.svelte';

// --- LÓGICA DEL MODAL DE IMÁGENES ---
  let isImageModalOpen = false;
  let imageModalUrls = [];
  let isImageModalLoading = false;
  // --- LOCAL STATE ---
  let showNotifications = false;
  
  // --- AUTO REFRESH STATE ---
  let autoRefreshInterval;
  let isAutoRefreshEnabled = true;
  let isAutoRefreshActive = false;
  let refreshCount = 0;

  // --- SOUND ACTIVATION STATE ---
  // Now handled via unifiedSoundActivation store from useUnifiedNotifications.js
  
  // --- NOTIFICATION SERVICE STATE ---
  let connectionStatus = { isConnected: false };
  
  // --- UNIFIED NOTIFICATION SERVICE STATE ---
  let activeServiceInfo = { mode: 'websocket', isConnected: false, serviceName: 'None', fallbackAttempted: false };
  let isWebSocketPreferred = true; // WebSocket by default
  let showServiceInfo = false; // Debug panel


  async function openImageModal(inspectionId) {
    isImageModalOpen = true;
    isImageModalLoading = true;
    try {
      imageModalUrls = await data.fetchInspectionImages(inspectionId);
    } catch (e) {
      imageModalUrls = []; // En caso de error, muestra el modal vacío
    } finally {
      isImageModalLoading = false;
    }
  }

  function closeImageModal() {
    isImageModalOpen = false;
    imageModalUrls = [];
  }

  // --- AUTO REFRESH FUNCTIONS ---
  let lastRefreshTime = 0;
  const MIN_REFRESH_INTERVAL = 60000; // 1 minute minimum between refreshes

  function startAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(async () => {
      const now = Date.now();
      const currentView = get(ui).currentView;
      const dataState = get(data);
      
      // Only refresh if enabled, authenticated, not currently loading,
      // and enough time has passed since last refresh
      if (isAutoRefreshEnabled &&
          $auth.isAuthenticated &&
          !dataState.isLoading &&
          (now - lastRefreshTime) >= MIN_REFRESH_INTERVAL) {
        
        isAutoRefreshActive = true;
        
        try {
          switch (currentView) {
            case 'dashboard':
              console.log('🔄 Auto-refrescando tabla de inspecciones...');
              await data.fetchDashboardData(dataState.dashboard.currentPage, dataState.dashboard.pageSize);
              break;
            case 'machines':
              console.log('🔄 Auto-refrescando tabla de máquinas...');
              await data.fetchMachines();
              break;
            case 'work-orders':
              console.log('🔄 Auto-refrescando tabla de órdenes de trabajo...');
              await data.fetchWorkOrders(dataState.workOrders.currentPage, dataState.workOrders.pageSize);
              break;
            case 'consolidado':
              console.log('🔄 Auto-refrescando tabla de consolidado...');
              await data.fetchConsolidadoData();
              break;
            case 'oilManagement':
              console.log('🔄 Auto-refrescando tabla de aceites...');
              await data.fetchOils();
              break;
            case 'users':
              console.log('🔄 Auto-refrescando tabla de usuarios...');
              await data.fetchUsers();
              break;
          }
          lastRefreshTime = now;
          refreshCount++;
          console.log(`🔄 Auto-refresh #${refreshCount} completed at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
          console.warn('Error en auto-refresh:', error.message);
        } finally {
          isAutoRefreshActive = false;
        }
      }
    }, 60000); // Check every 1 minute, refresh if 1 minute has passed
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
      isAutoRefreshActive = false;
    }
  }

  function toggleAutoRefresh() {
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    if (isAutoRefreshEnabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  }

  function handleActivateSound() {
    console.log("🔊 [AUDIO] Activando sonido WebSocket por click del usuario...");
    
    activateWebSocketSound();
    
    // Update the WebSocket sound activation state
    setWebSocketSoundNeedsActivation(false);
    
    console.log("Contexto de audio WebSocket activado por el usuario.");
  }

  // Sound activation state is now handled directly via unifiedSoundActivation store
  // The template uses $getSoundNeedsActivation for reactivity

  // WebSocket connection status monitoring is now handled via wsNotificationService store
  $: {
    const wsStatus = $wsNotificationService;
    console.log("🔌 [APP] Estado WebSocket actualizado:", wsStatus);
  }

async function loadDataForView(view) {
  try {
    switch (view) {
      case 'dashboard':
        await data.fetchDashboardData();
        break;
      case 'users':
        await data.fetchUsers();
        break;
      case 'machines':
        await data.fetchMachines();
        break;
      case 'work-orders':
        await data.fetchWorkOrders();
        break;
      case 'consolidado':
        await data.fetchConsolidadoData();
        break;
      case 'oilManagement':
        await data.fetchOils();
        break;
    }
  } catch (error) {
    console.warn("Carga de datos interrumpida por fallo de autenticación (comportamiento esperado).");
  }
}

  // --- LIFECYCLE HOOKS ---
  onMount(async () => {
    console.log("🚀 [APP] Iniciando aplicación...");
    const isAuthenticated = await auth.checkAuth();
    console.log("🚀 [APP] Estado de autenticación:", isAuthenticated ? "AUTENTICADO" : "NO AUTENTICADO");
    
    if (isAuthenticated) {
      const currentView = get(ui).currentView;
      console.log("🚀 [APP] Cargando vista actual:", currentView);
      loadDataForView(currentView);
      
      // Inicializar WebSocket notifications DESPUÉS de cargar datos iniciales
      setTimeout(() => {
        initializeWebSocketNotifications();
        startAutoRefresh();
        console.log("🚀 [APP] Notificaciones WebSocket y auto-refresh iniciados.");
      }, 1000);
    } else {
      console.log("🚀 [APP] Usuario no autenticado - mostrando login");
    }
  });

  auth.subscribe(value => {
    console.log("🚀 [APP] Cambio en estado de auth:", value.isAuthenticated ? "AUTENTICADO" : "NO AUTENTICADO");
    
    if (value.isAuthenticated) {
      // No inicializar notificaciones aquí - ya se hizo en onMount
      console.log("🚀 [APP] Usuario autenticado - ya iniciado en onMount");
    } else {
      console.log("🚀 [APP] Usuario desconectado - cerrando streams WebSocket");
      disconnectFromWebSocket();
      stopAutoRefresh();
    }
  });
  
  onDestroy(() => {
    disconnectFromWebSocket();
    stopAutoRefresh();
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
    loadDataForView(view);
    // Don't restart auto-refresh on navigation to avoid conflicts with existing notification system
  }

  function handleCellContextMenu(event) {
    const { row, columnDef } = event.detail;
    if (columnDef.meta?.isStatus || columnDef.meta?.isDateStatus) {
      ui.openWorkOrderModal(row, columnDef);
    }
  }
function handleGridAction(event) {
    // Busca la propiedad 'data' y renómbrala a 'row'
    const { type, data: row } = event.detail; 
    
    // Ahora 'row' sí contiene los datos de la fila
    if (type === 'view_images' && row && row.id) { 
        openImageModal(row.id); 
    }
}
  async function handleCreateWorkOrder(event) {
    ui.setSaving(true);
    try {
      await data.createWorkOrder(event.detail);
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

{#if $soundNeedsActivation && $auth.isAuthenticated}
  <div class="sound-activation-overlay" on:click={handleActivateSound}>
    <div class="message-box">
      <h2>Activar Sonido</h2>
      <p>Haga clic en cualquier lugar para habilitar las notificaciones de sonido.</p>
    </div>
  </div>
{/if}

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
            {:else if $ui.currentView === 'oilManagement'}
              Gestión de Aceites
            {/if}
          </h2>
        </div>
        <div class="header-right">
          <div class="auto-refresh-indicator">
            <button class="auto-refresh-toggle" on:click={toggleAutoRefresh} title={isAutoRefreshEnabled ? 'Deshabilitar auto-refresh' : 'Habilitar auto-refresh'}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class:spinning={isAutoRefreshActive}>
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" fill={isAutoRefreshEnabled ? "#4CAF50" : "#9E9E9E"}/>
              </svg>
            </button>
            {#if isAutoRefreshActive}
              <span class="auto-refresh-text">Refrescando...</span>
            {/if}
          </div>
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

          <!-- WebSocket Connection Status -->
          <div class="connection-status-indicator" title="Estado de conexión WebSocket">
            {#if $wsNotificationService?.isConnected}
              <div class="connection-status connected" title="Conectado - WebSocket"></div>
            {:else}
              <div class="connection-status disconnected" title="Desconectado"></div>
            {/if}
          </div>
          <span class="user-info">Usuario: {$auth.currentUser?.name}</span>
          <button class="logout-btn" on:click={auth.logout}>Cerrar Sesión</button>
        </div>
      </header>

      <div class="content">
        {#if $ui.currentView === 'dashboard'}
          <Dashboard 
            on:gridaction={handleGridAction}
            on:cellContextMenu={handleCellContextMenu} 
          />
        {:else if $ui.currentView === 'users'}
          <UserManagement />
        {:else if $ui.currentView === 'machines'}
          <MachineManagement />
        {:else if $ui.currentView === 'work-orders'}
          <WorkOrderManagement />
        {:else if $ui.currentView === 'consolidado'}
          <Consolidado />
        {:else if $ui.currentView === 'oilManagement'}
            <OilManagement />
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

    {#if isImageModalOpen}
      <ImageCarouselModal
        imageUrls={imageModalUrls}
        isLoading={isImageModalLoading}
        on:close={closeImageModal}
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
    gap: 12px;
  }

  .auto-refresh-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .auto-refresh-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .auto-refresh-toggle:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .auto-refresh-toggle svg {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }

  .auto-refresh-toggle svg.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .auto-refresh-text {
    font-size: 10px;
    color: #4CAF50;
    font-weight: bold;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
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
    min-height: 0;
  }

  .sound-activation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    cursor: pointer;
    color: white;
  }
  .message-box {
    padding: 24px 48px;
    background: #e0e0e0;
    color: #000;
    border: 2px outset #c0c0c0;
    font-size: 14px;
    text-align: center;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
  }
  .message-box h2 {
    margin: 0 0 12px 0;
  }

  /* WebSocket Connection Status Indicator */
  .connection-status-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.2);
  }

  .connection-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }

  .connection-status.connected {
    background-color: #4CAF50;
    animation: pulse-connected 2s ease-in-out infinite;
  }

  .connection-status.disconnected {
    background-color: #F44336;
    animation: pulse-disconnected 2s ease-in-out infinite;
  }

  @keyframes pulse-connected {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }

  @keyframes pulse-disconnected {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
  }
</style>

