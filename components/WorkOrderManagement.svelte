<script>
  import DataGrid from './DataGrid.svelte';
  import { data } from '../stores/data.js';
  import { workOrderColumns } from './table-definitions.js';
</script>

<div class="work-order-management">
  <DataGrid columns={workOrderColumns} data={$data.workOrders} />
</div>

<style>
  .work-order-management {
    width: 100%;
    height: 100%;
  }
</style>