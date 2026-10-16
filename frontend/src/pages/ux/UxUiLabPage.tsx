import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Button } from "../../components/commons/Button";
import { StatusBadge } from "../../components/commons/StatusBadge";
import { ResumenCards } from "../../components/commons/ResumenCards";
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
} from "lucide-react";

export default function UxUiLabPage() {
  const { theme, setTheme } = useTheme();
  const [useInverted, setUseInverted] = useState(true);
  const [sampleInput, setSampleInput] = useState("SERVICIOS DE CONSULTORÍA EN SISTEMAS");
  const [sampleNumber, setSampleNumber] = useState("250000");

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className={`space-y-6 ${useInverted ? "ux-ui-lab" : ""} transition-colors duration-200`}>
      {/* 1. Cabecera del Laboratorio con Controles Interactivos */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-theme-primary/10 text-theme-primary ring-1 ring-theme-primary/25 shrink-0">
              <Palette size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-theme-main">
                  Laboratorio UX / UI
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-theme-primary text-theme-primaryText shadow-xs">
                  Pruebas de Color
                </span>
              </div>
              <p className="text-xs sm:text-sm text-theme-muted mt-1 max-w-2xl">
                Espacio experimental para validar la visibilidad y contraste cromático. En este apartado{" "}
                <span className="font-semibold text-theme-main">
                  invertimos los colores: Azul institucional en modo claro y Amarillo vibrante en modo oscuro
                </span>{" "}
                para resolver la pérdida de contraste sobre blanco y fondos oscuros.
              </p>
            </div>
          </div>

          {/* Botones de Control de Prueba */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Tema (Claro / Oscuro) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-theme-base border border-theme-border text-theme-main hover:bg-theme-border/40 transition-colors shadow-xs"
              title="Cambiar tema de la aplicación"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-blue-600" />}
              <span>{isDark ? "Modo Oscuro" : "Modo Claro"}</span>
            </button>

            {/* Toggle Comparativo: Invertido vs Estándar */}
            <button
              type="button"
              onClick={() => setUseInverted(!useInverted)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                useInverted
                  ? "bg-theme-primary text-theme-primaryText ring-1 ring-theme-primary/30"
                  : "bg-theme-base border border-theme-border text-theme-muted hover:text-theme-main"
              }`}
              title="Alternar entre esquema invertido y original del sistema"
            >
              <RefreshCw size={14} className={useInverted ? "animate-spin-once" : ""} />
              <span>{useInverted ? "Inversión Activada ✅" : "Esquema Original"}</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo del Estado Actual */}
        <div className="mt-5 p-3.5 rounded-xl bg-theme-base border border-theme-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-theme-primary ring-4 ring-theme-primary/20 shrink-0" />
            <span className="text-theme-muted">
              Estado activo:{" "}
              <strong className="text-theme-main">
                {isDark ? "Modo Oscuro" : "Modo Claro"}
              </strong>{" "}
              con{" "}
              <strong className="text-theme-main">
                {useInverted ? "Colores Invertidos (Azul en claro / Amarillo en oscuro)" : "Colores Originales del Sistema"}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-theme-muted">Color primario / letras:</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-theme-primary text-theme-primaryText">
              <span>{isDark ? (useInverted ? "#FFCD05 (Amarillo)" : "#19499C (Azul)") : (useInverted ? "#19499C (Azul)" : "#FFCD05 (Amarillo)")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Comparativa Didáctica de Contraste y Accesibilidad (WCAG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Caso Modo Claro */}
        <div className={`card p-4 sm:p-5 rounded-2xl border transition-all ${!isDark ? "ring-2 ring-theme-primary/40" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sun size={18} className="text-amber-500" />
              <h2 className="text-sm font-bold text-theme-main">Modo Claro (Fondo Blanco)</h2>
            </div>
            {!isDark && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-theme-primary/10 text-theme-primary">
                Modo actual
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-500">Esquema Original: Amarillo sobre Blanco</p>
                <p className="text-[11px] text-slate-400">Ratio de contraste 1.5:1 — Ilegible</p>
              </div>
              <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
                <AlertTriangle size={13} /> Falla WCAG
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-900">Propuesta Invertida: Azul sobre Blanco</p>
                <p className="text-[11px] text-blue-700">Ratio de contraste 8.4:1 — Alta definición</p>
              </div>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-md border border-emerald-300">
                <CheckCircle2 size={13} /> Cumple AAA
              </span>
            </div>
          </div>
        </div>

        {/* Caso Modo Oscuro */}
        <div className={`card p-4 sm:p-5 rounded-2xl border transition-all ${isDark ? "ring-2 ring-theme-primary/40" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon size={18} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-theme-main">Modo Oscuro (Fondo Grafito)</h2>
            </div>
            {isDark && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-theme-primary/10 text-theme-primary">
                Modo actual
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-400">Esquema Original: Azul oscuro sobre Fondo oscuro</p>
                <p className="text-[11px] text-slate-500">Ratio de contraste 1.6:1 — Se pierde en la oscuridad</p>
              </div>
              <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-950/40 px-2 py-1 rounded-md border border-rose-900/60">
                <AlertTriangle size={13} /> Falla WCAG
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-300">Propuesta Invertida: Amarillo vibrante sobre Oscuro</p>
                <p className="text-[11px] text-amber-200/70">Ratio de contraste 11.2:1 — Resalta con claridad</p>
              </div>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-800/60">
                <CheckCircle2 size={13} /> Cumple AAA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pruebas de Letras y Tipografía (El requerimiento principal del usuario) */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-theme-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-theme-main flex items-center gap-2">
              <Sparkles size={17} className="text-theme-primary" />
              Prueba de Letras y Textos de Acento
            </h2>
            <p className="text-xs text-theme-muted">
              Observa cómo se ven los títulos, importes numéricos y etiquetas cuando las letras toman el color invertido.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-theme-primary/10 text-theme-primary">
            {isDark ? "Letras en Amarillo ✨" : "Letras en Azul Institucional 🏛️"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Muestra 1: Cifras y Montos Financieros */}
          <div className="p-4 rounded-xl bg-theme-base border border-theme-border">
            <span className="text-[11px] uppercase tracking-wider text-theme-muted font-bold block mb-1">
              Cifra de Presupuesto Vigente
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-primary font-display">
              Bs. 1.845.200,50
            </p>
            <p className="text-xs text-theme-muted mt-1">
              Texto con clase <code className="font-mono text-[11px] text-theme-main">text-theme-primary</code>
            </p>
          </div>

          {/* Muestra 2: Títulos de Partida y Código */}
          <div className="p-4 rounded-xl bg-theme-base border border-theme-border">
            <span className="text-[11px] uppercase tracking-wider text-theme-muted font-bold block mb-1">
              Partida 25200 - Estudios e Inv.
            </span>
            <p className="text-lg font-bold text-theme-primary leading-snug">
              Auditoría Externa y Consultoría Estratégica
            </p>
            <p className="text-xs text-theme-muted mt-1">
              Letras con legibilidad optimizada sobre cualquier fondo.
            </p>
          </div>

          {/* Muestra 3: Enlaces y Elementos Interactivos */}
          <div className="p-4 rounded-xl bg-theme-base border border-theme-border flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-theme-muted font-bold block mb-1">
                Acción / Enlace Destacado
              </span>
              <button
                type="button"
                className="text-sm font-bold text-theme-primary hover:underline flex items-center gap-1.5 transition-colors"
              >
                <span>Ver desglose completo de memorias</span>
                <ArrowRight size={14} />
              </button>
            </div>
            <span className="text-[11px] text-theme-muted mt-3 block">
              Enlace con foco y hover sincronizados al esquema invertido.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tarjetas de Resumen KPI (ResumenCards) con Colores Invertidos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-theme-muted">
            Tarjetas de Indicadores Institucionales (KPIs)
          </h2>
          <span className="text-xs text-theme-muted">
            Renderizadas usando el componente oficial <code className="font-mono text-[11px]">ResumenCards</code>
          </span>
        </div>

        <ResumenCards
          columns={4}
          items={[
            {
              title: "Presupuesto Inicial",
              value: "Bs. 5.200.000",
              subtitle: "Aprobado en POA 2026",
              icon: <Wallet size={18} />,
              color: "primary",
            },
            {
              title: "Presupuesto Vigente",
              value: "Bs. 5.850.000",
              subtitle: "+12.5% modificaciones",
              icon: <TrendingUp size={18} />,
              color: "primary",
              progress: {
                value: 85,
                label: "85% asignado",
                maxLabel: "100%",
              },
            },
            {
              title: "Total Ejecutado",
              value: "Bs. 3.420.000",
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
              value: "Bs. 2.430.000",
              subtitle: "Techo remanente real",
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
      </div>

      {/* 5. Muestrario de Botones (Button Component) */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <h2 className="text-base font-bold text-theme-main mb-1">
          Variantes del Componente Oficial Button
        </h2>
        <p className="text-xs text-theme-muted mb-4">
          El botón primario toma automáticamente el color invertido con su texto de alto contraste correspondiente.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={<Check size={16} />}>
            Botón Primario
          </Button>

          <Button variant="outline" icon={<Eye size={16} />}>
            Botón Outline
          </Button>

          <Button variant="secondary" icon={<SlidersHorizontal size={16} />}>
            Botón Secundario
          </Button>

          <Button variant="ghost">
            Botón Ghost
          </Button>

          <Button variant="danger">
            Botón Peligro
          </Button>

          <Button variant="primary" loading={true}>
            Guardando
          </Button>

          <Button variant="primary" disabled={true}>
            Deshabilitado
          </Button>
        </div>
      </div>

      {/* 6. Formulario e Inputs de Prueba */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <h2 className="text-base font-bold text-theme-main mb-1">
          Campos de Formulario y Búsqueda
        </h2>
        <p className="text-xs text-theme-muted mb-4">
          Verifica cómo el anillo de enfoque (focus ring) y los acentos responden al color invertido.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-theme-muted mb-1.5 uppercase tracking-wider">
              Buscador de Ítems / Requerimientos
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted"
              />
              <input
                type="text"
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                placeholder="Buscar requerimiento..."
                className="input-theme pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-muted mb-1.5 uppercase tracking-wider">
              Monto Estimado de Partida (Bs.)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-theme-primary">
                Bs.
              </span>
              <input
                type="text"
                value={sampleNumber}
                onChange={(e) => setSampleNumber(e.target.value)}
                className="input-theme pl-10 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. Insignias de Estado (StatusBadge) */}
      <div className="card p-5 sm:p-6 bg-theme-surface border border-theme-border rounded-2xl shadow-sm">
        <h2 className="text-base font-bold text-theme-main mb-1">
          Insignias de Estado (StatusBadge)
        </h2>
        <p className="text-xs text-theme-muted mb-4">
          Verificación de compatibilidad con los estados institucionales del POA.
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status="APROBADO" />
          <StatusBadge status="PENDIENTE_PLANIFICACION" />
          <StatusBadge status="PENDIENTE_GERENCIA" />
          <StatusBadge status="PENDIENTE_TESORERIA" />
          <StatusBadge status="BORRADOR" />
          <StatusBadge status="RECHAZADO" />
          <StatusBadge status="EN_EJECUCION" />
          <StatusBadge status="FINALIZADO" />
        </div>
      </div>

      {/* 8. Tabla de Datos Simulada */}
      <div className="card p-5 bg-theme-surface border border-theme-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-theme-main">
            Previsualización en Tabla de Partidas
          </h2>
          <span className="text-xs text-theme-muted font-medium">3 registros de prueba</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-theme-base border-b border-theme-border text-theme-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Denominación</th>
                <th className="py-2.5 px-3 text-right">Presupuesto Vigente</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/60">
              <tr className="hover:bg-theme-base/50 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-theme-primary">25200</td>
                <td className="py-3 px-3 font-medium text-theme-main">Estudios, Investigaciones y Proyectos</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-theme-main">Bs. 450.000,00</td>
                <td className="py-3 px-3 text-center"><StatusBadge status="APROBADO" size="sm" /></td>
                <td className="py-3 px-3 text-right">
                  <button className="font-semibold text-theme-primary hover:underline">Gestionar</button>
                </td>
              </tr>
              <tr className="hover:bg-theme-base/50 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-theme-primary">31110</td>
                <td className="py-3 px-3 font-medium text-theme-main">Material de Escritorio y Útiles de Oficina</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-theme-main">Bs. 120.000,00</td>
                <td className="py-3 px-3 text-center"><StatusBadge status="PENDIENTE_PLANIFICACION" size="sm" /></td>
                <td className="py-3 px-3 text-right">
                  <button className="font-semibold text-theme-primary hover:underline">Gestionar</button>
                </td>
              </tr>
              <tr className="hover:bg-theme-base/50 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-theme-primary">43110</td>
                <td className="py-3 px-3 font-medium text-theme-main">Equipo de Computación y Comunicación</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-theme-main">Bs. 780.000,00</td>
                <td className="py-3 px-3 text-center"><StatusBadge status="EN_EJECUCION" size="sm" /></td>
                <td className="py-3 px-3 text-right">
                  <button className="font-semibold text-theme-primary hover:underline">Gestionar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
