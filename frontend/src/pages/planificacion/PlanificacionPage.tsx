import React, { useEffect, useState } from 'react';
import {
  Compass,
  Target,
  FileCheck2,
  ListTodo,
  Plus,
  Edit2,
  Power,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { planificacionService } from '../../services/planificacionService';
import { organizacionalService } from '../../services/organizacionalService';
import { AccionMedianoPlazo, AccionCortoPlazo, Operacion, Tarea } from '../../types/planificacion';
import { Area, Programa } from '../../types/organizacional';
import alertService from '../../utils/alerts';

export default function PlanificacionPage() {
  const { user } = useAuth();
  const rolName = user?.rol_nombre?.toUpperCase() || '';
  const isAprobador = user?.is_superuser || rolName === 'APROBADOR' || rolName === 'ADMINISTRADOR';
  const isGerente = rolName === 'GERENTE';
  const isElaborador = rolName === 'ELABORADOR';
  const isTrabajador = rolName === 'TRABAJADOR';

  const canCreateOpOrTarea = isAprobador || isGerente || isElaborador;
  const canEditOrToggleOpOrTarea = isAprobador || isGerente;
  const canManageAmpOrAcp = isAprobador;

  const userAreaId = user?.area_id;

  const [activeTab, setActiveTab] = useState<'OPERACIONES' | 'TAREAS' | 'ACP' | 'AMP'>('OPERACIONES');
  const [ampList, setAmpList] = useState<AccionMedianoPlazo[]>([]);
  const [acpList, setAcpList] = useState<AccionCortoPlazo[]>([]);
  const [operacionesList, setOperacionesList] = useState<Operacion[]>([]);
  const [tareasList, setTareasList] = useState<Tarea[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales de creación / edición
  const [showAmpModal, setShowAmpModal] = useState(false);
  const [editingAmp, setEditingAmp] = useState<AccionMedianoPlazo | null>(null);

  const [showAcpModal, setShowAcpModal] = useState(false);
  const [editingAcp, setEditingAcp] = useState<AccionCortoPlazo | null>(null);

  const [showOpModal, setShowOpModal] = useState(false);
  const [editingOp, setEditingOp] = useState<Operacion | null>(null);

  const [showTareaModal, setShowTareaModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);

  // Form states
  const [ampForm, setAmpForm] = useState({ programa: '', codigo: '', descripcion: '', periodo_inicio: 2026, periodo_fin: 2030 });
  const [acpForm, setAcpForm] = useState({ accion_mediano_plazo: '', codigo: '', descripcion: '' });
  const [opForm, setOpForm] = useState({ accion_corto_plazo: '', area: '', codigo: '', descripcion: '', es_contratacion: true });
  const [tareaForm, setTareaForm] = useState({ operacion: '', codigo: '', descripcion: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [amps, acps, ops, tareas, progsRes, arsRes] = await Promise.all([
        planificacionService.getAccionesMedianoPlazo(),
        planificacionService.getAccionesCortoPlazo(),
        planificacionService.getOperaciones(),
        planificacionService.getTareas(),
        organizacionalService.getProgramas(),
        organizacionalService.getAreas(),
      ]);
      setAmpList(amps || []);
      setAcpList(acps || []);
      setOperacionesList(ops || []);
      setTareasList(tareas || []);
      setProgramas(progsRes.data || []);
      setAreas(arsRes.data || []);
    } catch (err) {
      console.error('Error cargando planificación:', err);
      alertService.error('Error de carga', 'No se pudieron obtener los datos de Planificación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Handlers AMP
  const handleOpenCreateAMP = () => {
    if (!canManageAmpOrAcp) return;
    setEditingAmp(null);
    setAmpForm({ programa: '', codigo: '', descripcion: '', periodo_inicio: 2026, periodo_fin: 2030 });
    setShowAmpModal(true);
  };

  const handleOpenEditAMP = (amp: AccionMedianoPlazo) => {
    if (!canManageAmpOrAcp) return;
    setEditingAmp(amp);
    setAmpForm({
      programa: String(amp.programa),
      codigo: amp.codigo,
      descripcion: amp.descripcion,
      periodo_inicio: amp.periodo_inicio,
      periodo_fin: amp.periodo_fin,
    });
    setShowAmpModal(true);
  };

  const handleSaveAMP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAmpOrAcp) return;
    try {
      if (editingAmp) {
        await planificacionService.updateAccionMedianoPlazo(editingAmp.id, {
          programa: Number(ampForm.programa),
          codigo: ampForm.codigo,
          descripcion: ampForm.descripcion,
          periodo_inicio: Number(ampForm.periodo_inicio),
          periodo_fin: Number(ampForm.periodo_fin),
        });
        alertService.success('AMP Actualizada', 'Los cambios en la Acción a Mediano Plazo fueron guardados.');
      } else {
        await planificacionService.createAccionMedianoPlazo({
          programa: Number(ampForm.programa),
          codigo: ampForm.codigo,
          descripcion: ampForm.descripcion,
          periodo_inicio: Number(ampForm.periodo_inicio),
          periodo_fin: Number(ampForm.periodo_fin),
        });
        alertService.success('AMP Creada', 'Acción a Mediano Plazo registrada correctamente.');
      }
      setShowAmpModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo guardar la AMP.');
    }
  };

  const handleToggleAMP = async (amp: AccionMedianoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const confirm = await alertService.confirm({
      title: amp.estado ? '¿Desactivar AMP (Baja Lógica)?' : '¿Reactivar AMP?',
      text: amp.estado ? `La AMP ${amp.codigo} quedará dada de baja lógica.` : `La AMP ${amp.codigo} volverá a estar activa.`,
      isDanger: amp.estado,
    });
    if (!confirm) return;

    try {
      await planificacionService.toggleEstadoAMP(amp.id);
      alertService.success('Estado Actualizado', `La AMP ${amp.codigo} fue ${amp.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la AMP.');
    }
  };

  // Handlers ACP
  const handleOpenCreateACP = () => {
    if (!canManageAmpOrAcp) return;
    setEditingAcp(null);
    setAcpForm({ accion_mediano_plazo: '', codigo: '', descripcion: '' });
    setShowAcpModal(true);
  };

  const handleOpenEditACP = (acp: AccionCortoPlazo) => {
    if (!canManageAmpOrAcp) return;
    setEditingAcp(acp);
    setAcpForm({
      accion_mediano_plazo: String(acp.accion_mediano_plazo),
      codigo: acp.codigo,
      descripcion: acp.descripcion,
    });
    setShowAcpModal(true);
  };

  const handleSaveACP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageAmpOrAcp) return;
    try {
      if (editingAcp) {
        await planificacionService.updateAccionCortoPlazo(editingAcp.id, {
          accion_mediano_plazo: Number(acpForm.accion_mediano_plazo),
          codigo: acpForm.codigo,
          descripcion: acpForm.descripcion,
        });
        alertService.success('ACP Actualizada', 'Los cambios en la Acción a Corto Plazo fueron guardados.');
      } else {
        await planificacionService.createAccionCortoPlazo({
          accion_mediano_plazo: Number(acpForm.accion_mediano_plazo),
          codigo: acpForm.codigo,
          descripcion: acpForm.descripcion,
        });
        alertService.success('ACP Creada', 'Acción a Corto Plazo registrada correctamente.');
      }
      setShowAcpModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo guardar la ACP.');
    }
  };

  const handleToggleACP = async (acp: AccionCortoPlazo) => {
    if (!canManageAmpOrAcp) return;
    const confirm = await alertService.confirm({
      title: acp.estado ? '¿Desactivar ACP (Baja Lógica)?' : '¿Reactivar ACP?',
      text: acp.estado ? `La ACP ${acp.codigo} quedará dada de baja lógica.` : `La ACP ${acp.codigo} volverá a estar activa.`,
      isDanger: acp.estado,
    });
    if (!confirm) return;

    try {
      await planificacionService.toggleEstadoACP(acp.id);
      alertService.success('Estado Actualizado', `La ACP ${acp.codigo} fue ${acp.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la ACP.');
    }
  };

  // Handlers Operación
  const handleOpenCreateOp = () => {
    if (!canCreateOpOrTarea) return;
    setEditingOp(null);
    setOpForm({
      accion_corto_plazo: '',
      area: userAreaId ? String(userAreaId) : '',
      codigo: '',
      descripcion: '',
      es_contratacion: true
    });
    setShowOpModal(true);
  };

  const handleOpenEditOp = (op: Operacion) => {
    if (!canEditOrToggleOpOrTarea) return;
    setEditingOp(op);
    setOpForm({
      accion_corto_plazo: String(op.accion_corto_plazo),
      area: String(op.area),
      codigo: op.codigo,
      descripcion: op.descripcion,
      es_contratacion: op.es_contratacion,
    });
    setShowOpModal(true);
  };

  const handleSaveOp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedAreaId = isAprobador ? Number(opForm.area) : Number(userAreaId || opForm.area);
      if (editingOp) {
        if (!canEditOrToggleOpOrTarea) return;
        await planificacionService.updateOperacion(editingOp.id, {
          accion_corto_plazo: Number(opForm.accion_corto_plazo),
          area: selectedAreaId,
          codigo: opForm.codigo,
          descripcion: opForm.descripcion,
          es_contratacion: opForm.es_contratacion,
        });
        alertService.success('Operación Actualizada', 'Los cambios en la Operación fueron guardados.');
      } else {
        if (!canCreateOpOrTarea) return;
        await planificacionService.createOperacion({
          accion_corto_plazo: Number(opForm.accion_corto_plazo),
          area: selectedAreaId,
          codigo: opForm.codigo,
          descripcion: opForm.descripcion,
          es_contratacion: opForm.es_contratacion,
        });
        alertService.success('Operación Creada', 'Operación registrada correctamente.');
      }
      setShowOpModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'No se pudo guardar la Operación.');
    }
  };

  const handleToggleOp = async (op: Operacion) => {
    if (!canEditOrToggleOpOrTarea) return;
    const confirm = await alertService.confirm({
      title: op.estado ? '¿Desactivar Operación (Baja Lógica)?' : '¿Reactivar Operación?',
      text: op.estado ? `La Operación ${op.codigo} quedará dada de baja lógica.` : `La Operación ${op.codigo} volverá a estar activa.`,
      isDanger: op.estado,
    });
    if (!confirm) return;

    try {
      await planificacionService.toggleEstadoOperacion(op.id);
      alertService.success('Estado Actualizado', `La Operación ${op.codigo} fue ${op.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la Operación.');
    }
  };

  // Handlers Tarea
  const handleOpenCreateTarea = () => {
    if (!canCreateOpOrTarea) return;
    setEditingTarea(null);
    setTareaForm({ operacion: '', codigo: '', descripcion: '' });
    setShowTareaModal(true);
  };

  const handleOpenEditTarea = (tarea: Tarea) => {
    if (!canEditOrToggleOpOrTarea) return;
    setEditingTarea(tarea);
    setTareaForm({
      operacion: String(tarea.operacion),
      codigo: tarea.codigo,
      descripcion: tarea.descripcion,
    });
    setShowTareaModal(true);
  };

  const handleSaveTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTarea) {
        if (!canEditOrToggleOpOrTarea) return;
        await planificacionService.updateTarea(editingTarea.id, {
          operacion: Number(tareaForm.operacion),
          codigo: tareaForm.codigo,
          descripcion: tareaForm.descripcion,
        });
        alertService.success('Tarea Actualizada', 'Los cambios en la Tarea fueron guardados.');
      } else {
        if (!canCreateOpOrTarea) return;
        await planificacionService.createTarea({
          operacion: Number(tareaForm.operacion),
          codigo: tareaForm.codigo,
          descripcion: tareaForm.descripcion,
        });
        alertService.success('Tarea Creada', 'Tarea registrada correctamente.');
      }
      setShowTareaModal(false);
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || err?.response?.data?.non_field_errors?.[0] || 'No se pudo guardar la Tarea.');
    }
  };

  const handleToggleTarea = async (tarea: Tarea) => {
    if (!canEditOrToggleOpOrTarea) return;
    const confirm = await alertService.confirm({
      title: tarea.estado ? '¿Desactivar Tarea (Baja Lógica)?' : '¿Reactivar Tarea?',
      text: tarea.estado ? `La Tarea ${tarea.codigo} quedará dada de baja lógica.` : `La Tarea ${tarea.codigo} volverá a estar activa.`,
      isDanger: tarea.estado,
    });
    if (!confirm) return;

    try {
      await planificacionService.toggleEstadoTarea(tarea.id);
      alertService.success('Estado Actualizado', `La Tarea ${tarea.codigo} fue ${tarea.estado ? 'desactivada' : 'reactivada'}.`);
      fetchAll();
    } catch (err) {
      alertService.error('Error', 'No se pudo cambiar el estado de la Tarea.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera Principal */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-theme-primary/15 text-theme-primary shadow-sm">
              <Compass size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-theme-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-theme-primary">
                  Alineación Estratégica Institucional
                </span>
              </div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight mt-0.5">
                Planificación POA & PEI
              </h1>
              <p className="text-sm text-theme-muted">
                Gestión de Operaciones, Tareas TAMEP, Objetivos POA (ACP) y PEI (AMP).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeTab === 'OPERACIONES' && canCreateOpOrTarea && (
              <button onClick={handleOpenCreateOp} className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> Nueva Operación
              </button>
            )}
            {activeTab === 'TAREAS' && canCreateOpOrTarea && (
              <button onClick={handleOpenCreateTarea} className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> Nueva Tarea TAMEP
              </button>
            )}
            {activeTab === 'ACP' && canManageAmpOrAcp && (
              <button onClick={handleOpenCreateACP} className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> Nueva ACP (POA)
              </button>
            )}
            {activeTab === 'AMP' && canManageAmpOrAcp && (
              <button onClick={handleOpenCreateAMP} className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer">
                <Plus size={16} /> Nueva AMP (PEI)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme-border pb-2">
        <button
          onClick={() => setActiveTab('OPERACIONES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'OPERACIONES'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <FileCheck2 size={16} />
          <span>Operaciones por Área</span>
        </button>

        <button
          onClick={() => setActiveTab('TAREAS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'TAREAS'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <ListTodo size={16} />
          <span>Tareas TAMEP</span>
        </button>

        <button
          onClick={() => setActiveTab('ACP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'ACP'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <Target size={16} />
          <span>Acciones a Corto Plazo (POA)</span>
        </button>

        <button
          onClick={() => setActiveTab('AMP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'AMP'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <Compass size={16} />
          <span>Acciones a Mediano Plazo (PEI)</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      {loading ? (
        <div className="card p-12 text-center text-theme-muted">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2" />
          <p className="text-sm">Cargando alineación estratégica...</p>
        </div>
      ) : (
        <>
          {activeTab === 'OPERACIONES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-theme-main flex items-center gap-2">
                  <FileCheck2 className="text-theme-primary" size={18} />
                  <span>Catálogo de Operaciones por Área</span>
                </h3>
                <span className="text-xs text-theme-muted">
                  Total: <strong>{operacionesList.length}</strong>
                </span>
              </div>

              {operacionesList.length === 0 ? (
                <div className="card p-12 text-center text-theme-muted">
                  No hay operaciones disponibles para tu área.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {operacionesList.map((op) => (
                    <div key={op.id} className={`card p-5 space-y-3 transition-colors ${!op.estado ? 'opacity-60 bg-theme-base/40' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                            {op.codigo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {op.area_nombre || 'Área General'}
                          </span>
                        </div>

                        {/* Botones Modificación y Baja Lógica (Sólo Gerente o Aprobador) */}
                        {canEditOrToggleOpOrTarea && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditOp(op)}
                              className="p-1 rounded hover:bg-theme-border/50 text-blue-600"
                              title="Editar Operación"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleOp(op)}
                              className={`p-1 rounded hover:bg-theme-border/50 ${op.estado ? 'text-rose-600' : 'text-emerald-600'}`}
                              title={op.estado ? 'Desactivar (Baja Lógica)' : 'Reactivar'}
                            >
                              <Power size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-theme-main">{op.descripcion}</p>

                      <div className="flex items-center justify-between text-xs text-theme-muted pt-2 border-t border-theme-border/60">
                        <span>ACP: <strong>{op.acp_codigo}</strong></span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${op.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {op.estado ? 'Activa' : 'Baja Lógica'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'TAREAS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-theme-main flex items-center gap-2">
                  <ListTodo className="text-theme-primary" size={18} />
                  <span>Tareas TAMEP (Correlación Operativa)</span>
                </h3>
                <span className="text-xs text-theme-muted">
                  Total Tareas: <strong>{tareasList.length}</strong>
                </span>
              </div>

              {tareasList.length === 0 ? (
                <div className="card p-12 text-center text-theme-muted">
                  No hay Tareas registradas para las operaciones de tu área.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tareasList.map((tarea) => (
                    <div key={tarea.id} className={`card p-5 space-y-3 transition-colors ${!tarea.estado ? 'opacity-60 bg-theme-base/40' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          {tarea.codigo}
                        </span>

                        {canEditOrToggleOpOrTarea && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditTarea(tarea)}
                              className="p-1 rounded hover:bg-theme-border/50 text-blue-600"
                              title="Editar Tarea"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleTarea(tarea)}
                              className={`p-1 rounded hover:bg-theme-border/50 ${tarea.estado ? 'text-rose-600' : 'text-emerald-600'}`}
                              title={tarea.estado ? 'Desactivar (Baja Lógica)' : 'Reactivar'}
                            >
                              <Power size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-theme-main">{tarea.descripcion}</p>

                      <div className="flex items-center justify-between text-xs text-theme-muted pt-2 border-t border-theme-border/60">
                        <span>Operación: <strong>{tarea.operacion_codigo}</strong></span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tarea.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {tarea.estado ? 'Activa' : 'Baja Lógica'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ACP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-theme-main flex items-center gap-2">
                  <Target className="text-theme-primary" size={18} />
                  <span>Acciones a Corto Plazo (Metas Anuales POA)</span>
                </h3>
              </div>

              {acpList.length === 0 ? (
                <div className="card p-12 text-center text-theme-muted">
                  No hay Acciones a Corto Plazo registradas.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {acpList.map((acp) => (
                    <div key={acp.id} className={`card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${!acp.estado ? 'opacity-60 bg-theme-base/40' : ''}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {acp.codigo}
                          </span>
                          <span className="text-xs text-theme-muted">PEI: {acp.amp_codigo}</span>
                        </div>
                        <p className="text-sm font-semibold text-theme-main">{acp.descripcion}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${acp.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {acp.estado ? 'Activa' : 'Baja Lógica'}
                        </span>
                        {canManageAmpOrAcp && (
                          <>
                            <button
                              onClick={() => handleOpenEditACP(acp)}
                              className="p-1.5 rounded hover:bg-theme-border/50 text-blue-600"
                              title="Editar ACP"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleACP(acp)}
                              className={`p-1.5 rounded hover:bg-theme-border/50 ${acp.estado ? 'text-rose-600' : 'text-emerald-600'}`}
                              title={acp.estado ? 'Desactivar' : 'Reactivar'}
                            >
                              <Power size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'AMP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-theme-main flex items-center gap-2">
                  <Compass className="text-theme-primary" size={18} />
                  <span>Acciones a Mediano Plazo (PEI Quinquenal 5 Años)</span>
                </h3>
              </div>

              {ampList.length === 0 ? (
                <div className="card p-12 text-center text-theme-muted">
                  No hay Acciones a Mediano Plazo registradas.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {ampList.map((amp) => (
                    <div key={amp.id} className={`card p-6 space-y-3 ${!amp.estado ? 'opacity-60 bg-theme-base/40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            {amp.codigo}
                          </span>
                          <span className="text-xs font-semibold text-theme-muted">
                            Programa: {amp.programa_codigo} - {amp.programa_nombre}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-theme-primary/10 text-theme-primary">
                            Período {amp.periodo_inicio} - {amp.periodo_fin}
                          </span>
                          {canManageAmpOrAcp && (
                            <>
                              <button
                                onClick={() => handleOpenEditAMP(amp)}
                                className="p-1.5 rounded hover:bg-theme-border/50 text-blue-600"
                                title="Editar AMP"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleToggleAMP(amp)}
                                className={`p-1.5 rounded hover:bg-theme-border/50 ${amp.estado ? 'text-rose-600' : 'text-emerald-600'}`}
                                title={amp.estado ? 'Desactivar' : 'Reactivar'}
                              >
                                <Power size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <p className="text-sm font-bold text-theme-main">{amp.descripcion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal AMP (Crear / Editar) */}
      {showAmpModal && canManageAmpOrAcp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="font-bold text-base text-theme-main">
                {editingAmp ? 'Editar AMP (PEI)' : 'Nueva Acción a Mediano Plazo (PEI)'}
              </h3>
              <button onClick={() => setShowAmpModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveAMP} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Programa</label>
                <select
                  value={ampForm.programa}
                  onChange={(e) => setAmpForm({ ...ampForm, programa: e.target.value })}
                  required
                  className="input-theme w-full"
                >
                  <option value="">Seleccione programa...</option>
                  {programas.map((p) => (
                    <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Código AMP</label>
                <input
                  type="text"
                  value={ampForm.codigo}
                  onChange={(e) => setAmpForm({ ...ampForm, codigo: e.target.value })}
                  placeholder="Ej: AMP-03"
                  required
                  className="input-theme w-full"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Descripción / Objetivo PEI</label>
                <textarea
                  value={ampForm.descripcion}
                  onChange={(e) => setAmpForm({ ...ampForm, descripcion: e.target.value })}
                  rows={3}
                  required
                  className="input-theme w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Año Inicio</label>
                  <input
                    type="number"
                    value={ampForm.periodo_inicio}
                    onChange={(e) => setAmpForm({ ...ampForm, periodo_inicio: Number(e.target.value) })}
                    className="input-theme w-full"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Año Fin</label>
                  <input
                    type="number"
                    value={ampForm.periodo_fin}
                    onChange={(e) => setAmpForm({ ...ampForm, periodo_fin: Number(e.target.value) })}
                    className="input-theme w-full"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAmpModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar AMP</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ACP (Crear / Editar) */}
      {showAcpModal && canManageAmpOrAcp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="font-bold text-base text-theme-main">
                {editingAcp ? 'Editar ACP (POA)' : 'Nueva Acción a Corto Plazo (POA)'}
              </h3>
              <button onClick={() => setShowAcpModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveACP} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Acción a Mediano Plazo (PEI)</label>
                <select
                  value={acpForm.accion_mediano_plazo}
                  onChange={(e) => setAcpForm({ ...acpForm, accion_mediano_plazo: e.target.value })}
                  required
                  className="input-theme w-full"
                >
                  <option value="">Seleccione AMP...</option>
                  {ampList.map((a) => (
                    <option key={a.id} value={a.id}>{a.codigo} - {a.descripcion}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Código ACP</label>
                <input
                  type="text"
                  value={acpForm.codigo}
                  onChange={(e) => setAcpForm({ ...acpForm, codigo: e.target.value })}
                  placeholder="Ej: ACP-01.2"
                  required
                  className="input-theme w-full"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Descripción Meta Anual POA</label>
                <textarea
                  value={acpForm.descripcion}
                  onChange={(e) => setAcpForm({ ...acpForm, descripcion: e.target.value })}
                  rows={3}
                  required
                  className="input-theme w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAcpModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar ACP</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Operación (Crear / Editar) */}
      {showOpModal && canCreateOpOrTarea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="font-bold text-base text-theme-main">
                {editingOp ? 'Editar Operación' : 'Nueva Operación por Área'}
              </h3>
              <button onClick={() => setShowOpModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveOp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Acción a Corto Plazo (POA)</label>
                <select
                  value={opForm.accion_corto_plazo}
                  onChange={(e) => setOpForm({ ...opForm, accion_corto_plazo: e.target.value })}
                  required
                  className="input-theme w-full"
                >
                  <option value="">Seleccione ACP...</option>
                  {acpList.map((a) => (
                    <option key={a.id} value={a.id}>{a.codigo} - {a.descripcion}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Área / Gerencia Responsable</label>
                <select
                  value={opForm.area}
                  onChange={(e) => setOpForm({ ...opForm, area: e.target.value })}
                  disabled={!isAprobador}
                  required
                  className="input-theme w-full disabled:opacity-60"
                >
                  <option value="">Seleccione Área...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Código Operación</label>
                <input
                  type="text"
                  value={opForm.codigo}
                  onChange={(e) => setOpForm({ ...opForm, codigo: e.target.value })}
                  placeholder="Ej: OP-INF-03"
                  required
                  className="input-theme w-full"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Descripción de la Operación</label>
                <textarea
                  value={opForm.descripcion}
                  onChange={(e) => setOpForm({ ...opForm, descripcion: e.target.value })}
                  rows={3}
                  required
                  className="input-theme w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowOpModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Operación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tarea (Crear / Editar) */}
      {showTareaModal && canCreateOpOrTarea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="font-bold text-base text-theme-main">
                {editingTarea ? 'Editar Tarea TAMEP' : 'Nueva Tarea TAMEP'}
              </h3>
              <button onClick={() => setShowTareaModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveTarea} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Operación Padre</label>
                <select
                  value={tareaForm.operacion}
                  onChange={(e) => setTareaForm({ ...tareaForm, operacion: e.target.value })}
                  required
                  className="input-theme w-full"
                >
                  <option value="">Seleccione Operación...</option>
                  {operacionesList.map((op) => (
                    <option key={op.id} value={op.id}>{op.codigo} - {op.descripcion}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Código Tarea</label>
                <input
                  type="text"
                  value={tareaForm.codigo}
                  onChange={(e) => setTareaForm({ ...tareaForm, codigo: e.target.value })}
                  placeholder="Ej: TAR-INF-01.2"
                  required
                  className="input-theme w-full"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Descripción / Detalle TAMEP</label>
                <textarea
                  value={tareaForm.descripcion}
                  onChange={(e) => setTareaForm({ ...tareaForm, descripcion: e.target.value })}
                  rows={3}
                  required
                  className="input-theme w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowTareaModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
