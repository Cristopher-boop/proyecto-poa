import React, { useState, useEffect } from 'react';
import { Area, Programa, AreaFormData } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';

export const AreasList: React.FC = () => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [areasRes, programasRes] = await Promise.all([
                organizacionalService.getAreas(),
                organizacionalService.getProgramas()
            ]);
            setAreas(areasRes.data);
            setProgramas(programasRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar esta área?')) {
            try {
                await organizacionalService.deleteArea(id);
                await fetchData();
            } catch (error) {
                console.error('Error deleting area:', error);
                alert('Error al eliminar el área');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-[#19499C]">Cargando áreas...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="h-1 w-8 rounded-full bg-[#FFCD05]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#19499C]">
                        Organizacional
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-[#19499C]">Áreas</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de áreas, gerencias y unidades
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingArea(null);
                            setShowModal(true);
                        }}
                        className="bg-[#19499C] text-white px-4 py-2 rounded-lg hover:bg-[#19499C]/90 transition-colors shadow-sm"
                    >
                        Nueva Área
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="rounded-2xl border border-[#19499C]/10 bg-white shadow-panel overflow-hidden">
                <div className="h-1.5 bg-[#FFCD05]" />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Programa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Secciones
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {areas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No hay áreas registradas
                                    </td>
                                </tr>
                            ) : (
                                areas.map((area) => (
                                    <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#19499C]">
                                            {area.codigo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {area.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {area.programa_nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                area.tipo === 'GERENCIA' 
                                                    ? 'bg-purple-100 text-purple-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {area.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                            {area.secciones_count || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                area.estado 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {area.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setEditingArea(area);
                                                    setShowModal(true);
                                                }}
                                                className="text-[#19499C] hover:text-[#19499C]/80 mr-4"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(area.id)}
                                                className="text-red-600 hover:text-red-800"
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

            {/* Modal */}
            {showModal && (
                <AreaModal
                    area={editingArea}
                    programas={programas}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        fetchData();
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
};

// Componente Modal para Área
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
        tipo: area?.tipo || 'UNIDAD',
        descripcion: area?.descripcion || '',
        estado: area?.estado ?? true,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                programa: Number(formData.programa)
            };
            if (area) {
                await organizacionalService.updateArea(area.id, data);
            } else {
                await organizacionalService.createArea(data);
            }
            onSave();
        } catch (error) {
            console.error('Error saving area:', error);
            alert('Error al guardar el área');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-[#19499C]">
                            {area ? 'Editar Área' : 'Nueva Área'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Programa <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.programa}
                            onChange={(e) => setFormData({ ...formData, programa: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#19499C] focus:border-transparent"
                            required
                            disabled={loading}
                        >
                            <option value="">Seleccionar Programa</option>
                            {programas.filter(p => p.estado).map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.codigo} - {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#19499C] focus:border-transparent"
                            placeholder="Ej: GER-001"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#19499C] focus:border-transparent"
                            placeholder="Nombre del área"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'GERENCIA' | 'UNIDAD' })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#19499C] focus:border-transparent"
                            required
                            disabled={loading}
                        >
                            <option value="GERENCIA">Gerencia</option>
                            <option value="UNIDAD">Unidad</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#19499C] focus:border-transparent"
                            rows={3}
                            placeholder="Descripción del área"
                            disabled={loading}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="estado"
                            checked={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                            className="w-4 h-4 text-[#19499C] border-gray-300 rounded focus:ring-[#19499C]"
                            disabled={loading}
                        />
                        <label htmlFor="estado" className="text-sm text-gray-700">
                            Activo
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#19499C] text-white rounded-lg hover:bg-[#19499C]/90 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : (area ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};