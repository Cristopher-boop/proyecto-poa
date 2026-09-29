import { useState, useEffect, useCallback, useMemo } from 'react';
import { organizationalApi } from '../api/organizacionalApi';
import type {
  Area,
  Programa,
  Seccion,
  OrganizacionalTab,
  AreaFormValues,
  SeccionFormValues,
  ProgramaFormValues,
  HierarchicalAreaItem,
} from '../types/organizacional.types';
import { formatProgramaShort } from '../utils/organizacionalUtils';
import alertService from '../../../utils/alerts';

export function useOrganizacional() {
  const [activeTab, setActiveTab] = useState<OrganizacionalTab>('JERARQUIA');
  const [loading, setLoading] = useState(true);

  // Master Lists
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrograma, setSelectedPrograma] = useState<string>('ALL');
  const [selectedTipo, setSelectedTipo] = useState<string>('ALL');
  const [selectedEstado, setSelectedEstado] = useState<string>('ALL');

  // Modals: Area
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [showAreaDetalleModal, setShowAreaDetalleModal] = useState(false);
  const [viewingArea, setViewingArea] = useState<Area | null>(null);

  // Modals: Seccion
  const [showSeccionModal, setShowSeccionModal] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);
  const [showSeccionDetalleModal, setShowSeccionDetalleModal] = useState(false);
  const [viewingSeccion, setViewingSeccion] = useState<Seccion | null>(null);

  // Modals: Programa
  const [showProgramaModal, setShowProgramaModal] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState<Programa | null>(null);
  const [showProgramaDetalleModal, setShowProgramaDetalleModal] = useState(false);
  const [viewingPrograma, setViewingPrograma] = useState<Programa | null>(null);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [progs, ars, secs] = await Promise.all([
        organizationalApi.getProgramas(),
        organizationalApi.getAreas(),
        organizationalApi.getSecciones(),
      ]);
      setProgramas(progs);
      setAreas(ars);
      setSecciones(secs);
    } catch (err) {
      console.error('Error cargando estructura organizacional:', err);
      alertService.error('Error de carga', 'No se pudieron sincronizar los datos de la estructura organizacional.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ==========================================
  // FILTERED LISTS
  // ==========================================
  const filteredAreas = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return areas.filter((area) => {
      const progObj = programas.find((p) => p.id === area.programa);
      const progDisplay = formatProgramaShort(progObj, area.programa_codigo, area.programa_nombre);

      const matchText =
        !q ||
        area.codigo.toLowerCase().includes(q) ||
        area.nombre.toLowerCase().includes(q) ||
        (area.descripcion && area.descripcion.toLowerCase().includes(q)) ||
        progDisplay.toLowerCase().includes(q);

      const matchProg = selectedPrograma === 'ALL' || String(area.programa) === selectedPrograma;
      const matchTipo = selectedTipo === 'ALL' || area.tipo === selectedTipo;
      const matchEstado =
        selectedEstado === 'ALL' ||
        (selectedEstado === 'ACTIVAS' && area.estado) ||
        (selectedEstado === 'INACTIVAS' && !area.estado);

      return matchText && matchProg && matchTipo && matchEstado;
    });
  }, [areas, programas, searchTerm, selectedPrograma, selectedTipo, selectedEstado]);

  const filteredSecciones = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return secciones.filter((sec) => {
      const parentArea = areas.find((a) => a.id === sec.area);
      const matchText =
        !q ||
        sec.nombre.toLowerCase().includes(q) ||
        (sec.descripcion && sec.descripcion.toLowerCase().includes(q)) ||
        (sec.area_nombre && sec.area_nombre.toLowerCase().includes(q)) ||
        (parentArea && parentArea.nombre.toLowerCase().includes(q)) ||
        (parentArea && parentArea.codigo.toLowerCase().includes(q));

      const matchProg =
        selectedPrograma === 'ALL' ||
        (parentArea && String(parentArea.programa) === selectedPrograma);

      const matchTipo =
        selectedTipo === 'ALL' ||
        (parentArea && parentArea.tipo === selectedTipo);

      const matchEstado =
        selectedEstado === 'ALL' ||
        (selectedEstado === 'ACTIVAS' && sec.estado) ||
        (selectedEstado === 'INACTIVAS' && !sec.estado);

      return matchText && matchProg && matchTipo && matchEstado;
    });
  }, [secciones, areas, searchTerm, selectedPrograma, selectedTipo, selectedEstado]);

  const filteredProgramas = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return programas.filter((prog) => {
      const progDisplay = formatProgramaShort(prog);
      const matchText =
        !q ||
        prog.codigo.toLowerCase().includes(q) ||
        prog.nombre.toLowerCase().includes(q) ||
        progDisplay.toLowerCase().includes(q) ||
        (prog.descripcion && prog.descripcion.toLowerCase().includes(q));

      const matchProg = selectedPrograma === 'ALL' || String(prog.id) === selectedPrograma;

      const matchEstado =
        selectedEstado === 'ALL' ||
        (selectedEstado === 'ACTIVAS' && prog.estado) ||
        (selectedEstado === 'INACTIVAS' && !prog.estado);

      return matchText && matchProg && matchEstado;
    });
  }, [programas, searchTerm, selectedPrograma, selectedEstado]);

  // Hierarchical view grouping: Area -> Secciones
  const hierarchicalItems = useMemo((): HierarchicalAreaItem[] => {
    return filteredAreas.map((area) => {
      const progObj = programas.find((p) => p.id === area.programa);
      const areaSecciones = secciones.filter((s) => s.area === area.id);

      return {
        id: area.id,
        codigo: area.codigo,
        nombre: area.nombre,
        tipo: area.tipo,
        tipo_display: area.tipo === 'GERENCIA' ? 'Gerencia' : 'Unidad',
        programaId: area.programa,
        programaNombre: formatProgramaShort(progObj, area.programa_codigo, area.programa_nombre),
        programaCodigo: progObj?.codigo || area.programa_codigo || '',
        estado: area.estado,
        secciones: areaSecciones.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          descripcion: s.descripcion,
          estado: s.estado,
        })),
      };
    });
  }, [filteredAreas, programas, secciones]);

  // ==========================================
  // HANDLERS: ÁREA
  // ==========================================
  const handleOpenCreateArea = () => {
    setEditingArea(null);
    setShowAreaModal(true);
  };

  const handleOpenEditArea = (area: Area) => {
    setEditingArea(area);
    setShowAreaDetalleModal(false);
    setShowAreaModal(true);
  };

  const handleOpenViewArea = (area: Area) => {
    setViewingArea(area);
    setShowAreaDetalleModal(true);
  };

  const handleSaveArea = async (formValues: AreaFormValues) => {
    if (!formValues.programa) {
      alertService.error('Campo requerido', 'Debe seleccionar un Programa.');
      return;
    }
    if (!formValues.codigo?.trim()) {
      alertService.error('Campo requerido', 'El código de área es obligatorio.');
      return;
    }
    if (!formValues.nombre?.trim()) {
      alertService.error('Campo requerido', 'El nombre de área es obligatorio.');
      return;
    }

    try {
      if (editingArea) {
        await organizationalApi.updateArea(editingArea.id, {
          programa: Number(formValues.programa),
          codigo: formValues.codigo.trim().toUpperCase(),
          nombre: formValues.nombre.trim(),
          tipo: formValues.tipo,
          descripcion: formValues.descripcion?.trim() || '',
        });
        alertService.success('Área Actualizada', 'Los cambios en el área fueron guardados exitosamente.');
      } else {
        await organizationalApi.createArea({
          programa: Number(formValues.programa),
          codigo: formValues.codigo.trim().toUpperCase(),
          nombre: formValues.nombre.trim(),
          tipo: formValues.tipo,
          descripcion: formValues.descripcion?.trim() || '',
        });
        alertService.success('Área Creada', 'El área institucional fue registrada correctamente.');
      }
      setShowAreaModal(false);
      fetchAll();
    } catch (err: any) {
      console.error('Error guardando área:', err);
      const detail = err?.response?.data?.detail || err?.response?.data?.codigo?.[0] || 'Error al guardar el área.';
      alertService.error('No se pudo guardar', detail);
    }
  };

  const handleToggleArea = async (area: Area) => {
    const nextState = !area.estado;
    const confirmed = await alertService.confirm({
      title: nextState ? '¿Activar área institucional?' : '¿Desactivar área institucional?',
      text: nextState
        ? `El área "${area.nombre}" (${area.codigo}) pasará a estar activa para asignaciones y operaciones.`
        : `El área "${area.nombre}" (${area.codigo}) quedará inactiva para nuevas asignaciones presupuestarias.`,
      confirmButtonText: nextState ? 'Sí, activar' : 'Sí, desactivar',
      isDanger: !nextState,
    });
    if (!confirmed) return;

    try {
      await organizationalApi.toggleEstadoArea(area.id, nextState);
      alertService.success(
        nextState ? 'Área Activada' : 'Área Inactiva',
        `El estado de "${area.nombre}" ahora es ${nextState ? 'activo' : 'inactivo'}.`
      );
      fetchAll();
    } catch (err: any) {
      console.error('Error cambiando estado área:', err);
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo actualizar el estado del área.');
    }
  };

  // ==========================================
  // HANDLERS: SECCIÓN
  // ==========================================
  const handleOpenCreateSeccion = (defaultAreaId?: number) => {
    setEditingSeccion(defaultAreaId ? ({ area: defaultAreaId } as any) : null);
    setShowSeccionModal(true);
  };

  const handleOpenEditSeccion = (sec: Seccion) => {
    setEditingSeccion(sec);
    setShowSeccionDetalleModal(false);
    setShowSeccionModal(true);
  };

  const handleOpenViewSeccion = (sec: Seccion) => {
    setViewingSeccion(sec);
    setShowSeccionDetalleModal(true);
  };

  const handleSaveSeccion = async (formValues: SeccionFormValues) => {
    if (!formValues.area) {
      alertService.error('Campo requerido', 'Debe seleccionar un Área dependiente.');
      return;
    }
    if (!formValues.nombre?.trim()) {
      alertService.error('Campo requerido', 'El nombre de sección es obligatorio.');
      return;
    }

    try {
      if (editingSeccion?.id) {
        await organizationalApi.updateSeccion(editingSeccion.id, {
          area: Number(formValues.area),
          nombre: formValues.nombre.trim(),
          descripcion: formValues.descripcion?.trim() || '',
        });
        alertService.success('Sección Actualizada', 'Los cambios en la sección fueron guardados.');
      } else {
        await organizationalApi.createSeccion({
          area: Number(formValues.area),
          nombre: formValues.nombre.trim(),
          descripcion: formValues.descripcion?.trim() || '',
        });
        alertService.success('Sección Creada', 'La sección operativa fue registrada correctamente.');
      }
      setShowSeccionModal(false);
      fetchAll();
    } catch (err: any) {
      console.error('Error guardando sección:', err);
      const detail = err?.response?.data?.detail || err?.response?.data?.nombre?.[0] || 'Error al guardar la sección.';
      alertService.error('No se pudo guardar', detail);
    }
  };

  const handleToggleSeccion = async (sec: Seccion) => {
    const nextState = !sec.estado;
    const confirmed = await alertService.confirm({
      title: nextState ? '¿Activar sección?' : '¿Desactivar sección?',
      text: nextState
        ? `La sección "${sec.nombre}" pasará a estar activa.`
        : `La sección "${sec.nombre}" quedará en estado inactivo.`,
      confirmButtonText: nextState ? 'Sí, activar' : 'Sí, desactivar',
      isDanger: !nextState,
    });
    if (!confirmed) return;

    try {
      await organizationalApi.toggleEstadoSeccion(sec.id, nextState);
      alertService.success(
        nextState ? 'Sección Activada' : 'Sección Inactiva',
        `La sección "${sec.nombre}" ahora está ${nextState ? 'activa' : 'inactiva'}.`
      );
      fetchAll();
    } catch (err: any) {
      console.error('Error cambiando estado sección:', err);
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo actualizar el estado de la sección.');
    }
  };

  // ==========================================
  // HANDLERS: PROGRAMA
  // ==========================================
  const handleOpenCreatePrograma = () => {
    setEditingPrograma(null);
    setShowProgramaModal(true);
  };

  const handleOpenEditPrograma = (prog: Programa) => {
    setEditingPrograma(prog);
    setShowProgramaDetalleModal(false);
    setShowProgramaModal(true);
  };

  const handleOpenViewPrograma = (prog: Programa) => {
    setViewingPrograma(prog);
    setShowProgramaDetalleModal(true);
  };

  const handleSavePrograma = async (formValues: ProgramaFormValues) => {
    if (!formValues.codigo?.trim()) {
      alertService.error('Campo requerido', 'El código de programa es obligatorio.');
      return;
    }
    if (!formValues.nombre?.trim()) {
      alertService.error('Campo requerido', 'El nombre de programa es obligatorio.');
      return;
    }

    try {
      if (editingPrograma) {
        await organizationalApi.updatePrograma(editingPrograma.id, {
          codigo: formValues.codigo.trim(),
          nombre: formValues.nombre.trim(),
          descripcion: formValues.descripcion?.trim() || '',
        });
        alertService.success('Programa Actualizado', 'Los cambios en el programa fueron guardados.');
      } else {
        await organizationalApi.createPrograma({
          codigo: formValues.codigo.trim(),
          nombre: formValues.nombre.trim(),
          descripcion: formValues.descripcion?.trim() || '',
        });
        alertService.success('Programa Creado', 'El programa fue registrado correctamente.');
      }
      setShowProgramaModal(false);
      fetchAll();
    } catch (err: any) {
      console.error('Error guardando programa:', err);
      const detail = err?.response?.data?.detail || err?.response?.data?.codigo?.[0] || 'Error al guardar el programa.';
      alertService.error('No se pudo guardar', detail);
    }
  };

  const handleTogglePrograma = async (prog: Programa) => {
    const nextState = !prog.estado;
    const shortTitle = formatProgramaShort(prog);
    const confirmed = await alertService.confirm({
      title: nextState ? `¿Activar ${shortTitle}?` : `¿Desactivar ${shortTitle}?`,
      text: nextState
        ? `El ${shortTitle} pasará a estar activo.`
        : `El ${shortTitle} quedará inactivo.`,
      confirmButtonText: nextState ? 'Sí, activar' : 'Sí, desactivar',
      isDanger: !nextState,
    });
    if (!confirmed) return;

    try {
      await organizationalApi.toggleEstadoPrograma(prog.id, nextState);
      alertService.success(
        nextState ? 'Programa Activado' : 'Programa Inactivo',
        `El estado de ${shortTitle} ahora es ${nextState ? 'activo' : 'inactivo'}.`
      );
      fetchAll();
    } catch (err: any) {
      console.error('Error cambiando estado programa:', err);
      alertService.error('Error', err?.response?.data?.detail || 'No se pudo actualizar el estado del programa.');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPrograma('ALL');
    setSelectedTipo('ALL');
    setSelectedEstado('ALL');
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    fetchAll,

    // Filter states
    searchTerm,
    setSearchTerm,
    selectedPrograma,
    setSelectedPrograma,
    selectedTipo,
    setSelectedTipo,
    selectedEstado,
    setSelectedEstado,
    handleResetFilters,

    // Raw and Filtered lists
    programas,
    areas,
    secciones,
    filteredAreas,
    filteredSecciones,
    filteredProgramas,
    hierarchicalItems,

    // Counts
    areasCount: areas.length,
    seccionesCount: secciones.length,
    programasCount: programas.length,
    totalCount: areas.length + secciones.length + programas.length,

    // Modals: Area
    showAreaModal,
    setShowAreaModal,
    editingArea,
    showAreaDetalleModal,
    setShowAreaDetalleModal,
    viewingArea,
    handleOpenCreateArea,
    handleOpenEditArea,
    handleOpenViewArea,
    handleSaveArea,
    handleToggleArea,

    // Modals: Seccion
    showSeccionModal,
    setShowSeccionModal,
    editingSeccion,
    showSeccionDetalleModal,
    setShowSeccionDetalleModal,
    viewingSeccion,
    handleOpenCreateSeccion,
    handleOpenEditSeccion,
    handleOpenViewSeccion,
    handleSaveSeccion,
    handleToggleSeccion,

    // Modals: Programa
    showProgramaModal,
    setShowProgramaModal,
    editingPrograma,
    showProgramaDetalleModal,
    setShowProgramaDetalleModal,
    viewingPrograma,
    handleOpenCreatePrograma,
    handleOpenEditPrograma,
    handleOpenViewPrograma,
    handleSavePrograma,
    handleTogglePrograma,
  };
}
