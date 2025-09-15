export const workOrderColumns = [
  {
    accessorFn: (row) => (row.order.date ? new Date(row.order.date).toLocaleDateString('es-CO') : "N/A"),
    id: "fecha",
    header: "Fecha",
    size: 100,
  },
  {
    accessorFn: (row) => (row.machine ? `${row.machine.name} - ${row.machine.model} - ${row.machine.numInterIdentification}` : "N/A"),
    id: "maquina",
    header: "Máquina",
    size: 250,
  },
  {
    accessorFn: (row) => (row.order.description ? row.order.description.split('|')[0] : ''),
    id: 'origen',
    header: 'Origen',
    size: 100,
    meta: { isOrigin: true },
  },
  {
    accessorFn: (row) => (row.order.description ? row.order.description.split('|')[1] : ''),
    id: 'sector',
    header: 'Sector',
    size: 150,
  },
  {
    accessorFn: (row) => (row.order.description ? row.order.description.split('|')[2] : ''),
    id: 'condicion',
    header: 'Condición',
    size: 100,
    meta: { isCondition: true },
  },
  {
    accessorFn: (row) => (row.order.description ? row.order.description.split('|')[3] : ''),
    id: 'detalle',
    header: 'Detalle',
    size: 300,
  },
  {
    accessorFn: (row) => (row.order.description ? row.order.description.split('|')[4] : ''),
    id: 'tarea_asignada_a',
    header: 'Tarea Asignada a',
    size: 150,
  },
  {
    accessorFn: (row) => row.order.status,
    id: "status",
    header: "Estado",
    size: 100,
  },
  {
    accessorFn: (row) => (row.order.assignerUser ? row.order.assignerUser.fullName : "N/A"),
    id: "asignado_por",
    header: "Asignado por",
    size: 150,
  },
];
export const machineColumns = [
  { accessorKey: "name", header: "Nombre", size: 150 },
  { accessorKey: "brand", header: "Marca", size: 100 },
  { accessorKey: "model", header: "Modelo", size: 100 },
  { accessorKey: "numInterIdentification", header: "Núm. Identificación", size: 150 },
  { accessorKey: "numEngine", header: "Núm. Motor", size: 120 },
  {
    accessorFn: (row) => (row.belongsTo === 'distrito' ? 'Distrito' : 'Asociación'),
    id: "belongsTo",
    header: "Pertenece a",
    size: 100,
  },
  {
    // Adding 'T00:00:00' ensures the date is interpreted correctly across timezones
    accessorFn: (row) => (row.soat ? new Date(row.soat + 'T00:00:00').toLocaleDateString('es-CO') : 'N/A'),
    id: "soat",
    header: "SOAT",
    size: 100,
  },
  {
    accessorFn: (row) => (row.runt ? new Date(row.runt + 'T00:00:00').toLocaleDateString('es-CO') : 'N/A'),
    id: "runt",
    header: "RUNT",
    size: 100,
  },
  {
    id: "actions",
    header: "Acciones",
    size: 120,
    meta: { isAction: true }, // This tells the DataGrid to render action buttons
  },
];
export const dashboardColumns = [
    {
      accessorFn: (row) => new Date(row.dateStamp + 'Z').toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }),
      id: "fecha",
      header: "Fecha",
      size: 50,
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
      size: 10,
    },
    { accessorKey: "hourMeter", header: "Horómetro", size: 60 },
    {
      accessorKey: "leakStatus",
      header: "Fugas Sistema",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "brakeStatus",
      header: "Sistema Frenos",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "beltsPulleysStatus",
      header: "Correas y Poleas",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "tireLanesStatus",
      header: "Llantas / Carriles",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "carIgnitionStatus",
      header: "Sistema Encendido",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "electricalStatus",
      header: "Sistema Eléctrico",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "mechanicalStatus",
      header: "Sistema Mecánico",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "temperatureStatus",
      header: "Nivel Temperatura",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "oilStatus",
      header: "Nivel Aceite",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "hydraulicStatus",
      header: "Nivel Hidráulico",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "coolantStatus",
      header: "Nivel Refrigerante",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "structuralStatus",
      header: "Estado Estructural",
      size: 40,
      meta: { isStatus: true },
    },
    {
      accessorKey: "expirationDateFireExtinguisher",
      header: "Vigencia Extintor",
      size: 70,
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

function formatDateTime(utcDateString) {
  if (!utcDateString) return 'N/A';
  const date = new Date(utcDateString + 'Z'); // La clave: añadir 'Z' para interpretar como UTC
  const formattedDate = date.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' });
  const formattedTime = date.toLocaleTimeString('en-GB', { timeZone: 'America/Bogota' });
  return `${formattedDate} ${formattedTime}`;
}

function formatDate(utcDateString) {
  if (!utcDateString) return 'N/A';
  // Se añade 'Z' para asegurar que se interprete como UTC y evitar el error del día anterior.
  return new Date(utcDateString + 'Z').toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
  });
}

// CAMBIO: Se convierte a una función que genera las columnas dinámicamente
export const createConsolidadoColumns = (owner) => [
  {
    header: `Propiedad de ${owner}`,size:80,
    columns: [
        { header: 'Máquina', accessorKey: 'name' },
        { header: 'Horómetro Actual', accessorFn: row => row.motorData?.currentData?.currentHourMeter ?? 'N/A', id: 'horometro_actual' },
        { header: 'Última Actualización', accessorFn: row => formatDateTime(row.motorData?.currentData?.lastUpdate), id: 'ultima_actualizacion'},
    ]
  },
  {
    header: 'Aceite de Motor',
    columns: [
      { header: 'Marca', accessorFn: row => row.motorData?.brand ?? 'N/A', id: 'motor_marca', meta: { cellClass: 'motor-oil-cell' } },
      { header: 'Cant.', accessorFn: row => row.motorData?.quantity ?? 'N/A', id: 'motor_cantidad', meta: { cellClass: 'motor-oil-cell' } },
      { header: 'Prom. Cambio (hrs)', accessorFn: row => row.motorData?.averageChangeHours ?? 'N/A', id: 'motor_promedio_cambio', meta: { cellClass: 'motor-oil-cell' } },
      { header: 'Fecha Últ. Cambio', accessorFn: row => formatDate(row.motorData?.dateLastUpdate), id: 'motor_fecha_ultimo_cambio', meta: { cellClass: 'motor-oil-cell' } },
      { header: 'Horómetro Últ. Cambio', accessorFn: row => row.motorData?.hourMeterLastUpdate ?? 'N/A', id: 'motor_horometro_ultimo_cambio', meta: { cellClass: 'motor-oil-cell' } },
      { header: 'Próximo Cambio (hrs)', accessorFn: row => row.motorData?.hourMeterNextUpdate ?? 'N/A', id: 'motor_proximo_cambio', meta: { cellClass: 'motor-oil-cell' } },
      { header: 'Tiempo Últ. Cambio (meses)', accessorFn: row => row.motorData?.timeLastUpdateMouths ?? 'N/A', id: 'motor_tiempo_ultimo_cambio', meta: { cellClass: 'motor-oil-cell' } },
      { header: 'Horas Restantes', accessorFn: row => row.motorData?.remainingHoursNextUpdateMouths ?? 'N/A', id: 'motor_horas_restantes', meta: { cellClass: 'motor-oil-cell' } },
    ]
  },
  {
    header: 'Aceite Hidráulico',
    columns: [
      { header: 'Marca', accessorFn: row => row.hydraulicData?.brand ?? 'N/A', id: 'hidraulico_marca', meta: { cellClass: 'hydraulic-oil-cell' } },
      { header: 'Cant.', accessorFn: row => row.hydraulicData?.quantity ?? 'N/A', id: 'hidraulico_cantidad', meta: { cellClass: 'hydraulic-oil-cell' } },
      { header: 'Prom. Cambio (hrs)', accessorFn: row => row.hydraulicData?.averageChangeHours ?? 'N/A', id: 'hidraulico_promedio_cambio', meta: { cellClass: 'hydraulic-oil-cell' } },
      { header: 'Fecha Últ. Cambio', accessorFn: row => formatDate(row.hydraulicData?.dateLastUpdate), id: 'hidraulico_fecha_ultimo_cambio', meta: { cellClass: 'hydraulic-oil-cell' } },
      { header: 'Horómetro Últ. Cambio', accessorFn: row => row.hydraulicData?.hourMeterLastUpdate ?? 'N/A', id: 'hidraulico_horometro_ultimo_cambio', meta: { cellClass: 'hydraulic-oil-cell' } },
      { header: 'Próximo Cambio (hrs)', accessorFn: row => row.hydraulicData?.hourMeterNextUpdate ?? 'N/A', id: 'hidraulico_proximo_cambio', meta: { cellClass: 'hydraulic-oil-cell' } },
      { header: 'Tiempo Últ. Cambio (meses)', accessorFn: row => row.hydraulicData?.timeLastUpdateMouths ?? 'N/A', id: 'hidraulico_tiempo_ultimo_cambio', meta: { cellClass: 'hydraulic-oil-cell' } },
      { header: 'Horas Restantes', accessorFn: row => row.hydraulicData?.remainingHoursNextUpdateMouths ?? 'N/A', id: 'hidraulico_horas_restantes', meta: { cellClass: 'hydraulic-oil-cell' } },
    ]
  },
];

export const userColumns = [
  { accessorKey: "id", header: "ID", size: 40 },
  { accessorKey: "username", header: "Usuario", size: 100 },
  { accessorKey: "email", header: "Gmail", size: 150 },
  { accessorKey: "fullName", header: "Nombre Completo", size: 150 },
  { accessorKey: "role", header: "Rol", size: 80 },
  {
    id: "actions",
    header: "Acciones",
    size: 120,
    meta: { isAction: true },
  },
];

