import React, { useMemo, useState } from 'react';
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
  Calendar,
  Lock,
} from 'lucide-react';
import { PresupuestoArea, MemoriaCalculo, Gestion } from '../../services/presupuestoService';
import { CertificacionPOA } from '../../types/certificacion';
import { useAuth } from '../../hooks/useAuth';
import { alertService } from '../../utils/alerts';

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

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
  const { user } = useAuth();

  // Control de permisos por rol institucional o área asignada
  const rolClean = String(user?.rol_nombre || '').toUpperCase();
  const isGlobalRole =
    Boolean(user?.is_superuser) ||
    ['ADMIN', 'PRESUPUEST', 'APROBAD', 'PLANIFIC', 'TESORER', 'FINAN'].some((k) =>
      rolClean.includes(k)
    );
  const userAreaId = user?.area_id ?? null;

  const canInspectArea = (targetAreaId: number) => {
    return isGlobalRole || (userAreaId !== null && Number(userAreaId) === Number(targetAreaId));
  };

  const handleNavigateArea = (areaId: number, areaNombre: string) => {
    if (canInspectArea(areaId)) {
      navigate(`/presupuestos?area=${areaId}`);
    } else {
      alertService.warning(
        'Acceso Restringido',
        `Solo puedes consultar los detalles y partidas presupuestarias de tu propia área (${user?.area_nombre || 'asignada'}).`
      );
    }
  };

  // Control de acceso directo al dictamen de certificaciones pendientes
  const canDirectCertAccess =
    Boolean(user?.is_superuser) ||
    ['ADMIN', 'PRESUPUEST', 'APROBAD', 'PLANIFIC', 'TESORER', 'FINAN'].some((k) =>
      rolClean.includes(k)
    );

  const handleNavigateCertificaciones = () => {
    if (canDirectCertAccess) {
      navigate('/certificaciones');
    } else {
      alertService.info(
        'Panel Informativo POA',
        'El detalle técnico y aprobación de certificaciones en curso está reservado para Planificación, Presupuestos y Tesorería. Tu rol puede monitorear el total en trámite en este indicador.'
      );
    }
  };

  // Mes actual del sistema (1 a 12)
  const currentRealMonth = useMemo(() => {
    const m = new Date().getMonth() + 1;
    return m >= 1 && m <= 12 ? m : 10;
  }, []);

  // Mes evaluado interactivo (inicia con el mes actual de la fecha real)
  const [mesEvaluado, setMesEvaluado] = useState<number>(currentRealMonth);

  // 1. Diagnóstico de Salud Presupuestaria Institucional (Interactivo con el mes actual)
  const salud = useMemo(() => {
    const metaEsperada = (mesEvaluado / 12) * 100;
    const diff = pctEjecucionGlobal - metaEsperada;

    if (diff >= -15 && diff <= 15) {
      return {
        estado: 'Al Día / Normal',
        color: 'emerald',
        badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        mensaje: 'El gasto presupuestario avanza al ritmo esperado según el calendario institucional.',
        diff,
        metaEsperada,
      };
    } else if (diff < -15) {
      return {
        estado: 'Gasto Lento / Menor al Programado',
        color: 'amber',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        mensaje: 'El nivel de gasto está por debajo de lo previsto para esta fecha del año.',
        diff,
        metaEsperada,
      };
    } else {
      return {
        estado: 'Gasto Acelerado',
        color: 'blue',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
        mensaje: 'Se ha ejecutado a mayor velocidad que el promedio programado; vigilar saldo restante.',
        diff,
        metaEsperada,
      };
    }
  }, [pctEjecucionGlobal, mesEvaluado]);

  // 2. Detección de Alertas Tempranas por Área
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

            {/* Selector interactivo de mes evaluado */}
            <div className="p-2.5 rounded-xl bg-theme-base/40 border border-theme-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-theme-muted shrink-0" />
                <span className="text-theme-muted font-medium text-[11px]">Mes evaluado:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={mesEvaluado}
                  onChange={(e) => setMesEvaluado(Number(e.target.value))}
                  className="text-xs font-bold text-theme-main bg-theme-surface border border-theme-border rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-theme-primary transition-colors"
                  aria-label="Seleccionar mes para evaluar ritmo de gasto"
                >
                  {NOMBRES_MESES.map((nombre, i) => (
                    <option key={i + 1} value={i + 1}>
                      {nombre} {i + 1 === currentRealMonth ? '(Actual)' : `(Mes ${i + 1})`}
                    </option>
                  ))}
                </select>
                {mesEvaluado !== currentRealMonth && (
                  <button
                    type="button"
                    onClick={() => setMesEvaluado(currentRealMonth)}
                    className="text-[10px] text-theme-primary hover:underline font-bold px-1.5 py-0.5 cursor-pointer"
                    title="Restablecer al mes actual real"
                  >
                    Actual
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-theme-base/40 border border-theme-border flex items-center justify-between text-xs">
              <span className="text-theme-muted font-medium">Gasto Global Real:</span>
              <strong className="text-theme-main font-bold text-sm">{pctEjecucionGlobal}%</strong>
            </div>

            <div className="p-3 rounded-xl bg-theme-base/40 border border-theme-border flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="text-theme-muted font-medium text-[11px]">
                  Meta a {NOMBRES_MESES[mesEvaluado - 1]}:
                </span>
                <span className="text-[10px] font-semibold text-theme-muted">
                  {salud.diff >= 0 ? `+${salud.diff.toFixed(1)}% vs meta` : `${salud.diff.toFixed(1)}% vs meta`}
                </span>
              </div>
              <strong className="text-theme-main font-bold text-sm">
                {Math.round(salud.metaEsperada)}%
              </strong>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-theme-border text-[11px] text-theme-muted flex items-center justify-between">
          <span>Gestión {activeGestion?.anio || new Date().getFullYear()}</span>
          <span className="text-theme-muted font-medium">
            {mesEvaluado === currentRealMonth ? 'Fecha actual del sistema' : `Evaluado al mes ${mesEvaluado}`}
          </span>
        </div>
      </div>

      {/* 2. Radar de Alertas Tempranas (Nombres limpios sin códigos y con validación de acceso) */}
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
              alertasAreas.map((alerta, idx) => {
                const canAccess = canInspectArea(alerta.areaId);

                return (
                  <div
                    key={`alerta-${idx}`}
                    onClick={() => handleNavigateArea(alerta.areaId, alerta.nombre)}
                    className="p-2.5 rounded-xl bg-theme-base/40 hover:bg-theme-base/70 border border-theme-border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs group"
                    title={
                      canAccess
                        ? `Clic para inspeccionar partidas de ${alerta.nombre}`
                        : `Acceso restringido: detalle reservado para ${alerta.nombre}`
                    }
                  >
                    <div className="min-w-0">
                      {/* Nombre limpio de la Gerencia sin códigos técnicos para reducir carga visual */}
                      <span className="font-bold text-theme-main truncate text-xs block group-hover:text-amber-500 transition-colors">
                        {alerta.nombre}
                      </span>
                      <p className="text-[10px] text-theme-muted truncate mt-0.5">{alerta.mensaje}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-bold text-rose-500">
                        {alerta.valor}
                      </span>
                      {canAccess ? (
                        <ArrowUpRight
                          size={13}
                          className="text-theme-muted group-hover:text-amber-500 transition-colors"
                        />
                      ) : (
                        <Lock
                          size={12}
                          className="text-theme-muted group-hover:text-rose-500 transition-colors"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-theme-border flex items-center justify-between text-xs">
          <span className="text-theme-muted text-[11px]">Monitoreo automático</span>
          <span className="text-[11px] text-theme-muted">
            {isGlobalRole ? 'Acceso global a áreas' : 'Detalles de tu área asignada'}
          </span>
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
              onClick={handleNavigateCertificaciones}
              className={`p-2.5 rounded-xl bg-theme-base/40 hover:bg-theme-base/70 border border-theme-border transition-all flex items-center justify-between group ${
                canDirectCertAccess ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={
                canDirectCertAccess
                  ? 'Ir a la bandeja de Certificaciones POA en trámite'
                  : 'Total de certificaciones en curso (Detalle reservado para Planificación, Presupuestos y Tesorería)'
              }
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <FileCheck2 size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-main group-hover:text-indigo-400 transition-colors">
                    Certificaciones Pendientes
                  </p>
                  <p className="text-[10px] text-theme-muted">
                    {canDirectCertAccess ? 'Pendientes de aprobación' : 'En evaluación por Planif. / Presup.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-theme-main px-2.5 py-0.5 rounded-full bg-theme-base border border-theme-border">
                  {tramites.certsPendientes}
                </span>
                {canDirectCertAccess ? (
                  <ArrowRight size={13} className="text-theme-muted group-hover:text-indigo-400 transition-colors" />
                ) : (
                  <Lock size={12} className="text-theme-muted" />
                )}
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
