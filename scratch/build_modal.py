import re

with open(r'c:\Users\hp\Desktop\proyecto-poa\scratch\modal_html.txt', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace activeGestion?.anio with fichaMemoria.gestion_anio
html = html.replace('activeGestion?.anio ||', 'fichaMemoria.gestion_anio ||')

# Replace edit method
html = html.replace('handleOpenEditar(targetMem);', 'if (onActionSuccess) { onActionSuccess("EDIT", targetMem); }')

# Now build the new React component
new_content = """import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import alertService from '../../../utils/alerts';
import {
  BookOpenText, CheckCircle2, XCircle, Send, FileText,
  User, RefreshCw, Edit3, Lock, Printer, Layers, AlertCircle
} from 'lucide-react';
import {
  getMemoria,
  enviarMemoriaGerencia,
  aprobarMemoriaGerencia,
  aprobarMemoriaPlanificacion,
  aprobarMemoriaFinanzas,
  rechazarMemoria,
  volverMemoriaBorrador
} from '../../../services/presupuestoService';

export const MemoriaDetalleModal = ({ memoriaId, onClose, onActionSuccess }: any) => {
  const { user } = useAuth();
  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isSuperuser = !!user?.is_superuser;
  const isAprobador = isSuperuser || rolClean === 'APROBADOR' || rolClean === 'ADMINISTRADOR';
  const isPlanificador = !isSuperuser && rolClean.includes('PLANIFIC');
  const isGerente = !isSuperuser && !isPlanificador && rolClean === 'GERENTE';
  const isElaborador = !isSuperuser && !isAprobador && !isPlanificador && !isGerente && rolClean === 'ELABORADOR';
  const canCreate = isAprobador || isElaborador;

  const [fichaMemoria, setFichaMemoria] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (memoriaId) {
      getMemoria(memoriaId).then(mem => {
        setFichaMemoria(mem);
        setLoading(false);
      }).catch(err => {
        alertService.error('Error', 'No se pudo cargar la memoria');
        onClose();
      });
    }
  }, [memoriaId]);

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 shadow-sm"><FileText size={12} /> Borrador</span>;
      case 'PENDIENTE_GERENCIA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 shadow-sm"><Send size={12} /> Pendiente Gerencia</span>;
      case 'PENDIENTE_PLANIFICACION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/90 dark:text-indigo-200 dark:border-indigo-700 shadow-sm"><CheckCircle2 size={12} /> Pendiente PlanificaciÃ³n</span>;
      case 'APROBADO_GERENCIA':
      case 'APROBADO_PLANIFICACION':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 shadow-sm"><CheckCircle2 size={12} /> Pendiente Presupuestos</span>;
      case 'APROBADO_FINANZAS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 shadow-sm"><CheckCircle2 size={12} /> Aprobado POA</span>;
      case 'RECHAZADO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 shadow-sm"><XCircle size={12} /> Rechazado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">{estado}</span>;
    }
  };

  async function handleEnviarGerencia() {
    try {
      setActionLoading(true);
      const res = await enviarMemoriaGerencia(fichaMemoria.id);
      alertService.success('Enviado a Gerencia', res.message);
      if (onActionSuccess) onActionSuccess();
      const fresca = await getMemoria(fichaMemoria.id);
      setFichaMemoria(fresca);
    } catch (err: any) {
      alertService.error('Error', 'No se pudo enviar a revisiÃ³n.');
    } finally { setActionLoading(false); }
  }

  async function handleAprobarGerencia() {
    const nota = await alertService.prompt({ title: 'Aprobar por Gerencia', text: 'Puede adjuntar una nota:' });
    if (nota === null) return;
    try {
      setActionLoading(true);
      const res = await aprobarMemoriaGerencia(fichaMemoria.id, nota);
      alertService.success('Aprobado', res.message);
      if (onActionSuccess) onActionSuccess();
      const fresca = await getMemoria(fichaMemoria.id);
      setFichaMemoria(fresca);
    } catch (err: any) {
      alertService.error('Error', 'Error al aprobar.');
    } finally { setActionLoading(false); }
  }

  async function handleAprobarPlanificacion() {
    const nota = await alertService.prompt({ title: 'Aprobar por PlanificaciÃ³n', text: 'Puede adjuntar una nota:' });
    if (nota === null) return;
    try {
      setActionLoading(true);
      const res = await aprobarMemoriaPlanificacion(fichaMemoria.id, nota);
      alertService.success('Aprobado', res.message);
      if (onActionSuccess) onActionSuccess();
      const fresca = await getMemoria(fichaMemoria.id);
      setFichaMemoria(fresca);
    } catch (err: any) {
      alertService.error('Error', 'Error al aprobar.');
    } finally { setActionLoading(false); }
  }

  async function handleAprobarFinanciero() {
    const nota = await alertService.prompt({ title: 'AprobaciÃ³n Final', text: 'Puede adjuntar una nota:' });
    if (nota === null) return;
    try {
      setActionLoading(true);
      const res = await aprobarMemoriaFinanzas(fichaMemoria.id, nota);
      alertService.success('Aprobado', res.message);
      if (onActionSuccess) onActionSuccess();
      const fresca = await getMemoria(fichaMemoria.id);
      setFichaMemoria(fresca);
    } catch (err: any) {
      alertService.error('Error', 'Error al aprobar.');
    } finally { setActionLoading(false); }
  }

  async function handleRechazar() {
    const motivo = await alertService.prompt({ title: 'Rechazar Memoria', text: 'Debe ingresar un motivo:' });
    if (!motivo) return;
    try {
      setActionLoading(true);
      const res = await rechazarMemoria(fichaMemoria.id, motivo);
      alertService.success('Rechazado', res.message);
      if (onActionSuccess) onActionSuccess();
      const fresca = await getMemoria(fichaMemoria.id);
      setFichaMemoria(fresca);
    } catch (err: any) {
      alertService.error('Error', 'Error al rechazar.');
    } finally { setActionLoading(false); }
  }

  async function handleVolverABorrador() {
    const motivo = await alertService.prompt({ title: 'Reiniciar a Borrador', text: 'Debe ingresar un motivo:' });
    if (!motivo) return;
    try {
      setActionLoading(true);
      const res = await volverMemoriaBorrador(fichaMemoria.id, motivo);
      alertService.success('Reiniciado a Borrador', res.message);
      if (onActionSuccess) onActionSuccess();
      const fresca = await getMemoria(fichaMemoria.id);
      setFichaMemoria(fresca);
    } catch (err: any) {
      alertService.error('Error', 'Error al regresar a borrador.');
    } finally { setActionLoading(false); }
  }

  if (loading || !fichaMemoria) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="card shadow-2xl bg-theme-surface p-10 flex flex-col items-center justify-center">
          <RefreshCw className="animate-spin text-theme-primary mb-4" size={32} />
          <p className="text-theme-main font-semibold">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  return (
""" + html

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriaDetalleModal.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
