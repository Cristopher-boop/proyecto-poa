import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { PresupuestoArea, Gasto, Gestion } from '../../services/presupuestoService';
import { useTheme } from '../../contexts/ThemeContext';

const MESES_ABR = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const COLORES_RANKING = [
  '#2563EB', // Azul
  '#059669', // Esmeralda
  '#D97706', // Ámbar
  '#7C3AED', // Violeta
  '#0891B2', // Cian
  '#DB2777', // Rosa
  '#4F46E5', // Índigo
  '#0D9488', // Verde Azulado
];

interface DashboardVisualAnalyticsProps {
  presupuestosCalculados: (PresupuestoArea & {
    monto_ejecutado_periodo: number;
    monto_disponible_periodo: number;
    porcentaje_ejecucion_periodo: number;
  })[];
  gastos: Gasto[];
  memorias?: any[];
  activeGestion: Gestion | null;
  mesDesde: number;
  mesHasta: number;
  totalInicial: number;
  formatMoney: (val: number | string) => string;
}

export const DashboardVisualAnalytics: React.FC<DashboardVisualAnalyticsProps> = ({
  presupuestosCalculados,
  gastos,
  activeGestion,
  mesDesde,
  mesHasta,
  totalInicial,
  formatMoney,
}) => {
  const { theme } = useTheme();

  // Detección reactiva del modo oscuro para invertir colores dinámicamente
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  // Colores dinámicos adaptados al tema según instrucciones del usuario:
  // Modo Claro: Barras Amarillas (#F59E0B) y Línea Azul (#2563EB)
  // Modo Oscuro: Barras Azules (#2563EB) y Línea Amarilla (#F59E0B)
  const colorBarra = isDark ? '#2563EB' : '#F59E0B';
  const colorLinea = isDark ? '#F59E0B' : '#2563EB';
  const colorGrid = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)';
  const colorTextoEje = isDark ? '#94A3B8' : '#64748B';
  const cursorFill = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';

  // Pestañas: 'flujo' (Mensual), 'distribucion' (Gastado vs Disponible), 'ranking' (Top Gerencias)
  const [tabGrafico, setTabGrafico] = useState<'flujo' | 'distribucion' | 'ranking'>('flujo');

  // 1. Datos Mensuales Reales (ComposedChart)
  const datosMensuales = useMemo(() => {
    let acumuladoProg = 0;

    return Array.from({ length: 12 }, (_, i) => {
      const mesNum = i + 1;
      let ejecutadoMes = 0;

      (Array.isArray(gastos) ? gastos : []).forEach((g) => {
        if (!g.fecha_gasto) return;
        const parts = g.fecha_gasto.split('-');
        if (parts.length >= 2 && parseInt(parts[1], 10) === mesNum) {
          ejecutadoMes += parseFloat(String(g.monto_ejecutado) || '0');
        }
      });

      acumuladoProg += ejecutadoMes;

      return {
        mesNum,
        name: MESES_ABR[i],
        ejecutado: ejecutadoMes,
        acumulado: acumuladoProg,
        enRango: mesNum >= mesDesde && mesNum <= mesHasta,
      };
    });
  }, [gastos, mesDesde, mesHasta]);

  // 2. Distribución General del Presupuesto
  const totalEjecutadoGeneral = useMemo(() => {
    return presupuestosCalculados.reduce((acc, p) => acc + (p.monto_ejecutado_periodo || 0), 0);
  }, [presupuestosCalculados]);

  const totalDisponibleGeneral = Math.max(0, totalInicial - totalEjecutadoGeneral);

  const datosDistribucionDonut = useMemo(() => {
    if (totalInicial <= 0) return [];
    return [
      {
        name: 'Presupuesto Gastado',
        value: totalEjecutadoGeneral,
        color: '#F43F5E',
      },
      {
        name: 'Saldo Disponible',
        value: totalDisponibleGeneral,
        color: '#10B981',
      },
    ];
  }, [totalInicial, totalEjecutadoGeneral, totalDisponibleGeneral]);

  // Distribución por Tipo de Estructura Organizacional
  const datosDistribucionEstructura = useMemo(() => {
    const grupos: Record<string, { nombre: string; gastado: number; inicial: number }> = {
      central: { nombre: 'Gerencias Centrales', gastado: 0, inicial: 0 },
      regional: { nombre: 'Gerencias Regionales y Agencias', gastado: 0, inicial: 0 },
      unidad: { nombre: 'Unidades Asesoras y de Apoyo', gastado: 0, inicial: 0 },
    };

    presupuestosCalculados.forEach((p) => {
      const inicial = parseFloat(p.monto_inicial || '0');
      const gastado = p.monto_ejecutado_periodo || 0;
      const codigo = (p.area_codigo || '').toUpperCase();

      if (['GAA', 'GAE', 'AE', 'GO', 'GC', 'GI', 'IF', 'SMS'].some((k) => codigo.includes(k))) {
        grupos.central.gastado += gastado;
        grupos.central.inicial += inicial;
      } else if (['EA', 'LP', 'CB', 'SC', 'CIJ', 'GYA', 'RIB', 'TDD'].some((k) => codigo.includes(k))) {
        grupos.regional.gastado += gastado;
        grupos.regional.inicial += inicial;
      } else {
        grupos.unidad.gastado += gastado;
        grupos.unidad.inicial += inicial;
      }
    });

    return Object.values(grupos).filter((g) => g.inicial > 0);
  }, [presupuestosCalculados]);

  // 3. Top Gerencias por Volumen de Gasto
  const datosRankingGrafico = useMemo(() => {
    const list = [...presupuestosCalculados]
      .filter((p) => (p.monto_ejecutado_periodo || 0) > 0)
      .sort((a, b) => (b.monto_ejecutado_periodo || 0) - (a.monto_ejecutado_periodo || 0))
      .slice(0, 7);

    return list.map((item) => ({
      id: item.area,
      codigo: item.area_codigo,
      nombre: item.area_nombre,
      ejecutado: item.monto_ejecutado_periodo || 0,
      inicial: parseFloat(item.monto_inicial || '0'),
      porcentaje: item.porcentaje_ejecucion_periodo || 0,
    }));
  }, [presupuestosCalculados]);

  const formatCompact = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return String(val);
  };

  // Tooltip personalizado para el Flujo Mensual
  const CustomTooltipFlujo = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="card p-3 bg-theme-surface/95 backdrop-blur-sm border border-theme-border rounded-xl shadow-lg text-xs space-y-1.5 z-50">
          <p className="font-bold text-theme-main border-b border-theme-border pb-1">
            Mes de {data.name} ({activeGestion?.anio || ''})
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-muted flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colorBarra }} />
              Gasto en el Mes:
            </span>
            <span className="font-bold text-theme-main font-mono">
              {formatMoney(data.ejecutado)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-muted flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorLinea }} />
              Gasto Acumulado:
            </span>
            <span className="font-bold font-mono" style={{ color: colorLinea }}>
              {formatMoney(data.acumulado)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Tooltip personalizado para el Donut
  const CustomTooltipDonut = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const pct = totalInicial > 0 ? ((d.value / totalInicial) * 100).toFixed(1) : '0';
      return (
        <div className="card p-3 bg-theme-surface/95 backdrop-blur-sm border border-theme-border rounded-xl shadow-lg text-xs space-y-1 z-50">
          <p className="font-bold text-theme-main">{d.name}</p>
          <p className="text-sm font-bold font-mono" style={{ color: d.payload.color }}>
            {formatMoney(d.value)}
          </p>
          <p className="text-[11px] text-theme-muted">{pct}% del presupuesto total</p>
        </div>
      );
    }
    return null;
  };

  // Tooltip personalizado para el Ranking
  const CustomTooltipRanking = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="card p-3 bg-theme-surface/95 backdrop-blur-sm border border-theme-border rounded-xl shadow-lg text-xs space-y-1.5 z-50">
          <div className="flex items-center gap-2 border-b border-theme-border pb-1">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
              {d.codigo}
            </span>
            <p className="font-bold text-theme-main truncate max-w-[200px]">{d.nombre}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-muted">Presupuesto Gastado:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatMoney(d.ejecutado)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-muted">Presupuesto Asignado:</span>
            <span className="font-bold text-theme-main font-mono">
              {formatMoney(d.inicial)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-theme-muted">% de Avance:</span>
            <span className="font-bold text-theme-main font-mono">{d.porcentaje}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-4">
      {/* Cabecera y Selector de Pestañas con estilo sólido original */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-theme-base/60 text-theme-main border border-theme-border">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-theme-main font-display">
              Análisis Visual del Presupuesto
            </h3>
            <p className="text-xs text-theme-muted">
              Comportamiento mensual, flujo de fondos y ranking institucional
            </p>
          </div>
        </div>

        {/* Pestañas de Vista: Minimenu de opciones limpio como antes */}
        <div className="flex items-center bg-theme-base/60 p-1 rounded-xl border border-theme-border text-xs font-semibold">
          <button
            onClick={() => setTabGrafico('flujo')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              tabGrafico === 'flujo'
                ? 'bg-theme-primary text-theme-primaryText font-bold shadow-sm'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            <Calendar size={13} />
            <span>Flujo Mensual</span>
          </button>

          <button
            onClick={() => setTabGrafico('distribucion')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              tabGrafico === 'distribucion'
                ? 'bg-theme-primary text-theme-primaryText font-bold shadow-sm'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            <PieIcon size={13} />
            <span>Distribución de Fondos</span>
          </button>

          <button
            onClick={() => setTabGrafico('ranking')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              tabGrafico === 'ranking'
                ? 'bg-theme-primary text-theme-primaryText font-bold shadow-sm'
                : 'text-theme-muted hover:text-theme-main'
            }`}
          >
            <BarChart3 size={13} />
            <span>Ranking Gerencias</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PESTAÑA 1: FLUJO MENSUAL (COMPOSED CHART REACTIVO A TEMA) */}
      {/* ============================================================== */}
      {tabGrafico === 'flujo' && (
        <div className="space-y-3">
          {/* Leyenda y Explicación */}
          <div className="flex flex-wrap items-center justify-between text-xs text-theme-muted gap-2 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: colorBarra }} />
                <span>Gasto en el Mes</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5" style={{ backgroundColor: colorLinea }} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorLinea }} />
                <span>Gasto Acumulado</span>
              </span>
            </div>
            <span className="font-semibold text-theme-main">
              Gestión {activeGestion?.anio || ''} (Meses {mesDesde} a {mesHasta})
            </span>
          </div>

          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={datosMensuales} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid stroke={colorGrid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: colorGrid }}
                  tick={{ fontSize: 11, fill: colorTextoEje }}
                />
                <YAxis
                  yAxisId="izq"
                  orientation="left"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 10, fill: colorTextoEje }}
                />
                <YAxis
                  yAxisId="der"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 10, fill: colorTextoEje }}
                />
                <Tooltip content={<CustomTooltipFlujo />} cursor={{ fill: cursorFill }} />
                {/* Barras de Gasto Mensual */}
                <Bar
                  yAxisId="izq"
                  dataKey="ejecutado"
                  fill={colorBarra}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                >
                  {datosMensuales.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={colorBarra}
                      opacity={entry.enRango ? 1 : 0.35}
                    />
                  ))}
                </Bar>
                {/* Línea de Tendencia Acumulada */}
                <Line
                  yAxisId="der"
                  type="monotone"
                  dataKey="acumulado"
                  stroke={colorLinea}
                  strokeWidth={3}
                  dot={{ r: 4, fill: colorLinea, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: colorLinea }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 2: DISTRIBUCIÓN DEL PRESUPUESTO */}
      {/* ============================================================== */}
      {tabGrafico === 'distribucion' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Gráfico Donut de Presupuesto Gastado vs Saldo */}
          <div className="flex flex-col items-center justify-center p-3">
            <p className="text-xs font-bold text-theme-main uppercase tracking-wider mb-2">
              Proporción Gastado vs Saldo Disponible
            </p>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosDistribucionDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {datosDistribucionDonut.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipDonut />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs mt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-theme-muted">Gastado:</span>
                <strong className="text-theme-main font-mono">{formatMoney(totalEjecutadoGeneral)}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-theme-muted">Disponible:</span>
                <strong className="text-theme-main font-mono">{formatMoney(totalDisponibleGeneral)}</strong>
              </div>
            </div>
          </div>

          {/* Desglose por Estructura Organizacional sin bordes invasivos */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-theme-main uppercase tracking-wider">
              Distribución por Estructura Organizacional
            </p>
            <div className="space-y-2.5">
              {datosDistribucionEstructura.map((item, idx) => {
                const pct = item.inicial > 0 ? ((item.gastado / item.inicial) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={`est-${idx}`}
                    className="p-3 rounded-xl bg-theme-base/40 hover:bg-theme-base/70 border border-theme-border transition-colors flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-theme-main">{item.nombre}</span>
                      <span className="font-mono font-bold text-theme-main">{pct}% gastado</span>
                    </div>

                    <div className="w-full bg-theme-border/40 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-theme-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, Number(pct)))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-theme-muted">
                      <span>Gastado: <strong className="text-theme-main">{formatMoney(item.gastado)}</strong></span>
                      <span>Asignado: <strong className="text-theme-main">{formatMoney(item.inicial)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 3: RANKING DE GERENCIAS (CURSOR SUAVE SIN FONDO BLANCO) */}
      {/* ============================================================== */}
      {tabGrafico === 'ranking' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-theme-muted px-1">
            <span>Gerencias y Unidades con mayor gasto acumulado en el periodo</span>
            <span className="font-semibold text-theme-main">
              Top {datosRankingGrafico.length} Áreas
            </span>
          </div>

          {datosRankingGrafico.length === 0 ? (
            <div className="py-12 text-center text-xs text-theme-muted">
              No hay gastos registrados en el periodo seleccionado para generar el ranking.
            </div>
          ) : (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={datosRankingGrafico}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid stroke={colorGrid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatCompact}
                    tick={{ fontSize: 10, fill: colorTextoEje }}
                  />
                  <YAxis
                    dataKey="codigo"
                    type="category"
                    tick={{ fontSize: 11, fontWeight: 'bold', fill: colorTextoEje }}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltipRanking />} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="ejecutado" radius={[0, 8, 8, 0]} maxBarSize={28}>
                    {datosRankingGrafico.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.id}-${index}`}
                        fill={COLORES_RANKING[index % COLORES_RANKING.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
