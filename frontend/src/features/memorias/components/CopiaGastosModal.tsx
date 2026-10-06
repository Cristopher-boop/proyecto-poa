import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Zap,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  X,
  Layers,
  Building,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { memoriasApi } from '../api/memoriasApi';
import { Dropdown, type DropdownItem } from '../../../components/commons';
import alertService from '../../../utils/alerts';

interface CopiaGastosModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGestion: any;
  gestiones: any[];
  user: any;
  currentAreaId?: string | number;
  onOpenEditor: (origenGestionId: number) => void;
  onSuccess: () => void;
}

export const CopiaGastosModal: React.FC<CopiaGastosModalProps> = ({
  isOpen,
  onClose,
  activeGestion,
  gestiones = [],
  user,
  currentAreaId,
  onOpenEditor,
  onSuccess,
}) => {
  // Gestión anterior por defecto
  const defaultOrigenId = useMemo(() => {
    if (!activeGestion) return gestiones[0]?.id || null;
    const anioActivo = Number(activeGestion.anio);
    const anteriores = gestiones
      .filter((g) => Number(g.anio) < anioActivo)
      .sort((a, b) => Number(b.anio) - Number(a.anio));
    return anteriores.length > 0 ? anteriores[0].id : gestiones[0]?.id || null;
  }, [activeGestion, gestiones]);

  const [selectedOrigenId, setSelectedOrigenId] = useState<number | null>(defaultOrigenId);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [memoriasOrigen, setMemoriasOrigen] = useState<any[]>([]);

  // Opciones para el Dropdown de Gestiones
  const gestionesDisponibles = useMemo((): DropdownItem[] => {
    return gestiones
      .filter((g) => g.id !== activeGestion?.id)
      .map((g) => ({
        id: g.id,
        label: `Gestión ${g.anio}`,
        badge: g.estado_display || (g.estado ? g.estado.replace(/_/g, ' ') : undefined),
      }));
  }, [gestiones, activeGestion]);

  // Cargar memorias de la gestión seleccionada para mostrar estadísticas previas
  useEffect(() => {
    if (!selectedOrigenId) return;

    let isMounted = true;
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const data = await memoriasApi.getLibroGestion(selectedOrigenId, currentAreaId);
        if (isMounted) {
          setMemoriasOrigen(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error al cargar datos de gestión origen:', err);
        if (isMounted) setMemoriasOrigen([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargarDatos();
    return () => {
      isMounted = false;
    };
  }, [selectedOrigenId, currentAreaId]);

  const gestionOrigenObj = gestiones.find((g) => g.id === selectedOrigenId);
  const anioOrigen = gestionOrigenObj?.anio || 'Anterior';
  const anioDestino = activeGestion?.anio || new Date().getFullYear();

  // Estadísticas del lote
  const totalMcs = memoriasOrigen.length;
  const totalItems = useMemo(() => {
    return memoriasOrigen.reduce((acc, m) => acc + (m.detalles?.length || 0), 0);
  }, [memoriasOrigen]);

  const montoTotal = useMemo(() => {
    return memoriasOrigen.reduce((acc, m) => {
      const tot = (m.detalles || []).reduce((subAcc: number, d: any) => {
        return subAcc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0);
      }, 0);
      return acc + tot;
    }, 0);
  }, [memoriasOrigen]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(val || 0);
  };

  const areaNombre = user?.area_nombre || (memoriasOrigen[0]?.area_nombre) || 'Área Institucional';

  // Opción 1: Duplicar todo de golpe
  const handleDuplicarDeGolpe = async () => {
    if (totalMcs === 0) {
      alertService.info('Sin registros', `No existen memorias de cálculo en la Gestión ${anioOrigen} para copiar.`);
      return;
    }

    const confirmed = await alertService.confirm({
      title: '¿Confirmar Duplicación de Memorias en Lote?',
      text: `Se duplicarán ${totalMcs} memorias de cálculo (${totalItems} ítems presupuestados) por un valor base total de ${formatMoney(montoTotal)} hacia la Gestión ${anioDestino}. Se registrarán en estado Borrador para su posterior edición.`,
      confirmButtonText: `Sí, duplicar todo (${totalMcs} MCs)`,
      cancelButtonText: 'Cancelar',
    });

    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await memoriasApi.duplicarMasivo({
        gestion_origen: selectedOrigenId!,
        gestion_destino: activeGestion.id,
      });

      alertService.success('¡Duplicación Completada!', res.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al duplicar de golpe:', err);
      alertService.error('Error', err?.response?.data?.error || 'No se pudo realizar la duplicación de memorias.');
    } finally {
      setActionLoading(false);
    }
  };

  // Opción 2: Abrir editor uno a uno
  const handleEditarUnoAUno = () => {
    if (totalMcs === 0) {
      alertService.info('Sin registros', `No existen memorias en la Gestión ${anioOrigen} para editar.`);
      return;
    }
    onOpenEditor(selectedOrigenId!);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card w-full max-w-2xl bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-theme-border bg-theme-base/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <Copy size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-theme-main">
                  Duplicar Memorias de la Gestión Anterior
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border text-theme-muted flex items-center gap-1">
                  <Building size={11} /> {areaNombre}
                </span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5">
                Genere las memorias de cálculo para la nueva gestión duplicando lo trabajado anteriormente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="p-1.5 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          {/* Selector de Flujo de Gestión con Dropdown y Flecha con Borde Azul */}
          <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/40 dark:border-blue-500/50 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted block">
              Flujo de Gestiones Presupuestarias
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {/* Origen */}
              <div className="flex-1 min-w-[200px]">
                <Dropdown
                  items={gestionesDisponibles}
                  value={selectedOrigenId}
                  onChange={(val) => setSelectedOrigenId(Number(val))}
                  placeholder="Seleccione gestión base..."
                  icon={<Calendar size={14} className="text-theme-muted" />}
                  size="sm"
                  searchable={false}
                />
              </div>

              {/* Flecha indicadora */}
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 px-2 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-theme-muted hidden sm:inline">Copia hacia</span>
                <ArrowRight size={18} />
              </div>

              {/* Destino con Borde Azul */}
              <div className="flex-1 min-w-[160px] px-3.5 py-2 rounded-xl bg-theme-surface border border-blue-500/40 dark:border-blue-500/50 text-xs flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-theme-muted block font-semibold">Destino Activo</span>
                  <span className="font-bold text-theme-main text-sm">Gestión {anioDestino}</span>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Año Entrante
                </span>
              </div>
            </div>
          </div>

          {/* Resumen de Datos Detectados */}
          {loading ? (
            <div className="py-8 text-center space-y-2">
              <RefreshCw size={22} className="animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
              <p className="text-xs text-theme-muted font-medium">Consultando memorias de la Gestión {anioOrigen}...</p>
            </div>
          ) : totalMcs === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-theme-border text-theme-muted space-y-1">
              <AlertCircle size={28} className="mx-auto text-amber-500 opacity-60 mb-1" />
              <p className="text-xs font-semibold text-theme-main">No hay memorias registradas en la Gestión {anioOrigen}</p>
              <p className="text-[11px]">Seleccione otra gestión base en el desplegable superior para continuar.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Badge de Resumen Global */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-theme-surface border border-theme-border text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-theme-main font-semibold">
                    <Layers size={14} className="text-blue-600 dark:text-blue-400" /> Total MCs: <strong>{totalMcs}</strong>
                  </span>
                  <span className="text-theme-muted">•</span>
                  <span className="text-theme-muted">
                    Total Ítems: <strong className="text-theme-main">{totalItems}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-theme-muted">Monto Base:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-300 text-sm bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-0.5 rounded-lg border border-blue-500/30">
                    {formatMoney(montoTotal)}
                  </span>
                </div>
              </div>

              {/* Tarjetas de Selección de Modalidad UX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                
                {/* Opción 1: De Golpe */}
                <div
                  onClick={!actionLoading ? handleDuplicarDeGolpe : undefined}
                  className="p-4 rounded-2xl border border-blue-500/30 hover:border-blue-500 bg-theme-surface hover:bg-theme-base/40 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                        <Zap size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-base border border-theme-border text-theme-muted">
                        Rápido / Automático
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-theme-main group-hover:text-blue-500 transition-colors">
                        Generar Todo de Golpe
                      </h4>
                      <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                        Genere la base completa ahora y edítela después si no cuenta con tiempo en este momento.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    className="w-full btn-primary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold cursor-pointer shadow-sm"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Duplicando...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        <span>Copiar Todo ({totalMcs} MCs)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Opción 2: Uno a Uno */}
                <div
                  onClick={handleEditarUnoAUno}
                  className="p-4 rounded-2xl border border-blue-500/30 hover:border-blue-500 bg-theme-surface hover:bg-theme-base/40 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet size={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-base border border-theme-border text-theme-muted">
                        Revisión Detallada
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-theme-main group-hover:text-blue-500 transition-colors">
                        Revisar y Editar Uno a Uno
                      </h4>
                      <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                        Ideal para editar renglones, ajustar precios y confirmar cada gasto si cuenta con tiempo ahora.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full btn-primary text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold cursor-pointer shadow-sm"
                  >
                    <FileSpreadsheet size={13} />
                    <span>Abrir Editor Uno a Uno</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer con Botón Cancelar Rojito */}
        <div className="p-4 border-t border-theme-border bg-theme-base/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};
