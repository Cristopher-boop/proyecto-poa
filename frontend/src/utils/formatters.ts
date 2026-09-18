/**
 * Utilidades de formateo estandarizadas para el sistema institucional POA.
 */

/**
 * Formatea un valor numérico o string a formato de moneda boliviana (BOB).
 * Ejemplo: 1250.5 -> "Bs. 1.250,50"
 */
export function formatMoney(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return 'Bs. 0,00';
  
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num).replace('BOB', 'Bs.');
}

/**
 * Formatea un valor a porcentaje.
 * Ejemplo: 45.678 -> "45.68%"
 */
export function formatPercent(value: number | string | null | undefined, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '0.00%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formatea una fecha ISO o YYYY-MM-DD a formato legible local (DD/MM/YYYY).
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('es-BO');
  } catch {
    return dateString;
  }
}
