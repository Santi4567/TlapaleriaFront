// src/components/returns/returnsUtils.ts

export const QUICK_REASONS = [
  'Producto defectuoso o dañado',
  'Cambio de medida / presentación',
  'Error de captura en caja',
  'Cliente canceló su compra',
];

export const formatCurrency = (val: number): string =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(val || 0);

export const formatQty = (val: number): string =>
  new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 3,
  }).format(val || 0);

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
