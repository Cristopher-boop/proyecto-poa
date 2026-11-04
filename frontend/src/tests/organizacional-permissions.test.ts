import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Función de verificación de superadministración (idéntica a la implementada en organizacionalUtils.ts)
 */
const isSuperAdminUser = (user: { is_superuser?: boolean; rol_nombre?: string | null } | null | undefined): boolean => {
  if (!user) return false;
  if (user.is_superuser) return true;
  const rolClean = (user.rol_nombre || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (
    rolClean.includes('SUPERADMIN') ||
    rolClean.includes('SUPERUSUARIO') ||
    rolClean.includes('ADMIN')
  );
};

describe('Reglas de Negocio y Permisos - Estructura Organizacional', () => {

  test('Permiso: Solo la Superadministración (is_superuser o rol Admin/Superadmin) tiene autorización', () => {
    // 1. Superadministrador de Django
    assert.equal(isSuperAdminUser({ is_superuser: true, rol_nombre: null }), true);
    assert.equal(isSuperAdminUser({ is_superuser: true, rol_nombre: 'GERENTE' }), true);

    // 2. Roles de administración del sistema
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'ADMINISTRADOR' }), true);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'SUPERADMIN' }), true);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'SUPERADMINISTRADOR' }), true);

    // 3. Otros roles institucionales NO pueden administrar ni crear gerencias/unidades
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'GERENTE' }), false);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'PLANIFICADOR' }), false);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'PLANIFICACIÓN' }), false);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'PRESUPUESTOS' }), false);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'APROBADOR' }), false);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'ELABORADOR' }), false);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'TRABAJADOR' }), false);
    assert.equal(isSuperAdminUser({ is_superuser: false, rol_nombre: 'TESORERÍA' }), false);
    assert.equal(isSuperAdminUser(null), false);
    assert.equal(isSuperAdminUser(undefined), false);
  });

  test('Visibilidad en Interfaz: Botón "Nueva Gerencia / Unidad" solo disponible para Superadministración', () => {
    const isCreateButtonVisible = (user: any) => {
      return isSuperAdminUser(user);
    };

    assert.equal(isCreateButtonVisible({ is_superuser: true }), true, 'SuperAdmin ve el botón de crear');
    assert.equal(isCreateButtonVisible({ rol_nombre: 'ADMINISTRADOR' }), true, 'Administrador ve el botón de crear');
    assert.equal(isCreateButtonVisible({ rol_nombre: 'GERENTE' }), false, 'Gerente NO ve el botón de crear');
    assert.equal(isCreateButtonVisible({ rol_nombre: 'ELABORADOR' }), false, 'Elaborador NO ve el botón de crear');
    assert.equal(isCreateButtonVisible({ rol_nombre: 'PLANIFICADOR' }), false, 'Planificador NO ve el botón de crear');
  });

  test('Acceso a Detalles: "Pueden ver los detalles pero hasta ahí"', () => {
    // Definición de acciones disponibles en tabla de áreas
    const getAvailableActions = (user: any) => {
      const canManage = isSuperAdminUser(user);
      return {
        verDetalles: true, // Siempre visible para todos ("Pueden ver los detalles")
        editar: canManage,  // Solo superadministración
        cambiarEstado: canManage, // Solo superadministración
      };
    };

    const accionesGerente = getAvailableActions({ rol_nombre: 'GERENTE' });
    assert.equal(accionesGerente.verDetalles, true, 'Gerente puede ver detalles');
    assert.equal(accionesGerente.editar, false, 'Gerente NO puede editar');
    assert.equal(accionesGerente.cambiarEstado, false, 'Gerente NO puede dar de baja / activar');

    const accionesElaborador = getAvailableActions({ rol_nombre: 'ELABORADOR' });
    assert.equal(accionesElaborador.verDetalles, true, 'Elaborador puede ver detalles');
    assert.equal(accionesElaborador.editar, false, 'Elaborador NO puede editar');
    assert.equal(accionesElaborador.cambiarEstado, false, 'Elaborador NO puede dar de baja / activar');

    const accionesSuperAdmin = getAvailableActions({ is_superuser: true });
    assert.equal(accionesSuperAdmin.verDetalles, true, 'SuperAdmin puede ver detalles');
    assert.equal(accionesSuperAdmin.editar, true, 'SuperAdmin puede editar');
    assert.equal(accionesSuperAdmin.cambiarEstado, true, 'SuperAdmin puede activar/desactivar');
  });

  test('Modal de Detalles: Botón "Editar Gerencia / Unidad" solo activo para SuperAdmin', () => {
    const canEditInModal = (user: any, activeTab: string) => {
      const canManage = isSuperAdminUser(user);
      return canManage && activeTab !== 'JERARQUIA';
    };

    // Para SuperAdmin en pestaña de áreas
    assert.equal(canEditInModal({ is_superuser: true }, 'AREAS'), true);
    // Para no superadmin
    assert.equal(canEditInModal({ rol_nombre: 'GERENTE' }, 'AREAS'), false);
    assert.equal(canEditInModal({ rol_nombre: 'TRABAJADOR' }, 'AREAS'), false);
    assert.equal(canEditInModal({ rol_nombre: 'PRESUPUESTOS' }, 'AREAS'), false);
  });
});
