<script>
  import { onMount } from 'svelte';
  import fetchWithAuth, { fetchWithoutV1 } from '../stores/api.js'; // Corrected import for fetchWithAuth
  import ConsolidadoTable from './ConsolidadoTable.svelte';

  let distritoMachines = [];
  let asociacionMachines = [];
  let isLoading = true;

  onMount(async () => {
    isLoading = true;
    try {
      const [machines, motorChanges, hydraulicChanges] = await Promise.all([
        fetchWithAuth('machine'), // Directly fetch machines
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
      // Optionally, show an error message to the user
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="consolidado-container">
  {#if isLoading}
    <p>Cargando datos del consolidado...</p>
  {:else}
    <ConsolidadoTable title="Maquinaria de Distrito" machines={distritoMachines} />
    <ConsolidadoTable title="Maquinaria de Asociación" machines={asociacionMachines} />
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
</style>