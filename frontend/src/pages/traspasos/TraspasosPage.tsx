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
} from 'lucide-react';
import {
  Gestion,
  Area,
  MemoriaCalculo,
  Traspaso,
  getGestiones,
  getAreas,
  getMemorias,
  getTraspasos,
  createTraspaso,
} from '../../services/presupuestoService';

export default function TraspasosPage() {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtros
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 15;

  // Modal Nuevo Traspaso
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalAreaId, setModalAreaId] = useState<number | ''>('');
  const [formTraspaso, setFormTraspaso] = useState<{
    memoriaOrigenId: number | '';
    memoriaDestinoId: number | '';
    monto: number | '';
    motivo: string;
  }>({
    memoriaOrigenId: '',
    memoriaDestinoId: '',
    monto: '',
    motivo: '',
  });

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (selectedGestionId) {
      cargarDatosTraspasos(selectedGestionId);
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

  async function cargarDatosTraspasos(gId: number) {
    setLoading(true);
    try {
      const [tList, mList] = await Promise.all([
        getTraspasos({ gestion: gId }),
        getMemorias({ gestion: gId }),
      ]);
      setTraspasos(Array.isArray(tList) ? tList : []);
      setMemorias(Array.isArray(mList) ? mList : []);
    } catch (err) {
      console.error(err);
      mostrarMensaje('error', 'Error al cargar los traspasos presupuestarios.');
    } finally {
      setLoading(false);
    }
  }

  function mostrarMensaje(type: 'success' | 'error', text: string) {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
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

  // Filtrado de Traspasos
  const traspasosFiltrados = useMemo(() => {
    return (Array.isArray(traspasos) ? traspasos : []).filter((t) => {
      const matchArea = filtroArea === 'todas' || t.area_nombre === (areas.find(a => String(a.id) === filtroArea)?.nombre);
      const matchSearch =
        !searchTerm.trim() ||
        t.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.memoria_origen_codigo && t.memoria_origen_codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.memoria_destino_codigo && t.memoria_destino_codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.area_nombre && t.area_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchArea && matchSearch;
    });
  }, [traspasos, filtroArea, searchTerm, areas]);

  // Reset página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [traspasosFiltrados]);

  const totalPages = Math.max(1, Math.ceil(traspasosFiltrados.length / PAGE_SIZE));
  const traspasosPaginados = useMemo(() => {
    return traspasosFiltrados.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [traspasosFiltrados, currentPage]);

  // Métricas
  const totalMontoMovilizado = useMemo(() => {
    return traspasosFiltrados.reduce((acc, t) => acc + parseFloat(String(t.monto) || '0'), 0);
  }, [traspasosFiltrados]);

  // Memorias Aprobadas para el Modal (filtradas por Área seleccionada en el modal)
  const memoriasAprobadasModal = useMemo(() => {
    if (!modalAreaId) return [];
    return (Array.isArray(memorias) ? memorias : []).filter(
      (m) =>
        m.area_id === Number(modalAreaId) &&
        ['APROBADO_FINANZAS', 'APROBADO_GERENCIA'].includes(m.estado)
    );
  }, [memorias, modalAreaId]);

  const memoriaOrigenSeleccionada = useMemo(() => {
    if (!formTraspaso.memoriaOrigenId) return null;
    return memoriasAprobadasModal.find((m) => m.id === Number(formTraspaso.memoriaOrigenId)) || null;
  }, [formTraspaso.memoriaOrigenId, memoriasAprobadasModal]);

  const memoriaDestinoSeleccionada = useMemo(() => {
    if (!formTraspaso.memoriaDestinoId) return null;
    return memoriasAprobadasModal.find((m) => m.id === Number(formTraspaso.memoriaDestinoId)) || null;
  }, [formTraspaso.memoriaDestinoId, memoriasAprobadasModal]);

  const memoriasDestinoCandidatas = useMemo(() => {
    if (!formTraspaso.memoriaOrigenId) return [];
    return memoriasAprobadasModal.filter((m) => m.id !== Number(formTraspaso.memoriaOrigenId));
  }, [memoriasAprobadasModal, formTraspaso.memoriaOrigenId]);

  function handleOpenModal() {
    setModalAreaId(areas[0]?.id || '');
    setFormTraspaso({
      memoriaOrigenId: '',
      memoriaDestinoId: '',
      monto: '',
      motivo: '',
    });
    setShowModal(true);
  }

  async function handleCrearTraspaso(e: React.FormEvent) {
    e.preventDefault();
    if (isGestionBloqueada) {
      mostrarMensaje('error', 'Solo se pueden realizar traspasos en gestiones En Ejecución.');
      return;
    }
    if (!formTraspaso.memoriaOrigenId || !formTraspaso.memoriaDestinoId || !formTraspaso.monto || !formTraspaso.motivo.trim()) {
      mostrarMensaje('error', 'Por favor completa todos los campos del traspaso.');
      return;
    }

    const montoNum = parseFloat(String(formTraspaso.monto));
    if (montoNum <= 0) {
      mostrarMensaje('error', 'El monto debe ser mayor a 0.');
      return;
    }

    const disponibleOrigen = getSaldo(memoriaOrigenSeleccionada);
    if (montoNum > disponibleOrigen) {
      mostrarMensaje('error', `Monto excede el saldo disponible de origen (${formatMoney(disponibleOrigen)}).`);
      return;
    }

    setActionLoading(true);
    try {
      await createTraspaso({
        memoria_origen: Number(formTraspaso.memoriaOrigenId),
        memoria_destino: Number(formTraspaso.memoriaDestinoId),
        monto: montoNum,
        motivo: formTraspaso.motivo.trim(),
      });
      mostrarMensaje('success', 'Traspaso presupuestario realizado con éxito.');
      setShowModal(false);
      if (selectedGestionId) {
        cargarDatosTraspasos(selectedGestionId);
      }
    } catch (err: any) {
      console.error(err);
      const backendErr = err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.monto?.[0] || 'Error al registrar traspaso.';
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
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${feedbackMsg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-600'
            }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Cabecera Principal Tipo Carta */}
      <div className="card p-6 border border-theme-border bg-theme-surface shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display text-theme-main tracking-tight">
                  Modificaciones Presupuestarias
                </h1>
              </div>
              <p className="text-xs text-theme-muted mt-0.5">
                Reasignación de recursos financieros y saldos entre memorias de cálculo de una misma área organizacional
              </p>
            </div>
          </div>

          {/* Acciones e Indicador de Gestión */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-theme-base border border-theme-border rounded-xl px-3 py-2 shadow-sm">
              <Calendar size={15} className="text-theme-muted" />
              <span className="text-xs font-semibold text-theme-muted">Gestión:</span>
              <select
                value={selectedGestionId || ''}
                onChange={(e) => setSelectedGestionId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-theme-main focus:outline-none"
              >
                {gestiones.map((g) => (
                  <option key={g.id} value={g.id}>
                    Gestión {g.anio} — {g.estado.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenModal}
              disabled={isGestionBloqueada || loading}
              className={`btn-primary text-xs flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all ${isGestionBloqueada ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                }`}
              title={isGestionBloqueada ? 'Las modificaciones solo están permitidas en gestiones En Ejecución' : undefined}
            >
              <Plus size={16} />
              <span>Nueva Modificación</span>
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
            <p className="text-xl font-bold text-theme-main font-mono mt-0.5">{traspasosFiltrados.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4 border border-theme-border bg-theme-surface shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <WalletCards size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">Monto Total Movilizado</p>
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
              {new Set(traspasosFiltrados.map((t) => t.area_nombre)).size} Áreas
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
              placeholder="Buscar por memoria o motivo..."
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
          Mostrando <strong className="text-theme-main">{traspasosFiltrados.length}</strong> traspasos en Gestión {activeGestion?.anio}
        </p>
      </div>

      {/* Tabla de Traspasos */}
      <div className="card border border-theme-border bg-theme-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-theme-border/40 border-b border-theme-border text-theme-muted font-semibold">
                <th className="py-3 px-4"># / Fecha</th>
                <th className="py-3 px-4">Área Solicitante</th>
                <th className="py-3 px-4">Memoria Origen</th>
                <th className="py-3 px-4 text-center">Flujo</th>
                <th className="py-3 px-4">Memoria Destino</th>
                <th className="py-3 px-4 text-right">Monto Traspasado</th>
                <th className="py-3 px-4 max-w-xs">Motivo / Justificación</th>
                <th className="py-3 px-4 text-center">Usuario Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-theme-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
                      <p className="font-medium text-xs">Cargando traspasos presupuestarios...</p>
                    </div>
                  </td>
                </tr>
              ) : traspasosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-theme-muted">
                    <ArrowRightLeft size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No se registraron traspasos presupuestarios en esta gestión.</p>
                  </td>
                </tr>
              ) : (
                traspasosPaginados.map((t) => (
                  <tr key={t.id} className="hover:bg-theme-border/20 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-theme-main">#{t.id}</span>
                      <p className="text-[11px] text-theme-muted mt-0.5">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString('es-BO') : 'N/A'}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-theme-main">{t.area_nombre || 'N/A'}</span>
                    </td>

                    {/* Origen */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {t.memoria_origen_codigo || `MEM-${t.memoria_origen}`}
                        </span>
                        {t.memoria_origen_partida && (
                          <span className="text-[10px] text-theme-muted font-mono">
                            Partida {t.memoria_origen_partida}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dirección */}
                    <td className="py-3 px-4 text-center">
                      <div className="w-7 h-7 rounded-full bg-theme-border/60 flex items-center justify-center mx-auto text-theme-primary">
                        <ArrowRight size={14} />
                      </div>
                    </td>

                    {/* Destino */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {t.memoria_destino_codigo || `MEM-${t.memoria_destino}`}
                        </span>
                        {t.memoria_destino_partida && (
                          <span className="text-[10px] text-theme-muted font-mono">
                            Partida {t.memoria_destino_partida}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Monto */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-theme-main text-xs">
                        {formatMoney(t.monto)}
                      </span>
                    </td>

                    {/* Motivo */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-theme-main line-clamp-2">{t.motivo}</p>
                    </td>

                    {/* Usuario */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-theme-muted text-[11px]">
                        <UserCheck size={13} />
                        <span>{t.usuario_registro_nombre || 'Sistema'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-theme-border bg-theme-surface">
            <p className="text-xs text-theme-muted">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, traspasosFiltrados.length)} de {traspasosFiltrados.length} traspasos
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${currentPage === p
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

      {/* Modal Nuevo Traspaso */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="card w-full max-w-2xl flex flex-col shadow-2xl bg-theme-surface border border-theme-border overflow-hidden">
            <div className="p-5 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft className="text-theme-primary" size={22} />
                <div>
                  <h3 className="text-base font-bold text-theme-main">Nueva Modificación Presupuestaria</h3>
                  <p className="text-xs text-theme-muted">
                    Modificación de saldo entre memorias de la misma área • Gestión {activeGestion?.anio}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-theme-muted hover:text-theme-main text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearTraspaso} className="p-6 space-y-5">
              {/* Selección de Área */}
              <div>
                <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                  1. Seleccionar Área Organizacional *
                </label>
                <select
                  required
                  value={modalAreaId}
                  onChange={(e) => {
                    setModalAreaId(Number(e.target.value));
                    setFormTraspaso({ ...formTraspaso, memoriaOrigenId: '', memoriaDestinoId: '' });
                  }}
                  className="input-theme text-xs"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Memorias Origen y Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    2. Memoria de Origen *
                  </label>
                  <select
                    required
                    value={formTraspaso.memoriaOrigenId}
                    onChange={(e) => {
                      setFormTraspaso({
                        ...formTraspaso,
                        memoriaOrigenId: Number(e.target.value),
                        memoriaDestinoId: '',
                      });
                    }}
                    className="input-theme text-xs font-mono"
                  >
                    <option value="">-- Seleccionar Memoria Origen --</option>
                    {memoriasAprobadasModal.map((m) => {
                      const disponible = getSaldo(m);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.codigo} ({m.partida_codigo || 'P'}) - Disp: {formatMoney(disponible)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    3. Memoria de Destino *
                  </label>
                  <select
                    required
                    disabled={!formTraspaso.memoriaOrigenId}
                    value={formTraspaso.memoriaDestinoId}
                    onChange={(e) => setFormTraspaso({ ...formTraspaso, memoriaDestinoId: Number(e.target.value) })}
                    className="input-theme text-xs font-mono disabled:opacity-50"
                  >
                    <option value="">-- Seleccionar Memoria Destino --</option>
                    {memoriasDestinoCandidatas.map((m) => {
                      const disponible = getSaldo(m);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.codigo} ({m.partida_codigo || 'P'}) - Disp: {formatMoney(disponible)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Previsualización dinámica de saldos */}
              {memoriaOrigenSeleccionada && (
                <div className="p-3.5 rounded-xl bg-theme-border/30 border border-theme-border text-xs space-y-2">
                  <p className="font-bold text-theme-main uppercase tracking-wider text-[10px]">
                    Impacto Presupuestario Proyectado
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-theme-muted text-[11px]">Memoria Origen ({memoriaOrigenSeleccionada.codigo}):</p>
                      <p className="font-mono font-bold text-rose-600">
                        {formatMoney(getSaldo(memoriaOrigenSeleccionada))} →{' '}
                        {formatMoney(
                          Math.max(
                            0,
                            getSaldo(memoriaOrigenSeleccionada) -
                            (parseFloat(String(formTraspaso.monto)) || 0)
                          )
                        )}
                      </p>
                    </div>

                    {memoriaDestinoSeleccionada ? (
                      <div>
                        <p className="text-theme-muted text-[11px]">Memoria Destino ({memoriaDestinoSeleccionada.codigo}):</p>
                        <p className="font-mono font-bold text-emerald-600">
                          {formatMoney(getSaldo(memoriaDestinoSeleccionada))} →{' '}
                          {formatMoney(
                            getSaldo(memoriaDestinoSeleccionada) +
                            (parseFloat(String(formTraspaso.monto)) || 0)
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-theme-muted text-[11px] self-center">Selecciona memoria destino...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Monto y Motivo */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    4. Monto a Traspasar (Bs.) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={memoriaOrigenSeleccionada ? getSaldo(memoriaOrigenSeleccionada) : undefined}
                    required
                    value={formTraspaso.monto}
                    onChange={(e) => setFormTraspaso({ ...formTraspaso, monto: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    className="input-theme text-sm font-mono font-bold"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-theme-muted mb-1">
                    5. Justificación / Motivo del Traspaso *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formTraspaso.motivo}
                    onChange={(e) => setFormTraspaso({ ...formTraspaso, motivo: e.target.value })}
                    className="input-theme text-xs"
                    placeholder="Explica la razón por la cual se traspasa este presupuesto entre memorias..."
                  />
                </div>
              </div>

              {/* Botones del Modal */}
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
                  disabled={actionLoading}
                  className="btn-primary text-xs px-6 py-2 rounded-xl font-semibold shadow-md flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Confirmar Traspaso</span>
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
