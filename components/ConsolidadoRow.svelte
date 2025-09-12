<script>
  export let machine;

  /**
   * Determina el estado de la máquina basado en las horas restantes.
   * @param {number | null} remainingHours - Horas restantes.
   * @returns {string} - El estado ('Óptimo', 'Regular', 'Malo', 'N/A').
   */
  function getStatus(remainingHours) {
    if (remainingHours == null) return "N/A";
    if (remainingHours < 100) return "Malo";
    if (remainingHours < 200) return "Regular";
    return "Óptimo";
  }

  const STATUS_CLASSES = {
    Óptimo: "status-optimo",
    Regular: "status-regular",
    Malo: "status-malo",
    "N/A": "status-na",
  };

  /**
   * Formatea una fecha UTC a la zona horaria de Colombia (solo fecha).
   * @param {string | undefined} utcDateString - La fecha en formato string desde el servidor.
   * @returns {string} - La fecha formateada o 'N/A'.
   */
  function formatDate(utcDateString) {
    if (!utcDateString) return 'N/A';
    // Se añade 'Z' para asegurar que se interprete como UTC y se formatea a la zona horaria de Bogotá.
    return new Date(utcDateString + 'Z').toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
    });
  }

  /**
   * Formatea una fecha UTC a la zona horaria de Colombia (fecha y hora).
   * @param {string | undefined} utcDateString - La fecha en formato string desde el servidor.
   * @returns {string} - La fecha y hora formateadas o 'N/A'.
   */
  function formatDateTime(utcDateString) {
    if (!utcDateString) return 'N/A';
    const date = new Date(utcDateString + 'Z');
    // Se obtiene la fecha en formato local de Colombia
    const formattedDate = date.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
    // Se obtiene la hora en formato de 24h (usando 'en-GB' como truco)
    const formattedTime = date.toLocaleTimeString('en-GB', { timeZone: 'America/Bogota' });
    return `${formattedDate} ${formattedTime}`;
  }
</script>

<!-- Datos Generales -->
<td class="data-cell">{machine.name}</td>
<td class="data-cell">{machine.motorData?.currentData?.currentHourMeter ?? 'N/A'}</td>
<!-- CELDA CORREGIDA: Usa la función formatDateTime para mostrar fecha y hora -->
<td class="data-cell">{formatDateTime(machine.motorData?.currentData?.lastUpdate)}</td>

<!-- Motor Data -->
<td class="data-cell">{machine.motorData?.brand ?? 'N/A'}</td>
<td class="data-cell">{machine.motorData?.quantity ?? 'N/A'}</td>
<td class="data-cell">{machine.motorData?.averageChangeHours ?? 'N/A'}</td>
<!-- CELDA CORREGIDA: Usa la función formatDate para mostrar solo la fecha -->
<td class="data-cell">{formatDate(machine.motorData?.dateLastUpdate)}</td>
<td class="data-cell">{machine.motorData?.hourMeterLastUpdate ?? 'N/A'}</td>
<td class="data-cell">{machine.motorData?.hourMeterNextUpdate ?? 'N/A'}</td>
<td class="data-cell">{machine.motorData?.timeLastUpdateMouths ?? 'N/A'}</td>
<td class="data-cell">{machine.motorData?.remainingHoursNextUpdateMouths ?? 'N/A'}</td>
<td class="data-cell status-cell {STATUS_CLASSES[getStatus(machine.motorData?.remainingHoursNextUpdateMouths)]}">
  {getStatus(machine.motorData?.remainingHoursNextUpdateMouths)}
</td>

<!-- Hydraulic Data -->
<td class="data-cell">{machine.hydraulicData?.brand ?? 'N/A'}</td>
<td class="data-cell">{machine.hydraulicData?.quantity ?? 'N/A'}</td>
<td class="data-cell">{machine.hydraulicData?.averageChangeHours ?? 'N/A'}</td>
<!-- CELDA CORREGIDA: Usa la función formatDate y corrige el error de interpretación -->
<td class="data-cell">{formatDate(machine.hydraulicData?.dateLastUpdate)}</td>
<td class="data-cell">{machine.hydraulicData?.hourMeterLastUpdate ?? 'N/A'}</td>
<td class="data-cell">{machine.hydraulicData?.hourMeterNextUpdate ?? 'N/A'}</td>
<td class="data-cell">{machine.hydraulicData?.timeLastUpdateMouths ?? 'N/A'}</td>
<td class="data-cell">{machine.hydraulicData?.remainingHoursNextUpdateMouths ?? 'N/A'}</td>
<td class="data-cell status-cell {STATUS_CLASSES[getStatus(machine.hydraulicData?.remainingHoursNextUpdateMouths)]}">
  {getStatus(machine.hydraulicData?.remainingHoursNextUpdateMouths)}
</td>

<style>
  .data-cell {
    /* Estilos para que las celdas se vean ordenadas (opcional) */
    padding: 8px 12px;
    border: 1px solid #ddd;
    text-align: left;
    white-space: nowrap;
  }
  .status-cell {
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  }
  .status-optimo {
    background-color: #28a745; /* Verde más agradable */
  }
  .status-regular {
    background-color: #ffc107; /* Amarillo ámbar */
  }
  .status-malo {
    background-color: #dc3545; /* Rojo estándar de peligro */
  }
  .status-na {
    background-color: #6c757d; /* Gris neutro */
  }
</style>
