import React from 'react';
import { ShieldCheck, RefreshCw, Download } from 'lucide-react';
import { PageHeader, Button } from '../../../components/commons';

interface AuditoriaHeaderProps {
  onRefresh: () => void;
  onExport: () => void;
  refreshing: boolean;
  totalLogsCount: number;
}

export const AuditoriaHeader: React.FC<AuditoriaHeaderProps> = ({
  onRefresh,
  onExport,
  refreshing,
  totalLogsCount,
}) => {
  return (
    <PageHeader
      icon={<ShieldCheck size={28} className="text-brand-500" />}
      title="Auditoría Integral y Trazabilidad Operativa"
      subtitle="Supervisión institucional, bitácora de eventos y flujo de trabajo por servidor público"
      tag="Superadministración"
      extraInfo={`${totalLogsCount.toLocaleString()} registros consolidados`}
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-1.5"
            title="Exportar bitácora a formato CSV compatible con Excel"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Exportar Bitácora</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            loading={refreshing}
            className="flex items-center gap-1.5"
            title="Sincronizar y recargar registros de auditoría"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      }
    />
  );
};
