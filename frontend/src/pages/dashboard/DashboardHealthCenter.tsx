import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowUpRight,
  FileText,
  FileCheck2,
  ArrowRightLeft,
} from 'lucide-react';
import { PresupuestoArea, MemoriaCalculo, Gestion } from '../../services/presupuestoService';
import { CertificacionPOA } from '../../types/certificacion';

interface DashboardHealthCenterProps {
  activeGestion: Gestion | null;
  presupuestosCalculados: (PresupuestoArea & {
    monto_ejecutado_periodo: number;
    monto_disponible_periodo: number;
    porcentaje_ejecucion_periodo: number;
  })[];
  memorias: MemoriaCalculo[];
  certificaciones: CertificacionPOA[];
  traspasosCount: number;
  pctEjecucionGlobal: number;
  mesHasta: number;
  formatMoney: (val: number | string) => string;
}

export const DashboardHealthCenter: React.FC<DashboardHealthCenterProps> = ({
  activeGestion,
  presupuestosCalculados,
  memorias,
  certificaciones,
  traspasosCount,
  pctEjecucionGlobal,
  mesHasta,
  formatMoney,
}) => {
  const navigate = useNavigate();

  // 1. Diagnóstico de Salud Presupuestaria Institucional (Lenguaje no técnico y sin bordes estridentes)
  const salud = useMemo(() => {
    const metaEsperada = (mesHasta / 12) * 100;
    const diff = pctEjecucionGlobal - metaEsperada;

    if (diff >= -15 && diff <= 15) {
      return {
        estado: 'Al Día / Normal',
        color: 'emerald',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        mensaje: 'El gasto presupuestario avanza al ritmo esperado según el calendario del año.',
      };
    } else if (diff < -15) {
      return {
        estado: 'Gasto Lento / Menor al Programado',
        color: 'amber',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        mensaje: 'El nivel de gasto está por debajo de lo previsto para esta fecha del año.',
      };
    } else {
      return {
        estado: 'Gasto Acelerado',
        color: 'blue',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
        mensaje: 'Se ha gastado más rápido que el promedio programado; vigilar saldo restante.',
      };
    }
  }, [pctEjecucionGlobal, mesHasta]);

  // 2. Detección de Alertas Tempranas por Área con enlace directo
  const alertasAreas = useMemo(() => {
    const list: {
      tipo: 'subejecucion' | 'saldo_critico';
      areaId: number;
      codigo: string;
      nombre: string;
      mensaje: string;
      valor: string;
    }[] = [];

    presupuestosCalculados.forEach((p) => {
      const inicial = parseFloat(p.monto_inicial || '0');
      if (inicial <= 0) return;

      // Saldo bajo (< 10% disponible)
      const ratioDisponible = p.monto_disponible_periodo / inicial;
      if (ratioDisponible < 0.1 && p.monto_ejecutado_periodo > 0) {
        list.push({
          tipo: 'saldo_critico',
          areaId: p.area,
          codigo: p.area_codigo,
          nombre: p.area_nombre,
          mensaje: 'Saldo restante menor al 10%',
          valor: `${formatMoney(p.monto_disponible_periodo)} libre`,
        });
      }

      // Gasto lento severo (< 10% gastado a partir de mitad de año)
      if (mesHasta >= 6 && inicial >= 50000 && p.porcentaje_ejecucion_periodo < 10) {
        list.push({
          tipo: 'subejecucion',
          areaId: p.area,
          codigo: p.area_codigo,
          nombre: p.area_nombre,
          mensaje: 'Bajo avance de gasto para el periodo',
          valor: `${p.porcentaje_ejecucion_periodo}% gastado`,
        });
      }
    });

    return list.slice(0, 4);
  }, [presupuestosCalculados, mesHasta, formatMoney]);

  // 3. Mesa de Control: Trámites en Curso
  const tramites = useMemo(() => {
    const memList = Array.isArray(memorias) ? memorias : [];
    const certList = Array.isArray(certificaciones) ? certificaciones : [];

    const memoriasEnRevision = memList.filter((m) =>
      ['PENDIENTE_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado)
    ).length;

    const certsPendientes = certList.filter((c) => c.estado === 'PENDIENTE_PLANIFICACION').length;

    return {
      memoriasEnRevision,
      certsPendientes,
      traspasosTotal: traspasosCount,
    };
  }, [memorias, certificaciones, traspasosCount]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Barómetro de Salud Institucional */}
      <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-theme-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-theme-base/60 text-theme-main border border-theme-border">
                <ShieldAlert size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-theme-main">
                Estado del Presupuesto
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${salud.badgeClass}`}>
              {salud.estado}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            <p className="text-xs text-theme-muted leading-relaxed">{salud.mensaje}</p>

            <div className="p-3 rounded-xl bg-theme-base/40 border border-theme-border flex items-center justify-between text-xs">
              <span className="text-theme-muted font-medium">Gasto Global Real:</span>
              <strong className="text-theme-main font-bold text-sm">{pctEjecucionGlobal}%</strong>
            </div>

            <div className="p-3 rounded-xl bg-theme-base/40 border border-theme-border flex items-center justify-between text-xs">
              <span className="text-theme-muted font-medium">Meta sugerida a Mes {mesHasta}:</span>
              <strong className="text-theme-main font-bold text-sm">
                {Math.round((mesHasta / 12) * 100)}%
              </strong>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-theme-border text-[11px] text-theme-muted flex items-center justify-between">
          <span>Gestión {activeGestion?.anio || ''}</span>
          <span className="text-theme-muted font-medium">Evaluación continua</span>
        </div>
      </div>

      {/* 2. Radar de Alertas Tempranas con navegación directa a la Gerencia */}
      <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-theme-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <AlertTriangle size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-theme-main">
                Alertas por Gerencia ({alertasAreas.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold text-theme-muted">Atención Requerida</span>
          </div>

          <div className="mt-3 space-y-2">
            {alertasAreas.length === 0 ? (
              <div className="py-6 text-center text-xs text-theme-muted flex flex-col items-center gap-1.5">
                <CheckCircle2 size={24} className="text-emerald-500 opacity-80" />
                <p>Todas las áreas operan sin saldo crítico ni retrasos severos.</p>
              </div>
            ) : (
              alertasAreas.map((alerta, idx) => (
                <div
                  key={`alerta-${idx}`}
                  onClick={() => navigate(`/presupuestos?area=${alerta.areaId}`)}
                  className="p-2.5 rounded-xl bg-theme-base/40 hover:bg-theme-base/70 border border-theme-border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs group"
                  title={`Clic para inspeccionar ${alerta.nombre}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                        {alerta.codigo}
                      </span>
                      <span className="font-bold text-theme-main truncate text-[11px] group-hover:text-amber-500 transition-colors">
                        {alerta.nombre}
                      </span>
                    </div>
                    <p className="text-[10px] text-theme-muted truncate mt-0.5">{alerta.mensaje}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold text-rose-500">
                      {alerta.valor}
                    </span>
                    <ArrowUpRight size={13} className="text-theme-muted group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-theme-border flex items-center justify-between text-xs">
          <span className="text-theme-muted text-[11px]">Monitoreo automático</span>
          <span className="text-[11px] text-theme-muted">Clic para ver área</span>
        </div>
      </div>

      {/* 3. Mesa de Control: Trámites en Curso */}
      <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-theme-border">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-theme-base/60 text-theme-main border border-theme-border">
                <Clock size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-theme-main">
                Trámites en Curso
              </h3>
            </div>
            <span className="text-[10px] font-bold text-theme-muted">Flujo POA</span>
          </div>

          <div className="mt-3 space-y-2">
            {/* Memorias en Revisión */}
            <div
              onClick={() => navigate('/memorias')}
              className="p-2.5 rounded-xl bg-theme-base/40 hover:bg-theme-base/70 border border-theme-border cursor-pointer transition-all flex items-center justify-between group"
              title="Ir al módulo de Memorias"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <FileText size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-main group-hover:text-amber-500 transition-colors">
                    Memorias en Revisión
                  </p>
                  <p className="text-[10px] text-theme-muted">Esperando visto bueno formal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-theme-main px-2.5 py-0.5 rounded-full bg-theme-base border border-theme-border">
                  {tramites.memoriasEnRevision}
                </span>
                <ArrowRight size={13} className="text-theme-muted group-hover:text-amber-500 transition-colors" />
              </div>
            </div>

            {/* Certificaciones POA Pendientes */}
            <div
              onClick={() => navigate('/certificaciones')}
              className="p-2.5 rounded-xl bg-theme-base/40 hover:bg-theme-base/70 border border-theme-border cursor-pointer transition-all flex items-center justify-between group"
              title="Ir al módulo de Certificaciones POA"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <FileCheck2 size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-main group-hover:text-indigo-400 transition-colors">
                    Certificaciones Pendientes
                  </p>
                  <p className="text-[10px] text-theme-muted">Pendientes de aprobación</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-theme-main px-2.5 py-0.5 rounded-full bg-theme-base border border-theme-border">
                  {tramites.certsPendientes}
                </span>
                <ArrowRight size={13} className="text-theme-muted group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>

            {/* Traspasos de Recursos */}
            <div
              onClick={() => navigate('/traspasos')}
              className="p-2.5 rounded-xl bg-theme-base/40 hover:bg-theme-base/70 border border-theme-border cursor-pointer transition-all flex items-center justify-between group"
              title="Ir al módulo de Modificaciones Presupuestarias"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <ArrowRightLeft size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-main group-hover:text-amber-400 transition-colors">
                    Traspasos de Recursos
                  </p>
                  <p className="text-[10px] text-theme-muted">Modificaciones intra-área</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-theme-main px-2.5 py-0.5 rounded-full bg-theme-base border border-theme-border">
                  {tramites.traspasosTotal}
                </span>
                <ArrowRight size={13} className="text-theme-muted group-hover:text-amber-400 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-theme-border text-[11px] text-theme-muted flex items-center justify-between">
          <span>Acceso directo</span>
          <span className="text-theme-muted font-medium">Navegación al módulo</span>
        </div>
      </div>
    </div>
  );
};
