// frontend/src/components/organizacional/UsuariosList.tsx
import React, { useState, useEffect } from 'react';
import { Usuario, Seccion, Rol } from '../../types/organizacional';
import { organizacionalService } from '../../services/organizacionalService';

export const UsuariosList: React.FC = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usuariosRes, seccionesRes, rolesRes] = await Promise.all([
                organizacionalService.getUsuarios(),
                organizacionalService.getSecciones(),
                organizacionalService.getRoles()
            ]);
            setUsuarios(usuariosRes.data);
            setSecciones(seccionesRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Implementar UsuarioForm similar a los anteriores
    // ...

    if (loading) return <div>Cargando usuarios...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Usuarios</h2>
                <button
                    onClick={() => {
                        setEditingUsuario(null);
                        setShowModal(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Nuevo Usuario
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cargo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sección
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {usuarios.map((usuario) => (
                            <tr key={usuario.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {usuario.first_name} {usuario.last_name}
                                </td>
                                <td className="px-6 py-4">{usuario.email}</td>
                                <td className="px-6 py-4">{usuario.cargo}</td>
                                <td className="px-6 py-4">{usuario.seccion_nombre}</td>
                                <td className="px-6 py-4">{usuario.rol_nombre}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${usuario.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {usuario.estado ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => {
                                            setEditingUsuario(usuario);
                                            setShowModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('¿Está seguro?')) {
                                                await organizacionalService.deleteUsuario(usuario.id);
                                                fetchData();
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};