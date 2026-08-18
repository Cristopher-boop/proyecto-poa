import React, { useState, useEffect } from 'react';
import { Seccion, Area, SeccionFormData } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';

export const SeccionesList: React.FC = () => {
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [seccionesRes, areasRes] = await Promise.all([
                organizacionalService.getSecciones(),
                organizacionalService.getAreas()
            ]);
            setSecciones(seccionesRes.data);
            setAreas(areasRes.data.filter((a: Area) => a.estado));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar esta sección?')) {
            try {
                await organizacionalService.deleteSeccion(id);
                await fetchData();
            } catch (error) {
                console.error('Error deleting seccion:', error);
                alert('Error al eliminar la sección');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-[#19499C]">Cargando secciones...</div>
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
                        <h2 className="text-2xl font-bold text-[#19499C]">Secciones</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de secciones por área
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingSeccion(null);
                            setShowModal(true);
                        }}
                        className="bg-[#19499C] text-white px-4 py-2 rounded-lg hover:bg-[#19499C]/90 transition-colors shadow-sm"
                    >
                        Nueva Sección
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
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Área
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código de Área
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo de Área
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
                            {secciones.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No hay secciones registradas
                                    </td>
                                </tr>
                            ) : (
                                secciones.map((seccion) => (
                                    <tr key={seccion.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {seccion.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {seccion.area_nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#19499C]">
                                            {seccion.area_codigo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                seccion.area_tipo === 'GERENCIA' 
                                                    ? 'bg-purple-100 text-purple-800' 
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {seccion.area_tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                seccion.estado 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {seccion.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setEditingSeccion(seccion);
                                                    setShowModal(true);
                                                }}
                                                className="text-[#19499C] hover:text-[#19499C]/80 mr-4"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(seccion.id)}
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
                <SeccionModal
                    seccion={editingSeccion}
                    areas={areas}
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

// Componente Modal para Sección
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
            const data = {
                ...formData,
                area: Number(formData.area)
            };
            if (seccion) {
                await organizacionalService.updateSeccion(seccion.id, data);
            } else {
                await organizacionalService.createSeccion(data);
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-[#19499C]">
                            {seccion ? 'Editar Sección' : 'Nueva Sección'}
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
                            Área <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#19499C] focus:border-transparent"
                            required
                            disabled={loading}
                        >
                            <option value="">Seleccionar Área</option>
                            {areas.map((a) => (
                                <option key={a.id} value={a.id}>
                                    [{a.tipo}] {a.codigo} - {a.nombre}
                                </option>
                            ))}
                        </select>
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
                            placeholder="Nombre de la sección"
                            required
                            disabled={loading}
                        />
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
                            placeholder="Descripción de la sección"
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

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                            {loading ? 'Guardando...' : (seccion ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};