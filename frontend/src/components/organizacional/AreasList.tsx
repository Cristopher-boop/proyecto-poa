import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Power,
  X,
  SlidersHorizontal,
  Calendar,
} from 'lucide-react';
import { Area, AreaFormData, Programa } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';
import { getGestiones, Gestion } from '../../services/presupuestoService';
import alertService from '../../utils/alerts';

export const AreasList: React.FC<{
  onOpenCreate?: () => void;
  externalShowCreate?: boolean;
  onCloseExternalCreate?: () => void;
}> = ({ externalShowCreate, onCloseExternalCreate }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPrograma, setSelectedPrograma] = useState<string>('TODOS');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');

  useEffect(() => {
    fetchAreas();
    fetchProgramas();
    fetchGestiones();
  }, []);

  useEffect(() => {
    if (externalShowCreate) {
      setEditingArea(null);
      setShowModal(true);
    }
  }, [externalShowCreate]);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await organizacionalService.getAreas();
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
      alertService.error('Error', 'No se pudieron obtener las áreas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramas = async () => {
    try {
      const response = await organizacionalService.getProgramas();
      setProgramas(response.data || []);
    } catch (error) {
      console.error('Error fetching programas:', error);
    }
  };

  const fetchGestiones = async () => {
    try {
      const data = await getGestiones();
      setGestiones(data || []);
    } catch (error) {
      console.error('Error fetching gestiones:', error);
    }
  };

  const areasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return areas.filter((area) => {
      const matchSearch =
        !term ||
        area.codigo.toLowerCase().includes(term) ||
        area.nombre.toLowerCase().includes(term) ||
        (area.programa_nombre ?? '').toLowerCase().includes(term) ||
        (area.tipo_display ?? '').toLowerCase().includes(term) ||
        area.tipo.toLowerCase().includes(term) ||
        (area.descripcion ?? '').toLowerCase().includes(term) ||
        (area.gestion_anio ? String(area.gestion_anio).includes(term) : false);

      const matchPrograma =
        selectedPrograma === 'TODOS' ||
        String(area.programa) === selectedPrograma;

      const matchTipo =
        selectedTipo === 'TODOS' ||
        area.tipo === selectedTipo;

      const matchEstado =
        selectedEstado === 'TODOS' ||
        (selectedEstado === 'ACTIVAS' && area.estado) ||
        (selectedEstado === 'INACTIVAS' && !area.estado);

      return matchSearch && matchPrograma && matchTipo && matchEstado;
    });
  }, [areas, search, selectedPrograma, selectedTipo, selectedEstado]);

  const handleToggleEstado = async (item: Area) => {
    const nuevoEstado = !item.estado;

    const confirmado = await alertService.confirm({
      title: nuevoEstado ? '¿Activar área?' : '¿Desactivar área?',
      text: nuevoEstado
        ? `El área "${item.nombre}" (${item.codigo}) pasará a estado activo.`
        : `El área "${item.nombre}" (${item.codigo}) se dará de baja lógica.`,
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      isDanger: !nuevoEstado,
    });

    if (!confirmado) return;

    try {
      await organizacionalService.toggleEstadoArea(item.id, nuevoEstado);
      alertService.success(
        nuevoEstado ? '¡Área activada!' : '¡Área desactivada!',
        `El estado de "${item.nombre}" fue actualizado correctamente.`
      );
      await fetchAreas();
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      alertService.error('Error', error?.response?.data?.detail || 'No se pudo actualizar el estado del área');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArea(null);
    if (onCloseExternalCreate) onCloseExternalCreate();
  };

  return (
    <div className="space-y-4">
      {/* Título de Sección y Botón de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-theme-main flex items-center gap-2">
            <Building2 className="text-theme-primary" size={18} />
            <span>Catálogo de Áreas, Gerencias y Unidades</span>
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Entidades operativas y estratégicas asignadas a la formulación y ejecución presupuestaria.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingArea(null);
            setShowModal(true);
          }}
          className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nueva Área</span>
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por código, nombre o programa..."
              className="input-theme pl-10 text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-theme-muted mr-1">
              <SlidersHorizontal size={14} />
              <span>Filtros:</span>
            </div>

            {/* Filtro Programa */}
            <select
              value={selectedPrograma}
              onChange={(e) => setSelectedPrograma(e.target.value)}
              className="border border-theme-border rounded-xl px-3 py-2 text-xs bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
            >
              <option value="TODOS">Todos los Programas</option>
              {programas.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.codigo} - {p.nombre}
                </option>
              ))}
            </select>

            {/* Filtro Tipo */}
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="border border-theme-border rounded-xl px-3 py-2 text-xs bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="GERENCIA">Gerencia</option>
              <option value="UNIDAD">Unidad</option>
            </select>

            {/* Filtro Estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="border border-theme-border rounded-xl px-3 py-2 text-xs bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVAS">Solo Activas</option>
              <option value="INACTIVAS">Solo Inactivas</option>
            </select>
          </div>
        </div>

        {(search.trim() || selectedPrograma !== 'TODOS' || selectedTipo !== 'TODOS' || selectedEstado !== 'TODOS') && (
          <div className="flex items-center justify-between pt-2 border-t border-theme-border text-xs text-theme-muted">
            <span>
              Mostrando <strong>{areasFiltradas.length}</strong> de <strong>{areas.length}</strong> áreas
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedPrograma('TODOS');
                setSelectedTipo('TODOS');
                setSelectedEstado('TODOS');
              }}
              className="text-theme-primary hover:underline font-medium cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Áreas */}
      <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-theme-muted">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2" />
            <p className="text-sm">Cargando catálogo de áreas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-border">
              <thead className="bg-theme-base">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Nombre / Área
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Programa
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-theme-surface divide-y divide-theme-border">
                {areasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-theme-muted">
                      <Building2 size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No se encontraron áreas registradas.</p>
                      <p className="text-xs mt-1">Prueba ajustando los términos de búsqueda o filtros.</p>
                    </td>
                  </tr>
                ) : (
                  areasFiltradas.map((area) => (
                    <tr key={area.id} className="hover:bg-theme-base transition-colors">
                      {/* Código */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                          {area.codigo}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="px-6 py-4 text-sm font-medium text-theme-main">
                        <div>
                          <span>{area.nombre}</span>
                          {area.descripcion && (
                            <p className="text-xs text-theme-muted mt-0.5 truncate max-w-sm" title={area.descripcion}>
                              {area.descripcion}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-theme-muted">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          {area.tipo === 'GERENCIA' ? 'Gerencia' : 'Unidad'}
                        </span>
                      </td>

                      {/* Programa */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-theme-muted">
                        {area.programa_nombre ? (
                          <span className="font-medium text-theme-main">{area.programa_nombre}</span>
                        ) : (
                          <span className="italic opacity-60">Programa {area.programa}</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            area.estado
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              area.estado ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
                            }`}
                          />
                          {area.estado ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingArea(area);
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer flex items-center justify-center"
                            title="Editar Área"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(area)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                              area.estado
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            }`}
                            title={area.estado ? 'Desactivar (Baja Lógica)' : 'Reactivar Área'}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Área */}
      {showModal && (
        <AreaModal
          area={editingArea}
          programas={programas}
          gestiones={gestiones}
          onClose={handleCloseModal}
          onSave={() => {
            fetchAreas();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

const AreaModal: React.FC<{
  area?: Area | null;
  programas: Programa[];
  gestiones: Gestion[];
  onClose: () => void;
  onSave: () => void;
}> = ({ area, programas, gestiones, onClose, onSave }) => {
  const [formData, setFormData] = useState<AreaFormData>({
    programa: area?.programa || '',
    gestion: (area as any)?.gestion_id || area?.gestion || (gestiones.length === 1 ? gestiones[0].id : ''),
    codigo: area?.codigo || '',
    nombre: area?.nombre || '',
    tipo: area?.tipo || 'GERENCIA',
    descripcion: area?.descripcion || '',
    estado: area?.estado ?? true,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        gestion: formData.gestion ? Number(formData.gestion) : null,
      };

      if (area) {
        await organizacionalService.updateArea(area.id, payload);
        alertService.success('¡Área actualizada!', `El área "${formData.nombre}" se guardó correctamente.`);
      } else {
        await organizacionalService.createArea(payload);
        alertService.success('¡Área creada!', `El área "${formData.nombre}" fue registrada con éxito.`);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving area:', error);
      alertService.error('Error al guardar el área', error?.response?.data?.detail || 'No se pudo guardar la información del área.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-theme-primary/10 text-theme-primary">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-main">
                {area ? 'Editar Área / Gerencia' : 'Nueva Área / Gerencia'}
              </h3>
              <p className="text-xs text-theme-muted">
                {area ? 'Actualiza la información organizacional' : 'Ingresa los datos de la gerencia o unidad'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-base cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Programa */}
            <div>
              <label className="block text-xs font-semibold text-theme-main mb-1.5">
                Programa Institucional <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.programa}
                onChange={(e) => setFormData({ ...formData, programa: e.target.value })}
                required
                className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-2.5 text-xs text-theme-main focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none"
              >
                <option value="">Seleccione un programa</option>
                {programas.map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    {programa.codigo} - {programa.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Gestión */}
            <div>
              <label className="block text-xs font-semibold text-theme-main mb-1.5">
                Gestión Institucional <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.gestion || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gestion: e.target.value ? Number(e.target.value) : '',
                  })
                }
                required
                className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-2.5 text-xs text-theme-main focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none"
              >
                <option value="">Seleccione una gestión</option>
                {gestiones.map((g) => (
                  <option key={g.id} value={g.id}>
                    Gestión {g.anio} {g.estado ? `(${g.estado})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Código */}
            <div>
              <label className="block text-xs font-semibold text-theme-main mb-1.5">
                Código <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
                className="input-theme text-xs font-mono font-bold"
                placeholder="Ej: GER-001, PL, UT"
              />
            </div>

            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-theme-main mb-1.5">
                Nombre del Área <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                className="input-theme text-xs"
                placeholder="Ej: Gerencia Comercial, Planificación..."
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Tipo de Estructura <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'GERENCIA' | 'UNIDAD' })}
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-2.5 text-xs text-theme-main focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none"
            >
              <option value="GERENCIA">Gerencia</option>
              <option value="UNIDAD">Unidad</option>
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Descripción / Alcance
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="input-theme text-xs"
              placeholder="Funciones principales u objetivos del área..."
            />
          </div>

          {/* Estado activo */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 text-xs font-medium text-theme-main cursor-pointer p-3 rounded-xl border border-theme-border bg-theme-base/30 hover:bg-theme-base transition-colors">
              <input
                type="checkbox"
                checked={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                className="w-4 h-4 rounded text-theme-primary focus:ring-theme-primary focus:ring-offset-0 border-theme-border"
              />
              <div>
                <span className="font-semibold block">Área Activa</span>
                <span className="text-[11px] text-theme-muted">
                  Habilitada para formular presupuestos, operaciones y asignaciones.
                </span>
              </div>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-3 border-t border-theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-muted hover:bg-theme-base transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs font-semibold px-5 py-2.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : area ? 'Guardar Cambios' : 'Registrar Área'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};