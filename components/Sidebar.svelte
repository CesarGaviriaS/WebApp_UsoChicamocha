<script>
  import { createEventDispatcher } from 'svelte';

  // --- PROPS (Svelte 4 syntax) ---
  export let activeView = 'dashboard';
  
  const dispatch = createEventDispatcher();

  function navigate(view) {
    dispatch('navigate', view);
  }
</script>

<nav class="sidebar">
  <!-- Se usa 'on:click' en lugar de 'onclick' -->
  <button class="nav-item" on:click={() => navigate('dashboard')} class:active={activeView === 'dashboard'} title="Dashboard">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" /></svg>
    <span class="nav-text">Dashboard</span>
  </button>
  <button class="nav-item" on:click={() => navigate('users')} class:active={activeView === 'users'} title="Gestionar Usuarios">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" /></svg>
    <span class="nav-text">Usuarios</span>
  </button>
  <button class="nav-item" on:click={() => navigate('machines')} class:active={activeView === 'machines'} title="Gestionar Máquinas">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M12,2L9.5,4.5L6.4,4L5.5,1L2,3.5L3,6.5L1,7.5L2.5,11L4.5,9.5L5,12.5L1.5,15L4,17.5L6.5,16.5L7.5,19L11,20.5L9.5,22.5L12.5,23L15,20.5L17.6,21L18.5,24L22,21.5L21,18.5L23,17.5L21.5,14L19.5,15.5L19,12.5L22.5,10L20,7.5L17.5,8.5L16.5,6L13,4.5L14.5,2.5L11.5,2H12Z" /></svg>
    <span class="nav-text">Máquinas</span>
  </button>
  <button class="nav-item" on:click={() => navigate('work-orders')} class:active={activeView === 'work-orders'} title="Órdenes de Trabajo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M12,2L9.5,4.5L6.4,4L5.5,1L2,3.5L3,6.5L1,7.5L2.5,11L4.5,9.5L5,12.5L1.5,15L4,17.5L6.5,16.5L7.5,19L11,20.5L9.5,22.5L12.5,23L15,20.5L17.6,21L18.5,24L22,21.5L21,18.5L23,17.5L21.5,14L19.5,15.5L19,12.5L22.5,10L20,7.5L17.5,8.5L16.5,6L13,4.5L14.5,2.5L11.5,2H12Z" /></svg>
    <span class="nav-text">Órdenes</span>
  </button>
  <button class="nav-item" on:click={() => navigate('consolidado')} class:active={activeView === 'consolidado'} title="Consolidado">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M19,19H5V5H19V19M11,7H9V9H11V7M15,7H13V9H15V7M11,11H9V13H11V11M15,11H13V13H15V11Z" /></svg>
    <span class="nav-text">Consolidado</span>
  </button>
</nav>

<style>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 60px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border-right: 2px outset #c0c0c0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 0;
    gap: 0;
    z-index: 100;
    transition: width 0.3s ease;
    overflow: hidden;
  }

  .sidebar:hover {
    width: 200px;
  }

  .nav-item {
    width: 100%;
    height: 42px;
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
    border: none;
    border-bottom: 1px solid #808080;
    border-top: 1px solid #ffffff;
    cursor: pointer;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 18px;
    gap: 20px;
  }
  
  .nav-item:first-child {
    border-top: none;
    margin-top: 16px;
  }

  .nav-item:hover {
    background: linear-gradient(to bottom, #ffffff 0%, #e0e0e0 100%);
  }

  .nav-item:active, .nav-item.active {
    background: #c0c0c0;
    border-top-color: #808080;
  }

  .nav-item svg {
    width: 24px;
    height: 24px;
    fill: #000000;
    flex-shrink: 0;
  }

  .nav-text {
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    font-size: 11px;
    font-weight: bold;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .sidebar:hover .nav-text {
    opacity: 1;
    transition-delay: 0.15s;
  }
</style>