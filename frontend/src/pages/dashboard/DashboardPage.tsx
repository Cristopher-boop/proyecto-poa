import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import {
  PresupuestoArea,
  MemoriaCalculo,
  Gasto,
  Traspaso,
  getPresupuestosArea,
  getMemorias,
  getGastos,
  getTraspasos,
} from '../../services/presupuestoService';
import { certificacionService } from '../../services/certificacionService';
import { CertificacionPOA } from '../../types/certificacion';
import { useGestion } from '../../contexts/GestionContext';
import { PageHeader, GestionSelector } from '../../components/commons';
import { DashboardFiltros, MESES } from './DashboardFiltros';
import { DashboardKpis } from './DashboardKpis';
import { DashboardVisualAnalytics } from './DashboardVisualAnalytics';
import { DashboardHealthCenter } from './DashboardHealthCenter';
import { DashboardMatrixExplorer } from './DashboardMatrixExplorer';

const AREA_ORDER_WEIGHTS: Record<string, number> = {
  // 1. Gerencias Centrales / Principales
  GAA: 1,
  GAE: 2,
  AE: 2,
  GO: 3,
  GC: 4,
  GI: 5,
  IF: 5,
  SMS: 6,

  // 2. Gerencias Regionales y Agencias
  EA: 10,
  LP: 11,
  CB: 12,
  SC: 13,
  CIJ: 14,
  GYA: 15,
  RIB: 16,
  TDD: 17,

  // 3. Unidades
  PL: 20,
  UT: 21,
  AI: 22,
  AJ: 23,
  CIAC: 24,
  OD: 25,
};

function getAreaCodeShort(code?: string): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  const parts = clean.split('-');
  return parts[parts.length - 1];
}

function getAreaOrderWeight(code?: string): number {
  const shortCode = getAreaCodeShort(code);
  return AREA_ORDER_WEIGHTS[shortCode] ?? 999;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { gestiones, gestionActivaId, gestionActiva, setGestionActivaId } = useGestion();

  const [presupuestos, setPresupuestos] = useState<PresupuestoArea[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [certificaciones, setCertificaciones] = useState<CertificacionPOA[]>([]);
  const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros interactivos
  const [filtroAreaId, setFiltroAreaId] = useState<string>('todas');
  const [mesDesde, setMesDesde] = useState<number>(1);
  const [mesHasta, setMesHasta] = useState<number>(12);

  // Carga de datos multi-fuente en paralelo
  const cargarDatos = useCallback(async (gId: number) => {
    setLoading(true);
    try {
      const [pData, mData, gData, cData, tData] = await Promise.all([
        getPresupuestosArea({ gestion: gId }),
        getMemorias({ gestion: gId }),
        getGastos({ gestion: gId }),
        certificacionService.getCertificaciones({ gestion: gId }).catch(() => []),
        getTraspasos({ gestion: gId }).catch(() => []),
      ]);

      setPresupuestos(Array.isArray(pData) ? pData : []);
      setMemorias(Array.isArray(mData) ? mData : []);
      setGastos(Array.isArray(gData) ? gData : []);
      setCertificaciones(Array.isArray(cData) ? cData : []);
      setTraspasos(Array.isArray(tData) ? tData : []);
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (gestionActivaId) {
      cargarDatos(gestionActivaId);
    }
  }, [gestionActivaId, cargarDatos]);

  const formatMoney = useCallback((val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(num || 0);
  }, []);

  // Mapa de gastos por área acumulados en el rango de meses seleccionado [mesDesde, mesHasta]
  const gastosPorAreaPeriodo = useMemo(() => {
    const map: Record<number, number> = {};
    (Array.isArray(gastos) ? gastos : []).forEach((g) => {
      if (!g.fecha_gasto) return;
      const parts = g.fecha_gasto.split('-');
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        if (month >= mesDesde && month <= mesHasta) {
          const areaId = g.area_id;
          const monto = parseFloat(String(g.monto_ejecutado) || '0');
          if (areaId) {
            map[areaId] = (map[areaId] || 0) + monto;
          }
        }
      }
    });
    return map;
  }, [gastos, mesDesde, mesHasta]);

  // Lista calculada de presupuestos por área con cálculo dinámico según meses y filtro de área
  const presupuestosCalculados = useMemo(() => {
    let list = Array.isArray(presupuestos) ? presupuestos : [];

    if (filtroAreaId !== 'todas') {
      list = list.filter((p) => String(p.area) === filtroAreaId || String(p.id) === filtroAreaId);
    }

    const computedList = list.map((p) => {
      const inicial = parseFloat(p.monto_inicial || '0');
      const ejecutadoPeriodo = gastosPorAreaPeriodo[p.area] || 0;
      const disponiblePeriodo = Math.max(0, inicial - ejecutadoPeriodo);
      const porcentajePeriodo =
        inicial > 0 ? Math.round((ejecutadoPeriodo / inicial) * 10000) / 100 : 0;

      return {
        ...p,
        monto_ejecutado_periodo: ejecutadoPeriodo,
        monto_disponible_periodo: disponiblePeriodo,
        porcentaje_ejecucion_periodo: porcentajePeriodo,
      };
    });

    return computedList.sort((a, b) => {
      const weightA = getAreaOrderWeight(a.area_codigo);
      const weightB = getAreaOrderWeight(b.area_codigo);
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return (a.area_nombre || '').localeCompare(b.area_nombre || '');
    });
  }, [presupuestos, filtroAreaId, gastosPorAreaPeriodo]);

  // Totales institucionales agregados para KPIs y gráficos
  const totalInicial = useMemo(() => {
    return presupuestosCalculados.reduce((acc, p) => acc + parseFloat(p.monto_inicial || '0'), 0);
  }, [presupuestosCalculados]);

  const totalEjecutadoPeriodo = useMemo(() => {
    return presupuestosCalculados.reduce((acc, p) => acc + (p.monto_ejecutado_periodo || 0), 0);
  }, [presupuestosCalculados]);

  const totalDisponiblePeriodo = Math.max(0, totalInicial - totalEjecutadoPeriodo);
  const pctEjecucionPeriodo =
    totalInicial > 0 ? Math.round((totalEjecutadoPeriodo / totalInicial) * 10000) / 100 : 0;

  // Resumen agrupado por programas estratégicos institucionales
  const programasResumen = useMemo(() => {
    const map: Record<
      string,
      {
        id: number | string;
        codigo: string;
        nombre: string;
        total_inicial: number;
        total_ejecutado: number;
        total_disponible: number;
        porcentaje_ejecucion: number;
        areas: (PresupuestoArea & {
          monto_ejecutado_periodo: number;
          monto_disponible_periodo: number;
          porcentaje_ejecucion_periodo: number;
        })[];
      }
    > = {};

    const PROGRAMAS_ORDEN: Record<string, number> = {
      '1': 1,
      'P-1': 1,
      '2': 2,
      'P-2': 2,
      '210': 3,
      'P-210': 3,
      '410': 4,
      'P-410': 4,
    };

    presupuestosCalculados.forEach((p) => {
      let progCod = p.programa_codigo || '';
      let progNom = p.programa_nombre || '';

      if (!progCod && p.area_codigo) {
        const parts = p.area_codigo.split('-');
        if (parts.length >= 2) {
          progCod = parts[0] + '-' + parts[1];
        }
      }

      if (!progCod) progCod = 'OTRO';
      if (!progNom) {
        if (progCod.includes('1') && !progCod.includes('210') && !progCod.includes('410')) {
          progNom = 'PROGRAMA 1 - ADMINISTRACIÓN CENTRAL';
        } else if (progCod.includes('2') && !progCod.includes('210')) {
          progNom = 'PROGRAMA 2 - OPERACIONES AÉREAS';
        } else if (progCod.includes('210')) {
          progNom = 'PROGRAMA 210 - SERVICIO DE TRANSPORTE AÉREO';
        } else if (progCod.includes('410')) {
          progNom = 'PROGRAMA 410 - INFRAESTRUCTURA AERONÁUTICA';
        } else {
          progNom = `PROGRAMA ${progCod}`;
        }
      }

      if (!map[progCod]) {
        map[progCod] = {
          id: p.programa_id || progCod,
          codigo: progCod,
          nombre: progNom,
          total_inicial: 0,
          total_ejecutado: 0,
          total_disponible: 0,
          porcentaje_ejecucion: 0,
          areas: [],
        };
      }

      map[progCod].total_inicial += parseFloat(p.monto_inicial || '0');
      map[progCod].total_ejecutado += p.monto_ejecutado_periodo || 0;
      map[progCod].total_disponible += p.monto_disponible_periodo || 0;
      map[progCod].areas.push(p);
    });

    const list = Object.values(map);

    list.forEach((item) => {
      item.porcentaje_ejecucion =
        item.total_inicial > 0
          ? Math.round((item.total_ejecutado / item.total_inicial) * 10000) / 100
          : 0;
      item.areas.sort(
        (a, b) => getAreaOrderWeight(a.area_codigo) - getAreaOrderWeight(b.area_codigo)
      );
    });

    list.sort((a, b) => {
      const wA = PROGRAMAS_ORDEN[a.codigo] ?? 99;
      const wB = PROGRAMAS_ORDEN[b.codigo] ?? 99;
      return wA - wB;
    });

    return list;
  }, [presupuestosCalculados]);

  // Lista ordenada de todas las áreas disponibles para el selector de filtro
  const areasParaSelector = useMemo(() => {
    return [...presupuestos].sort((a, b) => {
      const weightA = getAreaOrderWeight(a.area_codigo);
      const weightB = getAreaOrderWeight(b.area_codigo);
      if (weightA !== weightB) return weightA - weightB;
      return (a.area_nombre || '').localeCompare(b.area_nombre || '');
    });
  }, [presupuestos]);

  const hayFiltrosActivos = filtroAreaId !== 'todas' || mesDesde !== 1 || mesHasta !== 12;

  const resetearFiltros = () => {
    setFiltroAreaId('todas');
    setMesDesde(1);
    setMesHasta(12);
  };

  const nombreMesDesde = MESES.find((m) => m.value === mesDesde)?.label || 'Enero';
  const nombreMesHasta = MESES.find((m) => m.value === mesHasta)?.label || 'Diciembre';

  if (loading && presupuestos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 space-y-3">
        <RefreshCw className="animate-spin text-theme-primary" size={32} />
        <p className="text-sm font-semibold text-theme-main">
          Cargando indicadores analíticos del POA...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* 1. Cabecera Principal Unificada */}
      <PageHeader
        icon={<LayoutDashboard size={24} />}
        title="Dashboard General POA"
        subtitle="Monitoreo estratégico en tiempo real del presupuesto, formulación de memorias y ejecución institucional."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <GestionSelector
              gestiones={gestiones}
              selectedGestionId={gestionActivaId}
              onSelectGestion={(id) => setGestionActivaId(id)}
            />
          </div>
        }
      />

      {/* 2. Barra de Filtros Analítica (Meses y Gerencias) */}
      <DashboardFiltros
        filtroAreaId={filtroAreaId}
        setFiltroAreaId={setFiltroAreaId}
        mesDesde={mesDesde}
        setMesDesde={setMesDesde}
        mesHasta={mesHasta}
        setMesHasta={setMesHasta}
        areasParaSelector={areasParaSelector}
        nombreMesDesde={nombreMesDesde}
        nombreMesHasta={nombreMesHasta}
        activeGestionAnio={gestionActiva?.anio}
        totalAreasEnAlcance={presupuestosCalculados.length}
        onReset={resetearFiltros}
        hayFiltrosActivos={hayFiltrosActivos}
      />

      {/* 3. Nivel Macro: KPIs Ejecutivos con Semáforo y Ritmo Esperado */}
      <DashboardKpis
        totalInicial={totalInicial}
        totalEjecutado={totalEjecutadoPeriodo}
        totalDisponible={totalDisponiblePeriodo}
        pctEjecucion={pctEjecucionPeriodo}
        mesDesde={mesDesde}
        mesHasta={mesHasta}
        totalAreas={presupuestosCalculados.length}
        formatMoney={formatMoney}
      />

      {/* 4. Nivel Comparativo y Tendencias: Visual Analytics Recharts */}
      <DashboardVisualAnalytics
        presupuestosCalculados={presupuestosCalculados}
        gastos={gastos}
        memorias={memorias}
        activeGestion={gestionActiva}
        mesDesde={mesDesde}
        mesHasta={mesHasta}
        totalInicial={totalInicial}
        formatMoney={formatMoney}
      />

      {/* 5. Nivel de Salud Operativa y Alertas Tempranas (Health Center) */}
      <DashboardHealthCenter
        activeGestion={gestionActiva}
        presupuestosCalculados={presupuestosCalculados}
        memorias={memorias}
        certificaciones={certificaciones}
        traspasosCount={traspasos.length}
        pctEjecucionGlobal={pctEjecucionPeriodo}
        mesHasta={mesHasta}
        formatMoney={formatMoney}
      />

      {/* 6. Nivel Analítico: Matriz Operativa / Explorador Institucional */}
      <DashboardMatrixExplorer
        presupuestosCalculados={presupuestosCalculados}
        programasResumen={programasResumen}
        formatMoney={formatMoney}
        mesDesde={mesDesde}
        mesHasta={mesHasta}
        activeGestionAnio={gestionActiva?.anio}
      />
    </div>
  );
}
