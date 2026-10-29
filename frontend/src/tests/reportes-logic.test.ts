import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Reglas de Reportería Institucional POA - Permisos y Alcance', () => {
  // Helper de verificación de acceso a reportes según rol
  const evalAccess = (rol: string, isSuperuser = false) => {
    const rolClean = rol.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isAdmin = isSuperuser || rolClean.includes('ADMIN');
    const isPlanificador = rolClean.includes('PLANIF');
    const isPresupuestos =
      rolClean.includes('PRESUP') || rolClean.includes('APROB') || rolClean.includes('FINAN');
    const isTesoreria = rolClean.includes('TESOR');
    const isGerente =
      rolClean.includes('GERENT') || rolClean.includes('DIRECT') || rolClean.includes('JEFE');
    const isElaborador = rolClean.includes('ELABORAD');
    const isTrabajador = rolClean.includes('TRABAJAD');

    const canAccessReports =
      (isAdmin || isPlanificador || isPresupuestos || isTesoreria || isGerente) &&
      !isElaborador &&
      !isTrabajador;

    const isGlobalRole = isAdmin || isPlanificador || isPresupuestos || isTesoreria;

    return { canAccessReports, isGlobalRole, isGerente };
  };

  test('Elaborador y Trabajador NO tienen permiso para acceder a Reportes', () => {
    const elaborador = evalAccess('ELABORADOR');
    const trabajador = evalAccess('TRABAJADOR');

    assert.equal(elaborador.canAccessReports, false);
    assert.equal(trabajador.canAccessReports, false);
  });

  test('Gerente de Área tiene acceso a reportes con alcance enfocado', () => {
    const gerente = evalAccess('GERENTE');
    const jefe = evalAccess('JEFE DE ÁREA');

    assert.equal(gerente.canAccessReports, true);
    assert.equal(gerente.isGlobalRole, false);
    assert.equal(gerente.isGerente, true);

    assert.equal(jefe.canAccessReports, true);
    assert.equal(jefe.isGlobalRole, false);
  });

  test('Roles Globales (Admin, Planificador, Presupuestos, Tesorería) tienen acceso institucional completo', () => {
    const admin = evalAccess('ADMINISTRADOR');
    const planif = evalAccess('PLANIFICADOR');
    const presup = evalAccess('PRESUPUESTOS');
    const tesor = evalAccess('TESORERÍA');

    assert.equal(admin.canAccessReports, true);
    assert.equal(admin.isGlobalRole, true);

    assert.equal(planif.canAccessReports, true);
    assert.equal(planif.isGlobalRole, true);

    assert.equal(presup.canAccessReports, true);
    assert.equal(presup.isGlobalRole, true);

    assert.equal(tesor.canAccessReports, true);
    assert.equal(tesor.isGlobalRole, true);
  });

  test('Superusuario de sistema siempre tiene acceso completo a reportes', () => {
    const superuser = evalAccess('', true);
    assert.equal(superuser.canAccessReports, true);
    assert.equal(superuser.isGlobalRole, true);
  });
});

describe('Reglas de Negocio - Cálculos de Reportería POA', () => {
  test('Consolidado Presupuestario: Cálculo correcto de Saldo Disponible y Porcentaje de Ejecución', () => {
    const montoInicial = 100000.0;
    const montoEjecutado = 45000.0;
    const saldoDisponible = montoInicial - montoEjecutado;
    const porcentajeEjecucion = Math.round((montoEjecutado / montoInicial) * 10000) / 100;

    assert.equal(saldoDisponible, 55000.0);
    assert.equal(porcentajeEjecucion, 45.0);
  });

  test('Semáforo de Ejecución Financiera: Categorización óptima, moderada y crítica', () => {
    const categorizarSemaforo = (pct: number): 'optimo' | 'moderado' | 'critico' => {
      if (pct >= 70) return 'optimo';
      if (pct >= 40) return 'moderado';
      return 'critico';
    };

    assert.equal(categorizarSemaforo(85.5), 'optimo');
    assert.equal(categorizarSemaforo(70.0), 'optimo');
    assert.equal(categorizarSemaforo(55.2), 'moderado');
    assert.equal(categorizarSemaforo(40.0), 'moderado');
    assert.equal(categorizarSemaforo(32.4), 'critico');
    assert.equal(categorizarSemaforo(0.0), 'critico');
  });

  test('Filtro de Requerimientos PAC: Aísla exclusivamente ítems de compra y contrataciones', () => {
    const items = [
      { id: 1, descripcion: 'Servicio de Internet y Fibra Óptica', esContratacion: true },
      { id: 2, descripcion: 'Hojas de Papel Bond carta', esContratacion: false },
      { id: 3, descripcion: 'Adquisición de Servidores de Rack', esContratacion: true },
      { id: 4, descripcion: 'Pasajes y Viáticos comisión La Paz', esContratacion: false },
    ];

    const pacItems = items.filter((i) => i.esContratacion);
    assert.equal(pacItems.length, 2);
    assert.equal(pacItems[0].descripcion, 'Servicio de Internet y Fibra Óptica');
    assert.equal(pacItems[1].descripcion, 'Adquisición de Servidores de Rack');
  });
});
