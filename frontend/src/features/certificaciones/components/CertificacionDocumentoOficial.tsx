import React, { useRef, useEffect } from 'react';
import { CertificacionPOA } from '../../../types/certificacion';

export interface ValoresEdicionDocumento {
  codigo_certificacion: string;
  numero_oficio_solicitud: string;
  categoria_programatica_codigo?: string;
  categoria_programatica?: string;
  notas?: string;
  elaborador_nombre?: string;
  elaborador_cargo?: string;
}

interface CertificacionDocumentoOficialProps {
  certificacion: CertificacionPOA;
  modoEdicion?: boolean;
  valoresEdicion?: ValoresEdicionDocumento;
  onChangeEdicion?: (fields: Partial<ValoresEdicionDocumento>) => void;
  printRef?: React.RefObject<HTMLDivElement>;
}

export function formatDiminutivoArea(areaCodigo?: string, areaNombre?: string): string {
  const cod = (areaCodigo || '').toUpperCase().trim();
  const nom = (areaNombre || '').toUpperCase().trim();

  if (nom.includes('OPERACIONES') || cod.endsWith('-GO')) return 'OPS';
  if (nom.includes('INFORM') || cod.endsWith('-IF')) return 'IF';
  if (nom.includes('ADMIN') || cod.endsWith('-GAA')) return 'GAA';
  if (nom.includes('COMERCIAL') || cod.endsWith('-GC')) return 'GC';
  if (nom.includes('AERONAVE') || cod.endsWith('-AE')) return 'AE';
  if (nom.includes('SMS') || cod.endsWith('-SMS')) return 'SMS';

  if (cod.includes('-')) {
    const parts = cod.split('-');
    const last = parts[parts.length - 1];
    if (last && isNaN(Number(last))) return last;
  }
  return cod.replace(/GERENCIA DE /i, '').replace(/GCIA\. /i, '').trim() || 'OPS';
}

export function cleanOficioSolicitud(oficio?: string, areaCodigo?: string, areaNombre?: string): string {
  if (!oficio) return '';
  if (/GCIA\.P-\d+-/i.test(oficio)) {
    const dim = formatDiminutivoArea(areaCodigo, areaNombre);
    return oficio.replace(/GCIA\.P-\d+-[A-Z0-9]+\.EPTAM/i, `GCIA.${dim}.EPTAM`);
  }
  return oficio;
}

export function getJerarquiaNumerica(
  progCodigo?: string,
  ampCodigo?: string,
  acpCodigo?: string,
  opCodigo?: string
): { ampNum: string; acpNum: string; opNum: string } {
  // 1. Número de programa (ej: 4 o 1)
  let progNum = '4';
  if (progCodigo) {
    const clean = progCodigo.replace(/^P-?/, '').trim();
    if (clean.startsWith('1')) progNum = '1';
    else if (clean.startsWith('2')) progNum = '2';
    else if (clean.startsWith('4')) progNum = '4';
    else if (/^\d+/.test(clean)) progNum = clean.charAt(0);
  } else if (ampCodigo && /AMP-P(\d+)/i.test(ampCodigo)) {
    const match = ampCodigo.match(/AMP-P(\d+)/i);
    if (match) {
      const p = match[1];
      if (p.startsWith('1')) progNum = '1';
      else if (p.startsWith('2')) progNum = '2';
      else if (p.startsWith('4')) progNum = '4';
      else progNum = p.charAt(0);
    }
  }

  // 2. Número de AMP (ej: 4.1 o 1.1)
  let ampSub = '1';
  if (ampCodigo) {
    const match = ampCodigo.match(/(\d+)$/);
    if (match) {
      ampSub = String(parseInt(match[1], 10) || 1);
    } else if (ampCodigo.includes('.')) {
      const parts = ampCodigo.split('.');
      if (parts.length >= 2) ampSub = parts[1];
    }
  }
  const ampNum = `${progNum}.${ampSub}`;

  // 3. Número de ACP (ej: 4.1.1 o 1.1.1)
  let acpSub = '1';
  if (acpCodigo && acpCodigo.includes('.')) {
    const parts = acpCodigo.split('.');
    if (parts.length >= 3) acpSub = parts[2];
  }
  const acpNum = `${ampNum}.${acpSub}`;

  // 4. Número de Operación (ej: 4.1.1.4 o 1.1.1.3)
  let opSub = '4';
  if (opCodigo) {
    if (opCodigo.includes('.')) {
      const parts = opCodigo.split('.');
      if (parts.length >= 4) opSub = parts[3];
    } else {
      const match = opCodigo.match(/(\d+)$/);
      if (match) {
        opSub = String(parseInt(match[1], 10) || 1);
      }
    }
  }
  const opNum = `${acpNum}.${opSub}`;

  return { ampNum, acpNum, opNum };
}

export function formatFechaCertificacion(fechaStr?: string): string {
  if (!fechaStr) {
    const now = new Date();
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `La Paz, ${meses[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }
  try {
    const [y, m, d] = fechaStr.split('T')[0].split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const mesIndex = parseInt(m, 10) - 1;
    const dia = parseInt(d, 10);
    if (!isNaN(mesIndex) && meses[mesIndex]) {
      return `La Paz, ${meses[mesIndex]} ${dia}, ${y}`;
    }
  } catch {}
  return `La Paz, ${fechaStr}`;
}

export const CertificacionDocumentoOficial: React.FC<CertificacionDocumentoOficialProps> = ({
  certificacion,
  modoEdicion = false,
  valoresEdicion,
  onChangeEdicion,
  printRef,
}) => {
  const gestionAnio = certificacion.gestion_anio || new Date().getFullYear();
  const fechaTexto = formatFechaCertificacion(certificacion.fecha);
  const versionTexto = certificacion.version || `Versión 1: ${gestionAnio}`;
  const notasTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Extraer datos de la jerarquía estratégica desde operaciones_detalle o jerarquia_resumen
  const opDetalle = certificacion.operaciones_detalle?.[0];

  const rawProgCod =
    opDetalle?.programa_codigo ||
    certificacion.jerarquia_resumen?.programas?.[0]?.codigo ||
    '';
  const rawAmpCod =
    opDetalle?.amp_codigo ||
    certificacion.jerarquia_resumen?.amps?.[0]?.codigo ||
    '';
  const rawAcpCod =
    opDetalle?.acp_codigo ||
    certificacion.jerarquia_resumen?.acps?.[0]?.codigo ||
    '';
  const rawOpCod =
    opDetalle?.codigo ||
    certificacion.jerarquia_resumen?.operaciones?.[0]?.codigo ||
    '';

  const { ampNum, acpNum, opNum } = getJerarquiaNumerica(
    rawProgCod,
    rawAmpCod,
    rawAcpCod,
    rawOpCod
  );

  const ampDescripcion =
    opDetalle?.amp_descripcion ||
    certificacion.jerarquia_resumen?.amps?.[0]?.descripcion ||
    'Incrementar mecanismos de control y eficiencia operacional a nivel Nacional.';

  const acpDescripcion =
    opDetalle?.acp_descripcion ||
    certificacion.jerarquia_resumen?.acps?.[0]?.descripcion ||
    `Ejecutar las acciones estratégicas programadas para la gestión fiscal ${gestionAnio}.`;

  const operacionDescripcion =
    opDetalle?.descripcion ||
    certificacion.jerarquia_resumen?.operaciones?.[0]?.descripcion ||
    certificacion.concepto_gasto ||
    'Operación institucional programada en el Plan Operativo Anual.';

  const progCodigo =
    opDetalle?.programa_codigo ||
    certificacion.jerarquia_resumen?.programas?.[0]?.codigo ||
    '210.0.0';
  const progNombre =
    opDetalle?.programa_nombre ||
    certificacion.jerarquia_resumen?.programas?.[0]?.nombre ||
    'Programas de Producción y/o Servicios Institucionales EPTAM';

  // Partida Presupuestaria
  const partidaCodigo = certificacion.partida_codigo || '';
  const partidaNombre =
    certificacion.partida_nombre ||
    certificacion.partida_literal ||
    'Partida de Gasto Presupuestario';
  const partidaCompleta = partidaCodigo ? `${partidaCodigo} ${partidaNombre}` : partidaNombre;

  const catProgCodigo =
    valoresEdicion?.categoria_programatica_codigo ??
    certificacion.categoria_programatica_codigo ??
    progCodigo;

  const catProgNombre =
    valoresEdicion?.categoria_programatica ??
    certificacion.categoria_programatica ??
    progNombre;

  const notasDefault =
    `Notas: El presente documento da a conocer únicamente que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) registrados en el Plan Operativo Anual ${gestionAnio}.\n\nLos aspectos presupuestarios y de contratación corresponden al área solicitante y se encuentran en el marco de las atribuciones y competencias de la Gerencia de Asuntos Administrativos EPTAM y sus instancias correspondientes según el D.S. Nº 0181 y normativa vigente relacionada.`;

  const notasValue =
    valoresEdicion?.notas !== undefined
      ? valoresEdicion.notas
      : certificacion.notas || notasDefault;

  // Ajustar altura del textarea de notas para que nunca tenga scroll y baje dinámicamente
  useEffect(() => {
    if (notasTextareaRef.current) {
      notasTextareaRef.current.style.height = 'auto';
      notasTextareaRef.current.style.height = `${notasTextareaRef.current.scrollHeight}px`;
    }
  }, [notasValue]);

  // Códigos oficiales (Se muestran tal cual serán asignados o los ya asignados)
  const rawOficio =
    valoresEdicion?.numero_oficio_solicitud ||
    certificacion.numero_oficio_solicitud ||
    '';
  const oficioValue = cleanOficioSolicitud(
    rawOficio,
    certificacion.area_codigo,
    certificacion.area_nombre
  );
  const codigoCertValue =
    valoresEdicion?.codigo_certificacion ||
    certificacion.codigo_certificacion ||
    '';

  return (
    <div
      ref={printRef}
      className="bg-white text-slate-900 border border-slate-300 dark:border-slate-700 shadow-lg rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto font-sans text-xs print:p-0 print:border-none print:shadow-none print:text-black print:rounded-none"
    >
      {/* ── Encabezado Superior: Fecha y Versión ───────────────────────────── */}
      <div className="flex justify-between items-start text-[11px] font-semibold text-slate-800 mb-2">
        <div>{fechaTexto}</div>
        <div className="text-right leading-tight">
          <div className="font-bold">{versionTexto}</div>
        </div>
      </div>

      {/* ── Título Central Institucional ────────────────────────────────────── */}
      <div className="text-center my-3 space-y-0.5">
        <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-950">
          EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR
        </h1>
        <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800">
          UNIDAD DE PLANIFICACIÓN Y CONTROL DE GESTIÓN
        </h2>
        <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-950 pt-1">
          CERTIFICACIÓN POA
        </h3>
      </div>

      <div className="w-full h-[1.5px] bg-slate-900 my-3" />

      {/* ── Tabla 1: Oficio de Solicitud y Certificación POA ───────────────── */}
      <table className="w-full border-collapse border border-slate-900 mb-2.5 text-xs">
        <thead>
          <tr className="bg-slate-100 text-[11px] font-bold text-slate-900 border-b border-slate-900 print:bg-slate-100">
            <th className="w-1/2 p-1.5 border-r border-slate-900 text-center uppercase tracking-wide">
              Nº Oficio de Solicitud
            </th>
            <th className="w-1/2 p-1.5 text-center uppercase tracking-wide">
              Nº Certificación POA
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="w-1/2 p-2 border-r border-slate-900 text-center font-mono font-bold text-slate-900">
              {oficioValue || (
                <span className="text-slate-400 italic font-sans font-normal">
                  {certificacion.hoja_ruta || 'Pendiente de emisión'}
                </span>
              )}
            </td>
            <td className="w-1/2 p-2 text-center font-mono font-bold text-slate-900">
              {codigoCertValue || (
                <span className="text-slate-400 italic font-sans font-normal">
                  Pendiente de emisión
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Tabla 2: Unidad Solicitante ─────────────────────────────────────── */}
      <table className="w-full border-collapse border border-slate-900 mb-3 text-xs">
        <tbody>
          <tr>
            <td className="w-[32%] sm:w-[35%] p-2 font-extrabold uppercase border-r border-slate-900 bg-slate-100 text-slate-900 print:bg-slate-100">
              UNIDAD SOLICITANTE:
            </td>
            <td className="w-[68%] sm:w-[65%] p-2 font-bold uppercase text-slate-900">
              {certificacion.area_nombre || 'GERENCIA SOLICITANTE'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Texto de Alineación POA ─────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-800 leading-relaxed mb-2 font-normal">
        La solicitud se encuentra programada en el Plan Operativo Anual (POA) {gestionAnio} de
        acuerdo al siguiente detalle:
      </p>

      {/* ── Tabla 3: Alineación Estratégica Institucional ────────────────────── */}
      <table className="w-full border-collapse border border-slate-900 mb-3 text-xs">
        <tbody>
          {/* Fila 1: PEE */}
          <tr className="border-b border-slate-900">
            <td className="w-[14%] p-2 border-r border-slate-900 font-mono font-bold text-center align-middle text-slate-900">
              {ampNum}
            </td>
            <td className="w-[36%] p-2 border-r border-slate-900 font-bold uppercase align-middle text-[10.5px] text-slate-900 bg-slate-50/50 print:bg-transparent">
              ACCIÓN DE MEDIANO PLAZO (PEE)
            </td>
            <td className="w-[50%] p-2 text-[11px] leading-snug align-middle text-slate-900">
              {ampDescripcion}
            </td>
          </tr>

          {/* Fila 2: POA */}
          <tr className="border-b border-slate-900">
            <td className="w-[14%] p-2 border-r border-slate-900 font-mono font-bold text-center align-middle text-slate-900">
              {acpNum}
            </td>
            <td className="w-[36%] p-2 border-r border-slate-900 font-bold uppercase align-middle text-[10.5px] text-slate-900 bg-slate-50/50 print:bg-transparent">
              ACCIÓN DE CORTO PLAZO (POA)
            </td>
            <td className="w-[50%] p-2 text-[11px] leading-snug align-middle text-slate-900">
              {acpDescripcion}
            </td>
          </tr>

          {/* Fila 3: OPERACIÓN */}
          <tr className="border-b border-slate-900">
            <td className="w-[14%] p-2 border-r border-slate-900 font-mono font-bold text-center align-middle text-slate-900">
              {opNum}
            </td>
            <td className="w-[36%] p-2 border-r border-slate-900 font-bold uppercase align-middle text-[10.5px] text-slate-900 bg-slate-50/50 print:bg-transparent">
              OPERACIÓN
            </td>
            <td className="w-[50%] p-2 text-[11px] leading-snug align-middle text-slate-900">
              {operacionDescripcion}
            </td>
          </tr>

          {/* Fila 4: CATEGORÍA PROGRAMÁTICA */}
          <tr>
            <td className="w-[14%] p-1.5 border-r border-slate-900 font-mono font-bold text-center align-middle text-slate-900">
              {modoEdicion ? (
                <input
                  type="text"
                  value={catProgCodigo}
                  onChange={(e) =>
                    onChangeEdicion?.({ categoria_programatica_codigo: e.target.value })
                  }
                  className="w-full text-center font-mono font-bold bg-amber-50/70 border border-amber-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-theme-primary"
                  placeholder="210.0.0"
                />
              ) : (
                catProgCodigo
              )}
            </td>
            <td className="w-[36%] p-2 border-r border-slate-900 font-bold uppercase align-middle text-[10.5px] text-slate-900 bg-slate-50/50 print:bg-transparent">
              CATEGORÍA PROGRAMÁTICA
            </td>
            <td className="w-[50%] p-1.5 text-[11px] leading-snug align-middle text-slate-900">
              {modoEdicion ? (
                <input
                  type="text"
                  value={catProgNombre}
                  onChange={(e) =>
                    onChangeEdicion?.({ categoria_programatica: e.target.value })
                  }
                  className="w-full font-medium bg-amber-50/70 border border-amber-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-theme-primary"
                  placeholder="Programas de Producción y/o Servicios Institucionales EPTAM"
                />
              ) : (
                catProgNombre
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Tabla 4: Partida Presupuestaria ─────────────────────────────────── */}
      <table className="w-full border-collapse border border-slate-900 mb-4 text-xs">
        <tbody>
          <tr>
            <td className="w-[32%] sm:w-[35%] p-2 font-extrabold uppercase border-r border-slate-900 bg-slate-100 text-slate-900 print:bg-slate-100">
              PARTIDA PRESUPUESTARIA
            </td>
            <td className="w-[68%] sm:w-[65%] p-2 font-semibold text-slate-900">
              {partidaCompleta}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Notas Legales Institucionales ───────────────────────────────────── */}
      <div className="space-y-1.5 text-[10.5px] text-slate-800 leading-relaxed mb-6 font-normal">
        {modoEdicion ? (
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Notas Legales / Aclaratorias (Modificable según contexto):
            </span>
            <textarea
              ref={notasTextareaRef}
              rows={1}
              value={notasValue}
              onChange={(e) => {
                onChangeEdicion?.({ notas: e.target.value });
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full text-[11px] p-2 bg-amber-50/70 border border-amber-300 rounded leading-relaxed focus:outline-none focus:ring-1 focus:ring-theme-primary text-slate-900 font-sans resize-none overflow-hidden"
              placeholder={notasDefault}
            />
          </div>
        ) : (
          <div className="whitespace-pre-line leading-relaxed text-[10.5px] text-slate-800">
            {notasValue}
          </div>
        )}
      </div>

      {/* ── Recuadro de Firmas (Idéntico al Ejemplo Oficial PDF) ─────────────── */}
      <table className="w-full border-collapse border border-slate-900 text-xs">
        <thead>
          <tr className="bg-slate-100 text-[11px] font-bold text-slate-900 border-b border-slate-900 print:bg-slate-100">
            <th className="w-1/2 p-1.5 border-r border-slate-900 text-left font-bold">
              Solicitado por:
            </th>
            <th className="w-1/2 p-1.5 text-left font-bold">
              Elaborado por:
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {/* Solicitado por */}
            <td className="w-1/2 p-3 border-r border-slate-900 align-top space-y-2">
              <div className="h-16 flex items-end text-slate-500 text-[11px]">
                Firma:
              </div>
              <div className="text-[11px] text-slate-950 font-normal">
                Nombre Apellidos:
              </div>
              <div className="text-[11px] text-slate-950 font-normal">
                Cargo:
              </div>
            </td>

            {/* Elaborado por */}
            <td className="w-1/2 p-3 align-top space-y-2">
              <div className="h-16 flex items-end text-slate-500 text-[11px]">
                Firma:
              </div>
              <div className="text-[11px] text-slate-950 font-normal">
                Nombre Apellidos:
              </div>
              <div className="text-[11px] text-slate-950 font-normal">
                Cargo:
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
