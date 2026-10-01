import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AuditLogEntry,
  AuditResumen,
  WorkerWorkflowSummary,
  WorkerDetailActivity,
  AuditFilterParams,
} from '../types/auditoria.types';
import {
  getAuditoriaResumen,
  getAuditoriaLogs,
  getFlujoTrabajadores,
  getTrabajadorDetalle,
  getUltimosIngresos,
  exportLogsToCSV,
} from '../services/auditoriaService';
import { UserProfile } from '../../../services/authService';

export type AuditoriaTab = 'BITACORA' | 'TRABAJADORES' | 'LOGINS';

export function useAuditoria(isAdmin: boolean) {
  const [activeTab, setActiveTab] = useState<AuditoriaTab>('BITACORA');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos principales
  const [resumen, setResumen] = useState<AuditResumen | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [flujoTrabajadores, setFlujoTrabajadores] = useState<WorkerWorkflowSummary[]>([]);
  const [ultimosIngresos, setUltimosIngresos] = useState<UserProfile[]>([]);

  // Filtros activos
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModulo, setSelectedModulo] = useState<string>('TODOS');
  const [selectedActionFlag, setSelectedActionFlag] = useState<string>('TODOS');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('TODOS');
  const [timeRange, setTimeRange] = useState<'TODAS' | 'HOY' | '7_DIAS' | 'ESTE_MES'>('TODAS');

  // Modales interactivos
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [workerDetail, setWorkerDetail] = useState<WorkerDetailActivity | null>(null);
  const [loadingWorkerDetail, setLoadingWorkerDetail] = useState(false);

  // Carga inicial y recarga
  const cargarDatos = useCallback(async (isSilent = false) => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [resumenData, logsData, trabajadoresData, ingresosData] = await Promise.all([
        getAuditoriaResumen(),
        getAuditoriaLogs({ limit: 1000 }),
        getFlujoTrabajadores(),
        getUltimosIngresos(),
      ]);

      setResumen(resumenData);
      setLogs(logsData);
      setFlujoTrabajadores(trabajadoresData);
      setUltimosIngresos(ingresosData);
    } catch (err: any) {
      console.error('Error cargando auditoría integral:', err);
      setError(err?.response?.data?.error || 'Error al obtener la información de auditoría.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Carga de detalle de trabajador específico al abrir su modal
  const handleOpenWorkerModal = async (workerId: number) => {
    setSelectedWorkerId(workerId);
    setLoadingWorkerDetail(true);
    try {
      const detail = await getTrabajadorDetalle(workerId);
      setWorkerDetail(detail);
    } catch (err) {
      console.error('Error cargando detalle del trabajador:', err);
    } finally {
      setLoadingWorkerDetail(false);
    }
  };

  const handleCloseWorkerModal = () => {
    setSelectedWorkerId(null);
    setWorkerDetail(null);
  };

  const handleOpenLogModal = (log: AuditLogEntry) => {
    setSelectedLog(log);
  };

  const handleCloseLogModal = () => {
    setSelectedLog(null);
  };

  // Filtrado reactivo de la bitácora
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filtro por rango de fechas
    if (timeRange !== 'TODAS') {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (timeRange === 'HOY') {
        result = result.filter((l) => l.action_time.startsWith(todayStr));
      } else if (timeRange === '7_DIAS') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        result = result.filter((l) => new Date(l.action_time) >= sevenDaysAgo);
      } else if (timeRange === 'ESTE_MES') {
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        result = result.filter((l) => {
          const d = new Date(l.action_time);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });
      }
    }

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.object_repr.toLowerCase().includes(term) ||
          l.change_message.toLowerCase().includes(term) ||
          l.usuario_nombre.toLowerCase().includes(term) ||
          l.usuario_username.toLowerCase().includes(term) ||
          l.usuario_area.toLowerCase().includes(term) ||
          l.modulo.toLowerCase().includes(term)
      );
    }

    // Filtro por módulo
    if (selectedModulo !== 'TODOS') {
      result = result.filter((l) => l.modulo === selectedModulo);
    }

    // Filtro por tipo de acción
    if (selectedActionFlag !== 'TODOS') {
      if (selectedActionFlag === 'LOGIN') {
        result = result.filter((l) => l.action_flag_display === 'LOGIN');
      } else {
        const flagNum = parseInt(selectedActionFlag, 10);
        result = result.filter((l) => l.action_flag === flagNum);
      }
    }

    // Filtro por trabajador específico
    if (selectedWorkerFilter !== 'TODOS') {
      const uid = parseInt(selectedWorkerFilter, 10);
      result = result.filter((l) => l.usuario_id === uid);
    }

    return result;
  }, [logs, searchTerm, selectedModulo, selectedActionFlag, selectedWorkerFilter, timeRange]);


  // Filtrado de trabajadores
  const filteredTrabajadores = useMemo(() => {
    if (!searchTerm.trim()) return flujoTrabajadores;
    const term = searchTerm.toLowerCase().trim();
    return flujoTrabajadores.filter(
      (w) =>
        w.nombre_completo.toLowerCase().includes(term) ||
        w.username.toLowerCase().includes(term) ||
        w.cargo.toLowerCase().includes(term) ||
        w.rol.toLowerCase().includes(term) ||
        w.area.toLowerCase().includes(term)
    );
  }, [flujoTrabajadores, searchTerm]);

  // Filtrado de ingresos
  const filteredIngresos = useMemo(() => {
    if (!searchTerm.trim()) return ultimosIngresos;
    const term = searchTerm.toLowerCase().trim();
    return ultimosIngresos.filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(term) ||
        (u.rol_nombre || '').toLowerCase().includes(term) ||
        (u.area_nombre || '').toLowerCase().includes(term)
    );
  }, [ultimosIngresos, searchTerm]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportLogsToCSV(filteredLogs, `bitacora_auditoria_poa_${timestamp}.csv`);
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    error,
    resumen,
    logs: filteredLogs,
    rawLogsCount: logs.length,
    flujoTrabajadores: filteredTrabajadores,
    rawTrabajadoresCount: flujoTrabajadores.length,
    ultimosIngresos: filteredIngresos,
    rawIngresosCount: ultimosIngresos.length,
    timeRange,
    setTimeRange,
    searchTerm,
    setSearchTerm,
    selectedModulo,
    setSelectedModulo,
    selectedActionFlag,
    setSelectedActionFlag,
    selectedWorkerFilter,
    setSelectedWorkerFilter,
    handleFilterByWorker: (userId: number | string) => {
      setSelectedWorkerFilter(String(userId));
      setActiveTab('BITACORA');
    },
    selectedLog,
    handleOpenLogModal,
    handleCloseLogModal,
    selectedWorkerId,
    workerDetail,
    loadingWorkerDetail,
    handleOpenWorkerModal,
    handleCloseWorkerModal,
    handleRefresh: () => cargarDatos(true),
    handleExportCSV,
  };
}
