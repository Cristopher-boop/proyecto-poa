import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  WalletCards,
  TrendingDown,
  Building2,
  FileText,
  Lock,
  ArrowRight,
  Plus,
  Calendar,
  CheckCircle2,
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [activeGestion, setActiveGestion] = useState<Gestion | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoArea[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const formatMoney = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 2,
    }).format(num || 0);
  };

  const totalInicial = (Array.isArray(presupuestos) ? presupuestos : []).reduce((acc, p) => acc + parseFloat(p.monto_inicial || "0"), 0);
  const totalEjecutado = (Array.isArray(gastos) ? gastos : []).reduce((acc, g) => acc + parseFloat(String(g.monto_ejecutado) || "0"), 0);
  const totalDisponible = Math.max(0, totalInicial - totalEjecutado);
  const pctEjecucion = totalInicial > 0 ? Math.round((totalEjecutado / totalInicial) * 10000) / 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-main tracking-tight">Dashboard General POA</h2>
          <p className="text-sm text-theme-muted">
            Monitoreo en tiempo real del estado de formulación, consolidación y ejecución presupuestaria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-theme-surface border border-theme-border px-3 py-1.5 rounded-xl text-xs font-semibold text-theme-main">
            <Calendar size={15} className="text-theme-muted" />
            <span>Gestión {activeGestion?.anio || 2026}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-primary/20 text-theme-main font-bold">
              {activeGestion?.estado_display || "En Formulación"}
            </span>
          </div>

          <button
            onClick={() => navigate("/presupuestos")}
            className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
          >
            Ir a Presupuestos <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Presupuesto Inicial Consolidado</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <WalletCards size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-theme-main mt-3 tracking-tight">{formatMoney(totalInicial)}</p>
          <p className="text-xs text-theme-muted mt-1">{presupuestos.length} áreas con techo asignado</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Gastos Ejecutados Reales</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-3 tracking-tight">
            {formatMoney(totalEjecutado)}
          </p>
          <p className="text-xs text-theme-muted mt-1">{gastos.length} comprobante(s) procesados</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Saldo Disponible ($Monto\_Actual$)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 tracking-tight">
            {formatMoney(totalDisponible)}
          </p>
          <p className="text-xs text-theme-muted mt-1">Fondos libres para operar</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">% Ejecutado</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-theme-main tracking-tight">{pctEjecucion}%</span>
            <span className="text-xs text-theme-muted">del total</span>
          </div>
          <div className="w-full bg-theme-border/60 rounded-full h-2 mt-2 overflow-hidden">
            <div className="h-full bg-theme-primary transition-all duration-500" style={{ width: `${pctEjecucion}%` }} />
          </div>
        </div>
      </div>

      {/* Secciones Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Techos por Área */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="p-5 border-b border-theme-border flex justify-between items-center bg-theme-base/40">
            <div>
              <h3 className="text-sm font-bold text-theme-main">Presupuesto por Gerencia / Área</h3>
              <p className="text-xs text-theme-muted">Resumen de techos y saldo disponible</p>
            </div>
            <button
              onClick={() => navigate("/presupuestos")}
              className="text-xs font-semibold text-theme-primary hover:underline flex items-center gap-1"
            >
              Ver detalle <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-theme-border bg-theme-base/60 font-semibold text-theme-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Área</th>
                  <th className="py-3 px-4 text-right">Inicial</th>
                  <th className="py-3 px-4 text-right">Ejecutado</th>
                  <th className="py-3 px-4 text-right">Disponible</th>
                  <th className="py-3 px-4 text-center">Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {presupuestos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-theme-muted">
                      No hay presupuestos consolidados en esta gestión.
                    </td>
                  </tr>
                ) : (
                  presupuestos.map((p) => (
                    <tr key={p.id} className="hover:bg-theme-border/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-theme-main">{p.area_nombre}</span>
                        <span className="text-[10px] text-theme-muted ml-2 font-mono">({p.area_codigo})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{formatMoney(p.monto_inicial)}</td>
                      <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-medium">
                        {formatMoney(p.monto_ejecutado)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(p.monto_actual)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-theme-border text-theme-main">
                          {p.porcentaje_ejecucion}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones Rápidas del Flujo */}
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-theme-main mb-1">Flujo Operativo del POA</h3>
            <p className="text-xs text-theme-muted">Accesos directos según las 3 fases del negocio:</p>

            <div className="mt-4 space-y-3">
              <div
                onClick={() => navigate("/presupuestos")}
                className="p-3 rounded-xl border border-theme-border hover:border-theme-primary bg-theme-base/60 cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-theme-main">
                  <FileText size={15} className="text-theme-primary" />
                  <span>1. Formulación de Memorias</span>
                </div>
                <p className="text-[11px] text-theme-muted mt-1">
                  Redacción de solicitudes ítem por ítem asociadas a partidas de gasto y aprobaciones por gerencia.
                </p>
              </div>

              <div
                onClick={() => navigate("/presupuestos")}
                className="p-3 rounded-xl border border-theme-border hover:border-theme-primary bg-theme-base/60 cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-theme-main">
                  <Lock size={15} className="text-amber-500" />
                  <span>2. Cierre y Consolidación</span>
                </div>
                <p className="text-[11px] text-theme-muted mt-1">
                  Bloqueo de memorias en Septiembre y consolidación del Presupuesto Inicial ($Monto\_Inicial$) por área.
                </p>
              </div>

              <div
                onClick={() => navigate("/presupuestos")}
                className="p-3 rounded-xl border border-theme-border hover:border-theme-primary bg-theme-base/60 cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-theme-main">
                  <TrendingDown size={15} className="text-rose-500" />
                  <span>3. Ejecución en Tiempo Real</span>
                </div>
                <p className="text-[11px] text-theme-muted mt-1">
                  Registro formal de facturas/comprobantes con resta automática del presupuesto disponible ($Monto\_Actual$).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-theme-border text-center">
            <button
              onClick={() => navigate("/presupuestos")}
              className="btn-primary w-full text-xs font-semibold py-2.5"
            >
              Abrir Módulo de Presupuestos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
