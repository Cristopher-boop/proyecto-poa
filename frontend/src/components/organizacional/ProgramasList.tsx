import React, { useEffect, useMemo, useState } from 'react';
import {
  FolderTree,
  Search,
  Plus,
  Edit2,
  Power,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Programa, ProgramaFormData } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';
import alertService from '../../utils/alerts';

export const ProgramasList: React.FC<{
  onOpenCreate?: () => void;
  externalShowCreate?: boolean;
  onCloseExternalCreate?: () => void;
}> = ({ externalShowCreate, onCloseExternalCreate }) => {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrograma, setEditingPrograma] = useState<Programa | null>(null);
  const [search, setSearch] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');

  useEffect(() => {
    fetchProgramas();
  }, []);

  useEffect(() => {
    if (externalShowCreate) {
      setEditingPrograma(null);
      setShowModal(true);
    }
  }, [externalShowCreate]);

  const fetchProgramas = async () => {
    try {
      setLoading(true);
      const response = await organizacionalService.getProgramas();
      setProgramas(response.data || []);
    } catch (error) {
      console.error('Error fetching programas:', error);
      alertService.error('Error', 'No se pudieron obtener los programas.');
    } finally {
      setLoading(false);
    }
  };

  const programasFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    return programas.filter((programa) => {
      const matchSearch =
        !term ||
        programa.codigo.toLowerCase().includes(term) ||
        programa.nombre.toLowerCase().includes(term) ||
        (programa.descripcion ?? '').toLowerCase().includes(term);

      const matchEstado =
        selectedEstado === 'TODOS' ||
        (selectedEstado === 'ACTIVAS' && programa.estado) ||
        (selectedEstado === 'INACTIVAS' && !programa.estado);

      return matchSearch && matchEstado;
    });
  }, [programas, search, selectedEstado]);

  const handleToggleEstado = async (item: Programa) => {
    const nuevoEstado = !item.estado;

    const confirmado = await alertService.confirm({
      title: nuevoEstado ? '¿Activar programa?' : '¿Desactivar programa?',
      text: nuevoEstado
        ? `El programa "${item.nombre}" (${item.codigo}) pasará a estado activo.`
        : `El programa "${item.nombre}" (${item.codigo}) se dará de baja lógica.`,
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      isDanger: !nuevoEstado,
    });

    if (!confirmado) return;

    try {
      await organizacionalService.toggleEstadoPrograma(item.id, nuevoEstado);
      alertService.success(
        nuevoEstado ? '¡Programa activado!' : '¡Programa desactivado!',
        `El estado de "${item.nombre}" fue actualizado correctamente.`
      );
      await fetchProgramas();
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      alertService.error('Error', error?.response?.data?.detail || 'No se pudo actualizar el estado del programa');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrograma(null);
    if (onCloseExternalCreate) onCloseExternalCreate();
  };

  return (
    <div className="space-y-4">
      {/* Título de Sección y Botón de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-theme-main flex items-center gap-2">
            <FolderTree className="text-theme-primary" size={18} />
            <span>Catálogo de Programas Institucionales</span>
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            Estructura presupuestaria programática (PEI / POA) de la empresa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPrograma(null);
            setShowModal(true);
          }}
          className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nuevo Programa</span>
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar programa, código o nombre..."
              className="input-theme pl-10 text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-theme-muted mr-1">
              <SlidersHorizontal size={14} />
              <span>Filtros:</span>
            </div>

            {/* Filtro Estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="border border-theme-border rounded-xl px-3 py-2 text-xs bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVAS">Solo Activos</option>
              <option value="INACTIVAS">Solo Inactivos</option>
            </select>
          </div>
        </div>

        {(search.trim() || selectedEstado !== 'TODOS') && (
          <div className="flex items-center justify-between pt-2 border-t border-theme-border text-xs text-theme-muted">
            <span>
              Mostrando <strong>{programasFiltrados.length}</strong> de <strong>{programas.length}</strong> programas
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedEstado('TODOS');
              }}
              className="text-theme-primary hover:underline font-medium cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Programas */}
      <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-theme-muted">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2" />
            <p className="text-sm">Cargando catálogo de programas...</p>
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
                    Nombre del Programa
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
                {programasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-theme-muted">
                      <FolderTree size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No se encontraron programas registrados.</p>
                      <p className="text-xs mt-1">Prueba ajustando los términos de búsqueda o filtros.</p>
                    </td>
                  </tr>
                ) : (
                  programasFiltrados.map((programa) => (
                    <tr key={programa.id} className="hover:bg-theme-base transition-colors">
                      {/* Código */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                          {programa.codigo}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="px-6 py-4 text-sm font-medium text-theme-main">
                        {programa.nombre}
                      </td>

                      {/* Descripción */}
                      <td className="px-6 py-4 text-xs text-theme-muted max-w-md truncate" title={programa.descripcion || ''}>
                        {programa.descripcion || <span className="italic opacity-60">Sin descripción</span>}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            programa.estado
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              programa.estado ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
                            }`}
                          />
                          {programa.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPrograma(programa);
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer flex items-center justify-center"
                            title="Editar Programa"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(programa)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                              programa.estado
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            }`}
                            title={programa.estado ? 'Desactivar (Baja Lógica)' : 'Reactivar Programa'}
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

      {/* Modal de Programa */}
      {showModal && (
        <ProgramaModal
          programa={editingPrograma}
          onClose={handleCloseModal}
          onSave={() => {
            fetchProgramas();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

const ProgramaModal: React.FC<{
  programa?: Programa | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ programa, onClose, onSave }) => {
  const [formData, setFormData] = useState<ProgramaFormData>({
    codigo: programa?.codigo || '',
    nombre: programa?.nombre || '',
    descripcion: programa?.descripcion || '',
    estado: programa?.estado ?? true,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (programa) {
        await organizacionalService.updatePrograma(programa.id, formData);
        alertService.success('¡Programa actualizado!', `El programa "${formData.nombre}" se guardó correctamente.`);
      } else {
        await organizacionalService.createPrograma(formData);
        alertService.success('¡Programa creado!', `El programa "${formData.nombre}" fue registrado con éxito.`);
      }

      onSave();
    } catch (error: any) {
      console.error('Error saving programa:', error);
      alertService.error('Error al guardar el programa', error?.response?.data?.detail || 'No se pudo guardar la información del programa.');
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
              <FolderTree size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-main">
                {programa ? 'Editar Programa Institucional' : 'Nuevo Programa Institucional'}
              </h3>
              <p className="text-xs text-theme-muted">
                {programa ? 'Actualiza los datos del programa' : 'Ingresa la información para registrar el programa'}
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
          {/* Código */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Código del Programa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              required
              className="input-theme text-xs font-mono font-bold"
              placeholder="Ej: 1, 2, 210, 410, PRG-001"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Nombre / Denominación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              className="input-theme text-xs"
              placeholder="Ej: Programa 1 - Gestión Institucional"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-theme-main mb-1.5">
              Descripción / Objetivos
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="input-theme text-xs"
              placeholder="Detalle o alcance institucional del programa..."
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
                <span className="font-semibold block">Programa Activo</span>
                <span className="text-[11px] text-theme-muted">
                  Habilitado para agrupar áreas y acciones estratégicas del POA.
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
              {loading ? 'Guardando...' : programa ? 'Guardar Cambios' : 'Registrar Programa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};