import { CertificacionPOA } from '../../../types/certificacion';
import {
  ValoresEdicionDocumento,
  formatFechaCertificacion,
  cleanOficioSolicitud,
  getJerarquiaNumerica,
} from '../components/CertificacionDocumentoOficial';

export function generarHtmlCertificacion(
  certificacion: CertificacionPOA,
  valoresEdicion?: ValoresEdicionDocumento
): string {
  const gestionAnio = certificacion.gestion_anio || new Date().getFullYear();
  const fechaTexto = formatFechaCertificacion(certificacion.fecha);
  const versionTexto = certificacion.version || `Versión 1:\n${gestionAnio}`;

  const opDetalle = certificacion.operaciones_detalle?.[0];

  const rawProgCod =
    valoresEdicion?.programa_codigo ||
    opDetalle?.programa_codigo ||
    certificacion.jerarquia_resumen?.programas?.[0]?.codigo ||
    '';
  const rawAmpCod =
    valoresEdicion?.amp_codigo ||
    opDetalle?.amp_codigo ||
    certificacion.jerarquia_resumen?.amps?.[0]?.codigo ||
    '';
  const rawAcpCod =
    valoresEdicion?.acp_codigo ||
    opDetalle?.acp_codigo ||
    certificacion.jerarquia_resumen?.acps?.[0]?.codigo ||
    '';
  const rawOpCod =
    valoresEdicion?.operacion_codigo ||
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
    valoresEdicion?.amp_descripcion ||
    opDetalle?.amp_descripcion ||
    certificacion.jerarquia_resumen?.amps?.[0]?.descripcion ||
    'Incrementar mecanismos de control y eficiencia operacional a nivel Nacional.';

  const acpDescripcion =
    valoresEdicion?.acp_descripcion ||
    opDetalle?.acp_descripcion ||
    certificacion.jerarquia_resumen?.acps?.[0]?.descripcion ||
    `Ejecutar las acciones estratégicas programadas para la gestión fiscal ${gestionAnio}.`;

  const operacionDescripcion =
    valoresEdicion?.operacion_descripcion ||
    opDetalle?.descripcion ||
    certificacion.jerarquia_resumen?.operaciones?.[0]?.descripcion ||
    certificacion.concepto_gasto ||
    'Operación institucional programada en el Plan Operativo Anual.';

  const progCodigo =
    valoresEdicion?.programa_codigo ||
    opDetalle?.programa_codigo ||
    certificacion.jerarquia_resumen?.programas?.[0]?.codigo ||
    '210.0.0';
  const progNombre =
    opDetalle?.programa_nombre ||
    certificacion.jerarquia_resumen?.programas?.[0]?.nombre ||
    'Programas de Producción y/o Servicios Institucionales EPTAM';

  const partidaCodigo =
    valoresEdicion?.partida_codigo !== undefined
      ? valoresEdicion.partida_codigo
      : certificacion.partida_codigo || '';
  const partidaNombre =
    valoresEdicion?.partida_nombre !== undefined
      ? valoresEdicion.partida_nombre
      : certificacion.partida_nombre ||
        certificacion.partida_literal ||
        'Partida de Gasto Presupuestario';
  const partidaCompleta = partidaCodigo ? `${partidaCodigo} ${partidaNombre}` : partidaNombre;

  const catProgCodigo =
    (valoresEdicion?.categoria_programatica_codigo ?? certificacion.categoria_programatica_codigo) ||
    progCodigo;

  const catProgNombre =
    (valoresEdicion?.categoria_programatica ?? certificacion.categoria_programatica) ||
    progNombre;

  const notasDefault =
    `Notas: El presente documento da a conocer únicamente que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) registrados en el Plan Operativo Anual ${gestionAnio}.\n\nLos aspectos presupuestarios y de contratación corresponden al área solicitante y se encuentran en el marco de las atribuciones y competencias de la Gerencia de Asuntos Administrativos EPTAM y sus instancias correspondientes según el D.S. Nº 0181 y normativa vigente relacionada.`;

  const notasValue =
    (valoresEdicion?.notas !== undefined && valoresEdicion.notas !== null
      ? valoresEdicion.notas
      : certificacion.notas) || notasDefault;

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

  const areaNombre = certificacion.area_nombre || 'GERENCIA SOLICITANTE';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Certificación POA — ${codigoCertValue || certificacion.hoja_ruta}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 8mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5px;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 4px 6px;
      line-height: 1.35;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .header-top .version {
      text-align: right;
      font-weight: bold;
      white-space: pre-line;
      line-height: 1.2;
    }
    .title-block {
      text-align: center;
      margin: 2px 0 6px 0;
    }
    .title-block h1 {
      font-size: 12.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 2px 0;
    }
    .title-block h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 3px 0;
    }
    .title-block h3 {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0;
    }
    .divider {
      width: 100%;
      height: 1.5px;
      background-color: #000000;
      margin: 6px 0 8px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 7px;
    }
    th, td {
      border: 1px solid #000000;
      padding: 4.5px 6.5px;
      vertical-align: middle;
      color: #000000;
    }
    .th-header {
      background-color: #f1f5f9 !important;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.3px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    
    .intro-cell {
      padding: 6px 8px;
      font-size: 10.5px;
      font-weight: normal;
      line-height: 1.4;
      background-color: #ffffff;
      border: 1px solid #000000;
      border-bottom: none;
    }
    .align-top { vertical-align: top; }
    .label-col {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      background-color: #ffffff;
    }
    .desc-cell {
      font-size: 10.5px;
      line-height: 1.35;
    }
    .notes-section {
      font-size: 10px;
      line-height: 1.45;
      margin: 8px 0 10px 0;
      white-space: pre-line;
      color: #000000;
      text-align: justify;
    }
    .firmas-table {
      margin-top: 8px;
      page-break-inside: avoid;
    }
    .firmas-table th {
      background-color: #f1f5f9 !important;
      font-size: 10px;
      font-weight: bold;
      text-align: left;
      padding: 4px 6px;
    }
    .firmas-table td {
      height: 75px;
      vertical-align: top;
      padding: 5px 7px;
    }
    .signature-space {
      height: 40px;
      display: flex;
      align-items: flex-end;
      color: #555555;
      font-size: 10px;
      margin-bottom: 3px;
    }
    .field-row {
      font-size: 10px;
      color: #000000;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <!-- Encabezado Superior: Fecha y Versión -->
  <div class="header-top">
    <div>${fechaTexto}</div>
    <div class="version">${versionTexto}</div>
  </div>

  <!-- Título Central Institucional -->
  <div class="title-block">
    <h1>EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR</h1>
    <h2>UNIDAD DE PLANIFICACIÓN Y CONTROL DE GESTIÓN</h2>
    <h3>CERTIFICACIÓN POA</h3>
  </div>

  <div class="divider"></div>

  <!-- Tabla 1: Oficio de Solicitud y Certificación POA -->
  <table>
    <thead>
      <tr>
        <th class="th-header text-center" style="width: 50%;">Nº Oficio de Solicitud</th>
        <th class="th-header text-center" style="width: 50%;">Nº Certificación POA</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center font-mono font-bold" style="width: 50%;">
          ${oficioValue || certificacion.hoja_ruta || 'Pendiente de emisión'}
        </td>
        <td class="text-center font-mono font-bold" style="width: 50%;">
          ${codigoCertValue || 'Pendiente de emisión'}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Tabla 2: Unidad Solicitante -->
  <table>
    <tbody>
      <tr>
        <td class="th-header" style="width: 35%; font-weight: 800;">
          UNIDAD SOLICITANTE:
        </td>
        <td class="font-bold uppercase" style="width: 65%;">
          ${areaNombre}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Párrafo / Encabezado de Alineación POA y Tabla 3 -->
  <div class="intro-cell">
    La solicitud se encuentra programada en el Plan Operativo Anual (POA) ${gestionAnio} de acuerdo al siguiente detalle:
  </div>
  <table style="margin-top: 0;">
    <tbody>
      <!-- Fila 1: PEE -->
      <tr>
        <td class="text-center font-mono font-bold" style="width: 14%;">
          ${ampNum}
        </td>
        <td class="label-col" style="width: 36%;">
          ACCIÓN DE MEDIANO PLAZO (PEE)
        </td>
        <td class="desc-cell" style="width: 50%;">
          ${ampDescripcion}
        </td>
      </tr>
      <!-- Fila 2: POA -->
      <tr>
        <td class="text-center font-mono font-bold" style="width: 14%;">
          ${acpNum}
        </td>
        <td class="label-col" style="width: 36%;">
          ACCIÓN DE CORTO PLAZO (POA)
        </td>
        <td class="desc-cell" style="width: 50%;">
          ${acpDescripcion}
        </td>
      </tr>
      <!-- Fila 3: OPERACIÓN -->
      <tr>
        <td class="text-center font-mono font-bold" style="width: 14%;">
          ${opNum}
        </td>
        <td class="label-col" style="width: 36%;">
          OPERACIÓN
        </td>
        <td class="desc-cell" style="width: 50%;">
          ${operacionDescripcion}
        </td>
      </tr>
      <!-- Fila 4: CATEGORÍA PROGRAMÁTICA -->
      <tr>
        <td class="text-center font-mono font-bold" style="width: 14%;">
          ${catProgCodigo}
        </td>
        <td class="label-col" style="width: 36%;">
          CATEGORÍA PROGRAMÁTICA
        </td>
        <td class="desc-cell" style="width: 50%;">
          ${catProgNombre}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Tabla 4: Partida Presupuestaria -->
  <table>
    <tbody>
      <tr>
        <td class="th-header" style="width: 35%; font-weight: 800;">
          PARTIDA PRESUPUESTARIA
        </td>
        <td class="font-bold" style="width: 65%;">
          ${partidaCompleta}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Notas Legales Institucionales -->
  <div class="notes-section">${notasValue}</div>

  <!-- Recuadro de Firmas Oficial -->
  <table class="firmas-table">
    <thead>
      <tr>
        <th style="width: 50%;">Solicitado por:</th>
        <th style="width: 50%;">Elaborado por:</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="width: 50%;">
          <div class="signature-space">Firma:</div>
          <div class="field-row">Nombre Apellidos:</div>
          <div class="field-row">Cargo:</div>
        </td>
        <td style="width: 50%;">
          <div class="signature-space">Firma:</div>
          <div class="field-row">Nombre Apellidos:</div>
          <div class="field-row">Cargo:</div>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Imprime la Certificación POA en un iframe aislado con resolución 1:1,
 * evitando interferencia de temas oscuros, estilos globales o overlays modales.
 */
export function imprimirCertificacion(
  certificacion: CertificacionPOA,
  valoresEdicion?: ValoresEdicionDocumento
) {
  const html = generarHtmlCertificacion(certificacion, valoresEdicion);

  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Dejar que el DOM del iframe se pinte completamente antes de abrir el cuadro de diálogo
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 250);
}
