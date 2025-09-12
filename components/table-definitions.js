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
    size: 100
  },
  {
    accessorFn: (row) => (row.order.assignerUser ? row.order.assignerUser.fullName : "N/A"),
    id: "asignado_por",
    header: "Asignado por",
    size: 150,
  },
];