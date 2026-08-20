import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Area, Seccion, SeccionFormData } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';

export const SeccionesList: React.FC = () => {
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSecciones();
        fetchAreas();
    }, []);

    const fetchSecciones = async () => {
        try {
            setLoading(true);
            const response = await organizacionalService.getSecciones();
            setSecciones(response.data);
        } catch (error) {
            console.error('Error fetching secciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAreas = async () => {
        try {
            const response = await organizacionalService.getAreas();
            setAreas(response.data);
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    };

    const seccionesFiltradas = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return secciones;

        return secciones.filter((seccion) =>
            seccion.nombre.toLowerCase().includes(term) ||
            (seccion.descripcion ?? '').toLowerCase().includes(term) ||
            (seccion.area_nombre ?? '').toLowerCase().includes(term) ||
            (seccion.area_codigo ?? '').toLowerCase().includes(term) ||
            (seccion.area_tipo ?? '').toLowerCase().includes(term)
        );
    }, [secciones, search]);

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

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar esta sección?')) {
            try {
                await organizacionalService.deleteSeccion(id);
                await fetchSecciones();
            } catch (error) {
                console.error('Error deleting seccion:', error);
                alert('Error al eliminar la sección');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-theme-primary">
                    Cargando secciones...
                </div>
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
                            Secciones
                        </h2>

                        <p className="mt-1 text-sm text-theme-muted">
                            Gestión de secciones organizacionales
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingSeccion(null);
                            setShowModal(true);
                        }}
                        className="bg-theme-primary text-theme-primaryText px-4 py-2 rounded-lg hover:bg-theme-primaryHover transition-colors shadow-sm"
                    >
                        Nueva Sección
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
                        placeholder="Buscar sección, nombre o área..."
                        className="input-theme pl-10 text-xs w-full"
                    />
                </div>

                {search.trim() && (
                    <p className="text-xs text-theme-muted mt-2">
                        {seccionesFiltradas.length} sección(es) encontrada(s)
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
                                    Nombre
                                </th>

                                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                    Área
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
                            {seccionesFiltradas.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-8 text-center text-theme-muted"
                                    >
                                        {search.trim()
                                            ? 'No hay secciones que coincidan con la búsqueda.'
                                            : 'No hay secciones registradas'}
                                    </td>
                                </tr>
                            ) : (
                                seccionesFiltradas.map((seccion) => (
                                    <tr
                                        key={seccion.id}
                                        className="hover:bg-theme-base transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-main">
                                            {seccion.nombre}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-muted">
                                            <div>
                                                <span className="text-theme-primary font-medium">
                                                    {getAreaCodigo(seccion)}
                                                </span>

                                                {getAreaCodigo(seccion) && ' - '}

                                                {getAreaNombre(seccion)}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-theme-muted max-w-xs truncate">
                                            {seccion.descripcion || 'Sin descripción'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    seccion.estado
                                                        ? 'bg-triad-green-50 text-triad-green-600 dark:bg-triad-green-500/15 dark:text-triad-green-500'
                                                        : 'bg-triad-rose-50 text-triad-rose-600 dark:bg-triad-rose-500/15 dark:text-triad-rose-500'
                                                }`}
                                            >
                                                {seccion.estado
                                                    ? 'Activa'
                                                    : 'Inactiva'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setEditingSeccion(seccion);
                                                    setShowModal(true);
                                                }}
                                                className="text-theme-primary hover:text-theme-primaryHover mr-4"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(seccion.id)
                                                }
                                                className="text-triad-rose-600 dark:text-triad-rose-500 hover:text-triad-rose-500"
                                            >
                                                Eliminar
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
                <SeccionModal
                    seccion={editingSeccion}
                    areas={areas}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        fetchSecciones();
                        setShowModal(false);
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
                await organizacionalService.updateSeccion(
                    seccion.id,
                    formData
                );
            } else {
                await organizacionalService.createSeccion(formData);
            }

            onSave();
        } catch (error) {
            console.error('Error saving seccion:', error);
            alert('Error al guardar la sección');
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
                            {seccion
                                ? 'Editar Sección'
                                : 'Nueva Sección'}
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
                            Área
                        </label>

                        <select
                            value={formData.area}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    area: e.target.value,
                                })
                            }
                            required
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                        >
                            <option value="">
                                Seleccione un área
                            </option>

                            {areas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.codigo} - {area.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-main mb-1">
                            Nombre
                        </label>

                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    nombre: e.target.value,
                                })
                            }
                            required
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            placeholder="Nombre de la sección"
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
                            placeholder="Descripción de la sección"
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
                        Sección activa
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