import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Check,
  ArrowRight,
  Plus,
  Trash2,
  Percent,
  RefreshCw,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Save,
  Tag,
  Building,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { memoriasApi } from '../api/memoriasApi';
import { Dropdown, type DropdownItem } from '../../../components/commons';
import alertService from '../../../utils/alerts';

export interface SheetDetalleItem {
  id?: number | string;
  partida_id: number;
  partida_codigo?: string;
  partida_nombre?: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
}

export interface SheetMemoria {
  idOrigen: number;
  codigoOrigen: string;
  seccionId: number;
  seccionNombre: string;
  areaNombre: string;
  operacionId: number | null;
  operacionCodigo: string;
  partidaId: number;
  partidaCodigo: string;
  partidaNombre: string;
  justificacion: string;
  es_contratacion: boolean;
  detalles: SheetDetalleItem[];
  guardada: boolean;
  nuevaMemoriaId?: number;
  nuevoCodigo?: string;
}

interface MemoriaExcelDuplicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGestion: any;
  gestiones: any[];
  user: any;
  currentAreaId?: string | number;
  initialOrigenId?: number;
  onSuccess: () => void;
}

export const MemoriaExcelDuplicatorModal: React.FC<MemoriaExcelDuplicatorModalProps> = ({
  isOpen,
  onClose,
  activeGestion,
  gestiones = [],
  user,
  currentAreaId,
  initialOrigenId,
  onSuccess,
}) => {
  // Encontrar por defecto la gestión anterior más cercana
  const defaultOrigen = useMemo(() => {
    if (initialOrigenId) return initialOrigenId;
    if (!activeGestion) return gestiones[0]?.id || null;
    const anioActivo = Number(activeGestion.anio);
    const anteriores = gestiones
      .filter((g) => Number(g.anio) < anioActivo)
      .sort((a, b) => Number(b.anio) - Number(a.anio));
    return anteriores.length > 0 ? anteriores[0].id : gestiones[0]?.id || null;
  }, [activeGestion, gestiones, initialOrigenId]);

  const [selectedOrigenId, setSelectedOrigenId] = useState<number | null>(defaultOrigen);
  const [sheets, setSheets] = useState<SheetMemoria[]>([]);
  const [originalSheets, setOriginalSheets] = useState<SheetMemoria[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPercentModal, setShowPercentModal] = useState(false);
  const [percentValue, setPercentValue] = useState<number>(5);
  const [percentScope, setPercentScope] = useState<'sheet' | 'all'>('sheet');

  const tabsScrollRef = useRef<HTMLDivElement>(null);

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

  // Cargar memorias de la gestión origen seleccionada
  const cargarLibroOrigen = async (origenId: number) => {
    setLoading(true);
    try {
      const data = await memoriasApi.getLibroGestion(origenId, currentAreaId);
      if (!Array.isArray(data) || data.length === 0) {
        setSheets([]);
        setOriginalSheets([]);
        setActiveSheetIndex(0);
        return;
      }

      const sortedData = [...data].sort((a: any, b: any) => {
        const codA = a.codigo || '';
        const codB = b.codigo || '';
        return codA.localeCompare(codB, undefined, { numeric: true, sensitivity: 'base' }) || (a.id - b.id);
      });

      const hojasMapeadas: SheetMemoria[] = sortedData.map((m) => {
        const primaryPartidaId =
          m.detalles && m.detalles.length > 0 ? m.detalles[0].partida : 0;
        const primaryPartidaCod = m.partida_codigo || (m.detalles && m.detalles[0]?.partida_codigo) || '';
        const primaryPartidaNom = m.partida_nombre || (m.detalles && m.detalles[0]?.partida_nombre) || '';

        const renglones: SheetDetalleItem[] = (m.detalles || []).map((d: any, idx: number) => ({
          id: d.id || `temp-${idx}`,
          partida_id: d.partida || primaryPartidaId,
          partida_codigo: d.partida_codigo || primaryPartidaCod,
          partida_nombre: d.partida_nombre || primaryPartidaNom,
          descripcion: d.descripcion || '',
          unidad_medida: d.unidad_medida || 'UNIDAD',
          cantidad: Number(d.cantidad) || 1,
          precio_unitario: Number(d.precio_unitario) || 0,
        }));

        if (renglones.length === 0) {
          renglones.push({
            id: `temp-0`,
            partida_id: primaryPartidaId,
            partida_codigo: primaryPartidaCod,
            partida_nombre: primaryPartidaNom,
            descripcion: '',
            unidad_medida: 'UNIDAD',
            cantidad: 1,
            precio_unitario: 0,
          });
        }

        return {
          idOrigen: m.id,
          codigoOrigen: m.codigo,
          seccionId: m.seccion,
          seccionNombre: m.seccion_nombre || 'Sección',
          areaNombre: m.area_nombre || '',
          operacionId: m.operacion,
          operacionCodigo: m.operacion_codigo || 'OP-SPO',
          partidaId: primaryPartidaId,
          partidaCodigo: primaryPartidaCod,
          partidaNombre: primaryPartidaNom,
          justificacion: m.justificacion || '',
          es_contratacion: Boolean(m.es_contratacion),
          detalles: renglones,
          guardada: false,
        };
      });

      setSheets(hojasMapeadas);
      setOriginalSheets(JSON.parse(JSON.stringify(hojasMapeadas)));
      setActiveSheetIndex(0);
    } catch (err: any) {
      console.error('Error cargando libro de gestión origen:', err);
      alertService.error('Error', err?.response?.data?.error || 'No se pudieron cargar las memorias de la gestión seleccionada.');
      setSheets([]);
      setOriginalSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrigenId) {
      cargarLibroOrigen(selectedOrigenId);
    }
  }, [selectedOrigenId]);

  const activeSheet = sheets[activeSheetIndex] || null;

  // Totales de la hoja activa
  const totalHojaActiva = useMemo(() => {
    if (!activeSheet) return 0;
    return activeSheet.detalles.reduce((acc, r) => {
      const cant = Number(r.cantidad) || 0;
      const pu = Number(r.precio_unitario) || 0;
      return acc + cant * pu;
    }, 0);
  }, [activeSheet]);

  // Total de todo el libro
  const totalLibro = useMemo(() => {
    return sheets.reduce((accSheet, sh) => {
      const totSh = sh.detalles.reduce((acc, r) => {
        const cant = Number(r.cantidad) || 0;
        const pu = Number(r.precio_unitario) || 0;
        return acc + cant * pu;
      }, 0);
      return accSheet + totSh;
    }, 0);
  }, [sheets]);

  // Conteo de memorias pendientes y guardadas
  const sheetsGuardadasCount = useMemo(() => sheets.filter((s) => s.guardada).length, [sheets]);
  const sheetsPendientesCount = useMemo(() => sheets.filter((s) => !s.guardada).length, [sheets]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(val || 0);
  };

  const areaNombre = user?.area_nombre || activeSheet?.areaNombre || 'Área Institucional';

  // Edición de celdas en la hoja activa
  const handleUpdateDetalle = (idx: number, field: keyof SheetDetalleItem, val: any) => {
    if (!activeSheet) return;
    const nuevosDetalles = [...activeSheet.detalles];
    nuevosDetalles[idx] = { ...nuevosDetalles[idx], [field]: val };

    const newSheets = [...sheets];
    newSheets[activeSheetIndex] = {
      ...activeSheet,
      detalles: nuevosDetalles,
    };
    setSheets(newSheets);
  };

  // Agregar nuevo renglón en la hoja activa
  const handleAddDetalle = () => {
    if (!activeSheet) return;
    const nuevoItem: SheetDetalleItem = {
      id: `temp-${Date.now()}`,
      partida_id: activeSheet.partidaId,
      partida_codigo: activeSheet.partidaCodigo,
      partida_nombre: activeSheet.partidaNombre,
      descripcion: '',
      unidad_medida: 'UNIDAD',
      cantidad: 1,
      precio_unitario: 0,
    };
    const newSheets = [...sheets];
    newSheets[activeSheetIndex] = {
      ...activeSheet,
      detalles: [...activeSheet.detalles, nuevoItem],
    };
    setSheets(newSheets);
  };

  // Eliminar renglón de la hoja activa (siempre visible)
  const handleRemoveDetalle = (idx: number) => {
    if (!activeSheet) return;
    if (activeSheet.detalles.length <= 1) {
      // Si es el único ítem, vaciar sus valores en lugar de dejar la tabla vacía
      handleUpdateDetalle(0, 'descripcion', '');
      handleUpdateDetalle(0, 'cantidad', 1);
      handleUpdateDetalle(0, 'precio_unitario', 0);
      return;
    }
    const nuevosDetalles = activeSheet.detalles.filter((_, i) => i !== idx);
    const newSheets = [...sheets];
    newSheets[activeSheetIndex] = {
      ...activeSheet,
      detalles: nuevosDetalles,
    };
    setSheets(newSheets);
  };

  // Actualizar metadata de la hoja activa (justificación, contratación)
  const handleUpdateActiveMetadata = (field: 'justificacion' | 'es_contratacion', val: any) => {
    if (!activeSheet) return;
    const newSheets = [...sheets];
    newSheets[activeSheetIndex] = {
      ...activeSheet,
      [field]: val,
    };
    setSheets(newSheets);
  };

  // Aplicar ajuste porcentual (+X% / -X%)
  const handleApplyPercent = () => {
    const factor = 1 + percentValue / 100;
    if (percentScope === 'sheet' && activeSheet) {
      const ajustados = activeSheet.detalles.map((d) => ({
        ...d,
        precio_unitario: Math.round(d.precio_unitario * factor * 100) / 100,
      }));
      const newSheets = [...sheets];
      newSheets[activeSheetIndex] = { ...activeSheet, detalles: ajustados };
      setSheets(newSheets);
      alertService.success('Ajuste Aplicado', `Precios de la MC actual ajustados en ${percentValue > 0 ? `+${percentValue}` : percentValue}%.`);
    } else {
      const allAjustados = sheets.map((sh) => ({
        ...sh,
        detalles: sh.detalles.map((d) => ({
          ...d,
          precio_unitario: Math.round(d.precio_unitario * factor * 100) / 100,
        })),
      }));
      setSheets(allAjustados);
      alertService.success('Ajuste Aplicado', `Precios de todas las MCs ajustados en ${percentValue > 0 ? `+${percentValue}` : percentValue}%.`);
    }
    setShowPercentModal(false);
  };

  // Restablecer la hoja activa a sus valores originales
  const handleResetActiveSheet = () => {
    if (!originalSheets[activeSheetIndex]) return;
    const newSheets = [...sheets];
    newSheets[activeSheetIndex] = JSON.parse(JSON.stringify(originalSheets[activeSheetIndex]));
    setSheets(newSheets);
    alertService.info('Hoja Restablecida', 'Se restablecieron los ítems y valores originales de la gestión base.');
  };

  // Guardar hoja individual y avanzar a la siguiente
  const handleGuardarHojaActual = async () => {
    if (!activeSheet) return;
    if (activeSheet.guardada) {
      // Si ya está guardada, simplemente avanzar a la siguiente
      irASiguienteHoja();
      return;
    }

    if (!activeSheet.operacionId) {
      alertService.error('Operación Requerida', 'La memoria debe tener una operación POA vinculada.');
      return;
    }

    if (activeSheet.detalles.some((r) => !r.descripcion.trim() || Number(r.cantidad) <= 0 || Number(r.precio_unitario) < 0)) {
      alertService.error('Renglones Incompletos', 'Verifique que todos los ítems tengan descripción, cantidad > 0 y precio unitario.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        gestion: activeGestion.id,
        seccion: activeSheet.seccionId,
        operacion: activeSheet.operacionId,
        es_contratacion: activeSheet.es_contratacion,
        justificacion: activeSheet.justificacion.trim().toUpperCase() || `REQUERIMIENTOS OPERATIVOS GESTIÓN ${activeGestion.anio}`,
        detalles: activeSheet.detalles.map((d) => ({
          partida_id: d.partida_id || activeSheet.partidaId,
          descripcion: d.descripcion.trim().toUpperCase(),
          unidad_medida: d.unidad_medida.trim().toUpperCase(),
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
        })),
      };

      const res = await memoriasApi.createMemoria(payload);
      alertService.success('Memoria Confirmada', `Se confirmó y formuló ${res.codigo} en estado Borrador exitosamente.`);

      // Marcar la hoja como guardada
      const newSheets = [...sheets];
      newSheets[activeSheetIndex] = {
        ...activeSheet,
        guardada: true,
        nuevaMemoriaId: res.id,
        nuevoCodigo: res.codigo,
      };
      setSheets(newSheets);

      // Notificar al componente padre
      onSuccess();

      // Ir a la siguiente hoja pendiente
      irASiguienteHoja(newSheets);
    } catch (err: any) {
      console.error('Error al guardar memoria individual:', err);
      alertService.error('Error', err?.response?.data?.error || err?.response?.data?.detail || 'No se pudo guardar la memoria.');
    } finally {
      setActionLoading(false);
    }
  };

  // Navegar a la siguiente hoja
  const irASiguienteHoja = (currentList = sheets) => {
    const nextUnsavedIdx = currentList.findIndex((s, i) => i > activeSheetIndex && !s.guardada);
    if (nextUnsavedIdx !== -1) {
      setActiveSheetIndex(nextUnsavedIdx);
      scrollToTab(nextUnsavedIdx);
    } else {
      const firstUnsavedIdx = currentList.findIndex((s) => !s.guardada);
      if (firstUnsavedIdx !== -1 && firstUnsavedIdx !== activeSheetIndex) {
        setActiveSheetIndex(firstUnsavedIdx);
        scrollToTab(firstUnsavedIdx);
      } else if (activeSheetIndex < currentList.length - 1) {
        setActiveSheetIndex(activeSheetIndex + 1);
        scrollToTab(activeSheetIndex + 1);
      } else {
        alertService.success('¡Proceso Completado!', 'Ha revisado y confirmado todas las memorias de cálculo disponibles.');
      }
    }
  };

  const scrollToTab = (index: number) => {
    if (tabsScrollRef.current) {
      const tabElements = tabsScrollRef.current.querySelectorAll<HTMLButtonElement>('[data-sheet-tab]');
      if (tabElements[index]) {
        tabElements[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  // Intentar cambiar de pestaña: validar si la actual está pendiente
  const handleIntentarCambiarPestana = async (targetIdx: number) => {
    if (targetIdx === activeSheetIndex) return;

    if (activeSheet && !activeSheet.guardada) {
      const confirmChange = await alertService.confirm({
        title: 'MC Actual sin Confirmar',
        text: `La memoria ${activeSheet.codigoOrigen} aún no ha sido confirmada ni guardada en la Gestión ${activeGestion?.anio}. ¿Desea cambiar de pestaña de todas formas?`,
        confirmButtonText: 'Sí, cambiar de pestaña',
        cancelButtonText: 'Permanecer y Guardar',
        icon: 'warning',
      });
      if (!confirmChange) return;
    }

    setActiveSheetIndex(targetIdx);
    scrollToTab(targetIdx);
  };

  const anioOrigen = gestiones.find((g) => g.id === selectedOrigenId)?.anio || 'Base';
  const anioDestino = activeGestion?.anio || new Date().getFullYear();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card w-full max-w-[96vw] xl:max-w-7xl h-[94vh] flex flex-col shadow-2xl bg-theme-surface border border-theme-border rounded-2xl overflow-hidden">
        
        {/* Cabecera Principal */}
        <div className="px-5 py-3 border-b border-theme-border bg-theme-base/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-theme-main">
                  Duplicar Memorias de Gestión Anterior
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border text-theme-muted flex items-center gap-1">
                  <Building size={11} /> {areaNombre}
                </span>
              </div>
              <p className="text-xs text-theme-muted">
                Revisión interactiva y confirmación de memorias de cálculo paso a paso.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Flujo de Gestiones con Dropdown y Flecha */}
            <div className="flex items-center gap-2 bg-theme-surface border border-blue-500/30 px-3 py-1.5 rounded-xl shadow-xs">
              <div className="w-[145px]">
                <Dropdown
                  items={gestionesDisponibles}
                  value={selectedOrigenId}
                  onChange={(val) => setSelectedOrigenId(Number(val))}
                  placeholder="Gestión Base"
                  icon={<Calendar size={13} className="text-theme-muted" />}
                  size="sm"
                  searchable={false}
                  disabled={loading || actionLoading}
                />
              </div>

              <div className="flex items-center text-blue-600 dark:text-blue-400 px-1">
                <ArrowRight size={16} />
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme-base border border-blue-500/30 text-xs">
                <span className="text-theme-muted font-medium">Destino:</span>
                <span className="font-bold text-theme-main">Gestión {anioDestino}</span>
              </div>
            </div>

            {/* Botón Ajuste % */}
            <button
              type="button"
              onClick={() => setShowPercentModal(true)}
              disabled={sheets.length === 0 || loading || actionLoading}
              className="px-3.5 py-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-xs active:scale-95"
              title="Ajustar precios por porcentaje"
            >
              <Percent size={13} className="text-blue-600 dark:text-blue-400" />
              <span>Ajustar %</span>
            </button>

            {/* Cerrar modal */}
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="p-1.5 rounded-xl text-theme-muted hover:text-theme-main hover:bg-theme-border/20 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Barra de Estadísticas */}
        <div className="px-5 py-2.5 bg-theme-surface border-b border-theme-border/60 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 text-theme-muted">
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600 dark:text-blue-400" />
              Total MCs: <strong className="text-theme-main font-semibold">{sheets.length}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500 font-bold" />
              Confirmadas: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{sheetsGuardadasCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-500" />
              Pendientes: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{sheetsPendientesCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-theme-muted uppercase tracking-wider text-[10px] font-bold">Total MC Actual:</span>
              <span className="font-mono font-bold text-xs text-theme-main bg-theme-base px-2 py-0.5 rounded-lg border border-theme-border">{formatMoney(totalHojaActiva)}</span>
            </div>
            <div className="h-4 w-px bg-theme-border/60" />
            <div className="flex items-center gap-1.5">
              <span className="text-theme-muted uppercase tracking-wider text-[10px] font-bold">Total Proyectado:</span>
              <span className="font-mono font-extrabold text-xs text-theme-main bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/40 dark:border-blue-400/50 shadow-2xs">{formatMoney(totalLibro)}</span>
            </div>
          </div>
        </div>

        {/* Cuerpo del Editor: Hoja Activa */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-theme-surface">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
              <RefreshCw size={28} className="animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-semibold text-theme-main">Cargando memorias de la Gestión {anioOrigen}...</p>
            </div>
          ) : sheets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <FileSpreadsheet size={36} className="text-theme-muted opacity-40 mb-1" />
              <h3 className="text-sm font-bold text-theme-main">No se encontraron memorias en la Gestión {anioOrigen}</h3>
              <p className="text-xs text-theme-muted max-w-md">
                Seleccione otra gestión base en el selector superior para cargar las memorias.
              </p>
            </div>
          ) : activeSheet ? (
            <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
              
              {/* Barra de Trazabilidad y Metadata de la MC Activa */}
              <div className="p-3 rounded-xl bg-theme-base/50 border border-theme-border space-y-2.5 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Trazabilidad con flechas y badges legibles */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-theme-muted uppercase tracking-wider text-[11px]">
                      MC {activeSheetIndex + 1} de {sheets.length}:
                    </span>

                    <span className="font-mono font-bold text-xs bg-theme-surface px-2.5 py-1 rounded-lg border border-blue-500/30 dark:border-blue-400/40 text-theme-main flex items-center gap-1.5 shadow-xs">
                      <Tag size={12} className="text-blue-600 dark:text-blue-400" /> Base {anioOrigen}: {activeSheet.codigoOrigen}
                    </span>

                    <ArrowRight size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />

                    <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-xs ${
                      activeSheet.guardada
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/40 dark:border-blue-400/50'
                    }`}>
                      <Tag size={12} className={activeSheet.guardada ? "text-emerald-500 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"} />
                      {activeSheet.guardada
                        ? `✓ Guardada: ${activeSheet.nuevoCodigo || 'MEM-OK'}`
                        : `Destino ${anioDestino}: MEM-${anioDestino}-${String(activeSheetIndex + 1).padStart(3, '0')}`}
                    </span>
                  </div>

                  {/* Acciones de la Memoria: Botón Revertir Cambios Prominente */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetActiveSheet}
                      className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Restablecer valores originales de la gestión base"
                    >
                      <RotateCcw size={13} className="text-amber-600 dark:text-amber-400" />
                      <span>Revertir Cambios</span>
                    </button>
                  </div>
                </div>

                {/* Justificación Técnica Amplia y Scrolleable */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-theme-muted">
                    <span>Justificación Técnica del Gasto:</span>
                    <span>{activeSheet.justificacion.length} caracteres</span>
                  </div>
                  <textarea
                    rows={2}
                    value={activeSheet.justificacion}
                    onChange={(e) => handleUpdateActiveMetadata('justificacion', e.target.value)}
                    placeholder="Detalle la justificación técnica operativa de la memoria de cálculo..."
                    className="w-full px-3 py-1.5 bg-theme-surface border border-theme-border rounded-xl text-xs uppercase text-theme-main focus:outline-none focus:ring-1 focus:ring-theme-primary resize-none overflow-y-auto leading-relaxed"
                  />
                </div>
              </div>

              {/* Encabezado de Renglones */}
              <div className="flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-1.5">
                  <FileSpreadsheet size={14} className="text-blue-600 dark:text-blue-400" /> Renglones / Ítems de la Memoria ({activeSheet.detalles.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddDetalle}
                  className="btn-primary text-xs px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Agregar Renglón
                </button>
              </div>

              {/* Tabla de Renglones Estilo Excel */}
              <div className="flex-1 min-h-0 border border-theme-border rounded-xl overflow-hidden flex flex-col bg-theme-surface shadow-xs">
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-theme-base border-b border-theme-border z-[5] font-bold text-theme-muted text-[11px] select-none">
                      <tr>
                        <th className="py-2 px-2 w-10 text-center border-r border-theme-border/40">#</th>
                        <th className="py-2 px-3 border-r border-theme-border/40">DESCRIPCIÓN DEL REQUERIMIENTO</th>
                        <th className="py-2 px-2.5 w-28 border-r border-theme-border/40">UNIDAD MEDIDA</th>
                        <th className="py-2 px-2.5 w-24 text-right border-r border-theme-border/40">CANTIDAD</th>
                        <th className="py-2 px-2.5 w-32 text-right border-r border-theme-border/40">P. UNITARIO (BS.)</th>
                        <th className="py-2 px-3 w-32 text-right border-r border-theme-border/40">SUBTOTAL (BS.)</th>
                        <th className="py-2 px-2 w-12 text-center">ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/40">
                      {activeSheet.detalles.map((renglon, idx) => {
                        const subtotal = (Number(renglon.cantidad) || 0) * (Number(renglon.precio_unitario) || 0);
                        return (
                          <tr key={renglon.id || idx} className="hover:bg-theme-border/15 transition-colors group">
                            <td className="py-1 px-2 text-center font-mono font-bold text-[11px] text-theme-muted bg-theme-base/30 border-r border-theme-border/40">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-2 border-r border-theme-border/40">
                              <input
                                type="text"
                                required
                                value={renglon.descripcion}
                                onChange={(e) => handleUpdateDetalle(idx, 'descripcion', e.target.value)}
                                placeholder="Descripción del requerimiento..."
                                className="w-full bg-transparent px-2 py-1 rounded text-xs text-theme-main uppercase focus:bg-theme-base focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all font-medium"
                              />
                            </td>
                            <td className="py-1 px-2 border-r border-theme-border/40">
                              <input
                                type="text"
                                required
                                value={renglon.unidad_medida}
                                onChange={(e) => handleUpdateDetalle(idx, 'unidad_medida', e.target.value)}
                                placeholder="UNIDAD"
                                className="w-full bg-transparent px-2 py-1 rounded text-xs text-theme-main uppercase focus:bg-theme-base focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all"
                              />
                            </td>
                            <td className="py-1 px-2 text-right border-r border-theme-border/40">
                              <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                value={renglon.cantidad === 0 ? '' : renglon.cantidad}
                                onChange={(e) => handleUpdateDetalle(idx, 'cantidad', e.target.value)}
                                placeholder="1"
                                className="w-full bg-transparent px-2 py-1 rounded text-xs text-right font-mono font-semibold text-theme-main focus:bg-theme-base focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all"
                              />
                            </td>
                            <td className="py-1 px-2 text-right border-r border-theme-border/40">
                              <div className="flex items-center gap-1 justify-end">
                                <span className="text-[10px] text-theme-muted font-bold select-none">Bs.</span>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={renglon.precio_unitario === 0 ? '' : renglon.precio_unitario}
                                  onChange={(e) => handleUpdateDetalle(idx, 'precio_unitario', e.target.value)}
                                  placeholder="0.00"
                                  className="w-24 bg-transparent px-1.5 py-1 rounded text-xs text-right font-mono font-semibold text-theme-main focus:bg-theme-base focus:outline-none focus:ring-1 focus:ring-theme-primary transition-all"
                                />
                              </div>
                            </td>
                            <td className="py-1 px-3 text-right font-mono font-bold text-xs text-theme-main border-r border-theme-border/40 bg-theme-base/10">
                              {formatMoney(subtotal)}
                            </td>
                            <td className="py-1 px-2 text-center">
                              {/* Botón de papelera siempre visible */}
                              <button
                                type="button"
                                onClick={() => handleRemoveDetalle(idx)}
                                className="p-1.5 rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Eliminar renglón"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pie de Tabla: Monto Total Proyectado de la MC con gran notoriedad institucional */}
                <div className="bg-theme-base/90 px-5 py-3 border-t border-theme-border flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-bold uppercase tracking-wider text-theme-main text-xs">
                      Monto Total Proyectado de esta MC:
                    </span>
                    <span className="text-[11px] text-theme-muted font-medium hidden sm:inline">
                      ({activeSheet.detalles.length} {activeSheet.detalles.length === 1 ? 'ítem presupuestado' : 'ítems presupuestados'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-4 py-1.5 rounded-xl bg-theme-surface border-2 border-blue-500/50 dark:border-blue-400/60 shadow-sm flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Total:
                      </span>
                      <span className="font-mono font-black text-base sm:text-lg text-theme-main tracking-tight">
                        {formatMoney(totalHojaActiva)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Barra Inferior: Sub-Pestañas Coloridas y Control de Avance */}
        <div className="border-t border-theme-border bg-theme-base/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Navegación y Pestañas Horizontales */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-full overflow-hidden">
            <button
              type="button"
              onClick={() => {
                if (activeSheetIndex > 0) handleIntentarCambiarPestana(activeSheetIndex - 1);
              }}
              disabled={activeSheetIndex === 0}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-30 cursor-pointer shrink-0"
              title="MC anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div
              ref={tabsScrollRef}
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0"
            >
              {sheets.map((sh, idx) => {
                const isActive = idx === activeSheetIndex;
                const isGuardada = sh.guardada;
                return (
                  <button
                    key={sh.idOrigen}
                    data-sheet-tab
                    type="button"
                    onClick={() => handleIntentarCambiarPestana(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                      isActive
                        ? isGuardada
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500 ring-2 ring-emerald-500/30 font-bold shadow-sm'
                          : 'bg-theme-surface border-theme-primary text-theme-main shadow-sm ring-2 ring-theme-primary/30 font-bold'
                        : isGuardada
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-theme-surface/60 hover:bg-theme-surface border-theme-border text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    {isGuardada ? (
                      <Check size={12} className="text-emerald-500 font-bold shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                    <span>MC {idx + 1}</span>
                    <span className="text-[10px] font-mono opacity-70">({sh.detalles.length})</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeSheetIndex < sheets.length - 1) handleIntentarCambiarPestana(activeSheetIndex + 1);
              }}
              disabled={activeSheetIndex >= sheets.length - 1}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/20 disabled:opacity-30 cursor-pointer shrink-0"
              title="Siguiente MC"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Botón de Acción Principal al pie */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGuardarHojaActual}
              disabled={!activeSheet || actionLoading}
              className="btn-primary text-xs font-semibold px-5 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {activeSheet?.guardada ? (
                <>
                  <span>Siguiente MC</span>
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Confirmar y Guardar MC {activeSheetIndex + 1}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Modal de Ajuste Porcentual (Sin solapamiento, z-[100] y borde azul) */}
      {showPercentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="card relative z-[101] w-full max-w-sm p-5 space-y-4 shadow-2xl bg-theme-surface border border-blue-500/40 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-main flex items-center gap-2">
                <Percent size={14} className="text-blue-600 dark:text-blue-400" /> Ajuste Porcentual de Precios
              </span>
              <button
                type="button"
                onClick={() => setShowPercentModal(false)}
                className="p-1 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-border/20 transition-colors cursor-pointer"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-theme-muted leading-relaxed">
              Aplique un incremento o reducción porcentual a los precios unitarios para actualizar estimaciones por inflación o ajustes normativos.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1.5">
                  Porcentaje de variación (+ o -)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={percentValue}
                    onChange={(e) => setPercentValue(Number(e.target.value))}
                    className="w-full pl-3 pr-8 py-2 bg-theme-base border border-blue-500/30 rounded-xl text-sm font-mono font-bold text-theme-main focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej. 5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-theme-muted select-none">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-theme-muted mb-1.5">
                  Alcance del ajuste
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPercentScope('sheet')}
                    className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      percentScope === 'sheet'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                        : 'border-theme-border text-theme-muted hover:text-theme-main bg-theme-base/40'
                    }`}
                  >
                    Solo MC Actual
                  </button>
                  <button
                    type="button"
                    onClick={() => setPercentScope('all')}
                    className={`py-2 px-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      percentScope === 'all'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold shadow-xs'
                        : 'border-theme-border text-theme-muted hover:text-theme-main bg-theme-base/40'
                    }`}
                  >
                    Todas ({sheets.length} MCs)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-theme-border">
              <button
                type="button"
                onClick={() => setShowPercentModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyPercent}
                className="btn-primary text-xs px-4 py-1.5 rounded-xl cursor-pointer"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
