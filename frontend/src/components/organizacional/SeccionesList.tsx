import React, { useEffect, useMemo, useState } from 'react';
import {
  Layers3,
  Search,
  Plus,
  Edit2,
  Power,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Area, Seccion, SeccionFormData } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';
import alertService from '../../utils/alerts';

export const SeccionesList: React.FC<{
  onOpenCreate?: () => void;
  externalShowCreate?: boolean;
  onCloseExternalCreate?: () => void;
}> = ({ externalShowCreate, onCloseExternalCreate }) => {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('TODOS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');

  useEffect(() => {
    fetchSecciones();
    fetchAreas();
  }, []);

  useEffect(() => {
    if (externalShowCreate) {
      setEditingSeccion(null);
      setShowModal(true);
    }
  }, [externalShowCreate]);

  const fetchSecciones = async () => {
    try {
      setLoading(true);
      const response = await organizacionalService.getSecciones();
      setSecciones(response.data || []);
    } catch (error) {
      console.error('Error fetching secciones:', error);
      alertService.error('Error', 'No se pudieron obtener las secciones.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await organizacionalService.getAreas();
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };

  const seccionesFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return secciones.filter((seccion) => {
      const matchSearch =
        !term ||
        seccion.nombre.toLowerCase().includes(term) ||
        (seccion.descripcion ?? '').toLowerCase().includes(term) ||
        (seccion.area_nombre ?? '').toLowerCase().includes(term) ||
        (seccion.area_codigo ?? '').toLowerCase().includes(term) ||
        (seccion.area_tipo ?? '').toLowerCase().includes(term);

      const matchArea =
        selectedArea === 'TODOS' ||
        String(seccion.area) === selectedArea;

      const matchEstado =
        selectedEstado === 'TODOS' ||
        (selectedEstado === 'ACTIVAS' && seccion.estado) ||
        (selectedEstado === 'INACTIVAS' && !seccion.estado);

      return matchSearch && matchArea && matchEstado;
    });
  }, [secciones, search, selectedArea, selectedEstado]);

  const getAreaNombre = (seccion: Seccion) => {
    return (
      seccion.area_nombre ||
      areas.find((area) => area.id === seccion.area)?.nombre ||
      'Sin área'
    );
  };

  const getAreaCodigo = (seccion: Seccion) => {
    return (
      seccion.area_codigo ||
      areas.find((area) => area.id === seccion.area)?.codigo ||
      ''
    );
  };

  const handleToggleEstado = async (item: Seccion) => {
    const nuevoEstado = !item.estado;

    const confirmado = await alertService.confirm({
      title: nuevoEstado ? '¿Activar sección?' : '¿Desactivar sección?',
      text: nuevoEstado
        ? `La sección "${item.nombre}" pasará a estado activo.`
        : `La sección "${item.nombre}" se dará de baja lógica.`,
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      isDanger: !nuevoEstado,
    });

    if (!confirmado) return;

    try {
      await organizacionalService.toggleEstadoSeccion(item.id, nuevoEstado);
      alertService.success(
        nuevoEstado ? '¡Sección activada!' : '¡Sección desactivada!',
        `El estado de "${item.nombre}" fue actualizado correctamente.`
      );
      await fetchSecciones();
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      alertService.error('Error', error?.response?.data?.detail || 'No se pudo actualizar el estado de la sección');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSeccion(null);
    if (onCloseExternalCreate) onCloseExternalCreate();
  };

  return (
    <div className="space-y-4">
      {/* Título de Sección y Botón de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-theme-main flex items-center gap-2">
            <Layers3 className="text-theme-primary" size={18} />
            <span>Catálogo de Secciones Organizacionales</span>
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Unidades y subdivisiones de formulación de presupuestos y memorias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSeccion(null);
            setShowModal(true);
          }}
          className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nueva Sección</span>
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
              placeholder="Buscar sección, área o código..."
              className="input-theme pl-10 text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-theme-muted mr-1">
              <SlidersHorizontal size={14} />
              <span>Filtros:</span>
            </div>

            {/* Filtro Área */}
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="border border-theme-border rounded-xl px-3 py-2 text-xs bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
            >
              <option value="TODOS">Todas las Áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.codigo} - {a.nombre}
                </option>
              ))}
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

        {(search.trim() || selectedArea !== 'TODOS' || selectedEstado !== 'TODOS') && (
          <div className="flex items-center justify-between pt-2 border-t border-theme-border text-xs text-theme-muted">
            <span>
              Mostrando <strong>{seccionesFiltradas.length}</strong> de <strong>{secciones.length}</strong> secciones
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedArea('TODOS');
                setSelectedEstado('TODOS');
              }}
              className="text-theme-primary hover:underline font-medium cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Secciones */}
      <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-theme-muted">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2" />
            <p className="text-sm">Cargando catálogo de secciones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-theme-border">
              <thead className="bg-theme-base">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Nombre de Sección
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Área Dependiente
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Descripción
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
                {seccionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-theme-muted">
                      <Layers3 size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No se encontraron secciones registradas.</p>
                      <p className="text-xs mt-1">Prueba ajustando los términos de búsqueda o filtros.</p>
                    </td>
                  </tr>
                ) : (
                  seccionesFiltradas.map((seccion) => (
                    <tr key={seccion.id} className="hover:bg-theme-base transition-colors">
                      {/* Nombre */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-main">
                        {seccion.nombre}
                      </td>

                      {/* Área */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-muted">
                        <div className="flex items-center gap-2">
                          {getAreaCodigo(seccion) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                              {getAreaCodigo(seccion)}
                            </span>
                          )}
                          <span className="font-medium text-theme-main">{getAreaNombre(seccion)}</span>
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="px-6 py-4 text-xs text-theme-muted max-w-xs truncate" title={seccion.descripcion || ''}>
                        {seccion.descripcion || <span className="italic opacity-60">Sin descripción</span>}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            seccion.estado
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              seccion.estado ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
                            }`}
                          />
                          {seccion.estado ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSeccion(seccion);
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Editar Sección"
                          >
                            <Edit2 size={14} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(seccion)}
                            className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer ${
                              seccion.estado
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            }`}
                            title={seccion.estado ? 'Desactivar (Baja Lógica)' : 'Reactivar Sección'}
                          >
                            <Power size={14} />
                            <span>{seccion.estado ? 'Desactivar' : 'Activar'}</span>
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

      {/* Modal de Sección */}
      {showModal && (
        <SeccionModal
          seccion={editingSeccion}
          areas={areas}
          onClose={handleCloseModal}
          onSave={() => {
            fetchSecciones();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

const SeccionModal: React.FC<{
  seccion?: Seccion | null;
  areas: Area[];
  onClose: () => void;
  onSave: () => void;
}> = ({ seccion, areas, onClose, onSave }) => {
  const [formData, setFormData] = useState<SeccionFormData>({
    area: seccion?.area || '',
    nombre: seccion?.nombre || '',
    descripcion: seccion?.descripcion || '',
    estado: seccion?.estado ?? true,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (seccion) {
        await organizacionalService.updateSeccion(seccion.id, formData);
        alertService.success('¡Sección actualizada!', `La sección "${formData.nombre}" se guardó correctamente.`);
      } else {
        await organizacionalService.createSeccion(formData);
        alertService.success('¡Sección creada!', `La sección "${formData.nombre}" fue registrada con éxito.`);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving seccion:', error);
      alertService.error('Error al guardar la sección', error?.response?.data?.detail || 'No se pudo guardar la información de la sección.');
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
              <Layers3 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-main">
                {seccion ? 'Editar Sección' : 'Nueva Sección'}
              </h3>
              <p className="text-xs text-theme-muted">
                {seccion ? 'Actualiza la sección del área' : 'Registra una nueva sección dependiente'}
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
          {/* Área */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Área Dependiente <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              required
              className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-2.5 text-xs text-theme-main focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none"
            >
              <option value="">Seleccione un área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.codigo} - {area.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Nombre de la Sección <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="input-theme text-xs"
              placeholder="Ej: Desarrollo de Sistemas, Tesorería..."
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="input-theme text-xs"
              placeholder="Descripción de actividades de la sección..."
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
                <span className="font-semibold block">Sección Activa</span>
                <span className="text-[11px] text-theme-muted">
                  Habilitada para formular memorias de cálculo y asignar gastos.
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
              {loading ? 'Guardando...' : seccion ? 'Guardar Cambios' : 'Registrar Sección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};