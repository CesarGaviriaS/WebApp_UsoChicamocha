<script>
  import { onMount } from 'svelte';
  import DataGrid from './DataGrid.svelte';
  import { data } from '../stores/data.js';

  onMount(() => {
    data.fetchWorkOrders();
  });

  // Columns for the DataGrid
  const workOrderColumns = [
    { accessorKey: "id", header: "ID", size: 50 },
    {
      accessorFn: (row) => new Date(row.date).toLocaleDateString('es-CO'),
      id: "fecha",
      header: "Fecha",
      size: 100,
    },
    { accessorKey: "description", header: "Descripción", size: 300 },
    { accessorKey: "status", header: "Estado", size: 100 },
    {
      accessorFn: (row) => row.inspection.machine.name,
      id: "maquina",
      header: "Máquina",
      size: 200,
    },
    {
      accessorFn: (row) => row.assignerUser.fullName,
      id: "asignado_por",
      header: "Asignado por",
      size: 150,
    },
  ];

</script>

<div class="work-order-management">
  <DataGrid columns={workOrderColumns} data={$data.workOrders} tableType="workOrders" />
</div>

<style>
  .work-order-management {
    width: 100%;
    height: 100%;
  }
</style>