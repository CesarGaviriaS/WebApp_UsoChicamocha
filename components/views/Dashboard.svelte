<script>
  import { createEventDispatcher } from 'svelte';
  import DataGrid from '../shared/DataGrid.svelte';
  import Loader from '../shared/Loader.svelte';
  import { dashboardColumns } from '../../config/table-definitions.js';
  import { data } from '../../stores/data.js';

  const dispatch = createEventDispatcher();

  $: dashboardInfo = $data.dashboard;
  $: isLoading = $data.isLoading;

  function handlePageChange(event) {
    const newPage = event.detail;
    data.fetchDashboardData(newPage, dashboardInfo.pageSize);
  }

  function handleSizeChange(event) {
    const newSize = event.detail;
    data.fetchDashboardData(0, newSize);
  }

  function handleCellContextMenu(event) {
    dispatch('cellContextMenu', event.detail);
  }
  
</script>

{#if isLoading}
  <div class="loader-container">
    <Loader />
    <p>Cargando inspecciones...</p>
  </div>
{:else}
  <div class="refresh-container">
    <button class="btn-refresh" on:click={() => data.fetchDashboardData()}>
      Refrescar información
    </button>
  </div>
  <div class="grid-wrapper">
    <DataGrid 
      columns={dashboardColumns}
      data={dashboardInfo.data}
      totalElements={dashboardInfo.totalElements}
      totalPages={dashboardInfo.totalPages}
      currentPage={dashboardInfo.currentPage}
      pageSize={dashboardInfo.pageSize}
      on:action={(e) => dispatch('gridaction', e.detail)}
      on:cellContextMenu={handleCellContextMenu}
      on:pageChange={handlePageChange}
      on:sizeChange={handleSizeChange}
    />
  </div>

  
{/if}

<style>
  .loader-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .grid-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .refresh-container {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  .btn-refresh {
    padding: 2px 8px;
    background: linear-gradient(to bottom, #e0e0e0 0%, #c0c0c0 100%);
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 10px;
    font-family: inherit;
  }
  .btn-refresh:hover {
    background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
  }
</style>

