<script>
  import { createSvelteTable, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from "@tanstack/svelte-table";

  export let title;
  export let machines;

  let filterText = "";

  /**
   * Formatea una fecha UTC a la zona horaria de Colombia (fecha y hora).
   * @param {string | undefined} utcDateString - La fecha en formato string desde el servidor.
   * @returns {string} - La fecha y hora formateadas o 'N/A'.
   */
  function formatDateTime(utcDateString) {
    if (!utcDateString) return 'N/A';
    const date = new Date(utcDateString + 'Z'); // La clave: añadir 'Z' para interpretar como UTC
    const formattedDate = date.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
    const formattedTime = date.toLocaleTimeString('en-GB', { timeZone: 'America/Bogota' });
    return `${formattedDate} ${formattedTime}`;
  }

  /**
   * NUEVA FUNCIÓN: Formatea una fecha UTC a la zona horaria de Colombia (solo fecha).
   * @param {string | undefined} utcDateString - La fecha en formato string desde el servidor.
   * @returns {string} - La fecha formateada o 'N/A'.
   */
  function formatDate(utcDateString) {
    if (!utcDateString) return 'N/A';
    // Se añade 'Z' para asegurar que se interprete como UTC y evitar el error del día anterior.
    return new Date(utcDateString + 'Z').toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
    });
  }

  const columns = [
    { header: 'Máquina', accessorKey: 'name', size: 200 },
    { header: 'Horómetro Actual', accessorFn: row => row.motorData?.currentData?.currentHourMeter ?? 'N/A', id: 'horometro_actual', size: 100 },
    { header: 'Última Actualización', accessorFn: row => formatDateTime(row.motorData?.currentData?.lastUpdate), id: 'ultima_actualizacion', size: 150 },
    {
      header: 'Aceite de Motor',
      columns: [
        { header: 'Marca', accessorFn: row => row.motorData?.brand ?? 'N/A', id: 'motor_marca' },
        { header: 'Cant.', accessorFn: row => row.motorData?.quantity ?? 'N/A', id: 'motor_cantidad' },
        { header: 'Prom. Cambio (hrs)', accessorFn: row => row.motorData?.averageChangeHours ?? 'N/A', id: 'motor_promedio_cambio' },
        // CORREGIDO: Usando la nueva función formatDate para mostrar solo la fecha.
        { header: 'Fecha Últ. Cambio', accessorFn: row => formatDate(row.motorData?.dateLastUpdate), id: 'motor_fecha_ultimo_cambio' },
        { header: 'Horómetro Últ. Cambio', accessorFn: row => row.motorData?.hourMeterLastUpdate ?? 'N/A', id: 'motor_horometro_ultimo_cambio' },
        { header: 'Próximo Cambio (hrs)', accessorFn: row => row.motorData?.hourMeterNextUpdate ?? 'N/A', id: 'motor_proximo_cambio' },
        { header: 'Tiempo Últ. Cambio (meses)', accessorFn: row => row.motorData?.timeLastUpdateMouths ?? 'N/A', id: 'motor_tiempo_ultimo_cambio' },
        { header: 'Horas Restantes', accessorFn: row => row.motorData?.remainingHoursNextUpdateMouths ?? 'N/A', id: 'motor_horas_restantes' },
      ]
    },
    {
      header: 'Aceite Hidráulico',
      columns: [
        { header: 'Marca', accessorFn: row => row.hydraulicData?.brand ?? 'N/A', id: 'hidraulico_marca' },
        { header: 'Cant.', accessorFn: row => row.hydraulicData?.quantity ?? 'N/A', id: 'hidraulico_cantidad' },
        { header: 'Prom. Cambio (hrs)', accessorFn: row => row.hydraulicData?.averageChangeHours ?? 'N/A', id: 'hidraulico_promedio_cambio' },
        // CORREGIDO: Usando la nueva función formatDate para mostrar solo la fecha.
        { header: 'Fecha Últ. Cambio', accessorFn: row => formatDate(row.hydraulicData?.dateLastUpdate), id: 'hidraulico_fecha_ultimo_cambio' },
        { header: 'Horómetro Últ. Cambio', accessorFn: row => row.hydraulicData?.hourMeterLastUpdate ?? 'N/A', id: 'hidraulico_horometro_ultimo_cambio' },
        { header: 'Próximo Cambio (hrs)', accessorFn: row => row.hydraulicData?.hourMeterNextUpdate ?? 'N/A', id: 'hidraulico_proximo_cambio' },
        { header: 'Tiempo Últ. Cambio (meses)', accessorFn: row => row.hydraulicData?.timeLastUpdateMouths ?? 'N/A', id: 'hidraulico_tiempo_ultimo_cambio' },
        { header: 'Horas Restantes', accessorFn: row => row.hydraulicData?.remainingHoursNextUpdateMouths ?? 'N/A', id: 'hidraulico_horas_restantes' },
      ]
    },
  ];

  const table = createSvelteTable({
    data: machines,
    columns,
    state: {
      get globalFilter() {
        return filterText;
      },
    },
    onGlobalFilterChange: (val) => (filterText = val),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

</script>

<div class="table-container">
  <div class="filter-section">
    <h3>{title}</h3>
    <input
      type="text"
      bind:value={filterText}
      placeholder="Buscar en {title}..."
      class="filter-input"
    />
    <span class="filter-info">
      Mostrando {$table.getPaginationRowModel().rows.length} de {$table.getCoreRowModel().rows.length} registros
    </span>
  </div>
  <div class="table-wrapper">
    <table class="data-table">
      <thead>
        {#each $table.getHeaderGroups() as headerGroup}
          <tr>
            {#each headerGroup.headers as header}
              <th class="header-cell" colspan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <div class="header-content" on:click={header.column.getToggleSortingHandler()}>
                    <svelte:component this={flexRender(header.column.columnDef.header, header.getContext())} />
                    <span class="sort-indicator">
                      {{ asc: "▲", desc: "▼" }[header.column.getIsSorted()] ?? ""}
                    </span>
                  </div>
                {/if}
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody>
        {#each $table.getPaginationRowModel().rows as row, i}
          <tr class="data-row {i % 2 === 0 ? 'even' : 'odd'}">
            {#each row.getVisibleCells() as cell}
              <td class="data-cell">
                <svelte:component this={flexRender(cell.column.columnDef.cell, cell.getContext())} />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="pagination">
    <button class="page-btn" on:click={() => $table.setPageIndex(0)} disabled={!$table.getCanPreviousPage()}>◀◀</button>
    <button class="page-btn" on:click={() => $table.previousPage()} disabled={!$table.getCanPreviousPage()}>◀</button>
    <span class="page-info">Página {$table.getState().pagination.pageIndex + 1} de {$table.getPageCount()}</span>
    <button class="page-btn" on:click={() => $table.nextPage()} disabled={!$table.getCanNextPage()}>▶</button>
    <button class="page-btn" on:click={() => $table.setPageIndex($table.getPageCount() - 1)} disabled={!$table.getCanNextPage()}>▶▶</button>
  </div>
</div>

<style>
  .table-container {
    display: flex;
    flex-direction: column;
    background: #fff;
    font-family: "MS Sans Serif", "Tahoma", sans-serif;
    font-size: 11px;
    border: 2px inset #c0c0c0;
    height: 100%; /* Opcional: para que ocupe todo el alto disponible */
  }
  .filter-section {
    padding: 8px 12px;
    background: linear-gradient(#e0e0e0, #c0c0c0);
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #808080;
  }
  .filter-input {
    padding: 2px 4px;
    border: 1px inset #c0c0c0;
    width: 200px;
  }
  .filter-info {
    margin-left: auto;
    color: #404040;
    font-size: 10px;
  }
  .table-wrapper {
    flex-grow: 1; /* Permite que la tabla ocupe el espacio restante */
    overflow-x: auto;
    overflow-y: auto;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  .header-cell {
    background: linear-gradient(#e0e0e0, #c0c0c0);
    border: 1px outset #c0c0c0;
    padding: 8px 12px;
    position: sticky;
    top: 0;
    z-index: 10;
    white-space: nowrap;
    text-align: center;
  }
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
  }
  .sort-indicator {
    font-size: 8px;
    margin-left: 4px;
  }
  .data-row.even {
    background: #f8f8f8;
  }
  .data-row.odd {
    background: #fff;
  }
  .data-row:hover {
    background: #e8e8e8;
  }
  .data-cell {
    padding: 8px 12px;
    border-right: 1px solid #d0d0d0;
    border-bottom: 1px solid #d0d0d0;
    vertical-align: middle;
    white-space: nowrap;
  }
  .pagination {
    padding: 8px 12px;
    background: linear-gradient(#e0e0e0, #c0c0c0);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-top: 1px solid #808080;
  }
  .page-btn {
    padding: 4px 8px;
    border: 1px outset #c0c0c0;
    background: linear-gradient(#e0e0e0, #c0c0c0);
    cursor: pointer;
  }
  .page-btn:disabled {
    background: #f0f0f0;
    color: #808080;
    cursor: not-allowed;
  }
</style>

