<script>
  import { onMount } from 'svelte';
  import fetchWithAuth, { fetchWithoutV1 } from '../../stores/api.js';
  import DataGrid from '../shared/DataGrid.svelte';
  // CAMBIO: Se importa la nueva función en lugar de la constante
  import { createConsolidadoColumns } from '../../config/table-definitions.js';

  let distritoMachines = [];
  let asociacionMachines = [];
  let isLoading = true;

  // CAMBIO: Se definen las columnas aquí para poder pasarlas al DataGrid
  const distritoColumns = createConsolidadoColumns('Distrito');
  const asociacionColumns = createConsolidadoColumns('Asociación');

  onMount(async () => {
    isLoading = true;
    try {
      const [machines, motorChanges, hydraulicChanges] = await Promise.all([
        fetchWithAuth('machine'),
        fetchWithoutV1('oil-changes/motor'),
        fetchWithoutV1('oil-changes/hydraulic'),
      ]);

      if (machines && motorChanges && hydraulicChanges) {
        const motorMap = new Map(motorChanges.map(item => [item.currentData.machineName.toLowerCase(), item]));
        const hydraulicMap = new Map(hydraulicChanges.map(item => [item.currentData.machineName.toLowerCase(), item]));

        const combinedData = machines.map(machine => ({
          ...machine,
          motorData: motorMap.get(machine.name.toLowerCase()) || null,
          hydraulicData: hydraulicMap.get(machine.name.toLowerCase()) || null,
        }));

        distritoMachines = combinedData.filter(m => m.belongsTo.toLowerCase() === 'distrito');
        asociacionMachines = combinedData.filter(m => m.belongsTo.toLowerCase() === 'asociacion');
      }
    } catch (error) {
      console.error("Error al cargar datos del consolidado:", error);
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="consolidado-container">
  {#if isLoading}
    <p>Cargando datos del consolidado...</p>
  {:else}
    <div>
      
      <!-- CAMBIO: Se usan las columnas específicas para el Distrito -->
      <DataGrid columns={distritoColumns} data={distritoMachines} />
    </div>
    <div>
      
      <!-- CAMBIO: Se usan las columnas específicas para la Asociación -->
      <DataGrid columns={asociacionColumns} data={asociacionMachines} />
    </div>
  {/if}
</div>

<style>
  .consolidado-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  h3 {
    margin-bottom: 10px;
  }
</style>
