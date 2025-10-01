<script>
  import { createConsolidadoColumns } from '../../config/table-definitions.js';
  import { data } from '../../stores/data.js';
  import DataGrid from '../shared/DataGrid.svelte';
  import Loader from '../shared/Loader.svelte';

  const distritoColumns = createConsolidadoColumns('Distrito');
  const asociacionColumns = createConsolidadoColumns('Asociación');

  
  $: distritoMachines = $data.consolidated.distrito;
  $: asociacionMachines = $data.consolidated.asociacion;
  $: isLoading = $data.isLoading;
  $: errorMessage = $data.error;

</script>

<div class="consolidado-container">
  <div class="refresh-container">
    <button class="btn-refresh" on:click={() => data.fetchConsolidadoData()}>
      Refrescar información
    </button>
  </div>
  {#if isLoading && distritoMachines.length === 0 && asociacionMachines.length === 0}
    <div class="loader-container">
      <Loader />
      <p>Cargando datos del consolidado...</p>
    </div>
  {:else if errorMessage}
    <div class="error-panel">
      <p><strong>Se encontraron problemas al cargar los datos:</strong></p>
      <p>{errorMessage}</p>
    </div>
  {:else}
    {#if distritoMachines.length > 0}
      <div class="table-group">
        <DataGrid columns={distritoColumns} data={distritoMachines} fixedLayout={false} />
      </div>
    {/if}
    
    {#if asociacionMachines.length > 0}
      <div class="table-group">
        <DataGrid columns={asociacionColumns} data={asociacionMachines} fixedLayout={false} />
      </div>
    {/if}
  {/if}
</div>

<style>
  .consolidado-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .loader-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 200px;
    gap: 16px;
  }
  .table-group {
    flex: 1;
    min-height: 0;
  }
  .error-panel {
    padding: 16px;
    background-color: #ffdddd;
    border: 1px solid #ff0000;
    color: #8b0000;
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

