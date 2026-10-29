import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useGestion } from '../../../contexts/GestionContext';
import { reportesApi } from '../api/reportesApi';
import {
  Area,
  Partida,
  PresupuestoArea,
  MemoriaCalculo,
  DetallePresupuestoMemoria,
  ModificacionPresupuestaria,
  Traspaso,
  Gasto,
} from '../../../services/presupuestoService';
import { CertificacionPOA } from '../../../types/certificacion';
import {
  ReportCategory,
  SubReportPresupuesto,
  SubReportMemoria,
  SubReportModificacion,
  SubReportGasto,
  SubReportConsolidado,
  PresupuestoAreaResumen,
  PartidaConsolidadaReporte,
  MemoriaEstadoRow,
  ItemRequerimientoRow,
  ModificacionRow,
  MatrizTraspasoRow,
  GastoReporteRow,
  CertificacionReporteRow,
  SemaforoAreaRow,
} from '../types/reportes.types';
import alertService from '../../../utils/alerts';

export function useReportes() {
  const { user } = useAuth();
  const {
    gestiones,
    gestionActivaId: selectedGestionId,
    setGestionActivaId: setSelectedGestionId,
    gestionActiva,
  } = useGestion();

  // ── Roles y Permisos ────────────────────────────────────────────────────────
  const rolName = (user?.rol_nombre || (user as any)?.rol?.nombre || '').toUpperCase().trim();
  const rolClean = rolName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isSuperAdmin = Boolean(user?.is_superuser) || rolClean.includes('ADMIN');
  const isPlanificador = rolClean.includes('PLANIF');
  const isPresupuestos =
    rolClean.includes('PRESUP') || rolClean.includes('APROB') || rolClean.includes('FINAN');
  const isTesoreria = rolClean.includes('TESOR');
  const isGerente =
    rolClean.includes('GERENT') || rolClean.includes('DIRECT') || rolClean.includes('JEFE');
  const isElaborador = rolClean.includes('ELABORAD');
  const isTrabajador = rolClean.includes('TRABAJAD');

  // Elaborador y Trabajador no tienen permiso de reportes
  const canAccessReports =
    (isSuperAdmin || isPlanificador || isPresupuestos || isTesoreria || isGerente) &&
    !isElaborador &&
    !isTrabajador;

  // Roles globales: ven cualquier área y alternan filtros libremente
  const isGlobalRole = isSuperAdmin || isPlanificador || isPresupuestos || isTesoreria;

  // Área asociada al usuario (ej. Gerencia de Informática)
  const userAreaId = user?.area_id || (user?.seccion as any)?.area_id || null;
  const userAreaNombre = user?.area_nombre || (user?.seccion as any)?.area?.nombre || '';

  // ── Estado de Navegación de Reportes ─────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('presupuestos');
  const [subReportPresupuesto, setSubReportPresupuesto] = useState<SubReportPresupuesto>('institucional');
  const [subReportMemoria, setSubReportMemoria] = useState<SubReportMemoria>('estados');
  const [subReportModificacion, setSubReportModificacion] = useState<SubReportModificacion>('historial');
  const [subReportGasto, setSubReportGasto] = useState<SubReportGasto>('libro_gastos');
  const [subReportConsolidado, setSubReportConsolidado] = useState<SubReportConsolidado>('ficha_ejecutiva');

  // Filtro de Área:
  // Si es un rol de área (Gerente), por defecto se bloquea a su gerencia en vistas detalladas
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    !isGlobalRole && userAreaId ? String(userAreaId) : 'todas'
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Modales
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // ── Estado de Datos Brutos ─────────────────────────────────────────────────
  const [loading, setLoading] = useState<boolean>(true);
  const [areas, setAreas] = useState<Area[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [presupuestosArea, setPresupuestosArea] = useState<PresupuestoArea[]>([]);
  const [memorias, setMemorias] = useState<MemoriaCalculo[]>([]);
  const [detallesPresupuesto, setDetallesPresupuesto] = useState<DetallePresupuestoMemoria[]>([]);
  const [modificaciones, setModificaciones] = useState<ModificacionPresupuestaria[]>([]);
  const [traspasos, setTraspasos] = useState<Traspaso[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [certificaciones, setCertificaciones] = useState<CertificacionPOA[]>([]);

  // ── Carga de Datos Centralizada ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedGestionId || !canAccessReports) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        areasRes,
        partidasRes,
        presupuestosRes,
        memoriasRes,
        detallesRes,
        modificacionesRes,
        traspasosRes,
        gastosRes,
        certificacionesRes,
      ] = await Promise.all([
        reportesApi.getAreas().catch(() => [] as Area[]),
        reportesApi.getPartidas().catch(() => [] as Partida[]),
        reportesApi.getPresupuestosArea(selectedGestionId).catch(() => [] as PresupuestoArea[]),
        reportesApi.getMemorias({ gestion: selectedGestionId }).catch(() => [] as MemoriaCalculo[]),
        reportesApi.getDetallesPresupuesto({ gestion: selectedGestionId }).catch(() => [] as DetallePresupuestoMemoria[]),
        reportesApi.getModificaciones({ gestion: selectedGestionId }).catch(() => [] as ModificacionPresupuestaria[]),
        reportesApi.getTraspasos({ gestion: selectedGestionId }).catch(() => [] as Traspaso[]),
        reportesApi.getGastos({ gestion: selectedGestionId }).catch(() => [] as Gasto[]),
        reportesApi.getCertificaciones({ gestion: selectedGestionId }).catch(() => [] as CertificacionPOA[]),
      ]);

      setAreas(areasRes);
      setPartidas(partidasRes);
      setPresupuestosArea(presupuestosRes);
      setMemorias(memoriasRes);
      setDetallesPresupuesto(detallesRes);
      setModificaciones(modificacionesRes);
      setTraspasos(traspasosRes);
      setGastos(gastosRes);
      setCertificaciones(certificacionesRes);
    } catch (err: any) {
      alertService.error('Error al sincronizar datos de reportes', err?.message || 'Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  }, [selectedGestionId, canAccessReports]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Si cambia el usuario y no es rol global, forzar su área
  useEffect(() => {
    if (!isGlobalRole && userAreaId) {
      setSelectedAreaId(String(userAreaId));
    }
  }, [isGlobalRole, userAreaId]);

  // ── Filtros y Auxiliares ────────────────────────────────────────────────────
  const parseNum = (val: string | number | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const formatMoney = (val: number | string | undefined | null): string => {
    const num = parseNum(val);
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(num)
      .replace('BOB', 'Bs.');
  };

  const matchesArea = (areaId: number | string | undefined | null): boolean => {
    if (!areaId) return false;
    if (selectedAreaId === 'todas') return true;
    return String(areaId) === String(selectedAreaId);
  };

  // ── 1. REPORTES DE PRESUPUESTO ──────────────────────────────────────────────
  // Consolidado Institucional (todas las gerencias)
  const presupuestosInstitucionales = useMemo<PresupuestoAreaResumen[]>(() => {
    return presupuestosArea
      .filter((p) => {
        if (selectedAreaId !== 'todas' && String(p.area) !== String(selectedAreaId)) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = (p.area_nombre || '').toLowerCase().includes(term);
          const matchProg = (p.programa_nombre || '').toLowerCase().includes(term);
          const matchTipo = (p.area_tipo || '').toLowerCase().includes(term);
          if (!matchName && !matchProg && !matchTipo) return false;
        }
        return true;
      })
      .map((p) => {
        const montoInicial = parseNum(p.monto_inicial);
        const montoEjecutado = parseNum(p.monto_ejecutado);
        const saldoDisponible = parseNum(p.monto_actual);
        const montoVigente = montoEjecutado + saldoDisponible;
        const pct = montoInicial > 0 ? Math.round((montoEjecutado / montoInicial) * 10000) / 100 : 0;

        return {
          areaId: p.area,
          areaNombre: p.area_nombre,
          areaTipo: p.area_tipo,
          programaNombre: p.programa_nombre || 'Programa Central',
          montoInicial,
          modificacionesEntrantes: 0,
          modificacionesSalientes: 0,
          montoVigente,
          montoEjecutado,
          saldoDisponible,
          porcentajeEjecucion: pct,
        };
      });
  }, [presupuestosArea, selectedAreaId, searchTerm]);

  // Consolidado por Partidas Presupuestarias
  const partidasConsolidadas = useMemo<PartidaConsolidadaReporte[]>(() => {
    const map = new Map<number, PartidaConsolidadaReporte>();

    // Inicializar con catálogo si es necesario
    partidas.forEach((partida) => {
      map.set(partida.id, {
        partidaId: partida.id,
        codigo: partida.codigo,
        nombre: partida.nombre,
        clase: partida.clase,
        presupuestado: 0,
        incrementos: 0,
        disminuciones: 0,
        vigente: 0,
        ejecutado: 0,
        disponible: 0,
        porcentajeEjecucion: 0,
      });
    });

    // Sumar desde detalles de memorias
    detallesPresupuesto.forEach((det) => {
      const pId = det.partida;
      if (!pId) return;

      // Filtro de área si aplica
      const mem = memorias.find((m) => m.id === det.memoria);
      if (selectedAreaId !== 'todas' && mem && String(mem.area_id) !== String(selectedAreaId)) {
        return;
      }

      let row = map.get(pId);
      if (!row) {
        row = {
          partidaId: pId,
          codigo: det.partida_codigo || 'S/C',
          nombre: det.partida_nombre || 'Partida General',
          clase: 'EGRESO',
          presupuestado: 0,
          incrementos: 0,
          disminuciones: 0,
          vigente: 0,
          ejecutado: 0,
          disponible: 0,
          porcentajeEjecucion: 0,
        };
        map.set(pId, row);
      }

      const totProg = parseNum(det.precio_total || det.total_programado);
      const totEjec = parseNum(det.monto_ejecutado || (det as any).total_ejecutado);
      const disp = parseNum(det.monto_disponible || (det as any).saldo_disponible);

      row.presupuestado += totProg;
      row.ejecutado += totEjec;
      row.disponible += disp;
    });

    // Calcular vigentes y porcentajes
    const result: PartidaConsolidadaReporte[] = [];
    map.forEach((row) => {
      if (row.presupuestado > 0 || row.ejecutado > 0) {
        row.vigente = row.presupuestado + row.incrementos - row.disminuciones;
        row.porcentajeEjecucion =
          row.vigente > 0 ? Math.round((row.ejecutado / row.vigente) * 10000) / 100 : 0;

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchCod = row.codigo.toLowerCase().includes(term);
          const matchNom = row.nombre.toLowerCase().includes(term);
          if (!matchCod && !matchNom) return;
        }

        result.push(row);
      }
    });

    return result.sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [partidas, detallesPresupuesto, memorias, selectedAreaId, searchTerm]);

  // ── 2. REPORTES DE MEMORIAS DE CÁLCULO (MC) ─────────────────────────────────
  // Resumen de Estados por Gerencia
  const memoriasPorEstado = useMemo<MemoriaEstadoRow[]>(() => {
    const areaMap = new Map<number, MemoriaEstadoRow>();

    areas.forEach((a) => {
      if (selectedAreaId !== 'todas' && String(a.id) !== String(selectedAreaId)) return;
      areaMap.set(a.id, {
        areaId: a.id,
        areaNombre: a.nombre,
        totalMemorias: 0,
        borrador: 0,
        pendienteGerencia: 0,
        aprobadoGerencia: 0,
        pendientePlanificacion: 0,
        aprobadoPlanificacion: 0,
        aprobadoFinanzas: 0,
        rechazado: 0,
        montoFormulado: 0,
        montoAprobadoFinanzas: 0,
      });
    });

    memorias.forEach((m) => {
      const aId = m.area_id;
      if (!aId) return;
      if (selectedAreaId !== 'todas' && String(aId) !== String(selectedAreaId)) return;

      let row = areaMap.get(aId);
      if (!row) {
        row = {
          areaId: aId,
          areaNombre: m.area_nombre || 'Gerencia',
          totalMemorias: 0,
          borrador: 0,
          pendienteGerencia: 0,
          aprobadoGerencia: 0,
          pendientePlanificacion: 0,
          aprobadoPlanificacion: 0,
          aprobadoFinanzas: 0,
          rechazado: 0,
          montoFormulado: 0,
          montoAprobadoFinanzas: 0,
        };
        areaMap.set(aId, row);
      }

      row.totalMemorias += 1;
      const monto = parseNum(m.total_presupuesto);
      row.montoFormulado += monto;

      const st = (m.estado || '').toUpperCase();
      if (st.includes('BORRADOR')) row.borrador += 1;
      else if (st.includes('PENDIENTE_GERENCIA')) row.pendienteGerencia += 1;
      else if (st.includes('APROBADO_GERENCIA')) row.aprobadoGerencia += 1;
      else if (st.includes('PENDIENTE_PLANIFICACION')) row.pendientePlanificacion += 1;
      else if (st.includes('APROBADO_PLANIFICACION')) row.aprobadoPlanificacion += 1;
      else if (st.includes('APROBADO_FINANZAS')) {
        row.aprobadoFinanzas += 1;
        row.montoAprobadoFinanzas += monto;
      } else if (st.includes('RECHAZADO')) row.rechazado += 1;
    });

    let list = Array.from(areaMap.values());
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((r) => r.areaNombre.toLowerCase().includes(term));
    }
    return list.sort((a, b) => b.totalMemorias - a.totalMemorias);
  }, [areas, memorias, selectedAreaId, searchTerm]);

  // Catálogo Limpio de Ítems y Requerimientos (Sin códigos confusos)
  const itemsRequerimientos = useMemo<ItemRequerimientoRow[]>(() => {
    return detallesPresupuesto
      .map((det) => {
        const mem = memorias.find((m) => m.id === det.memoria);
        const areaId = mem?.area_id;

        return {
          id: det.id || Math.random(),
          descripcion: det.descripcion || 'Requerimiento institucional',
          unidadMedida: det.unidad_medida || 'Unidad',
          cantidad: parseNum(det.cantidad),
          precioUnitario: parseNum(det.precio_unitario),
          precioTotal: parseNum(det.precio_total || det.total_programado),
          partidaCodigo: det.partida_codigo || '',
          partidaNombre: det.partida_nombre || 'Partida general',
          areaNombre: mem?.area_nombre || 'Gerencia',
          seccionNombre: mem?.seccion_nombre || 'Área Operativa',
          esContratacion: Boolean(mem?.es_contratacion),
          estadoGasto: det.estado_ejecucion || 'PENDIENTE',
          mesRequerido: det.mes_requerido || 'Anual',
          memoriaCodigo: mem?.codigo || '',
          _areaId: areaId,
        };
      })
      .filter((item) => {
        if (selectedAreaId !== 'todas' && String(item._areaId) !== String(selectedAreaId)) {
          return false;
        }
        if (estadoFilter !== 'todos' && item.estadoGasto !== estadoFilter) {
          return false;
        }
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchDesc = item.descripcion.toLowerCase().includes(term);
          const matchPartida = item.partidaNombre.toLowerCase().includes(term);
          const matchArea = item.areaNombre.toLowerCase().includes(term);
          const matchMes = (item.mesRequerido || '').toLowerCase().includes(term);
          if (!matchDesc && !matchPartida && !matchArea && !matchMes) return false;
        }
        return true;
      });
  }, [detallesPresupuesto, memorias, selectedAreaId, estadoFilter, searchTerm]);

  // Contrataciones PAC (filtrando solo requerimientos de compra o contrataciones)
  const itemsContrataciones = useMemo<ItemRequerimientoRow[]>(() => {
    return itemsRequerimientos.filter((it) => it.esContratacion);
  }, [itemsRequerimientos]);

  // ── 3. REPORTES DE MODIFICACIONES Y TRASPASOS ───────────────────────────────
  // Historial Maestro de Modificaciones
  const historialModificaciones = useMemo<ModificacionRow[]>(() => {
    return modificaciones
      .filter((m) => {
        if (selectedAreaId !== 'todas') {
          const matchSol = String(m.area) === String(selectedAreaId);
          const matchCed = m.area_cedente && String(m.area_cedente) === String(selectedAreaId);
          if (!matchSol && !matchCed) return false;
        }
        if (estadoFilter !== 'todos' && m.estado !== estadoFilter) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchCod = (m.codigo || '').toLowerCase().includes(term);
          const matchMotivo = (m.motivo || '').toLowerCase().includes(term);
          const matchSol = (m.area_nombre || '').toLowerCase().includes(term);
          const matchCed = (m.area_cedente_nombre || '').toLowerCase().includes(term);
          if (!matchCod && !matchMotivo && !matchSol && !matchCed) return false;
        }
        return true;
      })
      .map((m) => ({
        id: m.id,
        codigo: m.codigo,
        fecha: m.fecha ? m.fecha.slice(0, 10) : m.created_at.slice(0, 10),
        tipo: m.tipo,
        tipoDisplay: m.tipo_display || m.tipo.replace(/_/g, ' '),
        areaSolicitante: m.area_nombre || 'Gerencia Solicitante',
        areaCedente: m.area_cedente_nombre || undefined,
        motivo: m.motivo,
        monto: parseNum(m.total_monto),
        estado: m.estado,
        estadoDisplay: m.estado_display || m.estado.replace(/_/g, ' '),
        usuarioSolicitante: m.usuario_registro_nombre || 'Usuario Responsable',
        aprobadoPor: m.aprobado_por_nombre || undefined,
      }));
  }, [modificaciones, selectedAreaId, estadoFilter, searchTerm]);

  // Matriz de Traspasos Origen -> Destino
  const matrizTraspasos = useMemo<MatrizTraspasoRow[]>(() => {
    const rows: MatrizTraspasoRow[] = [];

    // Traspasos 1 a 1 existentes
    traspasos.forEach((t) => {
      const origMem = memorias.find((m) => m.id === t.memoria_origen);
      const destMem = memorias.find((m) => m.id === t.memoria_destino);

      const aOrigId = origMem?.area_id;
      const aDestId = destMem?.area_id;

      if (selectedAreaId !== 'todas') {
        if (String(aOrigId) !== String(selectedAreaId) && String(aDestId) !== String(selectedAreaId)) {
          return;
        }
      }

      rows.push({
        id: t.id,
        modificacionCodigo: `TRASP-${t.id}`,
        fecha: t.created_at ? t.created_at.slice(0, 10) : '',
        origenArea: origMem?.area_nombre || 'Gerencia Origen',
        origenPartida: t.memoria_origen_partida || origMem?.partida_nombre || 'Partida Origen',
        origenMemoria: t.memoria_origen_codigo || origMem?.codigo || 'MC-ORIGEN',
        destinoArea: destMem?.area_nombre || 'Gerencia Destino',
        destinoPartida: t.memoria_destino_partida || destMem?.partida_nombre || 'Partida Destino',
        destinoMemoria: t.memoria_destino_codigo || destMem?.codigo || 'MC-DESTINO',
        monto: parseNum(t.monto),
        motivo: t.motivo || 'Compensación operativa de partidas',
      });
    });

    // Modificaciones M:N con detalles desglosados
    modificaciones.forEach((mod) => {
      if (mod.tipo === 'INCREMENTO' || mod.tipo === 'DISMINUCION') return;
      if (selectedAreaId !== 'todas') {
        const matchSol = String(mod.area) === String(selectedAreaId);
        const matchCed = mod.area_cedente && String(mod.area_cedente) === String(selectedAreaId);
        if (!matchSol && !matchCed) return;
      }

      const origenes = mod.origenes || [];
      const destinos = mod.destinos || [];

      if (origenes.length > 0 && destinos.length > 0) {
        origenes.forEach((orig, idx) => {
          const dest = destinos[idx] || destinos[0];
          rows.push({
            id: Number(`${mod.id}${idx}`),
            modificacionCodigo: mod.codigo,
            fecha: mod.fecha ? mod.fecha.slice(0, 10) : mod.created_at.slice(0, 10),
            origenArea: mod.area_cedente_nombre || mod.area_nombre || 'Gerencia Cedente',
            origenPartida: orig.partida_nombre || 'Partida Compensada',
            origenMemoria: orig.memoria_codigo || 'MC Origen',
            destinoArea: mod.area_nombre || 'Gerencia Receptora',
            destinoPartida: dest.partida_nombre || 'Partida Destino',
            destinoMemoria: dest.memoria_codigo || 'MC Destino',
            monto: parseNum(orig.monto),
            motivo: mod.motivo,
          });
        });
      }
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return rows.filter(
        (r) =>
          r.modificacionCodigo.toLowerCase().includes(term) ||
          r.origenArea.toLowerCase().includes(term) ||
          r.destinoArea.toLowerCase().includes(term) ||
          r.motivo.toLowerCase().includes(term)
      );
    }

    return rows;
  }, [traspasos, modificaciones, memorias, selectedAreaId, searchTerm]);

  // Incrementos autorizados
  const incrementosPresupuestarios = useMemo<ModificacionRow[]>(() => {
    return historialModificaciones.filter((m) => m.tipo === 'INCREMENTO');
  }, [historialModificaciones]);

  // ── 4. REPORTES DE GASTOS Y EJECUCIÓN ───────────────────────────────────────
  // Libro Diario de Gastos
  const libroGastos = useMemo<GastoReporteRow[]>(() => {
    return gastos
      .filter((g) => {
        if (selectedAreaId !== 'todas' && String(g.area_id) !== String(selectedAreaId)) return false;
        if (dateFrom && g.fecha_gasto < dateFrom) return false;
        if (dateTo && g.fecha_gasto > dateTo) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchComp = (g.comprobante_num || '').toLowerCase().includes(term);
          const matchObs = (g.observacion || '').toLowerCase().includes(term);
          const matchArea = (g.area_nombre || '').toLowerCase().includes(term);
          const matchPartida = (g.partida_nombre || '').toLowerCase().includes(term);
          if (!matchComp && !matchObs && !matchArea && !matchPartida) return false;
        }
        return true;
      })
      .map((g) => ({
        id: g.id,
        fecha: g.fecha_gasto,
        comprobante: g.comprobante_num || 'Sin Comprobante',
        areaNombre: g.area_nombre || 'Gerencia',
        seccionNombre: g.seccion_nombre || 'Área Operativa',
        partidaCodigo: g.partida_codigo || '',
        partidaNombre: g.partida_nombre || 'Gasto Operativo',
        memoriaCodigo: g.memoria_codigo || '',
        concepto: g.observacion || 'Ejecución presupuestaria regular',
        monto: parseNum(g.monto_ejecutado),
        registradoPor: g.usuario_nombre || 'Responsable',
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [gastos, selectedAreaId, dateFrom, dateTo, searchTerm]);

  // Certificaciones POA
  const certificacionesPOA = useMemo<CertificacionReporteRow[]>(() => {
    return certificaciones
      .filter((c) => {
        if (selectedAreaId !== 'todas' && String(c.area) !== String(selectedAreaId)) return false;
        if (estadoFilter !== 'todos' && c.estado !== estadoFilter) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchCod = (c.codigo_certificacion || '').toLowerCase().includes(term);
          const matchConc = (c.concepto_gasto || '').toLowerCase().includes(term);
          const matchArea = (c.area_nombre || '').toLowerCase().includes(term);
          const matchOficio = (c.numero_oficio_solicitud || '').toLowerCase().includes(term);
          if (!matchCod && !matchConc && !matchArea && !matchOficio) return false;
        }
        return true;
      })
      .map((c) => ({
        id: c.id,
        codigo: c.codigo_certificacion || `CERT-${c.id}`,
        fecha: c.fecha || '',
        areaNombre: c.area_nombre || 'Gerencia Solicitante',
        montoSolicitado: parseNum(c.monto_solicitado),
        concepto: c.concepto_gasto || 'Solicitud de fondos POA',
        estado: c.estado,
        estadoDisplay: c.estado_display || c.estado.replace(/_/g, ' '),
        esContratacion: Boolean(c.es_contratacion),
        operacionCodigo: c.operaciones_detalle?.[0]?.codigo || '',
        numeroOficio: c.numero_oficio_solicitud,
        comprobantePago: c.comprobante_pago,
        solicitante: c.solicitante_nombre || 'Responsable de Gerencia',
      }));
  }, [certificaciones, selectedAreaId, estadoFilter, searchTerm]);

  // Semáforo de Eficiencia y Desviación del Gasto
  const semaforoEjecucion = useMemo<SemaforoAreaRow[]>(() => {
    return presupuestosInstitucionales.map((p) => {
      let estadoSemaforo: 'optimo' | 'moderado' | 'critico' = 'critico';
      if (p.porcentajeEjecucion >= 70) {
        estadoSemaforo = 'optimo';
      } else if (p.porcentajeEjecucion >= 40) {
        estadoSemaforo = 'moderado';
      }

      return {
        areaId: p.areaId,
        areaNombre: p.areaNombre,
        techoAsignado: p.montoInicial,
        montoEjecutado: p.montoEjecutado,
        saldoDisponible: p.saldoDisponible,
        porcentajeEjecucion: p.porcentajeEjecucion,
        estadoSemaforo,
        diasTranscurridos: 300,
      };
    });
  }, [presupuestosInstitucionales]);

  // ── 5. RESUMEN DE INDICADORES (KPIS CARDS) ──────────────────────────────────
  const resumenKpis = useMemo(() => {
    if (activeCategory === 'presupuestos') {
      const totalInicial = presupuestosInstitucionales.reduce((acc, p) => acc + p.montoInicial, 0);
      const totalEjecutado = presupuestosInstitucionales.reduce((acc, p) => acc + p.montoEjecutado, 0);
      const totalDisponible = presupuestosInstitucionales.reduce((acc, p) => acc + p.saldoDisponible, 0);
      const pct = totalInicial > 0 ? Math.round((totalEjecutado / totalInicial) * 10000) / 100 : 0;

      return {
        card1: {
          title: 'Presupuesto Inicial',
          value: formatMoney(totalInicial),
          subtitle: `${presupuestosInstitucionales.length} gerencias y áreas`,
          color: 'blue' as const,
        },
        card2: {
          title: 'Ejecutado Acumulado',
          value: formatMoney(totalEjecutado),
          subtitle: 'Gasto devengado en gestión',
          color: 'emerald' as const,
          progress: { value: pct, label: `${pct}% ejecutado` },
        },
        card3: {
          title: 'Saldo Disponible',
          value: formatMoney(totalDisponible),
          subtitle: 'Fondos vigentes por ejecutar',
          color: 'amber' as const,
        },
        card4: {
          title: 'Partidas con Asignación',
          value: `${partidasConsolidadas.length}`,
          subtitle: 'Clasificador del gasto en uso',
          color: 'primary' as const,
        },
      };
    }

    if (activeCategory === 'memorias') {
      const totalMcs = memorias.length;
      const aprobadasFinanzas = memorias.filter((m) => (m.estado || '').includes('APROBADO_FINANZAS')).length;
      const enRevision = memorias.filter(
        (m) => (m.estado || '').includes('PENDIENTE') || (m.estado || '').includes('GERENCIA')
      ).length;
      const montoTotalFormulado = memorias.reduce((acc, m) => acc + parseNum(m.total_presupuesto), 0);

      return {
        card1: {
          title: 'Total Memorias (MC)',
          value: `${totalMcs}`,
          subtitle: 'Justificaciones técnicas',
          color: 'blue' as const,
        },
        card2: {
          title: 'Aprobadas en Finanzas',
          value: `${aprobadasFinanzas}`,
          subtitle: 'Listas para ejecución oficial',
          color: 'emerald' as const,
          progress: {
            value: totalMcs > 0 ? Math.round((aprobadasFinanzas / totalMcs) * 100) : 0,
            label: `${totalMcs > 0 ? Math.round((aprobadasFinanzas / totalMcs) * 100) : 0}% aprobadas`,
          },
        },
        card3: {
          title: 'En Circuito de Revisión',
          value: `${enRevision}`,
          subtitle: 'Pendientes por instancias',
          color: 'amber' as const,
        },
        card4: {
          title: 'Monto Formulado en MC',
          value: formatMoney(montoTotalFormulado),
          subtitle: `${itemsRequerimientos.length} requerimientos detallados`,
          color: 'primary' as const,
        },
      };
    }

    if (activeCategory === 'modificaciones') {
      const totalMods = historialModificaciones.length;
      const aprobadas = historialModificaciones.filter((m) => m.estado === 'APROBADO').length;
      const montoCompensado = historialModificaciones.reduce((acc, m) => acc + m.monto, 0);
      const totalTraspasos = matrizTraspasos.length;

      return {
        card1: {
          title: 'Total Modificaciones',
          value: `${totalMods}`,
          subtitle: 'Solicitudes en la gestión',
          color: 'blue' as const,
        },
        card2: {
          title: 'Modificaciones Aprobadas',
          value: `${aprobadas}`,
          subtitle: 'Efectivizadas en presupuesto',
          color: 'emerald' as const,
          progress: {
            value: totalMods > 0 ? Math.round((aprobadas / totalMods) * 100) : 0,
            label: `${totalMods > 0 ? Math.round((aprobadas / totalMods) * 100) : 0}% efectivizadas`,
          },
        },
        card3: {
          title: 'Monto Compensado',
          value: formatMoney(montoCompensado),
          subtitle: 'Recursos reasignados',
          color: 'amber' as const,
        },
        card4: {
          title: 'Matriz de Traspasos',
          value: `${totalTraspasos}`,
          subtitle: 'Movimientos origen a destino',
          color: 'primary' as const,
        },
      };
    }

    // gastos / ejecucion
    const totalGastosMonto = libroGastos.reduce((acc, g) => acc + g.monto, 0);
    const totalCertificacionesMonto = certificacionesPOA.reduce((acc, c) => acc + c.montoSolicitado, 0);
    const totalCertificacionesCount = certificacionesPOA.length;
    const certsAprobadas = certificacionesPOA.filter((c) => c.estado === 'APROBADO').length;

    return {
      card1: {
        title: 'Gastos Ejecutados',
        value: formatMoney(totalGastosMonto),
        subtitle: `${libroGastos.length} comprobantes registrados`,
        color: 'emerald' as const,
      },
      card2: {
        title: 'Certificaciones Emitidas',
        value: `${totalCertificacionesCount}`,
        subtitle: `${certsAprobadas} aprobadas y pagadas`,
        color: 'blue' as const,
        progress: {
          value: totalCertificacionesCount > 0 ? Math.round((certsAprobadas / totalCertificacionesCount) * 100) : 0,
          label: `${totalCertificacionesCount > 0 ? Math.round((certsAprobadas / totalCertificacionesCount) * 100) : 0}% pagadas`,
        },
      },
      card3: {
        title: 'Monto Certificado POA',
        value: formatMoney(totalCertificacionesMonto),
        subtitle: 'Fondos comprometidos preventivos',
        color: 'amber' as const,
      },
      card4: {
        title: 'Comprobantes Registrados',
        value: `${libroGastos.length}`,
        subtitle: 'Trazabilidad de pagos',
        color: 'primary' as const,
      },
    };
  }, [
    activeCategory,
    presupuestosInstitucionales,
    partidasConsolidadas,
    memorias,
    itemsRequerimientos,
    historialModificaciones,
    matrizTraspasos,
    libroGastos,
    certificacionesPOA,
  ]);

  // ── 6. EXPORTACIÓN A CSV / EXCEL ───────────────────────────────────────────
  const exportarExcelCSV = useCallback(() => {
    let filename = `Reporte_POA_${activeCategory}_${gestionActiva?.anio || '2026'}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeCategory === 'presupuestos') {
      if (subReportPresupuesto === 'institucional') {
        filename = `Reporte_POA_Presupuesto_Institucional_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Área / Gerencia', 'Tipo', 'Programa Estratégico', 'Presupuesto Inicial (Bs)', 'Monto Vigente (Bs)', 'Monto Ejecutado (Bs)', 'Saldo Disponible (Bs)', '% Ejecución'];
        rows = presupuestosInstitucionales.map((p) => [
          p.areaNombre,
          p.areaTipo,
          p.programaNombre,
          p.montoInicial.toFixed(2),
          p.montoVigente.toFixed(2),
          p.montoEjecutado.toFixed(2),
          p.saldoDisponible.toFixed(2),
          `${p.porcentajeEjecucion}%`,
        ]);
      } else {
        filename = `Reporte_POA_Clasificador_Partidas_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Código Partida', 'Descripción de Partida', 'Clase', 'Presupuestado (Bs)', 'Ejecutado (Bs)', 'Saldo Disponible (Bs)', '% Ejecución'];
        rows = partidasConsolidadas.map((p) => [
          p.codigo,
          p.nombre,
          p.clase,
          p.presupuestado.toFixed(2),
          p.ejecutado.toFixed(2),
          p.disponible.toFixed(2),
          `${p.porcentajeEjecucion}%`,
        ]);
      }
    } else if (activeCategory === 'memorias') {
      if (subReportMemoria === 'estados') {
        filename = `Reporte_POA_Memorias_Por_Estado_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Gerencia / Área', 'Total MCs', 'Borrador', 'Pendiente Gerencia', 'Aprobado Gerencia', 'Pendiente Planificación', 'Aprobado Finanzas', 'Rechazado', 'Monto Formulado (Bs)'];
        rows = memoriasPorEstado.map((m) => [
          m.areaNombre,
          m.totalMemorias,
          m.borrador,
          m.pendienteGerencia,
          m.aprobadoGerencia,
          m.pendientePlanificacion,
          m.aprobadoFinanzas,
          m.rechazado,
          m.montoFormulado.toFixed(2),
        ]);
      } else {
        filename = `Reporte_POA_Catalogo_Requerimientos_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Descripción del Requerimiento', 'Partida', 'Gerencia', 'Unidad de Medida', 'Cantidad', 'Precio Unitario (Bs)', 'Total Programado (Bs)', 'Estado', 'Mes Requerido'];
        const dataSource = subReportMemoria === 'contrataciones_pac' ? itemsContrataciones : itemsRequerimientos;
        rows = dataSource.map((i) => [
          i.descripcion,
          `${i.partidaCodigo} - ${i.partidaNombre}`,
          i.areaNombre,
          i.unidadMedida,
          i.cantidad,
          i.precioUnitario.toFixed(2),
          i.precioTotal.toFixed(2),
          i.estadoGasto,
          i.mesRequerido || 'Anual',
        ]);
      }
    } else if (activeCategory === 'modificaciones') {
      if (subReportModificacion === 'matriz_traspasos') {
        filename = `Reporte_POA_Matriz_Traspasos_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Código Traspaso', 'Fecha', 'Gerencia Origen', 'Partida Origen', 'Gerencia Destino', 'Partida Destino', 'Monto Compensado (Bs)', 'Motivo Operativo'];
        rows = matrizTraspasos.map((t) => [
          t.modificacionCodigo,
          t.fecha,
          t.origenArea,
          t.origenPartida,
          t.destinoArea,
          t.destinoPartida,
          t.monto.toFixed(2),
          t.motivo,
        ]);
      } else {
        filename = `Reporte_POA_Historial_Modificaciones_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Código', 'Fecha', 'Tipo de Movimiento', 'Gerencia Solicitante', 'Gerencia Cedente', 'Monto (Bs)', 'Estado', 'Justificación'];
        rows = historialModificaciones.map((m) => [
          m.codigo,
          m.fecha,
          m.tipoDisplay,
          m.areaSolicitante,
          m.areaCedente || 'N/A',
          m.monto.toFixed(2),
          m.estadoDisplay,
          m.motivo,
        ]);
      }
    } else {
      if (subReportGasto === 'certificaciones') {
        filename = `Reporte_POA_Certificaciones_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Nº Certificación POA', 'Fecha', 'Unidad Solicitante', 'Monto Solicitado (Bs)', 'Estado', '¿Contratación?', 'Concepto'];
        rows = certificacionesPOA.map((c) => [
          c.codigo,
          c.fecha,
          c.areaNombre,
          c.montoSolicitado.toFixed(2),
          c.estadoDisplay,
          c.esContratacion ? 'SÍ' : 'NO',
          c.concepto,
        ]);
      } else {
        filename = `Reporte_POA_Libro_Diario_Gastos_${gestionActiva?.anio || '2026'}.csv`;
        headers = ['Fecha', 'Nº Comprobante', 'Gerencia', 'Partida', 'Monto Ejecutado (Bs)', 'Glosa / Observación', 'Registrado Por'];
        rows = libroGastos.map((g) => [
          g.fecha,
          g.comprobante,
          g.areaNombre,
          `${g.partidaCodigo} - ${g.partidaNombre}`,
          g.monto.toFixed(2),
          g.concepto,
          g.registradoPor,
        ]);
      }
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(';'),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alertService.toast('Reporte descargado correctamente en formato CSV / Excel.', 'success');
  }, [
    activeCategory,
    subReportPresupuesto,
    subReportMemoria,
    subReportModificacion,
    subReportGasto,
    gestionActiva,
    presupuestosInstitucionales,
    partidasConsolidadas,
    memoriasPorEstado,
    itemsRequerimientos,
    itemsContrataciones,
    matrizTraspasos,
    historialModificaciones,
    certificacionesPOA,
    libroGastos,
  ]);

  return {
    // Permisos y Usuario
    user,
    canAccessReports,
    isGlobalRole,
    isGerente,
    userAreaId,
    userAreaNombre,

    // Gestión
    gestiones,
    selectedGestionId,
    setSelectedGestionId,
    gestionActiva,

    // Navegación
    activeCategory,
    setActiveCategory,
    subReportPresupuesto,
    setSubReportPresupuesto,
    subReportMemoria,
    setSubReportMemoria,
    subReportModificacion,
    setSubReportModificacion,
    subReportGasto,
    setSubReportGasto,
    subReportConsolidado,
    setSubReportConsolidado,

    // Filtros
    areas,
    selectedAreaId,
    setSelectedAreaId,
    searchTerm,
    setSearchTerm,
    estadoFilter,
    setEstadoFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,

    // Modales
    showPrintModal,
    setShowPrintModal,

    // Datos procesados
    loading,
    refetch: fetchData,
    formatMoney,
    presupuestosInstitucionales,
    partidasConsolidadas,
    memoriasPorEstado,
    itemsRequerimientos,
    itemsContrataciones,
    historialModificaciones,
    matrizTraspasos,
    incrementosPresupuestarios,
    libroGastos,
    certificacionesPOA,
    semaforoEjecucion,
    resumenKpis,

    // Acciones
    exportarExcelCSV,
  };
}
