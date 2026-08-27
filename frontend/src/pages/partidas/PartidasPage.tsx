import React, { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Layers,
  Power,
  X,
} from 'lucide-react';
import { Partida, PartidaFormData, ClasePartida } from '../../types/partida';
import { partidaService } from '../../services/partidaService';
import alertService from '../../utils/alerts';

export default function PartidasPage() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingPartida, setEditingPartida] = useState<Partida | null>(null);

  const fetchPartidas = async () => {
    try {
      setLoading(true);
      const response = await partidaService.getPartidas({ clase: 'EGRESO' });
      const egresos = (response.data || []).filter(
        (p) => (p.clase || '').toUpperCase() === 'EGRESO'
      );
      setPartidas(egresos);
    } catch (error) {
      console.error('Error cargando catálogo de partidas:', error);
      alertService.error('Error de carga', 'No se pudieron obtener las partidas presupuestarias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartidas();
  }, []);

  const partidasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return partidas.filter((partida) => {
      const matchSearch =
        !term ||
        partida.codigo.toLowerCase().includes(term) ||
        partida.nombre.toLowerCase().includes(term) ||
        (partida.descripcion ?? '').toLowerCase().includes(term);

      const matchEstado =
        selectedEstado === 'TODOS' ||
        (selectedEstado === 'ACTIVAS' && partida.estado) ||
        (selectedEstado === 'INACTIVAS' && !partida.estado);

      return matchSearch && matchEstado;
    });
  }, [partidas, search, selectedEstado]);

  const totalPartidas = partidas.length;
  const partidasActivas = partidas.filter((p) => p.estado).length;
  const partidasInactivas = totalPartidas - partidasActivas;

  const handleToggleEstado = async (item: Partida) => {
    const nuevoEstado = !item.estado;

    const confirmado = await alertService.confirm({
      title: nuevoEstado ? '¿Activar partida?' : '¿Desactivar partida?',
      text: nuevoEstado
        ? `La partida presupuestaria "${item.codigo} - ${item.nombre}" volverá a estar disponible para su uso.`
        : `La partida "${item.codigo} - ${item.nombre}" se dará de baja lógica y no podrá asignarse en nuevas formulaciones.`,
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      isDanger: !nuevoEstado,
    });

    if (!confirmado) return;

    try {
      await partidaService.toggleEstadoPartida(item.id, nuevoEstado);
      alertService.success(
        nuevoEstado ? '¡Partida activada!' : '¡Partida desactivada!',
        `La partida "${item.codigo}" fue actualizada a estado ${nuevoEstado ? 'Activa' : 'Inactiva (Baja lógica)'}.`
      );
      await fetchPartidas();
    } catch (error: any) {
      console.error('Error al cambiar estado de la partida:', error);
      alertService.error('Error', error?.response?.data?.detail || 'No se pudo actualizar el estado de la partida.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-theme-primary/15 text-theme-primary shadow-sm">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-theme-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-theme-primary">
                  Clasificador Presupuestario
                </span>
              </div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight mt-0.5">
                Partidas Presupuestarias
              </h1>
              <p className="text-sm text-theme-muted">
                Catálogo oficial de partidas presupuestarias de egreso para la formulación del POA.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingPartida(null);
              setShowModal(true);
            }}
            className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Nueva Partida</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-theme-primary/10 text-theme-primary">
              <Layers size={20} />
            </div>
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Total</span>
          </div>
          <p className="text-3xl font-bold text-theme-main mt-3">{totalPartidas}</p>
          <p className="text-xs text-theme-muted mt-1">Partidas de egreso registradas</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Activas</span>
          </div>
          <p className="text-3xl font-bold text-theme-main mt-3">{partidasActivas}</p>
          <p className="text-xs text-theme-muted mt-1">Disponibles para formulación y gastos</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              <XCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Inactivas</span>
          </div>
          <p className="text-3xl font-bold text-theme-main mt-3">{partidasInactivas}</p>
          <p className="text-xs text-theme-muted mt-1">Dadas de baja lógica en el sistema</p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-theme pl-10 text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-theme-muted mr-1">
              <SlidersHorizontal size={14} />
              <span>Filtros:</span>
            </div>

            {/* Filtro de Estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="border border-theme-border rounded-xl px-3 py-2 text-xs bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVAS">Solo Activas</option>
              <option value="INACTIVAS">Solo Inactivas (Baja Lógica)</option>
            </select>
          </div>
        </div>

        {(search.trim() || selectedEstado !== 'TODOS') && (
          <div className="flex items-center justify-between pt-2 border-t border-theme-border text-xs text-theme-muted">
            <span>
              Mostrando <strong>{partidasFiltradas.length}</strong> de <strong>{totalPartidas}</strong> partidas
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

      {/* Tabla de Partidas */}
      <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-theme-muted">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2" />
            <p className="text-sm">Cargando catálogo de partidas...</p>
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
                    Nombre / Concepto
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Clase
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
                {partidasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-theme-muted">
                      <FileSpreadsheet size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No se encontraron partidas presupuestarias.</p>
                      <p className="text-xs mt-1">Prueba ajustando los términos de búsqueda o filtros.</p>
                    </td>
                  </tr>
                ) : (
                  partidasFiltradas.map((partida) => (
                    <tr key={partida.id} className="hover:bg-theme-base transition-colors">
                      {/* Código */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                          {partida.codigo}
                        </span>
                      </td>

                      {/* Nombre */}
                      <td className="px-6 py-4 text-sm font-medium text-theme-main">
                        {partida.nombre}
                      </td>

                      {/* Clase */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            partida.clase === 'EGRESO'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                          }`}
                        >
                          {partida.clase_display || (partida.clase === 'EGRESO' ? 'Egreso' : 'Ingreso')}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td className="px-6 py-4 text-xs text-theme-muted max-w-xs truncate" title={partida.descripcion || ''}>
                        {partida.descripcion || <span className="italic opacity-60">Sin descripción</span>}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            partida.estado
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              partida.estado ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
                            }`}
                          />
                          {partida.estado ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPartida(partida);
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer flex items-center justify-center"
                            title="Editar Partida"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEstado(partida)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                              partida.estado
                                ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            }`}
                            title={partida.estado ? 'Desactivar (Baja Lógica)' : 'Reactivar Partida'}
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

      {/* Modal de Partida */}
      {showModal && (
        <PartidaModal
          partida={editingPartida}
          onClose={() => setShowModal(false)}
          onSave={() => {
            fetchPartidas();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

const PartidaModal: React.FC<{
  partida?: Partida | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ partida, onClose, onSave }) => {
  const [formData, setFormData] = useState<PartidaFormData>({
    codigo: partida?.codigo || '',
    nombre: partida?.nombre || '',
    clase: partida?.clase || 'EGRESO',
    descripcion: partida?.descripcion || '',
    estado: partida?.estado ?? true,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (partida) {
        await partidaService.updatePartida(partida.id, formData);
        alertService.success(
          '¡Partida actualizada!',
          `La partida "${formData.codigo} - ${formData.nombre}" se guardó correctamente.`
        );
      } else {
        await partidaService.createPartida(formData);
        alertService.success(
          '¡Partida creada!',
          `La partida "${formData.codigo} - ${formData.nombre}" fue registrada con éxito.`
        );
      }

      onSave();
    } catch (error: any) {
      console.error('Error al guardar la partida:', error);
      alertService.error(
        'Error al guardar la partida',
        error?.response?.data?.codigo?.[0] ||
          error?.response?.data?.nombre?.[0] ||
          error?.response?.data?.detail ||
          'No se pudo guardar la información de la partida.'
      );
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
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-main">
                {partida ? 'Editar Partida Presupuestaria' : 'Nueva Partida Presupuestaria'}
              </h3>
              <p className="text-xs text-theme-muted">
                {partida ? 'Actualiza los datos del clasificador' : 'Ingresa la información para registrar la partida'}
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
                placeholder="Ej: 11100, 22100"
              />
            </div>

            {/* Clase */}
            <div>
              <label className="block text-xs font-semibold text-theme-main mb-1.5">
                Clase de Gasto <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.clase}
                onChange={(e) => setFormData({ ...formData, clase: e.target.value as ClasePartida })}
                required
                className="w-full rounded-xl border border-theme-border bg-theme-surface px-4 py-2.5 text-xs text-theme-main focus:border-theme-primary focus:ring-1 focus:ring-theme-primary focus:outline-none"
              >
                <option value="EGRESO">Egreso</option>
                <option value="INGRESO">Ingreso</option>
              </select>
            </div>
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
              placeholder="Ej: Sueldos y Salarios, Pasajes y Viáticos..."
            />
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
              placeholder="Detalle o descripción de los conceptos imputables a esta partida..."
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
                <span className="font-semibold block">Partida Activa</span>
                <span className="text-[11px] text-theme-muted">
                  Disponible para formulación de memorias y ejecución presupuestaria.
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
              {loading ? 'Guardando...' : partida ? 'Guardar Cambios' : 'Registrar Partida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
