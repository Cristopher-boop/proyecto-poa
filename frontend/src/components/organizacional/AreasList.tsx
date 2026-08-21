import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Area, AreaFormData, Programa } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';
import alertService from '../../utils/alerts';

export const AreasList: React.FC = () => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchAreas();
        fetchProgramas();
    }, []);

    const fetchAreas = async () => {
        try {
            setLoading(true);
            const response = await organizacionalService.getAreas();
            setAreas(response.data);
        } catch (error) {
            console.error('Error fetching areas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgramas = async () => {
        try {
            const response = await organizacionalService.getProgramas();
            setProgramas(response.data);
        } catch (error) {
            console.error('Error fetching programas:', error);
        }
    };

    const areasFiltradas = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return areas;

        return areas.filter((area) =>
            area.codigo.toLowerCase().includes(term) ||
            area.nombre.toLowerCase().includes(term) ||
            (area.programa_nombre ?? '').toLowerCase().includes(term) ||
            (area.tipo_display ?? '').toLowerCase().includes(term) ||
            area.tipo.toLowerCase().includes(term) ||
            (area.descripcion ?? '').toLowerCase().includes(term)
        );
    }, [areas, search]);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-theme-primary">Cargando áreas...</div>
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
                            Áreas
                        </h2>

                        <p className="mt-1 text-sm text-theme-muted">
                            Gestión de gerencias y unidades organizacionales
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingArea(null);
                            setShowModal(true);
                        }}
                        className="bg-theme-primary text-theme-primaryText px-4 py-2 rounded-lg hover:bg-theme-primaryHover transition-colors shadow-sm"
                    >
                        Nueva Área
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
                        placeholder="Buscar área, código, gerencia o programa..."
                        className="input-theme pl-10 text-xs w-full"
                    />
                </div>

                {search.trim() && (
                    <p className="text-xs text-theme-muted mt-2">
                        {areasFiltradas.length} área(s) encontrada(s)
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
                                    Tipo
                                </th>

                                <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                                    Programa
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
                            {areasFiltradas.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center text-theme-muted"
                                    >
                                        {search.trim()
                                            ? 'No hay áreas que coincidan con la búsqueda.'
                                            : 'No hay áreas registradas'}
                                    </td>
                                </tr>
                            ) : (
                                areasFiltradas.map((area) => (
                                    <tr
                                        key={area.id}
                                        className="hover:bg-theme-base transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">
                                            {area.codigo}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-main">
                                            {area.nombre}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-muted">
                                            {area.tipo_display ||
                                                (area.tipo === 'GERENCIA'
                                                    ? 'Gerencia'
                                                    : 'Unidad')}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-muted">
                                            {area.programa_nombre ||
                                                programas.find(
                                                    (programa) =>
                                                        programa.id === area.programa
                                                )?.nombre ||
                                                'Sin programa'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    area.estado
                                                        ? 'bg-triad-green-50 text-triad-green-600 dark:bg-triad-green-500/15 dark:text-triad-green-500'
                                                        : 'bg-triad-rose-50 text-triad-rose-600 dark:bg-triad-rose-500/15 dark:text-triad-rose-500'
                                                }`}
                                            >
                                                {area.estado ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setEditingArea(area);
                                                    setShowModal(true);
                                                }}
                                                className="text-theme-primary hover:text-theme-primaryHover mr-4"
                                            >
                                                Editar
                                            </button>

                                            <button
                                                onClick={() => handleToggleEstado(area)}
                                                className={area.estado
                                                    ? "text-triad-rose-600 dark:text-triad-rose-500 hover:text-triad-rose-500"
                                                    : "text-triad-green-600 dark:text-triad-green-500 hover:text-triad-green-500"}
                                            >
                                                {area.estado ? 'Desactivar' : 'Activar'}
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
                <AreaModal
                    area={editingArea}
                    programas={programas}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        fetchAreas();
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
};

const AreaModal: React.FC<{
    area?: Area | null;
    programas: Programa[];
    onClose: () => void;
    onSave: () => void;
}> = ({ area, programas, onClose, onSave }) => {
    const [formData, setFormData] = useState<AreaFormData>({
        programa: area?.programa || '',
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
            if (area) {
                await organizacionalService.updateArea(area.id, formData);
                alertService.success('¡Área actualizada!', `El área "${formData.nombre}" se guardó correctamente.`);
            } else {
                await organizacionalService.createArea(formData);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-theme-surface rounded-2xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 border-b border-theme-border">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-theme-primary">
                            {area ? 'Editar Área' : 'Nueva Área'}
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
                            Programa
                        </label>

                        <select
                            value={formData.programa}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    programa: e.target.value,
                                })
                            }
                            required
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                        >
                            <option value="">Seleccione un programa</option>

                            {programas.map((programa) => (
                                <option key={programa.id} value={programa.id}>
                                    {programa.codigo} - {programa.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-main mb-1">
                            Código
                        </label>

                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    codigo: e.target.value,
                                })
                            }
                            required
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            placeholder="Ej: GER-001"
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
                                setFormData({
                                    ...formData,
                                    nombre: e.target.value,
                                })
                            }
                            required
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                            placeholder="Nombre del área"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-theme-main mb-1">
                            Tipo
                        </label>

                        <select
                            value={formData.tipo}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    tipo: e.target.value as 'GERENCIA' | 'UNIDAD',
                                })
                            }
                            className="w-full border border-theme-border rounded-lg px-3 py-2 bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                        >
                            <option value="GERENCIA">Gerencia</option>
                            <option value="UNIDAD">Unidad</option>
                        </select>
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
                            placeholder="Descripción del área"
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
                        Área activa
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