import React from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../../components/commons/PageHeader';
import { Button } from '../../../components/commons/Button';
import { Gestion } from '../../../services/presupuestoService';

interface ReportesHeaderProps {
  gestionActiva: Gestion | null;
  gestiones: Gestion[];
  selectedGestionId: number | null;
  onSelectGestion: (id: number) => void;
  isGlobalRole: boolean;
  isGerente: boolean;
  userAreaNombre: string;
  loading: boolean;
  onRefresh: () => void;
  onExportCSV: () => void;
  onOpenPrint: () => void;
}

export const ReportesHeader: React.FC<ReportesHeaderProps> = ({
  gestionActiva,
  gestiones,
  selectedGestionId,
  onSelectGestion,
  isGlobalRole,
  isGerente,
  userAreaNombre,
  loading,
  onRefresh,
  onExportCSV,
  onOpenPrint,
}) => {
  return (
    <PageHeader
      icon={<FileText size={24} />}
      title="Centro Integral de Reportería POA"
      subtitle={`Consolidado macro y detallado de techos presupuestarios, memorias de cálculo, modificaciones y ejecución financiera • Gestión ${gestionActiva?.anio || '2026'}`}
      tag="Reportería Oficial"
      extraInfo={
        isGlobalRole
          ? 'Alcance: Institucional Global'
          : `Alcance: ${userAreaNombre || 'Tu Gerencia'}`
      }
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Gestión Fiscal */}
          <div className="flex items-center gap-2 bg-theme-base/80 border border-theme-border rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
              Gestión:
            </span>
            <select
              value={selectedGestionId || ''}
              onChange={(e) => onSelectGestion(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-theme-main focus:outline-none cursor-pointer"
            >
              {gestiones.map((g) => (
                <option key={g.id} value={g.id} className="bg-theme-surface text-theme-main">
                  {g.anio} ({g.estado_display || g.estado})
                </option>
              ))}
            </select>
          </div>

          {/* Actualizar datos */}
          <Button
            variant="outline"
            onClick={onRefresh}
            loading={loading}
            className="flex items-center gap-1.5"
            title="Refrescar datos de la gestión"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          {/* Exportar a CSV / Excel */}
          <Button
            variant="secondary"
            onClick={onExportCSV}
            className="flex items-center gap-1.5"
            title="Descargar tabla activa en formato Excel CSV"
          >
            <FileSpreadsheet size={15} />
            <span>Excel / CSV</span>
          </Button>

          {/* Imprimir Reporte Oficial (PDF) */}
          <Button
            variant="primary"
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 shadow-sm"
            title="Abrir vista imprimible oficial con firmas institucionales"
          >
            <Printer size={15} />
            <span>Imprimir PDF</span>
          </Button>
        </div>
      }
    >
      {/* Banner de alcance de rol si es Gerente */}
      {!isGlobalRole && isGerente && userAreaNombre && (
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-between text-xs text-theme-main">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-theme-primary shrink-0" />
            <span>
              Sesión de <strong>Gerencia</strong>: Visualizas el <strong>resumen institucional general</strong> y el <strong>desglose operativo exclusivo de tu área ({userAreaNombre})</strong>.
            </span>
          </div>
        </div>
      )}
    </PageHeader>
  );
};
