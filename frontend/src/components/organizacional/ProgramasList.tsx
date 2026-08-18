import React, { useState, useEffect } from 'react';
import { Programa, ProgramaFormData } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';

export const ProgramasList: React.FC = () => {
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPrograma, setEditingPrograma] = useState<Programa | null>(null);

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

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este programa?')) {
            try {
                await organizacionalService.deletePrograma(id);
                await fetchProgramas();
            } catch (error) {
                console.error('Error deleting programa:', error);
                alert('Error al eliminar el programa');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-[#19499C]">Cargando programas...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con estilo de la app */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="h-1 w-8 rounded-full bg-[#FFCD05]" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#19499C]">
                        Organizacional
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-[#19499C]">Programas</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Gestión de programas institucionales
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPrograma(null);
                            setShowModal(true);
                        }}
                        className="bg-[#19499C] text-white px-4 py-2 rounded-lg hover:bg-[#19499C]/90 transition-colors shadow-sm"
                    >
                        Nuevo Programa
                    </button>
                </div>
            </div>

            {/* Tabla con estilo de la app */}
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
                                    Descripción
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
                            {programas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No hay programas registrados
                                    </td>
                                </tr>
                            ) : (
                                programas.map((programa) => (
                                    <tr key={programa.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#19499C]">
                                            {programa.codigo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {programa.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {programa.descripcion || 'Sin descripción'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                programa.estado 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {programa.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setEditingPrograma(programa);
                                                    setShowModal(true);
                                                }}
                                                className="text-[#19499C] hover:text-[#19499C]/80 mr-4"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(programa.id)}
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

// Componente Modal para Programa
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
            } else {
                await organizacionalService.createPrograma(formData);
            }
            onSave();
        } catch (error) {
            console.error('Error saving programa:', error);
            alert('Error al guardar el programa');
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
                            {programa ? 'Editar Programa' : 'Nuevo Programa'}
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
                            Código <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#19499C] focus:border-transparent"
                            placeholder="Ej: PRG-001"
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
                            placeholder="Nombre del programa"
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
                            placeholder="Descripción del programa"
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
                            {loading ? 'Guardando...' : (programa ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};