import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Layers,
  AlertTriangle,
  Search,
  ArrowUpRight,
  Download,
  Printer,
  CheckCircle2,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
} from 'lucide-react';
import { PresupuestoArea } from '../../services/presupuestoService';
import { Dropdown, DropdownItem } from '../../components/commons';

export interface DashboardMatrixExplorerProps {
  presupuestosCalculados: (PresupuestoArea & {
    monto_ejecutado_periodo: number;
    monto_disponible_periodo: number;
    porcentaje_ejecucion_periodo: number;
  })[];
  programasResumen: {
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
  }[];
  formatMoney: (val: number | string) => string;
  mesDesde: number;
  mesHasta: number;
  activeGestionAnio?: number | string;
}

export const DashboardMatrixExplorer: React.FC<DashboardMatrixExplorerProps> = ({
  presupuestosCalculados,
  programasResumen,
  formatMoney,
  mesDesde,
  mesHasta,
  activeGestionAnio,
}) => {
  const navigate = useNavigate();

  // Tab activo de la matriz: 'gerencias' | 'programas' | 'radar'
  const [tabActivo, setTabActivo] = useState<'gerencias' | 'programas' | 'radar'>('gerencias');

  // Modo de visualización en Gerencias: 'cards' | 'table'
  const [modoVista, setModoVista] = useState<'cards' | 'table'>('table');

  // Buscador textual rápido
  const [busqueda, setBusqueda] = useState<string>('');

  // Filtro de estado semafórico en tab Gerencias: 'todos' | 'saludable' | 'subejecucion' | 'critico' | 'acelerado'
  const [filtroEstado, setFiltroEstado] = useState<
    'todos' | 'saludable' | 'subejecucion' | 'critico' | 'acelerado'
  >('todos');

  // Ordenamiento con Dropdown
  const [orden, setOrden] = useState<string>('ejecucion_desc');

  // Opciones de ordenamiento para el componente Dropdown
  const itemsOrden: DropdownItem[] = useMemo(() => [
    { id: 'ejecucion_desc', label: 'Mayor % Gastado' },
    { id: 'ejecucion_asc', label: 'Menor % Gastado' },
    { id: 'techo_desc', label: 'Mayor Presupuesto Asignado' },
    { id: 'saldo_asc', label: 'Menor Saldo Disponible' },
    { id: 'codigo', label: 'Código de Área' },
  ], []);

  // Expansión de programas en Tab 2
  const [programasExpandidos, setProgramasExpandidos] = useState<Record<string, boolean>>({});

  const togglePrograma = (cod: string) => {
    setProgramasExpandidos((prev) => ({ ...prev, [cod]: !prev[cod] }));
  };

  // Función clasificadora de salud por área (suave y sin bordes estridentes)
  const clasificarArea = (p: typeof presupuestosCalculados[0]) => {
    const inicial = parseFloat(p.monto_inicial || '0');
    const disp = p.monto_disponible_periodo || 0;
    const pct = p.porcentaje_ejecucion_periodo || 0;

    const saldoPct = inicial > 0 ? (disp / inicial) * 100 : 0;

    if (inicial > 0 && saldoPct <= 10) {
      return {
        tipo: 'critico' as const,
        label: 'Saldo Bajo (<10%)',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        barColor: 'bg-rose-500',
        mensaje: 'Saldo casi agotado. Requiere traspaso para nuevos compromisos.',
      };
    }

    if (pct >= 85) {
      return {
        tipo: 'acelerado' as const,
        label: 'Gasto Rápido (>85%)',
        badgeClass: 'bg-blue-600 text-white font-bold',
        barColor: 'bg-blue-500',
        mensaje: 'Alto avance de gasto en el periodo analizado.',
      };
    }

    if (pct < 35 && mesHasta >= 4) {
      return {
        tipo: 'subejecucion' as const,
        label: 'Gasto Lento (<35%)',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        barColor: 'bg-amber-500',
        mensaje: 'Ritmo por debajo del esperado. Acelerar certificaciones.',
      };
    }

    return {
      tipo: 'saludable' as const,
      label: 'Al Día / Normal',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      barColor: 'bg-emerald-500',
      mensaje: 'Gasto presupuestario dentro de los parámetros previstos.',
    };
  };

  // Áreas filtradas y ordenadas
  const areasFiltradas = useMemo(() => {
    let list = [...presupuestosCalculados];

    // 1. Búsqueda por texto
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.area_nombre || '').toLowerCase().includes(q) ||
          (p.area_codigo || '').toLowerCase().includes(q) ||
          (p.programa_nombre || '').toLowerCase().includes(q) ||
          (p.programa_codigo || '').toLowerCase().includes(q)
      );
    }

    // 2. Filtro semafórico
    if (filtroEstado !== 'todos') {
      list = list.filter((p) => {
        const c = clasificarArea(p);
        return c.tipo === filtroEstado;
      });
    }

    // 3. Ordenamiento
    list.sort((a, b) => {
      if (orden === 'ejecucion_desc') {
        return (b.porcentaje_ejecucion_periodo || 0) - (a.porcentaje_ejecucion_periodo || 0);
      }
      if (orden === 'ejecucion_asc') {
        return (a.porcentaje_ejecucion_periodo || 0) - (b.porcentaje_ejecucion_periodo || 0);
      }
      if (orden === 'techo_desc') {
        return parseFloat(b.monto_inicial || '0') - parseFloat(a.monto_inicial || '0');
      }
      if (orden === 'saldo_asc') {
        return (a.monto_disponible_periodo || 0) - (b.monto_disponible_periodo || 0);
      }
      return (a.area_codigo || '').localeCompare(b.area_codigo || '');
    });

    return list;
  }, [presupuestosCalculados, busqueda, filtroEstado, orden, mesHasta]);

  // Áreas para el Radar de Desviaciones (solo alertas)
  const areasRadar = useMemo(() => {
    return presupuestosCalculados
      .map((p) => ({
        ...p,
        diag: clasificarArea(p),
      }))
      .filter((p) => p.diag.tipo !== 'saludable');
  }, [presupuestosCalculados, mesHasta]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = [
      'Código Área',
      'Gerencia / Unidad',
      'Tipo',
      'Programa',
      'Presupuesto Asignado (BOB)',
      'Presupuesto Gastado (BOB)',
      'Saldo Disponible (BOB)',
      'Porcentaje Gastado (%)',
      'Diagnóstico',
    ];

    const rows = areasFiltradas.map((p) => {
      const diag = clasificarArea(p);
      return [
        `"${p.area_codigo || ''}"`,
        `"${(p.area_nombre || '').replace(/"/g, '""')}"`,
        `"${p.area_tipo || ''}"`,
        `"${(p.programa_nombre || p.programa_codigo || '').replace(/"/g, '""')}"`,
        parseFloat(p.monto_inicial || '0').toFixed(2),
        (p.monto_ejecutado_periodo || 0).toFixed(2),
        (p.monto_disponible_periodo || 0).toFixed(2),
        (p.porcentaje_ejecucion_periodo || 0).toFixed(2),
        `"${diag.label}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `ejecucion_presupuestaria_gestion_${activeGestionAnio || 'poa'}_m${mesDesde}_m${mesHasta}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-5">
      {/* 1. Encabezado de la Matriz y Navegación de Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-theme-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-theme-base/60 text-theme-main border border-theme-border">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-theme-main font-display">
                Explorador de Ejecución Institucional
              </h2>
              <p className="text-xs text-theme-muted mt-0.5">
                Desglose analítico por gerencias operativas, programas estratégicos y desviaciones
              </p>
            </div>
          </div>
        </div>

        {/* Tabs de Nivel de Análisis y Acciones sin bordes agresivos */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-theme-base/60 p-1 rounded-xl border border-theme-border text-xs font-semibold">
            <button
              onClick={() => setTabActivo('gerencias')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                tabActivo === 'gerencias'
                  ? 'bg-theme-primary text-theme-primaryText font-bold shadow-sm'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <Building2 size={13} />
              <span>Gerencias y Unidades</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-theme-base/80 text-theme-main font-mono">
                {presupuestosCalculados.length}
              </span>
            </button>

            <button
              onClick={() => setTabActivo('programas')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                tabActivo === 'programas'
                  ? 'bg-theme-primary text-theme-primaryText font-bold shadow-sm'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <Layers size={13} />
              <span>Programas Institucionales</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-theme-base/80 text-theme-main font-mono">
                {programasResumen.length}
              </span>
            </button>

            <button
              onClick={() => setTabActivo('radar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                tabActivo === 'radar'
                  ? 'bg-theme-primary text-theme-primaryText font-bold shadow-sm'
                  : 'text-theme-muted hover:text-theme-main'
              }`}
            >
              <AlertTriangle size={13} className="text-amber-500" />
              <span>Desviaciones</span>
              {areasRadar.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-500 font-mono">
                  {areasRadar.length}
                </span>
              )}
            </button>
          </div>

          {/* Botones de Exportar e Imprimir */}
          <div className="flex items-center gap-1">
            <button
              onClick={exportarCSV}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-main hover:bg-theme-base/60 transition-colors flex items-center gap-1.5"
              title="Descargar matriz en formato CSV para Excel"
            >
              <Download size={13} />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-main hover:bg-theme-base/60 transition-colors flex items-center gap-1.5"
              title="Imprimir vista ejecutiva"
            >
              <Printer size={13} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: GERENCIAS Y UNIDADES (CARDS / TABLA) */}
      {/* ============================================================== */}
      {tabActivo === 'gerencias' && (
        <div className="space-y-4">
          {/* Barra de Filtros, Dropdown de Orden y Vistas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Buscador Rápido */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted"
              />
              <input
                type="text"
                placeholder="Buscar por código, gerencia o programa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-theme-base/40 border border-theme-border rounded-xl text-theme-main focus:outline-none focus:border-theme-primary transition-all placeholder:text-theme-muted/60"
              />
            </div>

            {/* Chips de Estado, Dropdown de Orden y Toggle de Modo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setFiltroEstado('todos')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filtroEstado === 'todos'
                      ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                      : 'text-theme-muted hover:text-theme-main hover:bg-theme-base/50'
                  }`}
                >
                  Todas ({presupuestosCalculados.length})
                </button>
                <button
                  onClick={() => setFiltroEstado('saludable')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filtroEstado === 'saludable'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-theme-muted hover:text-emerald-500 hover:bg-theme-base/50'
                  }`}
                >
                  Al Día
                </button>
                <button
                  onClick={() => setFiltroEstado('subejecucion')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filtroEstado === 'subejecucion'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-theme-muted hover:text-amber-500 hover:bg-theme-base/50'
                  }`}
                >
                  Gasto Lento
                </button>
                <button
                  onClick={() => setFiltroEstado('critico')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filtroEstado === 'critico'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-theme-muted hover:text-rose-500 hover:bg-theme-base/50'
                  }`}
                >
                  Saldo Bajo
                </button>
              </div>

              {/* Selector de Orden usando el componente Dropdown */}
              <div className="w-48">
                <Dropdown
                  items={itemsOrden}
                  value={orden}
                  onChange={(val) => setOrden(String(val))}
                  icon={<ArrowUpDown size={13} className="text-theme-muted" />}
                  size="sm"
                  placeholder="Ordenar..."
                />
              </div>

              {/* Toggle Cards / Tabla */}
              <div className="flex items-center bg-theme-base/60 p-0.5 rounded-xl border border-theme-border">
                <button
                  onClick={() => setModoVista('cards')}
                  className={`p-1.5 rounded-lg transition-all ${
                    modoVista === 'cards'
                      ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                      : 'text-theme-muted hover:text-theme-main'
                  }`}
                  title="Vista de Tarjetas Ejecutivas"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setModoVista('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    modoVista === 'table'
                      ? 'bg-theme-primary text-theme-primaryText shadow-xs'
                      : 'text-theme-muted hover:text-theme-main'
                  }`}
                  title="Vista de Tabla Analítica"
                >
                  <TableIcon size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje de Sin Resultados */}
          {areasFiltradas.length === 0 && (
            <div className="p-12 text-center border border-dashed border-theme-border rounded-2xl bg-theme-base/20 space-y-2">
              <Building2 className="mx-auto text-theme-muted" size={32} />
              <p className="text-sm font-bold text-theme-main">
                No se encontraron áreas con los filtros aplicados
              </p>
              <p className="text-xs text-theme-muted">
                Intenta ajustar el texto de búsqueda o restablecer el filtro de estado.
              </p>
            </div>
          )}

          {/* VISTA 1: TARJETAS EJECUTIVAS */}
          {modoVista === 'cards' && areasFiltradas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {areasFiltradas.map((area) => {
                const diag = clasificarArea(area);
                const techo = parseFloat(area.monto_inicial || '0');
                const ejecutado = area.monto_ejecutado_periodo || 0;
                const disponible = area.monto_disponible_periodo || 0;
                const pct = area.porcentaje_ejecucion_periodo || 0;

                return (
                  <div
                    key={area.id}
                    className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm hover:border-theme-primary/30 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                            {area.area_codigo}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-theme-muted tracking-wider truncate">
                            {area.area_tipo}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${diag.badgeClass}`}
                        >
                          {diag.label}
                        </span>
                      </div>

                      {/* Nombre del Área */}
                      <h3 className="text-sm font-bold text-theme-main font-display mt-2 line-clamp-1 group-hover:text-amber-500 transition-colors">
                        {area.area_nombre}
                      </h3>

                      {area.programa_nombre && (
                        <p className="text-[11px] text-theme-muted truncate mt-0.5">
                          {area.programa_nombre}
                        </p>
                      )}

                      {/* Cifras Clave (Asignado, Gastado, Saldo) */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-theme-border text-center">
                        <div className="bg-theme-base/30 p-2 rounded-xl border border-theme-border">
                          <span className="text-[10px] font-semibold uppercase text-theme-muted block">
                            Asignado
                          </span>
                          <span className="text-xs font-bold text-theme-main mt-0.5 block truncate">
                            {formatMoney(techo)}
                          </span>
                        </div>

                        <div className="bg-rose-500/5 p-2 rounded-xl border border-theme-border">
                          <span className="text-[10px] font-semibold uppercase text-rose-500 block">
                            Gastado
                          </span>
                          <span className="text-xs font-bold text-rose-500 mt-0.5 block truncate">
                            {formatMoney(ejecutado)}
                          </span>
                        </div>

                        <div className="bg-emerald-500/5 p-2 rounded-xl border border-theme-border">
                          <span className="text-[10px] font-semibold uppercase text-emerald-500 block">
                            Saldo Disp.
                          </span>
                          <span className="text-xs font-bold text-emerald-500 mt-0.5 block truncate">
                            {formatMoney(disponible)}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progreso de Ejecución */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-theme-muted font-medium">% Gastado del Periodo:</span>
                          <span className="font-bold text-theme-main">{pct}%</span>
                        </div>
                        <div className="w-full bg-theme-border rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${diag.barColor} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer y Navegación Directa al Área Seleccionada */}
                    <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between">
                      <span className="text-[11px] text-theme-muted">
                        {area.total_memorias_aprobadas > 0
                          ? `${area.total_memorias_aprobadas} memorias registradas`
                          : 'Sin memorias activas'}
                      </span>

                      <button
                        onClick={() => navigate(`/presupuestos?area=${area.area}`)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-theme-primary text-theme-primaryText hover:bg-theme-primaryHover transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                        title={`Explorar memorias y partidas de ${area.area_nombre}`}
                      >
                        <span>Explorar Área</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 2: TABLA ANALÍTICA COMPACTA (CONFORTABLE A LA VISTA) */}
          {modoVista === 'table' && areasFiltradas.length > 0 && (
            <div className="border border-theme-border rounded-2xl overflow-hidden bg-theme-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-theme-base/60 border-b border-theme-border text-theme-muted font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-28 whitespace-nowrap">Código</th>
                      <th className="py-3 px-4">Gerencia / Unidad</th>
                      <th className="py-3 px-4">Programa</th>
                      <th className="py-3 px-4 text-right">Presupuesto Asignado</th>
                      <th className="py-3 px-4 text-right">Presupuesto Gastado</th>
                      <th className="py-3 px-4 text-right">Saldo Disponible</th>
                      <th className="py-3 px-4 text-center">% Gastado</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {areasFiltradas.map((area) => {
                      const diag = clasificarArea(area);
                      const techo = parseFloat(area.monto_inicial || '0');
                      const ejecutado = area.monto_ejecutado_periodo || 0;
                      const disponible = area.monto_disponible_periodo || 0;
                      const pct = area.porcentaje_ejecucion_periodo || 0;

                      return (
                        <tr
                          key={area.id}
                          className="hover:bg-theme-base/30 transition-colors group"
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap inline-block bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                              {area.area_codigo}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-theme-main block">
                              {area.area_nombre}
                            </span>
                            <span className="text-[10px] text-theme-muted uppercase">
                              {area.area_tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-theme-muted max-w-[160px] truncate">
                            {area.programa_nombre || area.programa_codigo || 'General'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-theme-main">
                            {formatMoney(techo)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-500">
                            {formatMoney(ejecutado)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-500">
                            {formatMoney(disponible)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-14 bg-theme-border rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${diag.barColor} rounded-full`}
                                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                />
                              </div>
                              <span className="font-bold text-theme-main text-[11px]">
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${diag.badgeClass}`}
                            >
                              {diag.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/presupuestos?area=${area.area}`)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-theme-primary text-theme-primaryText hover:bg-theme-primaryHover transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                              title={`Ver ${area.area_nombre} en Presupuestos`}
                            >
                              <span>Ver</span>
                              <ArrowUpRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PROGRAMAS INSTITUCIONALES */}
      {/* ============================================================== */}
      {tabActivo === 'programas' && (
        <div className="space-y-4">
          <p className="text-xs text-theme-muted">
            Consolidado agrupado según la estructura de Programas Operativos Institucionales.
          </p>

          <div className="space-y-3">
            {programasResumen.map((prog) => {
              const expandido = !!programasExpandidos[prog.codigo];
              const pct = prog.porcentaje_ejecucion || 0;

              return (
                <div
                  key={prog.codigo}
                  className="border border-theme-border rounded-2xl bg-theme-surface overflow-hidden shadow-sm transition-all"
                >
                  {/* Encabezado del Programa */}
                  <div
                    onClick={() => togglePrograma(prog.codigo)}
                    className="p-4 bg-theme-base/30 hover:bg-theme-base/60 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-theme-base/60 text-theme-main border border-theme-border shrink-0">
                        <Layers size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                            {prog.codigo}
                          </span>
                          <h3 className="text-sm font-bold text-theme-main font-display truncate">
                            {prog.nombre}
                          </h3>
                        </div>
                        <p className="text-xs text-theme-muted mt-0.5">
                          {prog.areas.length} {prog.areas.length === 1 ? 'área asignada' : 'áreas asignadas'}
                        </p>
                      </div>
                    </div>

                    {/* Resumen Financiero del Programa */}
                    <div className="flex flex-wrap items-center gap-6 justify-between md:justify-end">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-semibold uppercase text-theme-muted block">
                          Asignado
                        </span>
                        <span className="text-xs font-bold text-theme-main">
                          {formatMoney(prog.total_inicial)}
                        </span>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-semibold uppercase text-rose-500 block">
                          Gastado
                        </span>
                        <span className="text-xs font-bold text-rose-500">
                          {formatMoney(prog.total_ejecutado)}
                        </span>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-semibold uppercase text-emerald-500 block">
                          Saldo Disponible
                        </span>
                        <span className="text-xs font-bold text-emerald-500">
                          {formatMoney(prog.total_disponible)}
                        </span>
                      </div>

                      <div className="w-28 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-theme-muted">Avance:</span>
                          <span className="font-bold text-theme-main">{pct}%</span>
                        </div>
                        <div className="w-full bg-theme-border rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-theme-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-theme-muted">
                        {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Desplegable de Áreas del Programa */}
                  {expandido && (
                    <div className="p-4 border-t border-theme-border bg-theme-surface/50 space-y-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-theme-muted font-bold text-[10px] uppercase border-b border-theme-border">
                              <th className="py-2 px-3 w-28 whitespace-nowrap">Código</th>
                              <th className="py-2 px-3">Gerencia / Unidad</th>
                              <th className="py-2 px-3 text-right">Asignado (Bs.)</th>
                              <th className="py-2 px-3 text-right">Gastado (Bs.)</th>
                              <th className="py-2 px-3 text-right">Saldo (Bs.)</th>
                              <th className="py-2 px-3 text-center">% Gastado</th>
                              <th className="py-2 px-3 text-right whitespace-nowrap">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-theme-border">
                            {prog.areas.map((a) => {
                              const t = parseFloat(a.monto_inicial || '0');
                              const ej = a.monto_ejecutado_periodo || 0;
                              const dis = a.monto_disponible_periodo || 0;
                              const pAvance = a.porcentaje_ejecucion_periodo || 0;

                              return (
                                <tr key={a.id} className="hover:bg-theme-base/30 transition-colors">
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span className="font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap inline-block bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                                      {a.area_codigo}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-theme-main">
                                    {a.area_nombre}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-theme-main">
                                    {formatMoney(t)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-rose-500">
                                    {formatMoney(ej)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-emerald-500">
                                    {formatMoney(dis)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="font-bold text-theme-main">
                                      {pAvance}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <button
                                      onClick={() => navigate(`/presupuestos?area=${a.area}`)}
                                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-theme-primary text-theme-primaryText hover:bg-theme-primaryHover transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                                      title={`Explorar ${a.area_nombre}`}
                                    >
                                      <span>Ver</span>
                                      <ArrowUpRight size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: RADAR DE DESVIACIONES Y SEMÁFORO */}
      {/* ============================================================== */}
      {tabActivo === 'radar' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-bold">Mesa de Control de Desviaciones Presupuestarias</p>
              <p className="mt-0.5 text-amber-800/80 dark:text-amber-200/80">
                Se detectan automáticamente áreas con saldo menor al 10% (riesgo de falta de recursos),
                gasto lento respecto a la meta fiscal o ritmo acelerado de gasto.
              </p>
            </div>
          </div>

          {areasRadar.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-theme-border rounded-2xl bg-emerald-500/5 space-y-2">
              <CheckCircle2 className="mx-auto text-emerald-500" size={32} />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Todas las gerencias y unidades operan en equilibrio
              </p>
              <p className="text-xs text-theme-muted">
                No existen alertas tempranas de saldo crítico ni rezago severo de devengado en el
                periodo analizado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areasRadar.map((area) => {
                const techo = parseFloat(area.monto_inicial || '0');
                const ejecutado = area.monto_ejecutado_periodo || 0;
                const disponible = area.monto_disponible_periodo || 0;
                const pct = area.porcentaje_ejecucion_periodo || 0;

                return (
                  <div
                    key={area.id}
                    className="card p-4 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60">
                            {area.area_codigo}
                          </span>
                          <h4 className="text-sm font-bold text-theme-main font-display truncate">
                            {area.area_nombre}
                          </h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${area.diag.badgeClass}`}
                        >
                          {area.diag.label}
                        </span>
                      </div>

                      <p className="text-xs text-theme-muted mt-2">{area.diag.mensaje}</p>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-theme-border text-center">
                        <div className="bg-theme-base/30 p-2 rounded-xl border border-theme-border">
                          <span className="text-[10px] font-semibold uppercase text-theme-muted block">
                            Asignado
                          </span>
                          <span className="text-xs font-bold text-theme-main mt-0.5 block truncate">
                            {formatMoney(techo)}
                          </span>
                        </div>
                        <div className="bg-rose-500/5 p-2 rounded-xl border border-theme-border">
                          <span className="text-[10px] font-semibold uppercase text-rose-500 block">
                            Gastado
                          </span>
                          <span className="text-xs font-bold text-rose-500 mt-0.5 block truncate">
                            {formatMoney(ejecutado)}
                          </span>
                        </div>
                        <div className="bg-emerald-500/5 p-2 rounded-xl border border-theme-border">
                          <span className="text-[10px] font-semibold uppercase text-emerald-500 block">
                            Saldo Disp.
                          </span>
                          <span className="text-xs font-bold text-emerald-500 mt-0.5 block truncate">
                            {formatMoney(disponible)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-theme-border flex items-center justify-between">
                      <span className="text-xs font-bold text-theme-main">
                        % Gastado: {pct}%
                      </span>

                      <div className="flex items-center gap-2">
                        {area.diag.tipo === 'critico' && (
                          <button
                            onClick={() => navigate('/traspasos')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <ArrowRightLeft size={12} />
                            <span>Solicitar Traspaso</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/presupuestos?area=${area.area}`)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-theme-primary text-theme-primaryText hover:bg-theme-primaryHover transition-all flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                          title={`Ver detalles de ${area.area_nombre}`}
                        >
                          <span>Inspeccionar</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
