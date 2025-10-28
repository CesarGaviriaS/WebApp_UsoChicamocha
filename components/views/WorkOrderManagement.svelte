<script>
  import DataGrid from '../shared/DataGrid.svelte';
  import Loader from '../shared/Loader.svelte';
  import ExecuteOrderModal from '../shared/ExecuteOrderModal.svelte';
  import { workOrderColumns } from '../../config/table-definitions.js';
  import { data } from '../../stores/data.js';
  import { addNotification } from '../../stores/ui.js';

  $: workOrderInfo = $data.workOrders;
  $: isLoading = $data.isLoading;

  let showExecuteModal = false;
  let orderToExecute = null;
  let isExecuting = false;
  let isExporting = false;

  function handlePageChange(event) {
    const newPage = event.detail;
    data.fetchWorkOrders(newPage, workOrderInfo.pageSize);
  }

  function handleSizeChange(event) {
    const newSize = event.detail;
    data.fetchWorkOrders(0, newSize);
  }
  
  function handleAction(event) {
    const { type, data: orderData } = event.detail;
    if (type === 'execute') {
      orderToExecute = orderData;
      showExecuteModal = true;
    }
  }

  async function handleExecuteOrder(event) {
    isExecuting = true;
    try {
      await data.executeWorkOrder(event.detail);
      addNotification({ id: Date.now(), text: `Orden #${orderToExecute.order.id} ejecutada con éxito.` });
      showExecuteModal = false;
    } catch (e) {
      addNotification({ id: Date.now(), text: `Error al ejecutar la orden: ${e.message}` });
    } finally {
      isExecuting = false;
    }
  }

  async function handleExportInspections() {
    isExporting = true;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/inspection/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inspecciones.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addNotification({ id: Date.now(), text: 'Archivo de inspecciones descargado con éxito.' });
    } catch (e) {
      addNotification({ id: Date.now(), text: `Error al descargar el archivo: ${e.message}` });
    } finally {
      isExporting = false;
    }
  }

</script>

{#if isLoading}
  <div class="loader-container">
    <Loader />
    <p>Cargando órdenes de trabajo...</p>
  </div>
{:else}
  <div class="refresh-container">
    <button class="btn-refresh" on:click={() => data.fetchWorkOrders()}>
      Refrescar información
    </button>
    <button class="btn-export" on:click={handleExportInspections} disabled={isExporting}>
      {#if isExporting}
        <span class="loading-icon">⟳</span>
      {/if}
      {isExporting ? 'Descargando...' : 'Exportar Excel'}
    </button>
  </div>
  <DataGrid
    columns={workOrderColumns}
    data={workOrderInfo.data}
    totalElements={workOrderInfo.totalElements}
    totalPages={workOrderInfo.totalPages}
    currentPage={workOrderInfo.currentPage}
    pageSize={workOrderInfo.pageSize}
    fixedLayout={false}
    on:pageChange={handlePageChange}
    on:sizeChange={handleSizeChange}
    on:action={handleAction}
  />
{/if}

{#if showExecuteModal}
  <ExecuteOrderModal 
    workOrder={orderToExecute} 
    isSubmitting={isExecuting}
    on:cancel={() => showExecuteModal = false}
    on:execute={handleExecuteOrder}
  />
{/if}

<style>
  .loader-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .refresh-container {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
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
  .btn-export {
    padding: 2px 8px;
    background: linear-gradient(to bottom, #90ee90 0%, #7bc97b 100%);
    border: 1px outset #7bc97b;
    cursor: pointer;
    font-size: 10px;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .btn-export:hover:not(:disabled) {
    background: linear-gradient(to bottom, #a0ffa0 0%, #8bd98b 100%);
  }
  .btn-export:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .loading-icon {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>

