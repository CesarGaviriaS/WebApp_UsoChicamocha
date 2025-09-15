<script>
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import {
    createSvelteTable,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
  } from '@tanstack/svelte-table';

  export let columns = [];
  export let data = [];

  const dispatch = createEventDispatcher();

  const globalFilter = writable('');
  let sorting = [];

  $: table = createSvelteTable({
    data,
    columns,
    state: {
      get globalFilter() { return $globalFilter },
      sorting,
    },
    onGlobalFilterChange: globalFilter.set,
    onSortingChange: updater => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  function handleAction(type, rowData) {
    dispatch('action', { type, data: rowData });
  }

  function handleStatusClick(row, column) {
    dispatch('cellContextMenu', { row, column });
  }

  function getStatusClass(value) {
    const status = String(value || '').toLowerCase();
    if (status.includes('óptimo') || status.includes('optimo')) return 'status-optimo';
    if (status.includes('regular')) return 'status-regular';
    if (status.includes('malo')) return 'status-malo';
    return 'status-unknown';
  }
</script>

<div class="data-grid-wrapper">
  <div class="controls-container">
    <div class="filter-group">
      <label for="search-input">Filtrar:</label>
      <input
        id="search-input"
        type="text"
        bind:value={$globalFilter}
        placeholder="Buscar en toda la tabla..."
        class="search-input"
      />
    </div>
  </div>

  <div class="table-container">
    <table class="data-grid">
      <thead>
        {#each $table.getHeaderGroups() as headerGroup}
          <tr key={headerGroup.id}>
            {#each headerGroup.headers as header}
              <th
                key={header.id}
                colspan={header.colSpan}
                style:min-width="{header.column.getSize()}px"
                class:sortable={header.column.getCanSort()}
                on:click={header.column.getToggleSortingHandler()}
                class={header.column.columnDef.meta?.cellClass || ''}
              >
                {#if !header.isPlaceholder}
                  <!-- CORRECCIÓN: {@const} se movió aquí para ser hijo directo de {#if} -->
                  {@const content = flexRender(header.column.columnDef.header, header.getContext())}
                  <div class="header-content">
                    {#if typeof content === 'string'}
                      {@html content}
                    {:else}
                      <svelte:component this={content} />
                    {/if}
                    <span class="sort-indicator">
                      {{
                        asc: ' ▲',
                        desc: ' ▼',
                      }[header.column.getIsSorted()] ?? ''}
                    </span>
                  </div>
                {/if}
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody>
        {#each $table.getRowModel().rows as row}
          <tr key={row.id} class:unexpected-row={row.original.isUnexpected}>
            {#each row.getVisibleCells() as cell}
              <td 
                key={cell.id} 
                class:multiline={cell.column.columnDef.meta?.isMultiline}
                class={cell.column.columnDef.meta?.cellClass || ''}
              >
                {#if cell.column.columnDef.meta?.isAction}
                  <div class="actions-cell">
                    <button class="btn-action btn-edit" on:click={() => handleAction('edit', row.original)}>Editar</button>
                    <button class="btn-action btn-delete" on:click={() => handleAction('delete', row.original)}>Eliminar</button>
                  </div>
                {:else if cell.column.columnDef.meta?.isStatus || cell.column.columnDef.meta?.isDateStatus}
                  {@const cellValue = cell.getContext().getValue()}
                  <button
                    class="status-btn {getStatusClass(cellValue)}"
                    on:click={() => handleStatusClick(row.original, cell.column.columnDef)}
                  >
                    {cellValue}
                  </button>
                {:else}
                  <svelte:component this={flexRender(cell.column.columnDef.cell, cell.getContext())} />
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="footer-controls">
      <span class="record-count">
        Mostrando {$table.getRowModel().rows.length} de {$table.getCoreRowModel().rows.length} registros
      </span>
  </div>
</div>


<style>
  .data-grid-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .controls-container {
    padding: 12px;
    background: #e0e0e0;
    border: 1px solid #808080;
    border-bottom: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-shrink: 0; 
  }
  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .search-input {
    padding: 4px 6px;
    border: 1px inset #c0c0c0;
    font-size: 11px;
    font-family: inherit;
    background-color: #ffffff;
  }
  .table-container {
    flex: 1 1 auto;
    overflow: auto; 
    border: 2px inset #c0c0c0;
    border-top: none; 
    border-top-color: #808080;
    border-left-color: #808080;
    border-right-color: #dfdfdf;
    border-bottom-color: #dfdfdf;
  }
  .data-grid {
    width: 100%;
    border-collapse: collapse;
    font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
    font-size: 11px;
    table-layout: auto;
  }
  
  .data-grid th, .data-grid td {
    border: 1px solid #c0c0c0;
    padding: 6px 8px;
    text-align: left;
    background-color: #ffffff;
    white-space: nowrap;
  }
  .data-grid td.multiline {
      white-space: normal;
      word-break: break-word;
  }

  .data-grid th {
    background: #c0c0c0;
    font-weight: bold;
    border: 1px outset #c0c0c0;
    border-right: 1px solid #808080;
    white-space: normal;
    text-align: center;
    vertical-align: middle;
  }
  .unexpected-row td {
    background-color: #ffdddd !important;
  }

  th.sortable .header-content {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
  }
  .sort-indicator {
    font-size: 8px;
  }
  .actions-cell {
    display: flex;
    gap: 4px;
  }
  .btn-action, .status-btn {
    padding: 2px 8px;
    border: 1px outset #c0c0c0;
    cursor: pointer;
    font-size: 10px;
    margin: 0;
    flex: 1; 
    font-family: inherit;
  }
  .btn-edit {
    background-color: #f0f0f0;
  }
  .btn-delete {
    background-color: #ffbaba;
  }
  .status-btn {
    font-weight: bold;
    color: #000;
  }
  .status-optimo { background-color: #90ee90; }
  .status-regular { background-color: #ffd700; }
  .status-malo { background-color: #ffbaba; }
  .status-unknown { background-color: #e0e0e0; }
  .footer-controls {
    padding: 8px 12px;
    background: #e0e0e0;
    border: 1px solid #808080;
    border-top: 1px solid #c0c0c0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-shrink: 0;
  }
  .record-count {
    font-size: 11px;
  }

  :global(th.motor-oil-cell), :global(td.motor-oil-cell) {
    background-color: #e0f7fa !important;
  }
  :global(th.hydraulic-oil-cell), :global(td.hydraulic-oil-cell) {
    background-color: #e8f5e9 !important;
  }

</style>

