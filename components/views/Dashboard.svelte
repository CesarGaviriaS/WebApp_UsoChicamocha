<script>
  import { createEventDispatcher } from 'svelte';
  import DataGrid from '../shared/DataGrid.svelte';
  import { dashboardColumns } from '../../config/table-definitions.js';
  import { data } from '../../stores/data.js';

  const dispatch = createEventDispatcher();

  function handleCellContextMenu(event) {
    dispatch('cellContextMenu', event.detail);
  }
</script>

<div class="grid-container">
  <DataGrid 
    columns={dashboardColumns}
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

<style>
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

