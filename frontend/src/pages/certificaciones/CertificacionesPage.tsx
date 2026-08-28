import { FileText, Printer, Download } from 'lucide-react';

export default function CertificacionesPage() {
  return (
    <div className="flex-1 p-8 overflow-auto h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-theme-main">Certificaciones POA</h1>
              <p className="text-xs text-theme-muted">Generación y vista previa de certificaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border text-theme-main hover:bg-theme-border/50 transition-colors">
              <Printer size={15} /> Imprimir
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-theme-primary text-theme-primaryText shadow-sm hover:opacity-90 transition-opacity">
              <Download size={15} /> Descargar PDF
            </button>
          </div>
        </div>

        {/* Vista previa "Hoja" tipo PDF */}
        <div className="bg-white text-black p-10 md:p-14 shadow-lg rounded-sm border border-gray-200 text-sm font-sans relative">
          
          <div className="flex justify-between items-start mb-6 text-xs font-semibold">
            <span>La Paz, junio 10, 2026*</span>
            <span>Versión 1: 2026*</span>
          </div>

          <div className="text-center font-bold mb-6 text-base leading-tight">
            <p>EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR</p>
            <p>UNIDAD DE PLANIFICACIÓN Y CONTROL DE GESTIÓN</p>
            <p className="text-lg mt-2 underline">CERTIFICACIÓN POA</p>
          </div>

          <table className="w-full border-collapse border border-black text-xs mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-1/2">Nº Oficio de Solicitud*</th>
                <th className="border border-black p-2 w-1/2">Nº Certificación POA*</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center">
                <td className="border border-black p-2">GCIA.OPS.EPTAM. Stría Nº 221/26*</td>
                <td className="border border-black p-2 font-bold">UPLANIF.EPTAM.CP. Nº 164/2026*</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black text-xs mb-6 font-bold">
            <tbody>
              <tr>
                <td className="border border-black p-2 w-1/3 bg-gray-100 uppercase">Unidad Solicitante:</td>
                <td className="border border-black p-2 uppercase">GERENCIA DE OPERACIONES*</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs mb-2">
            La solicitud se encuentra programada en el Plan Operativo Anual (POA) 2026 de acuerdo al siguiente detalle:
          </p>

          <table className="w-full border-collapse border border-black text-xs mb-6">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold w-16 align-top">4.1*</td>
                <td className="border border-black p-2 font-bold w-48 align-top">ACCIÓN DE MEDIANO PLAZO (PEE)</td>
                <td className="border border-black p-2 align-top">Incrementar en 10 rutas aéreas en operación, mecanismos de control de seguridad operacional a nivel Nacional.*</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top">4.1.1*</td>
                <td className="border border-black p-2 font-bold align-top">ACCIÓN DE CORTO PLAZO (POA)</td>
                <td className="border border-black p-2 align-top">Ejecutar en 10 rutas aéreas el programa de control de seguridad operacional a nivel nacional en el año 2026.*</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top">4.1.1.4*</td>
                <td className="border border-black p-2 font-bold align-top">OPERACIÓN</td>
                <td className="border border-black p-2 align-top">Planificar las inspecciones a las Jefaturas de Aeropuerto de todas las estaciones de EPTAM, de acuerdo a Normativa y Procedimientos vigentes.*</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold align-top">210.0.0*</td>
                <td className="border border-black p-2 font-bold align-top">CATEGORÍA PROGRAMÁTICA</td>
                <td className="border border-black p-2 align-top">Programas de Producción y/o Servicios - Operaciones Flota EP-TAM*</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black text-xs mb-8">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold uppercase w-1/3 bg-gray-100">Partida Presupuestaria</td>
                <td className="border border-black p-2">25220 Consultores Individuales de Línea*</td>
              </tr>
            </tbody>
          </table>

          <div className="text-xs mb-10 space-y-3 text-justify">
            <p>
              <span className="font-bold">Notas:</span> El presente documento da a conocer únicamente que la solicitud en mención se encuentra programada en alineación a la Acción de Mediano Plazo (PEE) y la Acción de Corto Plazo (POA) registrados en el Plan Operativo Anual 2026.
            </p>
            <p>
              Los aspectos presupuestarios y de contratación corresponden al área solicitante y se encuentran en el marco de las atribuciones y competencias de la Gerencia de Asuntos Administrativos EPTAM y sus instancias correspondientes según el D.S. Nº 0181 y normativa vigente relacionada.
            </p>
          </div>

          <table className="w-full border-collapse border border-black text-xs text-center">
            <tbody>
              <tr>
                <td className="border border-black p-4 w-1/2 align-top">
                  <p className="font-bold text-left mb-16">Solicitado por:</p>
                  <div className="w-3/4 mx-auto border-t border-black mb-1"></div>
                  <p>Firma:</p>
                  <p>Nombre Apellidos:*</p>
                  <p>Cargo:*</p>
                </td>
                <td className="border border-black p-4 w-1/2 align-top">
                  <p className="font-bold text-left mb-16">Elaborado por:</p>
                  <div className="w-3/4 mx-auto border-t border-black mb-1"></div>
                  <p>Firma:</p>
                  <p>Nombre Apellidos:*</p>
                  <p>Cargo:*</p>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="absolute top-4 right-4 text-[10px] text-gray-400 italic">
            * Datos quemados / de prueba
          </div>
        </div>
      </div>
    </div>
  );
}
