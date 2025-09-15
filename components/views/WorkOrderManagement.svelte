<script>
  import DataGrid from '../shared/DataGrid.svelte';
  import { data } from '../../stores/data.js';
  import { workOrderColumns } from '../../config/table-definitions.js';
</script>

<div class="work-order-management">
  <DataGrid columns={workOrderColumns} data={$data.workOrders} fixedLayout={true} />
</div>

<style>
  .work-order-management {
    width: 100%;
    height: 100%;
  }
</style>