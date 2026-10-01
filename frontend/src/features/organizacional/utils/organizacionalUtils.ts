import type { Programa } from '../../../types/organizacional';

/**
 * Formats a program to display strictly as "Programa X" without verbose breakdowns.
 * e.g., code "1" -> "Programa 1", code "410" -> "Programa 410"
 */
export const formatProgramaShort = (
  programa?: Programa | { codigo?: string; nombre?: string } | null,
  fallbackCodigo?: string,
  fallbackNombre?: string
): string => {
  const code = (programa?.codigo || fallbackCodigo || '').trim();
  if (code) {
    // If code already contains "PROGRAMA", format nicely
    if (/^programa\s+/i.test(code)) {
      return code.replace(/^programa\s+/i, 'Programa ');
    }
    return `Programa ${code}`;
  }

  const name = (programa?.nombre || fallbackNombre || '').trim();
  if (name) {
    const match = name.match(/PROGRAMA\s+(\d+|[a-zA-Z0-9]+)/i);
    if (match) {
      return `Programa ${match[1]}`;
    }
    return name;
  }

  return 'Sin Programa';
};
