import { useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Button,
  Modal,
  DataTable,
  Column,
  StatusBadge,
  TabsFilter,
  ResumenCards,
  FilterPanel,
  Dropdown,
  DropdownItem,
  PageHeader,
  Pagination,
  GestionSelector,
  BaseGestion,
} from "../../components/commons";
import {
  Palette,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Wallet,
  Receipt,
  Search,
  SlidersHorizontal,
  Info,
  Check,
  RefreshCw,
  Eye,
  FileText,
  ClipboardList,
  Clock,
  X,
  Plus,
  Download,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  Building2,
  Bookmark,
  DollarSign,
  Layers,
  ChevronRight,
  XCircle,
  AlertCircle,
  Coins,
  ShieldAlert,
} from "lucide-react";

// Modelo de datos simulado para la DataTable
interface PartidaMock {
  id: number;
  codigo: string;
  denominacion: string;
  area: string;
  inicial: number;
  vigente: number;
  ejecutado: number;
  disponible: number;
  porcentaje: number;
  estado: string;
}

const PARTIDAS_DEMO: PartidaMock[] = [
  {
    id: 1,
    codigo: "25200",
    denominacion: "Estudios, Investigaciones y Proyectos de Factibilidad",
    area: "Planificación",
    inicial: 400000,
    vigente: 450000,
    ejecutado: 285000,
    disponible: 165000,
    porcentaje: 63.3,
    estado: "APROBADO",
  },
  {
    id: 2,
    codigo: "31110",
    denominacion: "Gastos por Refrigerios al Personal Permanente",
    area: "Recursos Humanos",
    inicial: 150000,
    vigente: 120000,
    ejecutado: 98000,
    disponible: 22000,
    porcentaje: 81.6,
    estado: "PENDIENTE_PLANIFICACION",
  },
  {
    id: 3,
    codigo: "43110",
    denominacion: "Equipo de Computación, Redes y Comunicación",
    area: "Sistemas y TICs",
    inicial: 800000,
    vigente: 950000,
    ejecutado: 420000,
    disponible: 530000,
    porcentaje: 44.2,
    estado: "EN_EJECUCION",
  },
  {
    id: 4,
    codigo: "22110",
    denominacion: "Pasajes al Interior del País para Comisiones Oficiales",
    area: "Gerencia General",
    inicial: 90000,
    vigente: 90000,
    ejecutado: 78500,
    disponible: 11500,
    porcentaje: 87.2,
    estado: "APROBADO_GERENCIA",
  },
  {
    id: 5,
    codigo: "34110",
    denominacion: "Combustibles, Lubricantes y Derivados para Vehículos",
    area: "Servicios Generales",
    inicial: 210000,
    vigente: 230000,
    ejecutado: 115000,
    disponible: 115000,
    porcentaje: 50.0,
    estado: "PENDIENTE_TESORERIA",
  },
  {
    id: 6,
    codigo: "24110",
    denominacion: "Mantenimiento y Reparación de Inmuebles Institucionales",
    area: "Infraestructura",
    inicial: 320000,
    vigente: 290000,
    ejecutado: 290000,
    disponible: 0,
    porcentaje: 100.0,
    estado: "FINALIZADO",
  },
];

const GESTIONES_DEMO: BaseGestion[] = [
  { id: 1, anio: 2026, estado: "EN_EJECUCION", estado_display: "En Ejecución" },
  { id: 2, anio: 2025, estado: "CERRADO_FORMULACION", estado_display: "Cerrada" },
  { id: 3, anio: 2024, estado: "FINALIZADO", estado_display: "Histórico" },
];

export default function UxUiLabPage() {
  const { theme, setTheme } = useTheme();
  const [useInverted, setUseInverted] = useState(true);

  // Navegación rápida por sección del Laboratorio
  const [sectionFilter, setSectionFilter] = useState("todos");

  // Estado para Pestañas (TabsFilter)
  const [activeTabPOA, setActiveTabPOA] = useState("todas");
  const [searchTabs, setSearchTabs] = useState("");
  const [selectedAreaTab, setSelectedAreaTab] = useState("todas");

  // Estado para Modales Interactivos
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<PartidaMock | null>(null);

  // Estado para FilterPanel
  const [searchFilterPanel, setSearchFilterPanel] = useState("");
  const [selectedAreaFilter, setSelectedAreaFilter] = useState("todas");
  const [selectedPartidaFilter, setSelectedPartidaFilter] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [mesDesde, setMesDesde] = useState(1);
  const [mesHasta, setMesHasta] = useState(12);
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");

  // Estado para DataTable
  const [tableLoading, setTableLoading] = useState(false);
  const [tableEmpty, setTableEmpty] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Estado para Dropdown individual
  const [selectedDropdownVal, setSelectedDropdownVal] = useState<string>("rep_mensual");

  // Estado para GestionSelector
  const [selectedGestionId, setSelectedGestionId] = useState<number>(1);

  // Inputs de muestra
  const [sampleTextInput, setSampleTextInput] = useState("ADQUISICIÓN DE SERVIDORES DE BASE DE DATOS");
  const [sampleAmountInput, setSampleAmountInput] = useState("350000.00");
  const [sampleTextArea, setSampleTextArea] = useState(
    "JUSTIFICACIÓN TÉCNICA: SE REQUIERE LA AMPLIACIÓN DE CAPACIDAD DE ALMACENAMIENTO PARA RESPALDOS AUTOMATIZADOS."
  );

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // Determinar si hay filtros activos en el FilterPanel
  const hasActiveFilters = Boolean(
    searchFilterPanel.trim() ||
      selectedAreaFilter !== "todas" ||
      selectedPartidaFilter !== "todas" ||
      fechaDesde ||
      fechaHasta ||
      mesDesde !== 1 ||
      mesHasta !== 12 ||
      montoMin ||
      montoMax
  );

  const handleResetFilters = () => {
    setSearchFilterPanel("");
    setSelectedAreaFilter("todas");
    setSelectedPartidaFilter("todas");
    setFechaDesde("");
    setFechaHasta("");
    setMesDesde(1);
    setMesHasta(12);
    setMontoMin("");
    setMontoMax("");
  };

  // Opciones de Dropdowns simulados
  const areaOptions = [
    { value: "planif", label: "Gerencia de Planificación", badge: "GL-01" },
    { value: "finan", label: "Gerencia Administrativa Financiera", badge: "GF-02" },
    { value: "tics", label: "Dirección de Tecnologías y Sistemas", badge: "DT-03" },
    { value: "rrhh", label: "Unidad de Recursos Humanos", badge: "UR-04" },
    { value: "infra", label: "Unidad de Infraestructura y Obras", badge: "UI-05" },
  ];

  const partidaOptions = [
    {
      value: "25200",
      label: "25200 - Estudios e Investigaciones",
      badge: "Partida",
      group: "Servicios No Personales",
    },
    {
      value: "31110",
      label: "31110 - Gastos por Refrigerios",
      badge: "Partida",
      group: "Materiales y Suministros",
    },
    {
      value: "43110",
      label: "43110 - Equipo de Computación",
      badge: "Partida",
      group: "Activos Reales",
    },
    {
      value: "34110",
      label: "34110 - Combustibles y Lubricantes",
      badge: "Partida",
      group: "Materiales y Suministros",
    },
  ];

  const partidaDropdownItems: DropdownItem[] = useMemo(() => {
    return partidaOptions.map((p) => ({
      id: p.value,
      label: p.label,
      badge: p.badge,
      group: p.group,
    }));
  }, []);

  // Columnas tipadas para el componente DataTable
  const columns: Column<PartidaMock>[] = [
    {
      header: "Código",
      accessor: "codigo",
      width: "90px",
      align: "left",
      render: (row) => (
        <span className="font-mono font-bold text-theme-primary text-xs">{row.codigo}</span>
      ),
    },
    {
      header: "Denominación y Área",
      accessor: "denominacion",
      minWidth: "240px",
      render: (row) => (
        <div>
          <p className="font-semibold text-theme-main leading-tight">{row.denominacion}</p>
          <span className="text-[11px] text-theme-muted font-medium flex items-center gap-1 mt-0.5">
            <Building2 size={11} className="opacity-70" />
            {row.area}
          </span>
        </div>
      ),
    },
    {
      header: "Ppto. Vigente",
      align: "right",
      width: "130px",
      render: (row) => (
        <span className="font-mono font-bold text-theme-main text-xs">
          Bs. {row.vigente.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Ejecutado",
      align: "right",
      width: "120px",
      render: (row) => (
        <span className="font-mono text-theme-muted text-xs">
          Bs. {row.ejecutado.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Disponible / Progreso",
      align: "left",
      width: "170px",
      render: (row) => (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="font-bold text-theme-main">
              Bs. {row.disponible.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-theme-muted">{row.porcentaje}%</span>
          </div>
          <div className="w-full bg-theme-border/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-theme-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${row.porcentaje}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Estado",
      align: "center",
      width: "140px",
      render: (row) => <StatusBadge status={row.estado} size="sm" />,
    },
    {
      header: "Acciones",
      align: "right",
      width: "120px",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Eye size={14} />}
            title="Ver Ficha Técnica"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRowData(row);
              setOpenDetailModal(true);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            icon={<Edit3 size={13} />}
            title="Editar Partida"
            onClick={(e) => {
              e.stopPropagation();
              setOpenFormModal(true);
            }}
          />
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 size={13} />}
            title="Anular / Revertir"
            onClick={(e) => {
              e.stopPropagation();
              setOpenConfirmModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  // Datos filtrados para la tabla
  const filteredData = useMemo(() => {
    if (tableEmpty) return [];
    return PARTIDAS_DEMO.filter((p) => {
      if (activeTabPOA === "aprobadas" && !p.estado.includes("APROBADO")) return false;
      if (activeTabPOA === "revision" && !p.estado.includes("PENDIENTE")) return false;
      if (activeTabPOA === "ejecucion" && p.estado !== "EN_EJECUCION") return false;
      if (
        searchTabs.trim() &&
        !p.codigo.includes(searchTabs) &&
        !p.denominacion.toLowerCase().includes(searchTabs.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [activeTabPOA, searchTabs, tableEmpty]);

  const shouldShowSection = (id: string) => sectionFilter === "todos" || sectionFilter === id;

  return (
    <div
      className={`space-y-8 ${useInverted ? "" : "theme-legacy"} transition-colors duration-200 pb-16`}
    >
      {/* 1. Cabecera Principal del Laboratorio con Switch Invertido y Modo Claro/Oscuro */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-theme-primary/10 text-theme-primary ring-1 ring-theme-primary/25 shrink-0">
              <Palette size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-theme-main">
                  Laboratorio UX / UI — Catálogo Completo
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-theme-primary text-theme-primaryText shadow-xs">
                  Sandbox Oficial
                </span>
              </div>
              <p className="text-xs sm:text-sm text-theme-muted mt-1 max-w-3xl">
                Demostración integral de <strong>todos los componentes consolidados del sistema</strong>{" "}
                (Pestañas, Modales, Filtros avanzados, Tablas tipadas, Selectores de gestión y Formularios) con el{" "}
                <span className="font-bold text-theme-primary">
                  Esquema Cromático Invertido: Azul institucional en modo claro y Amarillo vibrante en modo oscuro
                </span>
                .
              </p>
            </div>
          </div>

          {/* Controles Principales */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-theme-base border border-theme-border text-theme-main hover:bg-theme-border/40 transition-colors shadow-xs"
              title="Cambiar tema de la aplicación"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-blue-600" />}
              <span>{isDark ? "Modo Oscuro" : "Modo Claro"}</span>
            </button>

            <button
              type="button"
              onClick={() => setUseInverted(!useInverted)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                useInverted
                  ? "bg-theme-primary text-theme-primaryText ring-1 ring-theme-primary/30"
                  : "bg-theme-base border border-theme-border text-theme-muted hover:text-theme-main"
              }`}
              title="Alternar entre esquema nuevo y el esquema anterior del sistema"
            >
              <RefreshCw size={14} className={useInverted ? "animate-spin-once" : ""} />
              <span>{useInverted ? "Esquema Nuevo (Activo) ✅" : "Esquema Anterior (Pre-migración)"}</span>
            </button>
          </div>
        </div>

        {/* Barra de Estado Rápido y Métricas */}
        <div className="mt-5 p-3.5 rounded-xl bg-theme-base border border-theme-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-primary ring-4 ring-theme-primary/20 shrink-0" />
            <span className="text-theme-muted">
              Previsualizando:{" "}
              <strong className="text-theme-main">{isDark ? "Modo Oscuro" : "Modo Claro"}</strong> con{" "}
              <strong className="text-theme-primary">
                {useInverted
                  ? isDark
                    ? "Amarillo en letras (#FFCD05) sobre fondo oscuro"
                    : "Azul en letras (#19499C) sobre fondo blanco"
                  : isDark
                  ? "Azul estándar (#19499C) sobre fondo oscuro"
                  : "Amarillo estándar (#FFCD05) sobre fondo blanco"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-theme-muted">Ratio Contraste:</span>
            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
              {isDark ? (useInverted ? "11.2:1 (AAA)" : "1.6:1 (Falla)") : (useInverted ? "8.4:1 (AAA)" : "1.5:1 (Falla)")}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Pestañas de Navegación del Catálogo (Demostración de TabsFilter institucional) */}
      <div className="bg-theme-surface p-2 rounded-2xl border border-theme-border shadow-sm">
        <TabsFilter
          tabs={[
            { id: "todos", label: "Todos los Componentes", icon: <Layers size={15} /> },
            { id: "modales", label: "Modales y Diálogos", icon: <ExternalLink size={15} />, count: 3 },
            { id: "pestanas", label: "Pestañas y Filtros", icon: <SlidersHorizontal size={15} /> },
            { id: "tablas", label: "Tablas y Paginación", icon: <ClipboardList size={15} /> },
            { id: "headers", label: "Cabeceras y Gestión", icon: <Bookmark size={15} /> },
            { id: "botones", label: "Botones y Formularios", icon: <CheckCircle2 size={15} /> },
            { id: "kpis", label: "Tarjetas y KPIs", icon: <Wallet size={15} /> },
            { id: "badges", label: "Insignias y Estados", icon: <Info size={15} /> },
          ]}
          activeTab={sectionFilter}
          onTabChange={setSectionFilter}
          className="!mb-0"
        />
      </div>

      {/* 3. SECCIÓN: Modales y Diálogos (El usuario solicitó explícitamente "modales") */}
      {shouldShowSection("modales") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <ExternalLink size={18} className="text-theme-primary" />
                1. Modales y Diálogos Accesibles (`Modal`)
              </h2>
              <p className="text-xs text-theme-muted">
                Componente oficial con backdrop blur, bloqueo de scroll en el body, soporte de Escape y múltiples tamaños preconfigurados.
              </p>
            </div>
            <span className="text-[11px] font-mono text-theme-muted">3 tipos de modal listos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarjeta Modal 1: Formulario */}
            <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-xl bg-theme-primary/10 text-theme-primary inline-flex mb-3">
                  <Plus size={20} />
                </div>
                <h3 className="text-sm font-bold text-theme-main">Modal de Formulario / Creación</h3>
                <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                  Modal de tamaño grande (`lg`) con campos de entrada, selector de partida presupuestaria y acciones de guardado.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-theme-border">
                <Button
                  variant="primary"
                  className="w-full"
                  icon={<Plus size={15} />}
                  onClick={() => setOpenFormModal(true)}
                >
                  Abrir Modal Formulario
                </Button>
              </div>
            </div>

            {/* Tarjeta Modal 2: Ficha Técnica */}
            <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 inline-flex mb-3">
                  <FileText size={20} />
                </div>
                <h3 className="text-sm font-bold text-theme-main">Modal de Detalle / Ficha Técnica</h3>
                <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                  Modal extra ancho (`xl`) con insignia de estado institucional, pestañas internas, desglose financiero y exportación.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-theme-border">
                <Button
                  variant="outline"
                  className="w-full"
                  icon={<Eye size={15} />}
                  onClick={() => {
                    setSelectedRowData(PARTIDAS_DEMO[0]);
                    setOpenDetailModal(true);
                  }}
                >
                  Abrir Ficha de Detalle
                </Button>
              </div>
            </div>

            {/* Tarjeta Modal 3: Alerta Peligrosa */}
            <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 inline-flex mb-3">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-sm font-bold text-theme-main">Modal de Confirmación / Alerta</h3>
                <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                  Modal compacto (`sm`) para confirmaciones críticas con advertencia presupuestaria y botón destructivo (`danger`).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-theme-border">
                <Button
                  variant="danger"
                  className="w-full"
                  icon={<Trash2 size={15} />}
                  onClick={() => setOpenConfirmModal(true)}
                >
                  Abrir Modal Confirmación
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. SECCIÓN: Pestañas de Filtrado (`TabsFilter`) */}
      {shouldShowSection("pestanas") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-theme-primary" />
                2. Pestañas de Navegación y Filtros (`TabsFilter`)
              </h2>
              <p className="text-xs text-theme-muted">
                Pestañas horizontales con contadores numéricos, borde inferior activo sincronizado al color primario, buscador y select de área.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary">
              Interactivo
            </span>
          </div>

          <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-4">
            <TabsFilter
              tabs={[
                { id: "todas", label: "Todas las Solicitudes", count: 142, icon: <ClipboardList size={15} /> },
                { id: "aprobadas", label: "Aprobadas POA", count: 86, icon: <CheckCircle2 size={15} /> },
                { id: "revision", label: "En Revisión Técnica", count: 34, icon: <Clock size={15} /> },
                { id: "ejecucion", label: "En Ejecución", count: 22, icon: <TrendingUp size={15} /> },
              ]}
              activeTab={activeTabPOA}
              onTabChange={setActiveTabPOA}
              searchTerm={searchTabs}
              onSearchChange={setSearchTabs}
              searchPlaceholder="Filtrar por código o denominación..."
              selectOptions={[
                { value: "planif", label: "Gerencia de Planificación" },
                { value: "finan", label: "Gerencia Administrativa" },
                { value: "tics", label: "Tecnologías de Información" },
              ]}
              selectedValue={selectedAreaTab}
              onSelectChange={setSelectedAreaTab}
              selectPlaceholder="Todas las Gerencias"
              actions={
                <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpenFormModal(true)}>
                  Nuevo Registro
                </Button>
              }
            />

            <div className="p-3 rounded-xl bg-theme-base border border-theme-border text-xs flex items-center justify-between">
              <span className="text-theme-muted">
                Pestaña activa: <strong className="text-theme-primary font-bold uppercase">{activeTabPOA}</strong> |
                Búsqueda: <strong className="text-theme-main">{searchTabs || "(Sin texto)"}</strong>
              </span>
              <span className="text-theme-muted font-mono">{filteredData.length} registros coincidentes</span>
            </div>
          </div>
        </section>
      )}

      {/* 5. SECCIÓN: Panel de Filtros Avanzados (`FilterPanel`) */}
      {shouldShowSection("pestanas") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <Bookmark size={18} className="text-theme-primary" />
                3. Panel Desacoplado de Filtros Avanzados (`FilterPanel`)
              </h2>
              <p className="text-xs text-theme-muted">
                Filtros desacoplados con buscador general, dropdowns buscables de área y partida, y panel retráctil de meses, fechas e importes.
              </p>
            </div>
          </div>

          <FilterPanel
            searchTerm={searchFilterPanel}
            onSearchChange={setSearchFilterPanel}
            searchPlaceholder="Buscar por número de comprobante, glosa o memorándum..."
            areaOptions={areaOptions}
            selectedArea={selectedAreaFilter}
            onAreaChange={setSelectedAreaFilter}
            areaPlaceholder="Todas las Áreas y Gerencias"
            partidaOptions={partidaOptions}
            selectedPartida={selectedPartidaFilter}
            onPartidaChange={setSelectedPartidaFilter}
            partidaPlaceholder="Todas las Partidas Presupuestarias"
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onFechaDesdeChange={setFechaDesde}
            onFechaHastaChange={setFechaHasta}
            mesDesde={mesDesde}
            mesHasta={mesHasta}
            onMesDesdeChange={setMesDesde}
            onMesHastaChange={setMesHasta}
            montoMin={montoMin}
            montoMax={montoMax}
            onMontoMinChange={setMontoMin}
            onMontoMaxChange={setMontoMax}
            gestionAnio={2026}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            actions={
              <Button
                variant="secondary"
                icon={<RefreshCw size={14} />}
                onClick={() => alert("Refrescando datos simulados")}
                title="Refrescar vista"
              />
            }
          />
        </section>
      )}

      {/* 6. SECCIÓN: Tabla de Datos Tipada y Paginación (`DataTable` y `Pagination`) */}
      {shouldShowSection("tablas") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <ClipboardList size={18} className="text-theme-primary" />
                4. Tabla Genérica Tipada y Paginación Oficial (`DataTable` & `Pagination`)
              </h2>
              <p className="text-xs text-theme-muted">
                Tabla accesible con anchos estrictos, alineación monetaria, barras de progreso de avance y estados reactivos.
              </p>
            </div>

            {/* Controles para probar estados de carga y vacío */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTableLoading(!tableLoading)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  tableLoading
                    ? "bg-theme-primary text-theme-primaryText border-theme-primary"
                    : "bg-theme-surface border-theme-border text-theme-muted hover:text-theme-main"
                }`}
              >
                {tableLoading ? "Cargando (ON)" : "Probar Loading"}
              </button>
              <button
                type="button"
                onClick={() => setTableEmpty(!tableEmpty)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                  tableEmpty
                    ? "bg-rose-500 text-white border-rose-500"
                    : "bg-theme-surface border-theme-border text-theme-muted hover:text-theme-main"
                }`}
              >
                {tableEmpty ? "Vacío (ON)" : "Probar Vacío"}
              </button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
            keyExtractor={(row) => row.id}
            loading={tableLoading}
            emptyMessage="No se encontraron partidas para los filtros seleccionados."
            onRowClick={(row) => {
              setSelectedRowData(row);
              setOpenDetailModal(true);
            }}
          />

          <Pagination
            currentPage={currentPage}
            totalItems={42}
            pageSize={6}
            onPageChange={setCurrentPage}
            itemLabel="partidas presupuestarias"
          />
        </section>
      )}

      {/* 7. SECCIÓN: Cabeceras Institucionales y Gestión (`PageHeader` y `GestionSelector`) */}
      {shouldShowSection("headers") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <Bookmark size={18} className="text-theme-primary" />
                5. Cabecera Institucional y Selector de Gestión (`PageHeader` & `GestionSelector`)
              </h2>
              <p className="text-xs text-theme-muted">
                Encabezado oficial con icono destacado, tag temático, subtítulo y selector de año fiscal activo sincronizado.
              </p>
            </div>
          </div>

          <PageHeader
            icon={<Layers size={24} />}
            title="Presupuesto Operativo y Asignación de Techos"
            subtitle="Planificación anual de partidas y techos presupuestarios por área gerencial"
            tag="POA 2026"
            extraInfo="Gestión fiscal abierta para formulación"
            actions={
              <>
                <GestionSelector
                  gestiones={GESTIONES_DEMO}
                  selectedGestionId={selectedGestionId}
                  onSelectGestion={setSelectedGestionId}
                  label="Gestión Activa"
                />
                <Button variant="outline" icon={<Download size={14} />}>
                  Exportar Reporte
                </Button>
                <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpenFormModal(true)}>
                  Nueva Partida
                </Button>
              </>
            }
          />
        </section>
      )}

      {/* 8. SECCIÓN: Tarjetas de Resumen y Métricas (`ResumenCards`) */}
      {shouldShowSection("kpis") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <Wallet size={18} className="text-theme-primary" />
                6. Tarjetas de Resumen y KPIs Institucionales (`ResumenCards`)
              </h2>
              <p className="text-xs text-theme-muted">
                Indicadores financieros con barras de progreso acentuadas con el color invertido y tipografía numérica legible.
              </p>
            </div>
          </div>

          <ResumenCards
            columns={4}
            items={[
              {
                title: "Presupuesto Inicial",
                value: "Bs. 5.200.000,00",
                subtitle: "Base del clasificador",
                icon: <Wallet size={18} />,
                color: "primary",
              },
              {
                title: "Presupuesto Vigente",
                value: "Bs. 5.850.000,00",
                subtitle: "+12.5% por traspasos e incrementos",
                icon: <TrendingUp size={18} />,
                color: "primary",
                progress: {
                  value: 85,
                  label: "85% asignado a memorias",
                  maxLabel: "100%",
                },
              },
              {
                title: "Total Ejecutado",
                value: "Bs. 3.420.000,00",
                subtitle: "Con certificaciones preventivas",
                icon: <Receipt size={18} />,
                color: "emerald",
                progress: {
                  value: 58.4,
                  label: "58.4% ejecutado",
                  maxLabel: "100%",
                },
              },
              {
                title: "Saldo Disponible",
                value: "Bs. 2.430.000,00",
                subtitle: "Techo real remanente",
                icon: <CheckCircle2 size={18} />,
                color: "primary",
                progress: {
                  value: 41.6,
                  label: "41.6% disponible",
                  maxLabel: "100%",
                },
              },
            ]}
          />
        </section>
      )}

      {/* 9. SECCIÓN: Botones Oficiales y Variantes (`Button`) */}
      {shouldShowSection("botones") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <CheckCircle2 size={18} className="text-theme-primary" />
                7. Catálogo Completo de Botones (`Button`)
              </h2>
              <p className="text-xs text-theme-muted">
                Todas las variantes (`primary`, `outline`, `secondary`, `danger`, `ghost`), tamaños y estados de carga.
              </p>
            </div>
          </div>

          <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-6">
            {/* Fila 1: Variantes Principales */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted block mb-2.5">
                Variantes de Estilo
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" icon={<Check size={15} />}>
                  Botón Primario
                </Button>
                <Button variant="outline" icon={<Eye size={15} />}>
                  Botón Outline
                </Button>
                <Button variant="secondary" icon={<SlidersHorizontal size={15} />}>
                  Botón Secundario
                </Button>
                <Button variant="danger" icon={<Trash2 size={15} />}>
                  Botón Peligro
                </Button>
                <Button variant="ghost" icon={<ExternalLink size={15} />}>
                  Botón Ghost
                </Button>
              </div>
            </div>

            {/* Fila 2: Tamaños */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted block mb-2.5">
                Escala de Tamaños
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary" icon={<Check size={13} />}>
                  Pequeño (sm)
                </Button>
                <Button size="md" variant="primary" icon={<Check size={15} />}>
                  Mediano (md - Estándar)
                </Button>
                <Button size="lg" variant="primary" icon={<Check size={17} />}>
                  Grande (lg)
                </Button>
                <Button size="sm" variant="outline" icon={<Eye size={14} />} />
                <Button size="md" variant="outline" icon={<Eye size={16} />} />
                <Button size="lg" variant="outline" icon={<Eye size={18} />} />
              </div>
            </div>

            {/* Fila 3: Estados de Carga y Deshabilitado */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted block mb-2.5">
                Estados Asíncronos
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" loading={true}>
                  Procesando Aprobación
                </Button>
                <Button variant="outline" loading={true}>
                  Cargando Datos
                </Button>
                <Button variant="primary" disabled={true} icon={<Check size={15} />}>
                  Deshabilitado
                </Button>
                <Button variant="danger" disabled={true} icon={<Trash2 size={15} />}>
                  Acción Bloqueada
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. SECCIÓN: Formularios, Inputs y Dropdowns */}
      {shouldShowSection("botones") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <Edit3 size={18} className="text-theme-primary" />
                8. Controles de Entrada y Menús Desplegables (`Dropdown` & Form Controls)
              </h2>
              <p className="text-xs text-theme-muted">
                Inputs estilizados con mayúsculas institucionales, buscador con icono, montos con prefijo y selector con autocompletado.
              </p>
            </div>
          </div>

          <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                  Texto en Mayúsculas Institucional
                </label>
                <input
                  type="text"
                  value={sampleTextInput}
                  onChange={(e) => setSampleTextInput(e.target.value)}
                  className="input-theme"
                  placeholder="Escribir aquí..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                  Monto con Prefijo de Moneda
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-theme-primary">
                    Bs.
                  </span>
                  <input
                    type="text"
                    value={sampleAmountInput}
                    onChange={(e) => setSampleAmountInput(e.target.value)}
                    className="input-theme pl-10 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                  Dropdown Avanzado con Búsqueda
                </label>
                <Dropdown
                  items={[
                    { id: "rep_mensual", label: "Reporte Mensual de Ejecución", badge: "PDF" },
                    { id: "rep_acumulado", label: "Reporte Acumulado de Techos", badge: "Excel" },
                    { id: "rep_traspasos", label: "Bitácora de Modificaciones", badge: "Audit" },
                    { id: "rep_certificaciones", label: "Certificaciones Emitidas", badge: "POA" },
                  ]}
                  value={selectedDropdownVal}
                  onChange={(val) => setSelectedDropdownVal(String(val))}
                  searchable={true}
                  searchPlaceholder="Buscar tipo de reporte..."
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Área de Texto (Textarea)
              </label>
              <textarea
                value={sampleTextArea}
                onChange={(e) => setSampleTextArea(e.target.value)}
                rows={2}
                className="input-theme"
              />
            </div>
          </div>
        </section>
      )}

      {/* 11. SECCIÓN: Insignias de Estado (`StatusBadge`) y Banners de Alerta */}
      {shouldShowSection("badges") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <div>
              <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
                <Info size={18} className="text-theme-primary" />
                9. Insignias de Estado (`StatusBadge`) y Alertas del Sistema
              </h2>
              <p className="text-xs text-theme-muted">
                Catálogo institucional de los 12 estados del flujo presupuestario y banners de retroalimentación para el usuario.
              </p>
            </div>
          </div>

          {/* Insignias */}
          <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted block">
              Catálogo de Estados Oficiales del POA
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status="BORRADOR" />
              <StatusBadge status="PENDIENTE_GERENCIA" />
              <StatusBadge status="PENDIENTE_PLANIFICACION" />
              <StatusBadge status="PENDIENTE_PRESUPUESTOS" />
              <StatusBadge status="PENDIENTE_TESORERIA" />
              <StatusBadge status="APROBADO_GERENCIA" />
              <StatusBadge status="APROBADO" />
              <StatusBadge status="OBSERVADO" />
              <StatusBadge status="RECHAZADO" />
              <StatusBadge status="FORMULACION" />
              <StatusBadge status="EN_EJECUCION" />
              <StatusBadge status="FINALIZADO" />
            </div>
          </div>

          {/* Banners de Alerta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3 text-xs">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-300">Aprobación Técnica Confirmada</p>
                <p className="text-emerald-700 dark:text-emerald-400/90 mt-0.5">
                  La memoria de cálculo ha superado el doble control y cuenta con saldo disponible suficiente en la partida.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300">Alerta de Techo Presupuestario</p>
                <p className="text-amber-700 dark:text-amber-400/90 mt-0.5">
                  El saldo disponible actual de la partida seleccionada se encuentra al 87% del límite comprometido.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODALES INTERACTIVOS (Renderizados para que el usuario pueda abrirlos) */}
      {/* ========================================================================= */}

      {/* 1. Modal de Formulario */}
      <Modal
        isOpen={openFormModal}
        onClose={() => setOpenFormModal(false)}
        title="Nuevo Requerimiento de Gasto POA"
        subtitle="Formulación presupuestaria para la gestión fiscal activa"
        icon={<Plus size={20} />}
        badge={<StatusBadge status="BORRADOR" size="sm" />}
        size="lg"
        className={useInverted ? "" : "theme-legacy"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenFormModal(false)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => setOpenFormModal(false)}>
              Guardar Borrador
            </Button>
            <Button
              variant="primary"
              icon={<Check size={15} />}
              onClick={() => {
                alert("¡Requerimiento guardado satisfactoriamente!");
                setOpenFormModal(false);
              }}
            >
              Aprobar y Registrar
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Código de Partida *
              </label>
              <Dropdown
                items={partidaDropdownItems}
                value="25200"
                onChange={() => null}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Unidad Responsable *
              </label>
              <input
                type="text"
                readOnly
                value="GERENCIA DE PLANIFICACIÓN"
                className="input-theme bg-theme-base/60 text-theme-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
              Detalle y Justificación Técnica *
            </label>
            <textarea
              rows={3}
              className="input-theme"
              placeholder="Describa el objetivo operativo y la justificación institucional..."
              defaultValue="CONTRATACIÓN DE SERVICIOS ESPECIALIZADOS PARA LA EVALUACIÓN INTERMEDIA DEL PLAN ESTRATÉGICO INSTITUCIONAL."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Cantidad Estimada
              </label>
              <input type="number" defaultValue={1} className="input-theme font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Unidad de Medida
              </label>
              <input type="text" defaultValue="SERVICIO" className="input-theme" />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted mb-1.5 uppercase tracking-wider">
                Costo Total (Bs.)
              </label>
              <input
                type="text"
                defaultValue="45.000,00"
                className="input-theme font-mono font-bold text-theme-primary"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-theme-primary/10 border border-theme-primary/20 flex items-center justify-between">
            <span className="font-semibold text-theme-main">Impacto en Techo Presupuestario:</span>
            <span className="font-bold text-base font-mono text-theme-primary">Bs. 45.000,00</span>
          </div>
        </div>
      </Modal>

      {/* 2. Modal de Detalle / Ficha Técnica */}
      <Modal
        isOpen={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        title={
          selectedRowData
            ? `Partida ${selectedRowData.codigo} — ${selectedRowData.denominacion}`
            : "Ficha Técnica de Partida"
        }
        subtitle="Registro detallado de techos presupuestarios y nivel de ejecución acumulado"
        icon={<FileText size={20} />}
        badge={<StatusBadge status={selectedRowData?.estado || "APROBADO"} size="sm" />}
        size="xl"
        className={useInverted ? "" : "theme-legacy"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenDetailModal(false)}>
              Cerrar Ficha
            </Button>
            <Button variant="outline" icon={<Download size={14} />}>
              Descargar Extracto (PDF)
            </Button>
            <Button
              variant="primary"
              icon={<Edit3 size={14} />}
              onClick={() => {
                setOpenDetailModal(false);
                setOpenFormModal(true);
              }}
            >
              Modificar Partida
            </Button>
          </>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Tarjetas KPI en el Modal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-[10px] uppercase tracking-wider text-theme-muted font-bold block">
                Presupuesto Inicial
              </span>
              <p className="text-base font-bold font-mono text-theme-main mt-0.5">
                Bs. {selectedRowData?.inicial.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-[10px] uppercase tracking-wider text-theme-muted font-bold block">
                Presupuesto Vigente
              </span>
              <p className="text-base font-bold font-mono text-theme-primary mt-0.5">
                Bs. {selectedRowData?.vigente.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-[10px] uppercase tracking-wider text-theme-muted font-bold block">
                Monto Ejecutado
              </span>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                Bs. {selectedRowData?.ejecutado.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-theme-base border border-theme-border">
              <span className="text-[10px] uppercase tracking-wider text-theme-muted font-bold block">
                Saldo Disponible
              </span>
              <p className="text-base font-bold font-mono text-theme-main mt-0.5">
                Bs. {selectedRowData?.disponible.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Tabla de Requerimientos dentro del Modal */}
          <div className="border border-theme-border rounded-xl overflow-hidden">
            <div className="bg-theme-base/60 p-2.5 border-b border-theme-border font-bold text-[11px] text-theme-muted uppercase tracking-wider">
              Ítems y Requerimientos Asociados en la Memoria
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-theme-border bg-theme-base/30 text-[10px] text-theme-muted uppercase">
                <tr>
                  <th className="py-2 px-3">Requerimiento</th>
                  <th className="py-2 px-3 text-center">Unidad</th>
                  <th className="py-2 px-3 text-right">Importe</th>
                  <th className="py-2 px-3 text-center">Estado Ítem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-theme-main">
                    Consultor Especialista en Arquitectura de Software
                  </td>
                  <td className="py-2.5 px-3 text-center text-theme-muted">Mes</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-theme-main">Bs. 120.000,00</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      EJECUTADO
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-theme-main">
                    Auditoría Informática Forense y Seguridad Perimetral
                  </td>
                  <td className="py-2.5 px-3 text-center text-theme-muted">Servicio</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-theme-main">Bs. 85.000,00</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">
                      EN_PROCESO
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* 3. Modal de Confirmación Crítica */}
      <Modal
        isOpen={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="Confirmar Anulación de Certificación"
        subtitle="Esta operación revertirá el saldo comprometido al presupuesto disponible"
        icon={<AlertTriangle size={20} className="text-rose-500" />}
        size="sm"
        className={useInverted ? "" : "theme-legacy"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenConfirmModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => {
                alert("Certificación preventiva anulada con éxito.");
                setOpenConfirmModal(false);
              }}
            >
              Sí, Anular Definitivamente
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-theme-main leading-relaxed">
            ¿Está seguro de que desea anular la <strong>Certificación POA #CERT-2026-0042</strong> por un importe de{" "}
            <strong className="text-rose-600 font-mono">Bs. 185.000,00</strong> correspondiente a la partida{" "}
            <strong>25200</strong>?
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert size={14} /> Advertencia de Control Interno
            </p>
            <p className="text-[11px] mt-1 leading-normal">
              Esta acción quedará asentada en la bitácora inmutable de auditoría con su usuario y marca de tiempo.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
