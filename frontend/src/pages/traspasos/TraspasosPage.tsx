import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Building2,
  Calendar,
  WalletCards,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import {
  Gestion,
  Area,
  MemoriaCalculo,
  Traspaso,
  ModificacionPresupuestaria,
  getGestiones,
  getAreas,
  getMemorias,
  getTraspasos,
  getModificaciones,
  createModificacion,
} from '../../services/presupuestoService';

interface FilaItem {
  id: string;
  memoriaId: number | '';
  monto: number | '';
}

export default function TraspasosPage() {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [modificaciones, setModificaciones] = useState<ModificacionPresupuestaria[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtros
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Expandir detalles de filas
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;

  // Modal Nueva Modificación M:N
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalAreaId, setModalAreaId] = useState<number | ''>('');
  const [motivo, setMotivo] = useState<string>('');
  const [filasOrigen, setFilasOrigen] = useState<FilaItem[]>([
    { id: 'orig-1', memoriaId: '', monto: '' },
  ]);
  const [filasDestino, setFilasDestino] = useState<FilaItem[]>([
    { id: 'dest-1', memoriaId: '', monto: '' },
  ]);

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (selectedGestionId) {
      cargarDatosModificaciones(selectedGestionId);
    }
  }, [selectedGestionId]);

  async function cargarBase() {
    setLoading(true);
    try {
      const [gList, aList] = await Promise.all([getGestiones(), getAreas()]);
      setGestiones(gList);
      setAreas(aList);

      if (gList.length > 0) {
        const enEjecucionG = gList.find((g) => g.estado === 'EN_EJECUCION');
        setSelectedGestionId(enEjecucionG ? enEjecucionG.id : gList[0].id);
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar gestiones y áreas.');
    } finally {
      setLoading(false);
    }
  }

  async function cargarDatosModificaciones(gId: number) {
    setLoading(true);
    try {
      const [mList, modList, tList] = await Promise.all([
        getMemorias({ gestion: gId }),
        getModificaciones({ gestion: gId }),
        getTraspasos({ gestion: gId }),
      ]);
      setMemorias(Array.isArray(mList) ? mList : []);

      // Unificar modificaciones M:N con traspasos 1:1 legacy si existieran
      const listaM: ModificacionPresupuestaria[] = Array.isArray(modList) ? [...modList] : [];
      if (Array.isArray(tList) && tList.length > 0) {
        for (const t of tList) {
          if (!listaM.some((m) => m.codigo === `TRASP-${t.id}`)) {
            listaM.push({
              id: t.id + 100000,
              codigo: `TRASP-${t.id}`,
              gestion: gId,
              area: 0,
              area_nombre: t.area_nombre,
              tipo: 'TRASPASO_INTRA_AREA',
              tipo_display: 'Traspaso Directo',
              motivo: t.motivo,
              total_monto: t.monto,
              estado: 'APROBADO',
              usuario_registro_nombre: t.usuario_registro_nombre,
              fecha: t.created_at || '',
              created_at: t.created_at || '',
              detalles: [],
              origenes: [
                {
                  memoria: t.memoria_origen,
                  memoria_codigo: t.memoria_origen_codigo || `MEM-${t.memoria_origen}`,
                  partida_codigo: t.memoria_origen_partida,
                  tipo_movimiento: 'DISMINUCION',
                  monto: t.monto,
                },
              ],
              destinos: [
                {
                  memoria: t.memoria_destino,
                  memoria_codigo: t.memoria_destino_codigo || `MEM-${t.memoria_destino}`,
                  partida_codigo: t.memoria_destino_partida,
                  tipo_movimiento: 'INCREMENTO',
                  monto: t.monto,
                },
              ],
            });
          }
        }
      }

      setModificaciones(listaM);
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar modificaciones presupuestarias.');
    } finally {
      setLoading(false);
    }
  }

  function mostrarMensaje(type: 'success' | 'error', text: string) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4500);
  }

  const activeGestion = useMemo(() => {
    return (Array.isArray(gestiones) ? gestiones : []).find((g) => g.id === selectedGestionId) || null;
  }, [gestiones, selectedGestionId]);

  const isGestionBloqueada = useMemo(() => {
    return !activeGestion || activeGestion.estado !== 'EN_EJECUCION';
  }, [activeGestion]);

  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 }).format(num || 0);
  };

  const getSaldo = (m?: MemoriaCalculo | null) => {
    if (!m) return 0;
    return parseFloat(m.saldo_disponible || m.total_disponible || '0');
  };

  // Filtrado de Modificaciones
  const modificacionesFiltradas = useMemo(() => {
    return (Array.isArray(modificaciones) ? modificaciones : []).filter((mod) => {
      const matchArea =
        filtroArea === 'todas' ||
        mod.area_nombre === areas.find((a) => String(a.id) === filtroArea)?.nombre;
      const matchSearch =
        !searchTerm.trim() ||
        mod.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mod.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mod.area_nombre && mod.area_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mod.origenes || []).some((o) => o.memoria_codigo?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mod.destinos || []).some((d) => d.memoria_codigo?.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchArea && matchSearch;
    });
  }, [modificaciones, filtroArea, searchTerm, areas]);

  useEffect(() => {
    setCurrentPage(1);
  }, [modificacionesFiltradas]);

  const totalPages = Math.max(1, Math.ceil(modificacionesFiltradas.length / PAGE_SIZE));
  const modificacionesPaginadas = useMemo(() => {
    return modificacionesFiltradas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [modificacionesFiltradas, currentPage]);

  const totalMontoMovilizado = useMemo(() => {
    return modificacionesFiltradas.reduce((acc, m) => acc + parseFloat(String(m.total_monto) || '0'), 0);
  }, [modificacionesFiltradas]);

  // Memorias Aprobadas del Área seleccionada en el Modal
  const memoriasAreaModal = useMemo(() => {
    if (!modalAreaId) return [];
    const areaSeleccionada = areas.find((a) => a.id === Number(modalAreaId));
    return (Array.isArray(memorias) ? memorias : []).filter((m) => {
      const matchArea =
        m.area_id === Number(modalAreaId) ||
        (areaSeleccionada &&
          m.area_nombre &&
          m.area_nombre.trim().toLowerCase() === areaSeleccionada.nombre.trim().toLowerCase());
      const matchEstado = ['APROBADO_FINANZAS', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(m.estado);
      return matchArea && matchEstado;
    });
  }, [memorias, modalAreaId, areas]);

  // Totales en el modal para verificación de cuadre
  const totalCedido = useMemo(() => {
    return filasOrigen.reduce((acc, f) => acc + (parseFloat(String(f.monto)) || 0), 0);
  }, [filasOrigen]);

  const totalRecibido = useMemo(() => {
    return filasDestino.reduce((acc, f) => acc + (parseFloat(String(f.monto)) || 0), 0);
  }, [filasDestino]);

  const diferencia = useMemo(() => {
    return Math.abs(totalCedido - totalRecibido);
  }, [totalCedido, totalRecibido]);

  const isCuadrado = useMemo(() => {
    return totalCedido > 0 && totalRecibido > 0 && diferencia < 0.01;
  }, [totalCedido, totalRecibido, diferencia]);

  function handleOpenModal() {
    const firstAreaId = areas[0]?.id || '';
    setModalAreaId(firstAreaId);
    setMotivo('');
    setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
    setFilasDestino([{ id: `dest-${Date.now()}-1`, memoriaId: '', monto: '' }]);
    setShowModal(true);
  }

  function handleAddFilaOrigen() {
    setFilasOrigen((prev) => [...prev, { id: `orig-${Date.now()}-${prev.length + 1}`, memoriaId: '', monto: '' }]);
  }

  function handleRemoveFilaOrigen(id: string) {
    if (filasOrigen.length <= 1) {
      mostrarMensaje('error', 'Debe haber al menos una memoria cedente.');
      return;
    }
    setFilasOrigen((prev) => prev.filter((f) => f.id !== id));
  }

  function handleAddFilaDestino() {
    setFilasDestino((prev) => [...prev, { id: `dest-${Date.now()}-${prev.length + 1}`, memoriaId: '', monto: '' }]);
  }

  function handleRemoveFilaDestino(id: string) {
    if (filasDestino.length <= 1) {
      mostrarMensaje('error', 'Debe haber al menos una memoria receptora.');
      return;
    }
    setFilasDestino((prev) => prev.filter((f) => f.id !== id));
  }

  function toggleRowExpand(id: number) {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleCrearModificacion(e: React.FormEvent) {
    e.preventDefault();
    if (isGestionBloqueada) {
      mostrarMensaje('error', 'Solo se pueden realizar modificaciones en gestiones En Ejecución.');
      return;
    }
    if (!modalAreaId) {
      mostrarMensaje('error', 'Selecciona el área organizacional.');
      return;
    }
    if (!motivo.trim()) {
      mostrarMensaje('error', 'Ingresa la justificación de la modificación presupuestaria.');
      return;
    }

    // Validar orígenes
    for (let i = 0; i < filasOrigen.length; i++) {
      const f = filasOrigen[i];
      if (!f.memoriaId) {
        mostrarMensaje('error', `Selecciona la memoria cedente en la fila ${i + 1}.`);
        return;
      }
      const montoNum = parseFloat(String(f.monto));
      if (!montoNum || montoNum <= 0) {
        mostrarMensaje('error', `Ingresa un monto válido mayor a 0 en la fila cedente ${i + 1}.`);
        return;
      }
      const memObj = memoriasAreaModal.find((m) => m.id === Number(f.memoriaId));
      const disp = getSaldo(memObj);
      if (montoNum > disp) {
        mostrarMensaje('error', `El monto en la fila ${i + 1} (${formatMoney(montoNum)}) excede el disponible (${formatMoney(disp)}).`);
        return;
      }
    }

    // Validar destinos
    for (let i = 0; i < filasDestino.length; i++) {
      const f = filasDestino[i];
      if (!f.memoriaId) {
        mostrarMensaje('error', `Selecciona la memoria receptora en la fila ${i + 1}.`);
        return;
      }
      const montoNum = parseFloat(String(f.monto));
      if (!montoNum || montoNum <= 0) {
        mostrarMensaje('error', `Ingresa un monto válido mayor a 0 en la fila receptora ${i + 1}.`);
        return;
      }
    }

    // Validar que no haya memorias repetidas
    const origMemIds = filasOrigen.map((f) => Number(f.memoriaId));
    const destMemIds = filasDestino.map((f) => Number(f.memoriaId));

    if (new Set(origMemIds).size !== origMemIds.length) {
      mostrarMensaje('error', 'No puedes repetir la misma memoria cedente.');
      return;
    }
    if (new Set(destMemIds).size !== destMemIds.length) {
      mostrarMensaje('error', 'No puedes repetir la misma memoria receptora.');
      return;
    }

    const solapadas = origMemIds.filter((id) => destMemIds.includes(id));
    if (solapadas.length > 0) {
      mostrarMensaje('error', 'Una memoria no puede ser simultáneamente cedente y receptora en la misma modificación.');
      return;
    }

    // Validar balance exacto
    if (!isCuadrado) {
      mostrarMensaje('error', `La modificación no cuadra: Total Cedido (${formatMoney(totalCedido)}) ≠ Total Recibido (${formatMoney(totalRecibido)}). Diferencia: ${formatMoney(diferencia)}.`);
      return;
    }

    setActionLoading(true);
    try {
      await createModificacion({
        gestion_id: Number(selectedGestionId),
        area_id: Number(modalAreaId),
        motivo: motivo.trim(),
        origenes: filasOrigen.map((f) => ({
          memoria_id: Number(f.memoriaId),
          monto: parseFloat(String(f.monto)),
        })),
        destinos: filasDestino.map((f) => ({
          memoria_id: Number(f.memoriaId),
          monto: parseFloat(String(f.monto)),
        })),
      });

      mostrarMensaje('success', '¡Modificación presupuestaria compensada registrada con éxito!');
      setShowModal(false);
      if (selectedGestionId) {
        cargarDatosModificaciones(selectedGestionId);
      }
    } catch (err: any) {
      console.error(err);
      const backendErr =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.origenes?.[0] ||
        err?.response?.data?.destinos?.[0] ||
        err?.response?.data?.motivo?.[0] ||
        'Error al registrar la modificación presupuestaria.';
      mostrarMensaje('error', backendErr);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Mensaje Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Encabezado del Módulo */}
      <div className="card p-6 border border-theme-border bg-theme-surface shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="text-theme-primary" size={24} />
              <h1 className="text-xl font-bold text-theme-main font-display">Modificaciones Presupuestarias</h1>
            </div>
            <p className="text-xs text-theme-muted mt-1">
              Traspasos compensados intra-área (1 a N, N a 1 o M a N) entre memorias de cálculo
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Selector de Gestión */}
            <div className="flex items-center gap-2 bg-theme-border/30 px-3 py-1.5 rounded-xl border border-theme-border">
              <Calendar size={15} className="text-theme-muted" />
              <select
                value={selectedGestionId || ''}
                onChange={(e) => setSelectedGestionId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-theme-main outline-none cursor-pointer"
              >
                {gestiones.map((g) => (
                  <option key={g.id} value={g.id} className="bg-theme-surface text-theme-main">
                    Gestión {g.anio} ({g.estado.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Nueva Modificación */}
            <button
              onClick={handleOpenModal}
              disabled={isGestionBloqueada}
              className="btn-primary text-xs px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isGestionBloqueada ? 'Solo habilitado en gestiones En Ejecución' : 'Registrar nueva modificación'}
            >
              <Plus size={16} />
              <span>Nueva Modificación (M:N)</span>
            </button>
          </div>
        </div>

        {/* Advertencia si Gestión Bloqueada */}
        {isGestionBloqueada && activeGestion && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center gap-3 text-xs font-medium">
            <Lock size={18} className="shrink-0" />
            <div>
              <span className="font-bold">Gestión {activeGestion.anio} ({activeGestion.estado.replace('_', ' ')}): </span>
              Las modificaciones presupuestarias entre memorias de cálculo están inhabilitadas porque la gestión no se encuentra en estado <strong>EN EJECUCIÓN</strong>.
            </div>
          </div>
        )}
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4 border border-theme-border bg-theme-surface shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center shrink-0">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Modificaciones Registradas</p>
            <p className="text-xl font-bold text-theme-main font-mono mt-0.5">{modificacionesFiltradas.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border border-theme-border bg-theme-surface shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <WalletCards size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Monto Total Compensado</p>
            <p className="text-xl font-bold text-theme-main font-mono mt-0.5">{formatMoney(totalMontoMovilizado)}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border border-theme-border bg-theme-surface shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Áreas Involucradas</p>
            <p className="text-xl font-bold text-theme-main font-mono mt-0.5">
              {new Set(modificacionesFiltradas.map((m) => m.area_nombre)).size} Áreas
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card p-4 border border-theme-border bg-theme-surface shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, memoria, motivo..."
              className="input-theme pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-theme-muted" />
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="input-theme text-xs py-1.5"
            >
              <option value="todas">Todas las Áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-theme-muted font-medium">
          Mostrando <strong className="text-theme-main">{modificacionesFiltradas.length}</strong> operaciones en Gestión {activeGestion?.anio}
        </p>
      </div>

      {/* Tabla de Modificaciones */}
      <div className="card border border-theme-border bg-theme-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-theme-border/40 border-b border-theme-border text-theme-muted font-semibold">
                <th className="py-3 px-4"># / Código</th>
                <th className="py-3 px-4">Área</th>
                <th className="py-3 px-4">Memorias Cedentes (-)</th>
                <th className="py-3 px-4 text-center">Flujo</th>
                <th className="py-3 px-4">Memorias Receptoras (+)</th>
                <th className="py-3 px-4 text-right">Monto Compensado</th>
                <th className="py-3 px-4 max-w-xs">Motivo / Justificación</th>
                <th className="py-3 px-4 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-theme-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
                      <p className="font-medium text-xs">Cargando modificaciones presupuestarias...</p>
                    </div>
                  </td>
                </tr>
              ) : modificacionesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-theme-muted">
                    <ArrowRightLeft size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No se registraron modificaciones presupuestarias en esta gestión.</p>
                  </td>
                </tr>
              ) : (
                modificacionesPaginadas.map((mod) => {
                  const origCount = mod.origenes?.length || 0;
                  const destCount = mod.destinos?.length || 0;
                  const isExpanded = !!expandedRows[mod.id];

                  return (
                    <React.Fragment key={mod.id}>
                      <tr className="hover:bg-theme-border/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-theme-main">{mod.codigo}</span>
                          <p className="text-[11px] text-theme-muted mt-0.5">
                            {mod.fecha ? new Date(mod.fecha).toLocaleDateString('es-BO') : 'N/A'}
                          </p>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-theme-main">{mod.area_nombre || 'N/A'}</span>
                        </td>

                        {/* Orígenes / Cedentes */}
                        <td className="py-3 px-4">
                          {origCount === 1 ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                {mod.origenes[0].memoria_codigo}
                              </span>
                              {mod.origenes[0].partida_codigo && (
                                <span className="text-[10px] text-theme-muted font-mono">
                                  Partida {mod.origenes[0].partida_codigo}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                <Layers size={11} className="mr-1" />
                                {origCount} Cedentes
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Dirección */}
                        <td className="py-3 px-4 text-center">
                          <div className="w-7 h-7 rounded-full bg-theme-border/60 flex items-center justify-center mx-auto text-theme-primary">
                            <ArrowRight size={14} />
                          </div>
                        </td>

                        {/* Destinos / Receptores */}
                        <td className="py-3 px-4">
                          {destCount === 1 ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {mod.destinos[0].memoria_codigo}
                              </span>
                              {mod.destinos[0].partida_codigo && (
                                <span className="text-[10px] text-theme-muted font-mono">
                                  Partida {mod.destinos[0].partida_codigo}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <Layers size={11} className="mr-1" />
                                {destCount} Receptoras
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Monto */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-bold text-theme-main text-xs">
                            {formatMoney(mod.total_monto)}
                          </span>
                        </td>

                        {/* Motivo */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-xs text-theme-main line-clamp-2">{mod.motivo}</p>
                          {mod.usuario_registro_nombre && (
                            <p className="text-[10px] text-theme-muted mt-1 flex items-center gap-1">
                              <UserCheck size={11} /> {mod.usuario_registro_nombre}
                            </p>
                          )}
                        </td>

                        {/* Botón Expansión */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleRowExpand(mod.id)}
                            className="p-1 rounded-lg hover:bg-theme-border/50 text-theme-muted hover:text-theme-main transition-colors"
                            title={isExpanded ? 'Ocultar desglose' : 'Ver desglose de partidas'}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>

                      {/* Fila Desplegable de Desglose M:N */}
                      {isExpanded && (
                        <tr className="bg-theme-border/10 border-b border-theme-border/60">
                          <td colSpan={8} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Panel Izquierdo: Orígenes */}
                              <div className="p-3 rounded-xl bg-theme-surface border border-rose-500/20 shadow-sm">
                                <div className="flex items-center justify-between border-b border-theme-border pb-2 mb-2">
                                  <span className="font-bold text-rose-600 flex items-center gap-1.5">
                                    <span>(-) Memorias Cedentes (Salida)</span>
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-rose-600">
                                    Subtotal: {formatMoney(mod.total_monto)}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {mod.origenes.map((orig, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between p-2 rounded-lg bg-theme-border/20 text-[11px]"
                                    >
                                      <div>
                                        <p className="font-mono font-bold text-theme-main">{orig.memoria_codigo}</p>
                                        <p className="text-[10px] text-theme-muted font-mono">
                                          Partida: {orig.partida_codigo || 'N/A'} {orig.partida_nombre ? `- ${orig.partida_nombre}` : ''}
                                        </p>
                                      </div>
                                      <span className="font-mono font-bold text-rose-600">
                                        -{formatMoney(orig.monto)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Panel Derecho: Destinos */}
                              <div className="p-3 rounded-xl bg-theme-surface border border-emerald-500/20 shadow-sm">
                                <div className="flex items-center justify-between border-b border-theme-border pb-2 mb-2">
                                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                                    <span>(+) Memorias Receptoras (Ingreso)</span>
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-emerald-600">
                                    Subtotal: {formatMoney(mod.total_monto)}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {mod.destinos.map((dest, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between p-2 rounded-lg bg-theme-border/20 text-[11px]"
                                    >
                                      <div>
                                        <p className="font-mono font-bold text-theme-main">{dest.memoria_codigo}</p>
                                        <p className="text-[10px] text-theme-muted font-mono">
                                          Partida: {dest.partida_codigo || 'N/A'} {dest.partida_nombre ? `- ${dest.partida_nombre}` : ''}
                                        </p>
                                      </div>
                                      <span className="font-mono font-bold text-emerald-600">
                                        +{formatMoney(dest.monto)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme-border bg-theme-surface">
            <p className="text-xs text-theme-muted">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, modificacionesFiltradas.length)} de {modificacionesFiltradas.length} operaciones
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-theme-muted">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        currentPage === p
                          ? 'border-theme-primary bg-theme-primary text-white'
                          : 'border-theme-border text-theme-muted hover:text-theme-main'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-theme-border text-theme-muted hover:text-theme-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nueva Modificación M:N */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="card w-full max-w-4xl flex flex-col shadow-2xl bg-theme-surface border border-theme-border overflow-hidden my-6 max-h-[90vh]">
            {/* Header del Modal */}
            <div className="p-5 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft className="text-theme-primary" size={24} />
                <div>
                  <h3 className="text-base font-bold text-theme-main">Nueva Modificación Presupuestaria Compensada (M:N)</h3>
                  <p className="text-xs text-theme-muted">
                    Traspaso intra-área balanceado: asigna múltiples orígenes a múltiples destinos • Gestión {activeGestion?.anio}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-theme-muted hover:text-theme-main text-lg font-bold px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Contenido con Scroll */}
            <form onSubmit={handleCrearModificacion} className="p-6 space-y-6 overflow-y-auto">
              {/* 1. Área Organizacional */}
              <div>
                <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                  1. Área Organizacional Solicitante *
                </label>
                <select
                  required
                  value={modalAreaId}
                  onChange={(e) => {
                    const newAreaId = Number(e.target.value);
                    setModalAreaId(newAreaId);
                    setFilasOrigen([{ id: `orig-${Date.now()}-1`, memoriaId: '', monto: '' }]);
                    setFilasDestino([{ id: `dest-${Date.now()}-1`, memoriaId: '', monto: '' }]);
                  }}
                  className="input-theme text-xs"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-theme-muted mt-1">
                  * Por regla institucional del POA, las modificaciones solo pueden realizarse entre memorias de la misma área.
                </p>
              </div>

              {/* 2. Paneles Dobles: Cedentes (-) vs Receptoras (+) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel Izquierdo: Orígenes / Cedentes */}
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                          <span>(-) Memorias Cedentes (Salida)</span>
                        </h4>
                        <p className="text-[10px] text-theme-muted">De dónde se retiran los fondos</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFilaOrigen}
                        className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={13} /> Agregar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {filasOrigen.map((fila, idx) => {
                        const memSeleccionada = memoriasAreaModal.find((m) => m.id === Number(fila.memoriaId));
                        const disp = getSaldo(memSeleccionada);
                        const montoNum = parseFloat(String(fila.monto)) || 0;
                        const excede = montoNum > disp;

                        return (
                          <div key={fila.id} className="p-3 rounded-lg border border-theme-border bg-theme-surface space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-theme-muted">Origen #{idx + 1}</span>
                              {filasOrigen.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFilaOrigen(fila.id)}
                                  className="text-rose-500 hover:text-rose-700"
                                  title="Eliminar fila"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            <select
                              required
                              value={fila.memoriaId}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setFilasOrigen((prev) =>
                                  prev.map((f) => (f.id === fila.id ? { ...f, memoriaId: val } : f))
                                );
                              }}
                              className="input-theme text-xs font-mono w-full"
                            >
                              <option value="">-- Seleccionar Memoria --</option>
                              {memoriasAreaModal.map((m) => {
                                const d = getSaldo(m);
                                return (
                                  <option key={m.id} value={m.id}>
                                    {m.codigo} ({m.partida_codigo || 'Partida'}) - Disp: {formatMoney(d)}
                                  </option>
                                );
                              })}
                            </select>

                            {memSeleccionada && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-theme-muted font-mono">
                                  Saldo Disponible: <strong className="text-emerald-600">{formatMoney(disp)}</strong>
                                </span>
                                {excede && (
                                  <span className="text-rose-600 font-bold text-[10px]">
                                    ¡Excede saldo disponible!
                                  </span>
                                )}
                              </div>
                            )}

                            <div>
                              <label className="block text-[10px] font-semibold text-theme-muted uppercase mb-1">
                                Monto a Ceder (Bs.) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={fila.monto}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setFilasOrigen((prev) =>
                                    prev.map((f) => (f.id === fila.id ? { ...f, monto: val } : f))
                                  );
                                }}
                                className={`input-theme text-xs font-mono font-bold ${
                                  excede ? 'border-rose-500 focus:border-rose-500' : ''
                                }`}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtotal Cedido */}
                  <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between font-bold text-xs">
                    <span className="text-theme-muted">Total Cedido:</span>
                    <span className="font-mono text-rose-600 text-sm">{formatMoney(totalCedido)}</span>
                  </div>
                </div>

                {/* Panel Derecho: Destinos / Receptores */}
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-theme-border mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                          <span>(+) Memorias Receptoras (Ingreso)</span>
                        </h4>
                        <p className="text-[10px] text-theme-muted">A qué memorias se incrementará el saldo</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFilaDestino}
                        className="text-[11px] font-semibold text-theme-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={13} /> Agregar
                      </button>
                    </div>

                    <div className="space-y-3">
                      {filasDestino.map((fila, idx) => {
                        const memSeleccionada = memoriasAreaModal.find((m) => m.id === Number(fila.memoriaId));
                        const disp = getSaldo(memSeleccionada);

                        return (
                          <div key={fila.id} className="p-3 rounded-lg border border-theme-border bg-theme-surface space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-theme-muted">Destino #{idx + 1}</span>
                              {filasDestino.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFilaDestino(fila.id)}
                                  className="text-rose-500 hover:text-rose-700"
                                  title="Eliminar fila"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            <select
                              required
                              value={fila.memoriaId}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : Number(e.target.value);
                                setFilasDestino((prev) =>
                                  prev.map((f) => (f.id === fila.id ? { ...f, memoriaId: val } : f))
                                );
                              }}
                              className="input-theme text-xs font-mono w-full"
                            >
                              <option value="">-- Seleccionar Memoria --</option>
                              {memoriasAreaModal.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.codigo} ({m.partida_codigo || 'Partida'})
                                </option>
                              ))}
                            </select>

                            {memSeleccionada && (
                              <p className="text-[11px] text-theme-muted font-mono">
                                Saldo Actual: <strong className="text-theme-main">{formatMoney(disp)}</strong>
                              </p>
                            )}

                            <div>
                              <label className="block text-[10px] font-semibold text-theme-muted uppercase mb-1">
                                Monto a Incrementar (Bs.) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={fila.monto}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                  setFilasDestino((prev) =>
                                    prev.map((f) => (f.id === fila.id ? { ...f, monto: val } : f))
                                  );
                                }}
                                className="input-theme text-xs font-mono font-bold"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subtotal Recibido */}
                  <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between font-bold text-xs">
                    <span className="text-theme-muted">Total Recibido:</span>
                    <span className="font-mono text-emerald-600 text-sm">{formatMoney(totalRecibido)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Barra de Cuadre / Balance en Tiempo Real */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                  isCuadrado
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCuadrado ? (
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={24} className="text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {isCuadrado ? '¡Operación Compensada Cuadrada!' : 'Diferencia en Cuadre Presupuestario'}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {isCuadrado
                        ? 'El total cedido coincide exactamente con el total recibido (suma cero).'
                        : totalCedido > totalRecibido
                        ? `Sobran Bs. ${diferencia.toFixed(2)} por asignar en las memorias receptoras.`
                        : totalRecibido > totalCedido
                        ? `Faltan Bs. ${diferencia.toFixed(2)} por fondear en las memorias cedentes.`
                        : 'Ingresa los montos en ambas columnas.'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase font-bold text-theme-muted">Diferencia</p>
                  <p className="text-base font-mono font-bold">
                    {formatMoney(diferencia)}
                  </p>
                </div>
              </div>

              {/* 4. Justificación / Motivo */}
              <div>
                <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                  3. Justificación / Motivo Institucional *
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="input-theme text-xs"
                  placeholder="Explica la necesidad técnica y el respaldo de la modificación presupuestaria..."
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:text-theme-main transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !isCuadrado}
                  className="btn-primary text-xs px-6 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Registrar Modificación Presupuestaria</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
