import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  WalletCards,
  TrendingDown,
  Building2,
  Lock,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  RotateCcw,
  Printer,
  FileText,
  X,
  PrinterCheck,
} from "lucide-react";
import {
  Gestion,
  PresupuestoArea,
  MemoriaCalculo,
  Gasto,
  getGestiones,
  getPresupuestosArea,
  getMemorias,
  getGastos,
} from "../../services/presupuestoService";

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

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

interface ResumenPrograma {
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

function getAreaCodeShort(code?: string): string {
  if (!code) return "";
  const clean = code.trim().toUpperCase();
  const parts = clean.split("-");
  return parts[parts.length - 1];
}

function getAreaOrderWeight(code?: string): number {
  const shortCode = getAreaCodeShort(code);
  return AREA_ORDER_WEIGHTS[shortCode] ?? 999;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [activeGestion, setActiveGestion] = useState<Gestion | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoArea[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros interactivos
  const [filtroAreaId, setFiltroAreaId] = useState<string>("todas");
  const [mesDesde, setMesDesde] = useState<number>(1);
  const [mesHasta, setMesHasta] = useState<number>(12);

  // Tab de agrupación: Por Gerencias/Áreas o Por Programas
  const [vistaAgrupacion, setVistaAgrupacion] = useState<"gerencias" | "programas">("gerencias");
  const [expandedProgramas, setExpandedProgramas] = useState<Record<string, boolean>>({});

  // Estado del Modal de Reporte e Impresión
  const [showModalReporte, setShowModalReporte] = useState<boolean>(false);
  const [tipoReporteImpresion, setTipoReporteImpresion] = useState<"gerencias" | "programas">("gerencias");

  const abrirReporte = (tipo?: "gerencias" | "programas") => {
    setTipoReporteImpresion(tipo || vistaAgrupacion);
    setShowModalReporte(true);
  };

  const toggleExpandPrograma = (codigo: string) => {
    setExpandedProgramas((prev) => ({ ...prev, [codigo]: !prev[codigo] }));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const gList = await getGestiones();
      setGestiones(gList);

      if (Array.isArray(gList) && gList.length > 0) {
        const current = gList[0];
        setActiveGestion(current);

        const [pData, mData, gData] = await Promise.all([
          getPresupuestosArea({ gestion: current.id }),
          getMemorias({ gestion: current.id }),
          getGastos({ gestion: current.id }),
        ]);

        setPresupuestos(Array.isArray(pData) ? pData : []);
        setMemorias(Array.isArray(mData) ? mData : []);
        setGastos(Array.isArray(gData) ? gData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function cambiarGestion(gestionId: number) {
    const selected = gestiones.find((g) => g.id === gestionId);
    if (!selected) return;

    setActiveGestion(selected);
    setLoading(true);
    try {
      const [pData, mData, gData] = await Promise.all([
        getPresupuestosArea({ gestion: selected.id }),
        getMemorias({ gestion: selected.id }),
        getGastos({ gestion: selected.id }),
      ]);

      setPresupuestos(Array.isArray(pData) ? pData : []);
      setMemorias(Array.isArray(mData) ? mData : []);
      setGastos(Array.isArray(gData) ? gData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatMoney = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(num || 0);
  };

  // Mapa de gastos por área en el rango de meses seleccionado [mesDesde, mesHasta]
  const gastosPorAreaPeriodo = useMemo(() => {
    const map: Record<number, number> = {};
    (Array.isArray(gastos) ? gastos : []).forEach((g) => {
      if (!g.fecha_gasto) return;
      const parts = g.fecha_gasto.split("-");
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10);
        if (month >= mesDesde && month <= mesHasta) {
          const areaId = g.area_id;
          const monto = parseFloat(String(g.monto_ejecutado) || "0");
          if (areaId) {
            map[areaId] = (map[areaId] || 0) + monto;
          }
        }
      }
    });
    return map;
  }, [gastos, mesDesde, mesHasta]);

  // Lista de presupuestos por área con cálculo dinámico según meses y filtro de área
  const presupuestosCalculados = useMemo(() => {
    let list = Array.isArray(presupuestos) ? presupuestos : [];

    if (filtroAreaId !== "todas") {
      list = list.filter((p) => String(p.area) === filtroAreaId || String(p.id) === filtroAreaId);
    }

    const computedList = list.map((p) => {
      const inicial = parseFloat(p.monto_inicial || "0");
      const ejecutadoPeriodo = gastosPorAreaPeriodo[p.area] || 0;
      const disponiblePeriodo = Math.max(0, inicial - ejecutadoPeriodo);
      const porcentajePeriodo = inicial > 0 ? Math.round((ejecutadoPeriodo / inicial) * 10000) / 100 : 0;

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
      return (a.area_nombre || "").localeCompare(b.area_nombre || "");
    });
  }, [presupuestos, filtroAreaId, gastosPorAreaPeriodo]);

  // Totales generales para los KPI cards considerando los filtros activos
  const totalInicial = useMemo(() => {
    return presupuestosCalculados.reduce((acc, p) => acc + parseFloat(p.monto_inicial || "0"), 0);
  }, [presupuestosCalculados]);

  const totalEjecutadoPeriodo = useMemo(() => {
    return presupuestosCalculados.reduce((acc, p) => acc + (p.monto_ejecutado_periodo || 0), 0);
  }, [presupuestosCalculados]);

  const totalDisponiblePeriodo = Math.max(0, totalInicial - totalEjecutadoPeriodo);
  const pctEjecucionPeriodo =
    totalInicial > 0 ? Math.round((totalEjecutadoPeriodo / totalInicial) * 10000) / 100 : 0;

  // Agrupación por Programas con los filtros de meses aplicados
  const programasResumen = useMemo(() => {
    const map: Record<
      string,
      ResumenPrograma & {
        monto_inicial_num: number;
        monto_ejecutado_num: number;
        monto_disponible_num: number;
      }
    > = {};

    const PROGRAMAS_ORDEN: Record<string, number> = {
      "1": 1,
      "P-1": 1,
      "2": 2,
      "P-2": 2,
      "210": 3,
      "P-210": 3,
      "410": 4,
      "P-410": 4,
    };

    presupuestosCalculados.forEach((p) => {
      let progCod = p.programa_codigo || "";
      let progNom = p.programa_nombre || "";

      if (!progCod && p.area_codigo) {
        const parts = p.area_codigo.split("-");
        if (parts.length >= 2) {
          progCod = parts[0] + "-" + parts[1];
        }
      }

      if (!progCod) progCod = "OTRO";
      if (!progNom) {
        if (progCod.includes("1") && !progCod.includes("210") && !progCod.includes("410")) {
          progNom = "PROGRAMA 1 - ADMINISTRACIÓN CENTRAL";
        } else if (progCod.includes("2") && !progCod.includes("210")) {
          progNom = "PROGRAMA 2 - GESTIÓN FINANCIERA";
        } else if (progCod.includes("210")) {
          progNom = "PROGRAMA 210 - OPERACIONES FLOTA EPTAM";
        } else if (progCod.includes("410")) {
          progNom = "PROGRAMA 410 - SERVICIOS DE TRANSPORTE AÉREO";
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
          monto_inicial_num: 0,
          monto_ejecutado_num: 0,
          monto_disponible_num: 0,
          areas: [],
        };
      }

      const inicial = parseFloat(p.monto_inicial || "0");
      const ejecutado = p.monto_ejecutado_periodo || 0;
      const disponible = p.monto_disponible_periodo || 0;

      map[progCod].monto_inicial_num += inicial;
      map[progCod].monto_ejecutado_num += ejecutado;
      map[progCod].monto_disponible_num += disponible;
      map[progCod].areas.push(p);
    });

    const list = Object.values(map);

    list.forEach((item) => {
      item.total_inicial = item.monto_inicial_num;
      item.total_ejecutado = item.monto_ejecutado_num;
      item.total_disponible = item.monto_disponible_num;
      item.porcentaje_ejecucion =
        item.total_inicial > 0
          ? Math.round((item.total_ejecutado / item.total_inicial) * 10000) / 100
          : 0;
      item.areas.sort((a, b) => getAreaOrderWeight(a.area_codigo) - getAreaOrderWeight(b.area_codigo));
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
      return (a.area_nombre || "").localeCompare(b.area_nombre || "");
    });
  }, [presupuestos]);

  const hayFiltrosActivos = filtroAreaId !== "todas" || mesDesde !== 1 || mesHasta !== 12;

  const resetearFiltros = () => {
    setFiltroAreaId("todas");
    setMesDesde(1);
    setMesHasta(12);
  };

  const nombreMesDesde = MESES.find((m) => m.value === mesDesde)?.label || "Enero";
  const nombreMesHasta = MESES.find((m) => m.value === mesHasta)?.label || "Diciembre";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-main tracking-tight">Dashboard General POA</h2>
          <p className="text-sm text-theme-muted">
            Monitoreo en tiempo real del estado presupuestario, formulación y ejecución institucional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-theme-surface border border-theme-border px-3 py-1.5 rounded-xl text-xs font-semibold text-theme-main">
            <Calendar size={15} className="text-theme-muted" />
            <select
              value={activeGestion?.id || ""}
              onChange={(e) => cambiarGestion(Number(e.target.value))}
              className="bg-transparent font-bold text-sm text-theme-main focus:outline-none cursor-pointer"
            >
              {gestiones.map((g) => (
                <option key={g.id} value={g.id}>
                  Gestión {g.anio}
                </option>
              ))}
            </select>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-primary/20 text-theme-main font-bold">
              {activeGestion?.estado_display || "En Formulación"}
            </span>
          </div>

          <button
            onClick={() => abrirReporte(vistaAgrupacion)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-theme-surface border border-theme-border text-theme-main hover:border-theme-primary transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer size={14} className="text-theme-primary" />
            Generar / Imprimir Reporte
          </button>

          <button
            onClick={() => navigate("/presupuestos")}
            className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 shadow-sm"
          >
            Ir a Presupuestos <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS SUPERIOR: Por Gerencias y Rango de Meses */}
      <div className="card p-4 bg-theme-surface border border-theme-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-theme-main uppercase tracking-wider">
            <Filter size={15} className="text-theme-primary" />
            <span>Filtros de Análisis Presupuestario</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro por Gerencia / Área */}
            <div className="flex items-center gap-2 bg-theme-base/60 border border-theme-border px-3 py-1.5 rounded-xl text-xs">
              <Building2 size={14} className="text-theme-muted" />
              <label className="text-theme-muted font-medium">Gerencia:</label>
              <select
                value={filtroAreaId}
                onChange={(e) => setFiltroAreaId(e.target.value)}
                className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer text-xs max-w-[220px] truncate"
              >
                <option value="todas">Todas las Gerencias y Unidades</option>
                {areasParaSelector.map((a) => (
                  <option key={a.id} value={String(a.area)}>
                    {a.area_nombre} ({a.area_codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Mes Desde */}
            <div className="flex items-center gap-2 bg-theme-base/60 border border-theme-border px-3 py-1.5 rounded-xl text-xs">
              <Calendar size={14} className="text-theme-muted" />
              <label className="text-theme-muted font-medium">Desde:</label>
              <select
                value={mesDesde}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMesDesde(val);
                  if (val > mesHasta) setMesHasta(val);
                }}
                className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer text-xs"
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Mes Hasta */}
            <div className="flex items-center gap-2 bg-theme-base/60 border border-theme-border px-3 py-1.5 rounded-xl text-xs">
              <Calendar size={14} className="text-theme-muted" />
              <label className="text-theme-muted font-medium">Hasta:</label>
              <select
                value={mesHasta}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMesHasta(val);
                  if (val < mesDesde) setMesDesde(val);
                }}
                className="bg-transparent font-bold text-theme-main focus:outline-none cursor-pointer text-xs"
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Resetear Filtros */}
            {hayFiltrosActivos && (
              <button
                onClick={resetearFiltros}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                title="Restablecer a todo el año y todas las áreas"
              >
                <RotateCcw size={13} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Indicador de Rango Activo */}
        <div className="mt-3 pt-2.5 border-t border-theme-border/60 flex items-center justify-between text-[11px] text-theme-muted">
          <span>
            Mostrando datos correspondientes a:{" "}
            <strong className="text-theme-main">
              {nombreMesDesde === nombreMesHasta
                ? `${nombreMesDesde} ${activeGestion?.anio || ""}`
                : `${nombreMesDesde} a ${nombreMesHasta} ${activeGestion?.anio || ""}`}
            </strong>
            {filtroAreaId !== "todas" && (
              <span>
                {" "}
                | Filtrado por:{" "}
                <strong className="text-theme-primary">
                  {areasParaSelector.find((a) => String(a.area) === filtroAreaId)?.area_nombre || "Área"}
                </strong>
              </span>
            )}
          </span>
          <span>
            {presupuestosCalculados.length}{" "}
            {presupuestosCalculados.length === 1 ? "área registrada" : "áreas registradas"}
          </span>
        </div>
      </div>

      {/* KPI Cards Dinámicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
              Presupuesto Inicial
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <WalletCards size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mt-3 tracking-tight">{formatMoney(totalInicial)}</p>
          <p className="text-xs text-theme-muted mt-1">{presupuestosCalculados.length} área(s) en alcance</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
              Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3 tracking-tight">
            {formatMoney(totalEjecutadoPeriodo)}
          </p>
          <p className="text-xs text-theme-muted mt-1">Gastos en el periodo seleccionado</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
              Saldo Disponible
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 tracking-tight">
            {formatMoney(totalDisponiblePeriodo)}
          </p>
          <p className="text-xs text-theme-muted mt-1">Remanente respecto al periodo</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">% Ejecutado</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-theme-main tracking-tight">{pctEjecucionPeriodo}%</span>
            <span className="text-xs text-theme-muted">del periodo</span>
          </div>
          <div className="w-full bg-theme-border/60 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="h-full bg-theme-primary transition-all duration-500"
              style={{ width: `${Math.min(100, pctEjecucionPeriodo)}%` }}
            />
          </div>
        </div>
      </div>

      {/* TABLA PRINCIPAL A PANTALLA COMPLETA (Full Width) */}
      <div className="card p-0 overflow-hidden shadow-sm">
        {/* Cabecera de la Tarjeta */}
        <div className="p-4 sm:p-5 border-b border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-base/40">
          <div>
            <h3 className="text-sm font-bold text-theme-main">
              {vistaAgrupacion === "gerencias"
                ? "Presupuesto y Ejecución por Gerencia / Área"
                : "Presupuesto y Ejecución Consolidado por Programa"}
            </h3>
            <p className="text-xs text-theme-muted">
              {vistaAgrupacion === "gerencias"
                ? `Techo asignado, gasto ejecutado y saldo disponible entre ${nombreMesDesde} y ${nombreMesHasta}`
                : `Consolidación por programa estratégico según ejecución entre ${nombreMesDesde} y ${nombreMesHasta}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Pestañas de Navegación: Gerencias vs Programas */}
            <div className="flex items-center p-1 bg-theme-surface border border-theme-border rounded-xl">
              <button
                onClick={() => setVistaAgrupacion("gerencias")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  vistaAgrupacion === "gerencias"
                    ? "bg-theme-primary text-theme-primaryText shadow-sm"
                    : "text-theme-muted hover:text-theme-main"
                }`}
              >
                <Building2 size={13} />
                Por Gerencias
              </button>
              <button
                onClick={() => setVistaAgrupacion("programas")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  vistaAgrupacion === "programas"
                    ? "bg-theme-primary text-theme-primaryText shadow-sm"
                    : "text-theme-muted hover:text-theme-main"
                }`}
              >
                <Layers size={13} />
                Por Programas
              </button>
            </div>

            <button
              onClick={() => abrirReporte(vistaAgrupacion)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-theme-primary/10 text-theme-primary hover:bg-theme-primary/20 transition-all flex items-center gap-1.5"
              title="Generar e imprimir reporte según el filtro activo"
            >
              <Printer size={13} />
              Imprimir Reporte
            </button>

            <button
              onClick={() => navigate("/presupuestos")}
              className="text-xs font-semibold text-theme-primary hover:underline flex items-center gap-1"
            >
              Ver en Presupuestos <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Contenedor de la Tabla Ampliado */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-theme-border bg-theme-base/60 font-semibold text-theme-muted uppercase tracking-wider">
                <th className="py-3 px-4">
                  {vistaAgrupacion === "gerencias" ? "Área / Gerencia" : "Programa"}
                </th>
                <th className="py-3 px-4 text-right">Techo Inicial</th>
                <th className="py-3 px-4 text-right">
                  Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                </th>
                <th className="py-3 px-4 text-right">Disponible</th>
                <th className="py-3 px-4 text-center">Avance</th>
              </tr>
            </thead>

            {vistaAgrupacion === "gerencias" ? (
              <tbody className="divide-y divide-theme-border">
                {presupuestosCalculados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-theme-muted text-sm">
                      No hay registros presupuestarios para el criterio seleccionado.
                    </td>
                  </tr>
                ) : (
                  presupuestosCalculados.map((p) => (
                    <tr key={p.id} className="hover:bg-theme-border/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-theme-main text-xs">{p.area_nombre}</span>
                        <span className="text-[10px] text-theme-muted ml-2 font-mono">({p.area_codigo})</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">{formatMoney(p.monto_inicial)}</td>
                      <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400 font-medium">
                        {formatMoney(p.monto_ejecutado_periodo)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(p.monto_disponible_periodo)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.porcentaje_ejecucion_periodo > 80
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : p.porcentaje_ejecucion_periodo > 50
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-theme-border text-theme-main"
                          }`}
                        >
                          {p.porcentaje_ejecucion_periodo}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            ) : (
              <tbody className="divide-y divide-theme-border">
                {programasResumen.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-theme-muted text-sm">
                      No hay programas registrados para el criterio seleccionado.
                    </td>
                  </tr>
                ) : (
                  programasResumen.map((prog) => {
                    const isExpanded = expandedProgramas[prog.codigo];
                    return (
                      <React.Fragment key={prog.codigo}>
                        <tr
                          onClick={() => toggleExpandPrograma(prog.codigo)}
                          className="hover:bg-theme-border/30 transition-colors cursor-pointer bg-theme-base/20"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="text-theme-muted">
                                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </div>
                              <div>
                                <span className="font-bold text-theme-main text-xs">{prog.nombre}</span>
                                <span className="text-[10px] px-2 py-0.5 ml-2 rounded-full font-bold bg-theme-primary/10 text-theme-primary font-mono">
                                  {prog.areas.length} {prog.areas.length === 1 ? "área" : "áreas"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-theme-main">
                            {formatMoney(prog.total_inicial)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                            {formatMoney(prog.total_ejecutado)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(prog.total_disponible)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                prog.porcentaje_ejecucion > 80
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : prog.porcentaje_ejecucion > 50
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {prog.porcentaje_ejecucion}%
                            </span>
                          </td>
                        </tr>

                        {/* Desglose de áreas del programa al expandir */}
                        {isExpanded &&
                          prog.areas.map((a) => (
                            <tr
                              key={`prog-${prog.codigo}-area-${a.id}`}
                              className="bg-theme-surface/70 hover:bg-theme-border/10 transition-colors text-[11px]"
                            >
                              <td className="py-2.5 px-4 pl-10 border-l-2 border-theme-primary/40">
                                <span className="text-theme-main font-medium">{a.area_nombre}</span>
                                <span className="text-[10px] text-theme-muted ml-2 font-mono">
                                  ({a.area_codigo})
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right text-theme-muted">
                                {formatMoney(a.monto_inicial)}
                              </td>
                              <td className="py-2.5 px-4 text-right text-rose-600/80 dark:text-rose-400/80">
                                {formatMoney(a.monto_ejecutado_periodo)}
                              </td>
                              <td className="py-2.5 px-4 text-right text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                                {formatMoney(a.monto_disponible_periodo)}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className="text-[10px] text-theme-muted font-medium">
                                  {a.porcentaje_ejecucion_periodo}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* MODAL DE VISTA PREVIA E IMPRESIÓN DE REPORTE OFICIAL */}
      {showModalReporte && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:shadow-none print:w-full">
            {/* Barra de Controles Superior (Oculta al Imprimir) */}
            <div className="p-4 border-b border-theme-border flex flex-wrap items-center justify-between gap-3 bg-theme-base/60 print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-theme-primary/10 text-theme-primary">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-theme-main">Vista Previa del Reporte POA</h3>
                  <p className="text-[11px] text-theme-muted">
                    Gestión {activeGestion?.anio || "2026"} • {nombreMesDesde} a {nombreMesHasta}
                  </p>
                </div>
              </div>

              {/* Opciones de Formato y Botones */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-theme-surface border border-theme-border rounded-xl mr-2">
                  <button
                    onClick={() => setTipoReporteImpresion("gerencias")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      tipoReporteImpresion === "gerencias"
                        ? "bg-theme-primary text-theme-primaryText shadow-sm"
                        : "text-theme-muted hover:text-theme-main"
                    }`}
                  >
                    Por Gerencias
                  </button>
                  <button
                    onClick={() => setTipoReporteImpresion("programas")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      tipoReporteImpresion === "programas"
                        ? "bg-theme-primary text-theme-primaryText shadow-sm"
                        : "text-theme-muted hover:text-theme-main"
                    }`}
                  >
                    Por Programas
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText text-xs font-bold hover:bg-theme-primaryHover transition-all flex items-center gap-1.5 shadow"
                >
                  <Printer size={15} />
                  Imprimir Reporte (PDF)
                </button>

                <button
                  onClick={() => setShowModalReporte(false)}
                  className="p-2 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/40 transition-colors"
                  title="Cerrar vista previa"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Hoja de Reporte Imprimible Oficial */}
            <div className="p-4 sm:p-8 overflow-y-auto print:overflow-visible bg-white text-black">
              <div id="reporte-dashboard-printable" className="w-full bg-white text-black max-w-4xl mx-auto space-y-6">
                {/* Cabecera Institucional */}
                <div className="border-b-2 border-black pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                        ESTADO PLURINACIONAL DE BOLIVIA
                      </p>
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-black mt-0.5">
                        EMPRESA PÚBLICA DE TRANSPORTE AÉREO MILITAR - EPTAM
                      </h1>
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                        SISTEMA INTEGRADO DE PROGRAMACIÓN OPERATIVA ANUAL (POA)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block border-2 border-black px-2.5 py-1 text-xs font-black uppercase tracking-wider">
                        POA {activeGestion?.anio || "2026"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-black underline underline-offset-4">
                      REPORTE DE ESTADO Y EJECUCIÓN PRESUPUESTARIA
                    </h2>
                    <p className="text-xs font-bold text-gray-700 mt-1 uppercase">
                      {tipoReporteImpresion === "gerencias"
                        ? "CONSOLIDADO POR GERENCIAS Y UNIDADES ORGANIZACIONALES"
                        : "CONSOLIDADO POR PROGRAMAS ESTRATÉGICOS"}
                    </p>
                  </div>
                </div>

                {/* Bloque de Metadatos y Filtros Aplicados */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border border-gray-400 bg-gray-50 p-3 rounded">
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Gestión Fiscal:</span>
                    <span className="font-bold text-black">{activeGestion?.anio || "2026"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Periodo Evaluado:</span>
                    <span className="font-bold text-black">
                      {nombreMesDesde === nombreMesHasta
                        ? `${nombreMesDesde} ${activeGestion?.anio || ""}`
                        : `${nombreMesDesde} - ${nombreMesHasta} ${activeGestion?.anio || ""}`}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Área Filtrada:</span>
                    <span className="font-bold text-black truncate block">
                      {filtroAreaId === "todas"
                        ? "Todas las Áreas"
                        : areasParaSelector.find((a) => String(a.area) === filtroAreaId)?.area_nombre || "Área"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[9px]">Fecha de Emisión:</span>
                    <span className="font-medium text-black">
                      {new Date().toLocaleDateString("es-BO")} {new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Cuadros Resumen Ejecutivo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">Presupuesto Inicial</p>
                    <p className="text-sm font-black text-black mt-0.5">{formatMoney(totalInicial)}</p>
                  </div>
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">
                      Ejecutado ({nombreMesDesde.slice(0, 3)} - {nombreMesHasta.slice(0, 3)})
                    </p>
                    <p className="text-sm font-black text-red-700 mt-0.5">{formatMoney(totalEjecutadoPeriodo)}</p>
                  </div>
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">Saldo Disponible</p>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">{formatMoney(totalDisponiblePeriodo)}</p>
                  </div>
                  <div className="border border-gray-400 p-2.5 rounded bg-white">
                    <p className="text-[9px] font-bold uppercase text-gray-600">% Avance / Ejecución</p>
                    <p className="text-sm font-black text-black mt-0.5">{pctEjecucionPeriodo}%</p>
                  </div>
                </div>

                {/* Tabla de Datos Principal */}
                <div>
                  <table className="w-full border-collapse border border-gray-400 text-[11px]">
                    <thead>
                      <tr className="bg-gray-200 border-b border-gray-400 font-black text-black uppercase tracking-wider text-[10px]">
                        <th className="border border-gray-400 py-2 px-2.5 text-center w-10">Nº</th>
                        <th className="border border-gray-400 py-2 px-2 text-center w-24">Código</th>
                        <th className="border border-gray-400 py-2 px-3 text-left">
                          {tipoReporteImpresion === "gerencias" ? "Gerencia / Unidad Organizacional" : "Programa / Área"}
                        </th>
                        <th className="border border-gray-400 py-2 px-3 text-right w-28">Presupuesto Inicial (Bs.)</th>
                        <th className="border border-gray-400 py-2 px-3 text-right w-28">Ejecutado Periodo (Bs.)</th>
                        <th className="border border-gray-400 py-2 px-3 text-right w-28">Saldo Disponible (Bs.)</th>
                        <th className="border border-gray-400 py-2 px-2 text-center w-16">% Ejec.</th>
                      </tr>
                    </thead>

                    {tipoReporteImpresion === "gerencias" ? (
                      <tbody>
                        {presupuestosCalculados.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="border border-gray-400 py-6 text-center text-gray-500 font-medium">
                              No existen datos presupuestarios para el criterio seleccionado.
                            </td>
                          </tr>
                        ) : (
                          presupuestosCalculados.map((p, idx) => (
                            <tr key={`print-area-${p.id}`} className={idx % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                              <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-gray-600">
                                {idx + 1}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-2 text-center font-mono font-bold text-black">
                                {p.area_codigo}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 font-semibold text-black">
                                {p.area_nombre}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 text-right font-medium text-black">
                                {formatMoney(p.monto_inicial)}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 text-right font-medium text-red-700">
                                {formatMoney(p.monto_ejecutado_periodo)}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-3 text-right font-bold text-emerald-800">
                                {formatMoney(p.monto_disponible_periodo)}
                              </td>
                              <td className="border border-gray-400 py-1.5 px-2 text-center font-bold text-black">
                                {p.porcentaje_ejecucion_periodo}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    ) : (
                      <tbody>
                        {programasResumen.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="border border-gray-400 py-6 text-center text-gray-500 font-medium">
                              No existen programas para el criterio seleccionado.
                            </td>
                          </tr>
                        ) : (
                          programasResumen.map((prog, pIdx) => (
                            <React.Fragment key={`print-prog-${prog.codigo}`}>
                              {/* Fila de Encabezado de Programa */}
                              <tr className="bg-gray-200 font-bold border-t-2 border-b border-gray-400 text-black">
                                <td className="border border-gray-400 py-2 px-2 text-center font-black">{pIdx + 1}</td>
                                <td className="border border-gray-400 py-2 px-2 text-center font-mono font-black">
                                  {prog.codigo}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 uppercase tracking-wide">
                                  {prog.nombre}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 text-right font-black">
                                  {formatMoney(prog.total_inicial)}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 text-right font-black text-red-800">
                                  {formatMoney(prog.total_ejecutado)}
                                </td>
                                <td className="border border-gray-400 py-2 px-3 text-right font-black text-emerald-800">
                                  {formatMoney(prog.total_disponible)}
                                </td>
                                <td className="border border-gray-400 py-2 px-2 text-center font-black">
                                  {prog.porcentaje_ejecucion}%
                                </td>
                              </tr>

                              {/* Filas de Áreas hijas del Programa */}
                              {prog.areas.map((a, aIdx) => (
                                <tr key={`print-prog-area-${a.id}`} className={aIdx % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                                  <td className="border border-gray-400 py-1 px-2 text-center text-gray-400 text-[10px]">
                                    {pIdx + 1}.{aIdx + 1}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-2 text-center font-mono text-gray-600">
                                    {a.area_codigo}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 pl-6 text-black">
                                    {a.area_nombre}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 text-right text-gray-800">
                                    {formatMoney(a.monto_inicial)}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 text-right text-red-700">
                                    {formatMoney(a.monto_ejecutado_periodo)}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-3 text-right font-semibold text-emerald-700">
                                    {formatMoney(a.monto_disponible_periodo)}
                                  </td>
                                  <td className="border border-gray-400 py-1 px-2 text-center text-gray-800 font-medium">
                                    {a.porcentaje_ejecucion_periodo}%
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    )}

                    {/* Fila de Totales Generales */}
                    <tfoot>
                      <tr className="bg-gray-300 border-t-2 border-black font-black text-black">
                        <td colSpan={3} className="border border-gray-400 py-2 px-3 text-right uppercase tracking-wider">
                          TOTAL GENERAL CONSOLIDADO:
                        </td>
                        <td className="border border-gray-400 py-2 px-3 text-right font-black">
                          {formatMoney(totalInicial)}
                        </td>
                        <td className="border border-gray-400 py-2 px-3 text-right font-black text-red-800">
                          {formatMoney(totalEjecutadoPeriodo)}
                        </td>
                        <td className="border border-gray-400 py-2 px-3 text-right font-black text-emerald-800">
                          {formatMoney(totalDisponiblePeriodo)}
                        </td>
                        <td className="border border-gray-400 py-2 px-2 text-center font-black">
                          {pctEjecucionPeriodo}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Bloque de Firmas Institucionales */}
                <div className="pt-8 pb-4 mt-8">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Elaborado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Responsable de Planificación y Presupuesto</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Revisado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Jefe de Planificación Institucional</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                    <div className="border-t border-black pt-2">
                      <p className="text-[10px] font-bold uppercase text-black">Aprobado por</p>
                      <p className="text-[9px] text-gray-600 mt-1">Gerencia General / Dirección EPTAM</p>
                      <p className="text-[8px] text-gray-500 mt-4">Firma y Sello</p>
                    </div>
                  </div>
                </div>

                {/* Nota al pie */}
                <div className="border-t border-gray-300 pt-2 text-[8px] text-gray-500 flex justify-between">
                  <span>Sistema POA - EPTAM • Documento Oficial de Seguimiento y Evaluación Presupuestaria</span>
                  <span>Montos expresados en Bolivianos (Bs.)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

