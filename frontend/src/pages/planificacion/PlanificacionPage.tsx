import React, { useEffect, useState } from 'react';
import {
  Compass,
  Target,
  FileCheck2,
  Plus,
  X,
} from 'lucide-react';
import { planificacionService } from '../../services/planificacionService';
import { organizacionalService } from '../../services/organizacionalService';
import { AccionMedianoPlazo, AccionCortoPlazo, Operacion } from '../../types/planificacion';
import { Area, Programa } from '../../types/organizacional';
import alertService from '../../utils/alerts';

export default function PlanificacionPage() {
  const [activeTab, setActiveTab] = useState<'AMP' | 'ACP' | 'OPERACIONES'>('OPERACIONES');
  const [ampList, setAmpList] = useState<AccionMedianoPlazo[]>([]);
  const [acpList, setAcpList] = useState<AccionCortoPlazo[]>([]);
  const [operacionesList, setOperacionesList] = useState<Operacion[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales de creación
  const [showAmpModal, setShowAmpModal] = useState(false);
  const [showAcpModal, setShowAcpModal] = useState(false);
  const [showOpModal, setShowOpModal] = useState(false);

  // Form states
  const [ampForm, setAmpForm] = useState({ programa: '', codigo: '', descripcion: '', periodo_inicio: 2026, periodo_fin: 2030 });
  const [acpForm, setAcpForm] = useState({ accion_mediano_plazo: '', codigo: '', descripcion: '' });
  const [opForm, setOpForm] = useState({ accion_corto_plazo: '', area: '', codigo: '', descripcion: '', es_contratacion: true });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [amps, acps, ops, progsRes, arsRes] = await Promise.all([
        planificacionService.getAccionesMedianoPlazo(),
        planificacionService.getAccionesCortoPlazo(),
        planificacionService.getOperaciones(),
        organizacionalService.getProgramas(),
        organizacionalService.getAreas(),
      ]);
      setAmpList(amps || []);
      setAcpList(acps || []);
      setOperacionesList(ops || []);
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

  const handleCreateAMP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await planificacionService.createAccionMedianoPlazo({
        programa: Number(ampForm.programa),
        codigo: ampForm.codigo,
        descripcion: ampForm.descripcion,
        periodo_inicio: Number(ampForm.periodo_inicio),
        periodo_fin: Number(ampForm.periodo_fin),
      });
      alertService.success('AMP Creada', 'Acción a Mediano Plazo registrada correctamente.');
      setShowAmpModal(false);
      setAmpForm({ programa: '', codigo: '', descripcion: '', periodo_inicio: 2026, periodo_fin: 2030 });
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo crear la AMP.');
    }
  };

  const handleCreateACP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await planificacionService.createAccionCortoPlazo({
        accion_mediano_plazo: Number(acpForm.accion_mediano_plazo),
        codigo: acpForm.codigo,
        descripcion: acpForm.descripcion,
      });
      alertService.success('ACP Creada', 'Acción a Corto Plazo registrada correctamente.');
      setShowAcpModal(false);
      setAcpForm({ accion_mediano_plazo: '', codigo: '', descripcion: '' });
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo crear la ACP.');
    }
  };

  const handleCreateOp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await planificacionService.createOperacion({
        accion_corto_plazo: Number(opForm.accion_corto_plazo),
        area: Number(opForm.area),
        codigo: opForm.codigo,
        descripcion: opForm.descripcion,
        es_contratacion: opForm.es_contratacion,
      });
      alertService.success('Operación Creada', 'Operación registrada correctamente.');
      setShowOpModal(false);
      setOpForm({ accion_corto_plazo: '', area: '', codigo: '', descripcion: '', es_contratacion: true });
      fetchAll();
    } catch (err: any) {
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo crear la Operación.');
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
                Control de correlación de operaciones y tareas TAMEP contra Objetivos Estratégicos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeTab === 'OPERACIONES' && (
              <button
                onClick={() => setShowOpModal(true)}
                className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Nueva Operación
              </button>
            )}
            {activeTab === 'ACP' && (
              <button
                onClick={() => setShowAcpModal(true)}
                className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Nueva ACP (POA)
              </button>
            )}
            {activeTab === 'AMP' && (
              <button
                onClick={() => setShowAmpModal(true)}
                className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> Nueva AMP (PEI)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="flex items-center gap-2 border-b border-theme-border pb-2">
        <button
          onClick={() => setActiveTab('OPERACIONES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            activeTab === 'OPERACIONES'
              ? 'bg-theme-primary text-white shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface'
          }`}
        >
          <FileCheck2 size={16} />
          <span>Operaciones por Área / Unidad</span>
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
          <span>Acciones a Corto Plazo (POA - 1 Año)</span>
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
          <span>Acciones a Mediano Plazo (PEI - 5 Años)</span>
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
                  <span>Catálogo de Operaciones Habilitadas para Contrataciones</span>
                </h3>
                <span className="text-xs text-theme-muted">
                  Total Operaciones: <strong>{operacionesList.length}</strong>
                </span>
              </div>

              {operacionesList.length === 0 ? (
                <div className="card p-12 text-center text-theme-muted">
                  No hay operaciones registradas aún. Presiona "Nueva Operación" para crear una.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {operacionesList.map((op) => (
                    <div key={op.id} className="card p-5 space-y-3 hover:border-theme-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                            {op.codigo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {op.area_nombre || 'Área General'}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-theme-muted">
                          ACP: {op.acp_codigo}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-theme-main">{op.descripcion}</p>

                      {op.tareas && op.tareas.length > 0 && (
                        <div className="pt-2 border-t border-theme-border/60 space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted block">
                            Tareas TAMEP Asociadas:
                          </span>
                          {op.tareas.map((t) => (
                            <div key={t.id} className="flex items-center gap-2 text-xs text-theme-muted bg-theme-base/40 p-2 rounded-lg">
                              <span className="font-mono font-bold text-theme-primary text-[10px]">{t.codigo}</span>
                              <span className="truncate">{t.descripcion}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
                    <div key={acp.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-theme-base text-theme-muted border border-theme-border">
                          Operaciones: {acp.operaciones?.length || 0}
                        </span>
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
                    <div key={amp.id} className="card p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            {amp.codigo}
                          </span>
                          <span className="text-xs font-semibold text-theme-muted">
                            Programa: {amp.programa_codigo} - {amp.programa_nombre}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-theme-primary/10 text-theme-primary">
                          Período {amp.periodo_inicio} - {amp.periodo_fin}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-theme-main">{amp.descripcion}</p>

                      <div className="pt-2 border-t border-theme-border text-xs text-theme-muted">
                        Acciones Corto Plazo asociadas: <strong>{amp.acciones_corto_plazo?.length || 0}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Nueva AMP */}
      {showAmpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="font-bold text-base text-theme-main">Nueva Acción a Mediano Plazo (PEI)</h3>
              <button onClick={() => setShowAmpModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAMP} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Programa</label>
                <select
                  value={ampForm.programa}
                  onChange={(e) => setAmpForm({ ...ampForm, programa: e.target.value })}
                  required
                  className="input-theme w-full"
                >
                  <option value="">Seleccione un programa...</option>
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

      {/* Modal Nueva ACP */}
      {showAcpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="font-bold text-base text-theme-main">Nueva Acción a Corto Plazo (POA)</h3>
              <button onClick={() => setShowAcpModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateACP} className="space-y-3 text-xs">
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

      {/* Modal Nueva Operación */}
      {showOpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-lg border border-theme-border space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h3 className="font-bold text-base text-theme-main">Nueva Operación por Área</h3>
              <button onClick={() => setShowOpModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateOp} className="space-y-3 text-xs">
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
                  required
                  className="input-theme w-full"
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
    </div>
  );
}
