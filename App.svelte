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
    import ImageCarouselModal from './components/shared/ImageCarouselModal.svelte';

// --- LÓGICA DEL MODAL DE IMÁGENES ---
  let isImageModalOpen = false;
  let imageModalUrls = [];
  let isImageModalLoading = false;
  // --- LOCAL STATE ---
  let showNotifications = false;
  let inspectionEventSource;
  let dataUpdateEventSource;
  let soatRuntEventSource;
  let oilChangeEventSource;
  let audioCtx;
  let soundNeedsActivation = true;


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
  // --- LÓGICA DE SONIDO ---
  function activateSound() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        soundNeedsActivation = false;
        console.log("Contexto de audio activado por el usuario.");
      } catch(e) {
        console.error("Web Audio API no es soportada en este navegador.");
        soundNeedsActivation = false;
      }
    } else {
        soundNeedsActivation = false;
    }
  }

function playNotificationSound() {
  if (!audioCtx) {
    console.warn("El audio debe ser activado por un gesto del usuario.");
    return;
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(800, now);
  oscillator.frequency.linearRampToValueAtTime(600, now + 0.15);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  
  oscillator.start(now);
  oscillator.stop(now + 0.25);
}

  // --- LÓGICA DE NOTIFICACIONES EN TIEMPO REAL ---
  function connectToInspectionStream() {
  if (inspectionEventSource) {
    inspectionEventSource.close();
    inspectionEventSource = null;
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('accessToken');

  if (!BASE_URL || !token) {
    console.warn("No se puede conectar al stream: falta la URL base o el token.");
    return;
  }
  
  const streamUrl = `${BASE_URL}/inspections/stream`;
  
  // 2. Usa 'EventSourcePolyfill' y pasa las cabeceras
  inspectionEventSource = new EventSourcePolyfill(streamUrl, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  inspectionEventSource.onopen = () => console.log("✅ Conectado al stream de notificaciones de inspecciones.");
  
    inspectionEventSource.onmessage = (event) => {
        const message = event.data;
        if (message === 'stream_open') {
          console.log('Notificaciones de inspecciones: ✅');
          return;
        }
        try {
          const newInspection = JSON.parse(event.data);
          const machineInfo = newInspection.machine ? `${newInspection.machine.name} ${newInspection.machine.model}` : 'una máquina';
 
          addNotification({
            id: newInspection.UUID || Date.now(),
            text: `¡IMPREVISTO EN ${machineInfo}!`
          });
 
          playNotificationSound();
 
          const currentView = get(ui).currentView;
          if (currentView === 'dashboard') {
            const dashboardState = get(data).dashboard;
            data.fetchDashboardData(dashboardState.currentPage, dashboardState.pageSize);
          }
        } catch (e) {
          console.error("Error procesando mensaje del stream:", e);
        }
      };
    inspectionEventSource.onerror = (err) => {
      console.error("Error en la conexión con el stream de inspecciones. Se cerrará la conexión.", err);
      inspectionEventSource.close();
    };
  }
  
  function connectToDataUpdateStream() {
  if (dataUpdateEventSource) {
    dataUpdateEventSource.close();
    dataUpdateEventSource = null;
  }

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('accessToken');

  if (!BASE_URL || !token) {
    console.warn("No se puede conectar al stream: falta la URL base o el token.");
    return;
  }
  
  const streamUrl = `${BASE_URL}/new-data/notifications/stream`;
  
  // 3. Haz lo mismo aquí: usa 'EventSourcePolyfill' con las cabeceras
  dataUpdateEventSource = new EventSourcePolyfill(streamUrl, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  dataUpdateEventSource.onopen = () => console.log("✅ Conectado al stream de actualización de datos.");

    dataUpdateEventSource.onmessage = (event) => {
        const message = event.data;
        if (message === 'stream_open') {
          console.log('Notificaciones de actualización: ✅');
          return;
        }
        const currentView = get(ui).currentView;
        const dataState = get(data);

        console.log(`Mensaje de actualización recibido: ${message}, vista actual: ${currentView}`);

        switch (message) {
            case 'inspections-updated':
                if (currentView === 'dashboard') {
                    console.log('Recargando tabla de inspecciones...');
                    data.fetchDashboardData(dataState.dashboard.currentPage, dataState.dashboard.pageSize);
                }
                break;
            case 'machines-updated':
                if (currentView === 'machines') {
                    console.log('Recargando tabla de máquinas...');
                    data.fetchMachines();
                }
                break;
            case 'users-updated':
                if (currentView === 'users') {
                    console.log('Recargando tabla de usuarios...');
                    data.fetchUsers();
                }
                break;
            case 'orders-updated':
                if (currentView === 'work-orders') {
                    console.log('Recargando tabla de órdenes de trabajo...');
                    data.fetchWorkOrders(dataState.workOrders.currentPage, dataState.workOrders.pageSize);
                }
                break;
            case 'oil-changes-updated':
              if (currentView === 'consolidado') {
                console.log('Recargando tabla de consolidado...');
                data.fetchConsolidatedData();
              }
              break;
        }
    };
    dataUpdateEventSource.onerror = (err) => {
        console.error("Error en la conexión con el stream de actualización. Se cerrará la conexión.", err);
        dataUpdateEventSource.close();
    };
  }

  function connectToSoatRuntStream() {
    if (soatRuntEventSource) {
      soatRuntEventSource.close();
      soatRuntEventSource = null;
    }

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('accessToken');

    if (!BASE_URL || !token) {
      console.warn("No se puede conectar al stream SOAT/RUNT: falta la URL base o el token.");
      return;
    }

    const streamUrl = `${BASE_URL}/soat/runt/notifications/stream`;

    soatRuntEventSource = new EventSourcePolyfill(streamUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    soatRuntEventSource.onopen = () => console.log("✅ Conectado al stream de notificaciones SOAT/RUNT.");

    soatRuntEventSource.onmessage = (event) => {
      const message = event.data;
      if (message === 'stream_open') {
        console.log('Notificaciones SOAT/RUNT: ✅');
        return;
      }
      try {
        const notificationData = JSON.parse(event.data);
        addNotification({
          id: notificationData.id || Date.now(),
          text: notificationData.message || 'Notificación SOAT/RUNT'
        });
        // No sound for this stream
      } catch (e) {
        console.error("Error procesando mensaje del stream SOAT/RUNT:", e);
      }
    };

    soatRuntEventSource.onerror = (err) => {
      console.error("Error en la conexión con el stream SOAT/RUNT. Se cerrará la conexión.", err);
      soatRuntEventSource.close();
    };
  }

  function connectToOilChangeStream() {
    if (oilChangeEventSource) {
      oilChangeEventSource.close();
      oilChangeEventSource = null;
    }

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('accessToken');

    if (!BASE_URL || !token) {
      console.warn("No se puede conectar al stream de cambios de aceite: falta la URL base o el token.");
      return;
    }

    const streamUrl = `${BASE_URL}/oil_change/notifications/stream`;

    oilChangeEventSource = new EventSourcePolyfill(streamUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    oilChangeEventSource.onopen = () => console.log("✅ Conectado al stream de notificaciones de cambios de aceite.");

    oilChangeEventSource.onmessage = (event) => {
      const message = event.data;
      if (message === 'stream_open') {
        console.log('Notificaciones de cambios de aceite: ✅');
        return;
      }
      try {
        const notificationData = JSON.parse(event.data);
        addNotification({
          id: notificationData.id || Date.now(),
          text: notificationData.message || 'Notificación de cambio de aceite'
        });
        // No sound for this stream
      } catch (e) {
        console.error("Error procesando mensaje del stream de cambios de aceite:", e);
      }
    };

    oilChangeEventSource.onerror = (err) => {
      console.error("Error en la conexión con el stream de cambios de aceite. Se cerrará la conexión.", err);
      oilChangeEventSource.close();
    };
  }

  function disconnectFromStreams() {
    if (inspectionEventSource) {
      inspectionEventSource.close();
      inspectionEventSource = null;
      console.log("Desconectado del stream de inspecciones.");
    }
    if (dataUpdateEventSource) {
      dataUpdateEventSource.close();
      dataUpdateEventSource = null;
      console.log("Desconectado del stream de actualización de datos.");
    }
    if (soatRuntEventSource) {
      soatRuntEventSource.close();
      soatRuntEventSource = null;
      console.log("Desconectado del stream SOAT/RUNT.");
    }
    if (oilChangeEventSource) {
      oilChangeEventSource.close();
      oilChangeEventSource = null;
      console.log("Desconectado del stream de cambios de aceite.");
    }
  }

 // RUTA: App.svelte

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
    const isAuthenticated = await auth.checkAuth();
    if (isAuthenticated) {
      const currentView = get(ui).currentView;
      loadDataForView(currentView);
    }
  });

  auth.subscribe(value => {
    if (value.isAuthenticated) {
      connectToInspectionStream();
      connectToDataUpdateStream();
      connectToSoatRuntStream();
      connectToOilChangeStream();
    } else {
      disconnectFromStreams();
    }
  });
  
  onDestroy(() => {
    disconnectFromStreams();
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

{#if soundNeedsActivation && $auth.isAuthenticated}
  <div class="sound-activation-overlay" on:click={activateSound}>
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
</style>

