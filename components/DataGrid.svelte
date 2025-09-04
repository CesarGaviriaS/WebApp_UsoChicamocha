<script>
  import { createEventDispatcher } from "svelte";
  import {
    createSvelteTable,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } from "@tanstack/svelte-table";

  // --- PROPS ---
  export let data = [];
  export let tableType = "estados";
  export let onCellContextMenu = null;

  const dispatch = createEventDispatcher();

  // --- STATE ---
  let filterText = "";
  let startDate = null;
  let endDate = null;
  const PAGE_SIZE = 20;
  const STATUS_VALUES = ["Óptimo", "Regular", "Malo"];
  const STATUS_CLASSES = {
    Óptimo: "status-optimo",
    Regular: "status-regular",
    Malo: "status-malo",
  };
  

  // --- LÓGICA DE FECHA PARA EL EXTINTOR ---
  function getExtintorStatus(dateString) {
    if (!dateString || typeof dateString !== "string") return "N/A";
    const expirationDate = new Date(dateString);
    expirationDate.setUTCHours(12); // Evitar problemas de zona horaria
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    if (expirationDate < today) return "Malo";
    if (expirationDate <= twoMonthsFromNow) return "Regular";
    return "Óptimo";
  }

  // --- COLUMNAS ---
  const estadosColumns = [
    {
      accessorFn: (row) => new Date(row.dateStamp + 'Z').toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
      id: "fecha",
      header: "Fecha",
      size: 80,
      sortingFn: (rowA, rowB, columnId) => {
          const dateA = new Date(rowA.original.dateStamp + 'Z');
          const dateB = new Date(rowB.original.dateStamp + 'Z');
          return dateA.getTime() - dateB.getTime();
      },
    },
    {
      accessorFn: (row) => new Date(row.dateStamp + 'Z').toLocaleTimeString('en-GB', { timeZone: 'America/Bogota' }), // Formato 24h
      id: "hora",
      header: "Hora",
      size: 50,
    },
    {
      accessorFn: (row) => `${row.machine.name} ${row.machine.model} ${row.machine.numInterIdentification}`,
      id: "maquina",
      header: "MÁQUINA",
      size: 250,
    },
    { accessorKey: "hourMeter", header: "Horómetro", size: 80 },
    {
      accessorKey: "leakStatus",
      header: "Fugas Sistema",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "brakeStatus",
      header: "Sistema Frenos",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "beltsPulleysStatus",
      header: "Correas y Poleas",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "tireLanesStatus",
      header: "Llantas/Carriles",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "carIgnitionStatus",
      header: "Sistema Encendido",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "electricalStatus",
      header: "Sistema Eléctrico",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "mechanicalStatus",
      header: "Sistema Mecánico",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "temperatureStatus",
      header: "Nivel Temperatura",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "oilStatus",
      header: "Nivel Aceite",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "hydraulicStatus",
      header: "Nivel Hidráulico",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "coolantStatus",
      header: "Nivel Refrigerante",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "structuralStatus",
      header: "Estado Estructural",
      size: 100,
      meta: { isStatus: true },
    },
    {
      accessorKey: "expirationDateFireExtinguisher",
      header: "Vigencia Extintor",
      size: 110,
      meta: { isDateStatus: true },
    },
    {
      accessorKey: "observations",
      header: "Observaciones",
      size: 350,
      meta: { isMultiline: true },
    },
    {
      accessorKey: "greasingAction",
      header: "Acción de Engrase",
      size: 150,
    },
    {
      accessorKey: "greasingObservations",
      header: "Observaciones de Engrase",
      size: 350,
      meta: { isMultiline: true },
    },
    {
      accessorFn: (row) => row.user.fullName,
      id: "responsable",
      header: "Responsable",
      size: 160,
    },
  ];

  $: columns = tableType === "estados" ? estadosColumns : [];

  $: filteredData = (() => {
    if (!startDate && !endDate) {
      return data;
    }
    return data.filter(item => {
      // Get the date string for the item in Colombia timezone (YYYY-MM-DD format)
      const itemDateInColombia = new Date(item.dateStamp + 'Z').toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

      let passesStartDate = true;
      if (startDate) {
        passesStartDate = itemDateInColombia >= startDate;
      }

      let passesEndDate = true;
      if (endDate) {
        passesEndDate = itemDateInColombia <= endDate;
      }
      
      return passesStartDate && passesEndDate;
    });
  })();

  let table = null;
  $: if (Array.isArray(columns)) {
    const safeData = Array.isArray(filteredData) ? filteredData : [];
    table = createSvelteTable({
      data: safeData,
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
        pagination: { pageSize: PAGE_SIZE },
        sorting: [{ id: 'fecha', desc: true }, { id: 'hora', desc: true }],
      },
    });
  }

  let keepDateSort = false;

  function handleHeaderClick(event, column) {
    const currentSorting = $table.getState().sorting;

    // If the checkbox is checked and we are not clicking the date column
    if (keepDateSort && column.id !== 'fecha') {
        // Find the current date sort to preserve its direction
        let dateSort = currentSorting.find(s => s.id === 'fecha');
        // If date is not sorted for some reason, add it as default
        if (!dateSort) {
            dateSort = { id: 'fecha', desc: true };
        }

        let newSorting = [dateSort];

        // Check if the clicked column is already the secondary sort
        const secondarySort = currentSorting.length > 1 ? currentSorting[1] : null;
        if (secondarySort && secondarySort.id === column.id) {
            // If it is, toggle its direction
            newSorting.push({ id: column.id, desc: !secondarySort.desc });
        } else {
            // Otherwise, add it as a new secondary sort (defaulting to ascending)
            newSorting.push({ id: column.id, desc: false });
        }
        $table.setSorting(newSorting);
    } else {
        // Default behavior: use shift key for multi-sort.
        // This also handles clicking on the 'fecha' column itself.
        column.getToggleSortingHandler()(event);
    }
  }

  function getHeaderContent(header) {
    try {
      return flexRender(header.column.columnDef.header, header.getContext());
    } catch (e) {
      return String(header.column.columnDef.header ?? "");
    }
  }

  function handleStatusClick(row, columnDef, value) {
    const payload = {
      data: row.original,
      column: columnDef.header ?? columnDef.accessorKey,
      value,
      field: columnDef.accessorKey,
    };
    dispatch("cellContextMenu", payload);
  }

  function goFirst() {
    $table.setPageIndex(0);
  }
  function goPrev() {
    $table.previousPage();
  }
  function goNext() {
    $table.nextPage();
  }
  function goLast() {
    $table.setPageIndex($table.getPageCount() - 1);
  }
</script>

<div class="table-container">
  <div class="filter-section">
    <label for="filter">Filtrar:</label>
    <input
      id="filter"
      type="text"
      bind:value={filterText}
      placeholder="Buscar en toda la tabla..."
      class="filter-input"
    />

    <div class="date-filter-container">
      <label for="start-date">Desde:</label>
      <input type="date" id="start-date" bind:value={startDate} class="date-input" />
      <label for="end-date">Hasta:</label>
      <input type="date" id="end-date" bind:value={endDate} class="date-input" />
      <button on:click={() => { startDate = null; endDate = null; }} class="clear-date-btn">Limpiar</button>
    </div>

    <span class="filter-info">
      {#if table}
        Mostrando {$table.getPaginationRowModel().rows.length} de {$table.getCoreRowModel().rows.length} registros
      {:else}
        Cargando tabla...
      {/if}
    </span>
  </div>

  <div class="table-wrapper">
    {#if table}
      <table class="data-table">
        <colgroup>
          {#each $table.getAllLeafColumns() as col}
            <col
              style="width: {col.getSize()}px; min-width: {col.getSize()}px;"
            />
          {/each}
        </colgroup>
        <thead>
          {#each $table.getHeaderGroups() as headerGroup}
            <tr>
              {#each headerGroup.headers as header}
                <th
                  style="width: {header.getSize()}px;"
                  class="header-cell"
                  on:click={(event) => handleHeaderClick(event, header.column)}
                >
                  <div class="header-content">
                    {#if header.isPlaceholder}
                      &nbsp;
                    {:else}
                      {@const content = getHeaderContent(header)}

                      {#if header.id === 'fecha'}
                        <input
                          type="checkbox"
                          bind:checked={keepDateSort}
                          on:click|stopPropagation
                          title="Mantener ordenamiento de fecha"
                          style="margin-right: 5px;"
                        />
                      {/if}

                      {#if typeof content === "string" || typeof content === "number"}
                        {content}
                      {:else if content && typeof content === "function"}
                        <!-- Si flexRender devolvió una clase/función de componente Svelte -->
                        <svelte:component
                          this={content}
                          {...header.getContext()}
                        />
                      {:else}
                        <!-- Si es otro tipo renderizable (node, fragmento), dejar que Svelte lo muestre -->
                        {content}
                      {/if}

                      <span class="sort-indicator">
                        {{ asc: "▲", desc: "▼" }[header.column.getIsSorted()] ??
                          ""}
                      </span>
                    {/if}
                  </div>
                </th>
              {/each}
            </tr>
          {/each}
        </thead>
        <tbody>
          {#each $table.getPaginationRowModel().rows as row, rowIndex}
            <tr
              class="data-row {rowIndex % 2 === 0 ? 'even' : 'odd'}"
              class:unexpected-row={row.original.isUnexpected}
            >
              {#each row.getVisibleCells() as cell}
                <td
                  class="data-cell"
                  class:multiline={cell.column.columnDef.meta?.isMultiline}
                  style="width: {cell.column.getSize()}px;"
                >
                  <!-- <<< CORREGIDO: Se elimina '@const' y se usa 'cell.getValue()' directamente >>> -->
                  {#if cell.column.columnDef.meta?.isStatus && STATUS_VALUES.includes(cell.getValue())}
                    <button
                      class="status-button {STATUS_CLASSES[cell.getValue()]}"
                      on:click={() =>
                        handleStatusClick(
                          row,
                          cell.column.columnDef,
                          cell.getValue()
                        )}
                      title="Click para crear orden de trabajo"
                    >
                      {cell.getValue()}
                    </button>
                  {:else if cell.column.columnDef.meta?.isDateStatus}
                    {@const dateValue = cell.getValue()}
                    {@const status = getExtintorStatus(dateValue)}

                    <div class="extintor-cell">
                      {#if !dateValue}
                        <!-- No hay fecha -->
                        <span class="cell-content">—</span>
                      {:else if status === "N/A"}
                        <!-- Fecha inválida o no parseable: mostramos la fecha tal cual viene -->
                        <span class="cell-content">{dateValue}</span>
                      {:else}
                        <!-- Estado (botón) + la fecha cruda debajo -->
                        <div class="status-and-date">
                          <button
                            class="status-button {STATUS_CLASSES[status]}"
                            on:click={() =>
                              handleStatusClick(
                                row,
                                cell.column.columnDef,
                                status
                              )}
                            title="Click para crear orden de trabajo"
                          >
                            {status}
                          </button>

                          <div class="extintor-date">
                            {dateValue}
                          </div>
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <span class="cell-content">
                      {cell.getValue() ?? ""}
                    </span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div style="padding:16px;">Inicializando tabla...</div>
    {/if}
  </div>

  <div class="pagination">
    {#if table}
      <button
        class="page-btn"
        on:click={goFirst}
        disabled={!$table.getCanPreviousPage()}>◀◀</button
      >
      <button
        class="page-btn"
        on:click={goPrev}
        disabled={!$table.getCanPreviousPage()}>◀</button
      >
      <span class="page-info"
        >Página {$table.getState().pagination.pageIndex + 1} de {$table.getPageCount()}</span
      >
      <button
        class="page-btn"
        on:click={goNext}
        disabled={!$table.getCanNextPage()}>▶</button
      >
      <button
        class="page-btn"
        on:click={goLast}
        disabled={!$table.getCanNextPage()}>▶▶</button
      >
    {/if}
  </div>
</div>

<div class="instructions">
  <p>
    <strong>💡</strong> Haz click en cualquier estado colorido (Óptimo/Regular/Malo)
  </p>
</div>

<style>
  
  /* mantengo tus estilos (idénticos a los previos) */
  .data-cell.multiline .cell-content {
    white-space: normal;
    word-break: break-word;
    max-height: 4.8em;
    overflow-y: auto;
    display: block;
    line-height: 1.6;
  }
  .table-container {
    height: calc(100%);
    display: flex;
    flex-direction: column;
    background: #fff;
    font-family: "MS Sans Serif", "Tahoma", sans-serif;
    font-size: 11px;
  }
  .filter-section {
    padding: 8px 12px;
    background: linear-gradient(#e0e0e0, #c0c0c0);
    display: flex;
    align-items: center;
    gap: 8px;
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
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
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
    cursor: pointer;
  }
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
  .data-row.unexpected-row {
    background-color: #ffdddd; /* Rojo muy tenue */
  }
  .data-row:hover {
    background: #e8e8e8; /* Default hover for non-unexpected rows */
  }
  .data-row.unexpected-row:hover {
    background-color: #ffaaaa; /* A more intense red for unexpected rows on hover */
  }
  .data-cell {
    padding: 8px 12px;
    border-right: 1px solid #d0d0d0;
    border-bottom: 1px solid #d0d0d0;
    vertical-align: middle;
  }
  .cell-content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }
  .status-button {
    padding: 4px 8px;
    border: 2px outset #c0c0c0;
    font-weight: bold;
    min-width: 60px;
  }
  .status-optimo {
    background: #90ee90;
  }
  .status-regular {
    background: #ffd700;
  }
  .status-malo {
    background: #ff6b6b;
  }
  .pagination {
    padding: 8px 12px;
    background: linear-gradient(#e0e0e0, #c0c0c0);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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
  .instructions {
    height: 30px;
    background: linear-gradient(#f0f0f0, #e0e0e0);
    display: flex;
    align-items: center;
    padding: 6px 16px;
    font-size: 10px;
  }
  .date-filter-container {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 16px;
  }
  .date-input {
    padding: 2px 4px;
    border: 1px inset #c0c0c0;
  }
  .clear-date-btn {
    padding: 4px 8px;
    border: 1px outset #c0c0c0;
    background: linear-gradient(#e0e0e0, #c0c0c0);
    cursor: pointer;
  }
</style>