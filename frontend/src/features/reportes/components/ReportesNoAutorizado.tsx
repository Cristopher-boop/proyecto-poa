import React from 'react';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/commons/Button';

export const ReportesNoAutorizado: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-theme-border bg-theme-surface p-8 text-center shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={36} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            Acceso Restringido
          </span>
          <h2 className="text-xl font-bold text-theme-main font-display">
            Módulo de Reportería Institucional
          </h2>
          <p className="text-sm text-theme-muted leading-relaxed">
            La generación y visualización masiva de reportes presupuestarios está reservada exclusivamente para los roles de <strong>Gerencia, Planificación, Presupuestos y Dirección Institucional</strong>.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-theme-base/60 border border-theme-border text-left text-xs text-theme-muted space-y-1">
          <div className="flex items-center gap-2 font-semibold text-theme-main">
            <Building2 size={14} className="text-theme-primary" />
            <span>Política de Seguridad POA:</span>
          </div>
          <p>
            Los roles de <em>Elaborador</em> y <em>Trabajador</em> gestionan formulaciones y ejecuciones operativas desde sus secciones correspondientes.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Volver al Dashboard</span>
        </Button>
      </div>
    </div>
  );
};
