import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Programa, ProgramaFormData } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';
import alertService from '../../utils/alerts';

export const ProgramasList: React.FC = () => {
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPrograma, setEditingPrograma] = useState<Programa | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProgramas();
    }, []);

    const fetchProgramas = async () => {
        try {
            setLoading(true);
            const response = await organizacionalService.getProgramas();
            setProgramas(response.data);
        } catch (error) {
            console.error('Error fetching programas:', error);
        } finally {
            setLoading(false);
        }
    };

    const programasFiltrados = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return programas;

        return programas.filter((programa) =>
            programa.codigo.toLowerCase().includes(term) ||
            programa.nombre.toLowerCase().includes(term) ||
            (programa.descripcion ?? '').toLowerCase().includes(term)
        );
    }, [programas, search]);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-theme-primary">Cargando programas...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="h-1 w-8 rounded-full bg-theme-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-theme-primary">
                        Organizacional
                    </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-theme-primary">
                            Programas
                        </h2>
                        <p className="mt-1 text-sm text-theme-muted">
                            Gestión de programas institucionales
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingPrograma(null);
                            setShowModal(true);
                        }}
                        className="bg-theme-primary text-theme-primaryText px-4 py-2 rounded-lg hover:bg-theme-primaryHover transition-colors shadow-sm"
                    >
                        Nuevo Programa
                    </button>
                </div>
            </div>

            {/* BUSCADOR */}
            <div className="card p-4">
                <div className="relative w-full max-w-md">
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

                {search.trim() && (
                    <p className="text-xs text-theme-muted mt-2">
                        {programasFiltrados.length} programa(s) encontrado(s)
                    </p>
                )}
            </div>

            <div className="rounded-2xl border border-theme-border bg-theme-surface shadow-panel overflow-hidden">
                <div className="h-1.5 bg-theme-primary" />

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-theme-border">
                        <thead className="bg-theme-base">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody className="bg-theme-surface divide-y divide-theme-border">
                            {programasFiltrados.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-theme-muted"
                                    >
                                        {search.trim()
                                            ? 'No hay programas que coincidan con la búsqueda.'
                                            : 'No hay programas registrados'}
                                    </td>
                                </tr>
                            ) : (
                                programasFiltrados.map((programa) => (
                                    <tr
                                        key={programa.id}
                                        className="hover:bg-theme-base transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">
                                            {programa.codigo}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-main">
                                            {programa.nombre}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-theme-muted max-w-xs truncate">
                                            {programa.descripcion || 'Sin descripción'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    programa.estado
                                                        ? 'bg-triad-green-50 text-triad-green-600 dark:bg-triad-green-500/15 dark:text-triad-green-500'
                                                        : 'bg-triad-rose-50 text-triad-rose-600 dark:bg-triad-rose-500/15 dark:text-triad-rose-500'
                                                }`}
                                            >
                                                {programa.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setEditingPrograma(programa);
                                                    setShowModal(true);
                                                }}
                                                className="text-theme-primary hover:text-theme-primaryHover mr-4"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                onClick={() => handleToggleEstado(programa)}
                                                className={programa.estado
                                                    ? "text-triad-rose-600 dark:text-triad-rose-500 hover:text-triad-rose-500"
                                                    : "text-triad-green-600 dark:text-triad-green-500 hover:text-triad-green-500"}
                                            >
                                                {programa.estado ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <ProgramaModal
                    programa={editingPrograma}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        fetchProgramas();
                        setShowModal(false);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-theme-surface rounded-2xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 border-b border-theme-border">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-theme-primary">
                            {programa ? 'Editar Programa' : 'Nuevo Programa'}
                        </h3>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-theme-muted hover:text-theme-main text-xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-theme-main mb-1">
                            Código
                        </label>

                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) =>
                                setFormData({ ...formData, codigo: e.target.value })
                            }
                            required
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            placeholder="Ej: PRG-001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-main mb-1">
                            Nombre
                        </label>

                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) =>
                                setFormData({ ...formData, nombre: e.target.value })
                            }
                            required
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            placeholder="Nombre del programa"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-main mb-1">
                            Descripción
                        </label>

                        <textarea
                            value={formData.descripcion}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    descripcion: e.target.value,
                                })
                            }
                            rows={3}
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            placeholder="Descripción del programa"
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-theme-main">
                        <input
                            type="checkbox"
                            checked={formData.estado}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    estado: e.target.checked,
                                })
                            }
                        />
                        Programa activo
                    </label>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-theme-border text-theme-main hover:bg-theme-base"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-theme-primary text-theme-primaryText hover:bg-theme-primaryHover disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};