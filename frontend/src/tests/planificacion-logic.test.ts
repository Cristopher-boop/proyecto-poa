import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Reglas de Negocio y Formato Visual - Módulo de Planificación', () => {

  test('Permisos: Solo SuperAdmin y Planificación pueden crear o modificar ACP y AMP', () => {
    const checkCanManageAmpOrAcp = (user: { is_superuser?: boolean; rol_nombre?: string }) => {
      const rolClean = (user.rol_nombre || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const isSuperadmin = Boolean(user.is_superuser) || rolClean.includes('ADMIN');
      const isPlanificador = rolClean.includes('PLANIFIC');
      return isSuperadmin || isPlanificador;
    };

    // SuperAdmin
    assert.equal(checkCanManageAmpOrAcp({ is_superuser: true }), true);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'ADMINISTRADOR' }), true);

    // Planificación (con o sin tilde)
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'PLANIFICACIÓN' }), true);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'PLANIFICACION' }), true);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'PLANIFICADOR' }), true);

    // Otros roles NO pueden modificar AMP ni ACP
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'PRESUPUESTOS' }), false);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'APROBADOR' }), false);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'GERENTE' }), false);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'ELABORADOR' }), false);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'TRABAJADOR' }), false);
    assert.equal(checkCanManageAmpOrAcp({ rol_nombre: 'TESORERÍA' }), false);
  });

  test('Permisos: Gerencias pueden duplicar/replicar sus operaciones de área', () => {
    const checkCanReplicate = (user: { is_superuser?: boolean; rol_nombre?: string }) => {
      const rolClean = (user.rol_nombre || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const isSuperadmin = Boolean(user.is_superuser) || rolClean.includes('ADMIN');
      const isPlanificador = rolClean.includes('PLANIFIC');
      const isGerente = rolClean.includes('GERENT');
      return isSuperadmin || isPlanificador || isGerente;
    };

    assert.equal(checkCanReplicate({ rol_nombre: 'GERENTE' }), true);
    assert.equal(checkCanReplicate({ rol_nombre: 'PLANIFICACIÓN' }), true);
    assert.equal(checkCanReplicate({ is_superuser: true }), true);

    assert.equal(checkCanReplicate({ rol_nombre: 'ELABORADOR' }), false);
    assert.equal(checkCanReplicate({ rol_nombre: 'TRABAJADOR' }), false);
  });

  test('Formato de Código AMP: se mantiene hasta AMP-P{num} sin sufijo -01', () => {
    const formatAmpCode = (rawProgCode: string) => {
      const cleanNum = rawProgCode.replace(/[^0-9]/g, '') || rawProgCode;
      return `AMP-P${cleanNum}`;
    };

    assert.equal(formatAmpCode('1'), 'AMP-P1');
    assert.equal(formatAmpCode('2'), 'AMP-P2');
    assert.equal(formatAmpCode('210'), 'AMP-P210');
    assert.equal(formatAmpCode('410'), 'AMP-P410');
  });

  test('Formato de Código ACP: MANTIENE la gestión anual (ACP-P{num}-{gestion})', () => {
    const formatAcpCode = (rawProgCode: string, anio: number | string = 2026) => {
      const cleanNum = rawProgCode.replace(/[^0-9]/g, '') || rawProgCode;
      return `ACP-P${cleanNum}-${anio}`;
    };

    assert.equal(formatAcpCode('1', 2026), 'ACP-P1-2026');
    assert.equal(formatAcpCode('2', 2026), 'ACP-P2-2026');
    assert.equal(formatAcpCode('210', 2026), 'ACP-P210-2026');
    assert.equal(formatAcpCode('410', 2026), 'ACP-P410-2026');
    assert.equal(formatAcpCode('1', 2027), 'ACP-P1-2027');
  });

  test('Formato de Nombre de Programa en AMP: debe ser exactamente "Programa {num}"', () => {
    const formatProgramLabel = (progCodigo?: string) => {
      const progNum = progCodigo?.replace(/^P-?/i, '') || '1';
      return `Programa ${progNum}`;
    };

    assert.equal(formatProgramLabel('1'), 'Programa 1');
    assert.equal(formatProgramLabel('2'), 'Programa 2');
    assert.equal(formatProgramLabel('210'), 'Programa 210');
    assert.equal(formatProgramLabel('410'), 'Programa 410');
    assert.equal(formatProgramLabel('P-210'), 'Programa 210');
  });

  test('Replicación de Operación a nuevo año: reemplaza el año y valida ACP del próximo año', () => {
    const replicateOpCode = (baseCode: string, baseYear: number, nextYear: number) => {
      const replaced = baseCode.replace(String(baseYear), String(nextYear));
      return replaced === baseCode ? `${baseCode}-${nextYear}` : replaced;
    };

    assert.equal(replicateOpCode('OP-AE-2026-01', 2026, 2027), 'OP-AE-2027-01');
    assert.equal(replicateOpCode('OP-PL-2026-01', 2026, 2027), 'OP-PL-2027-01');
    assert.equal(replicateOpCode('OP-AI-2026-02', 2026, 2027), 'OP-AI-2027-02');
  });
});
