import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Reglas de Negocio de Memorias de Cálculo (MCs)', () => {
  test('Pestañas visibles para SuperAdmin deben ser exactamente 5', () => {
    const isSuperuser = true;
    const isPlanificador = false;
    const isAprobador = true; // SuperAdmin has aprobador-level privileges
    const isGerente = false;
    const isElaborador = false;
    const isTrabajador = false;

    const tabs: string[] = ['todas'];

    if (isElaborador || isTrabajador || isGerente || isSuperuser) {
      tabs.push('borrador');
    }

    if (isTrabajador || isElaborador || isGerente || isSuperuser) {
      tabs.push('espera');
    }

    // Excluido para SuperAdmin: consolidado en 'espera'
    if (isPlanificador && !isSuperuser) {
      tabs.push('planificacion');
    }

    // Excluido para SuperAdmin: consolidado en 'espera'
    if (isAprobador && !isSuperuser) {
      tabs.push('finanzas');
    }

    tabs.push('aprobadas');
    tabs.push('rechazadas');

    assert.equal(tabs.length, 5, 'SuperAdmin debe tener exactamente 5 opciones en MCs');
    assert.deepEqual(tabs, ['todas', 'borrador', 'espera', 'aprobadas', 'rechazadas']);
  });

  test('Pestañas visibles para Planificador (no superuser)', () => {
    const isSuperuser = false;
    const isPlanificador = true;
    const isAprobador = false;
    const isGerente = false;
    const isElaborador = false;
    const isTrabajador = false;

    const tabs: string[] = ['todas'];

    if (isElaborador || isTrabajador || isGerente || isSuperuser) {
      tabs.push('borrador');
    }

    if (isTrabajador || isElaborador || isGerente || isSuperuser) {
      tabs.push('espera');
    }

    if (isPlanificador && !isSuperuser) {
      tabs.push('planificacion');
    }

    if (isAprobador && !isSuperuser) {
      tabs.push('finanzas');
    }

    tabs.push('aprobadas');
    tabs.push('rechazadas');

    assert.ok(tabs.includes('planificacion'));
    assert.ok(!tabs.includes('finanzas'));
  });

  test('Pestañas visibles para Aprobador/Finanzas (no superuser)', () => {
    const isSuperuser = false;
    const isPlanificador = false;
    const isAprobador = true;
    const isGerente = false;
    const isElaborador = false;
    const isTrabajador = false;

    const tabs: string[] = ['todas'];

    if (isElaborador || isTrabajador || isGerente || isSuperuser) {
      tabs.push('borrador');
    }

    if (isTrabajador || isElaborador || isGerente || isSuperuser) {
      tabs.push('espera');
    }

    if (isPlanificador && !isSuperuser) {
      tabs.push('planificacion');
    }

    if (isAprobador && !isSuperuser) {
      tabs.push('finanzas');
    }

    tabs.push('aprobadas');
    tabs.push('rechazadas');

    assert.ok(tabs.includes('finanzas'));
    assert.ok(!tabs.includes('planificacion'));
  });

  test('Autorización para enviar borradores masivos (Elaborador, Gerente y SuperAdmin)', () => {
    const canEnviar = (rol: string, isSuperuser: boolean) => {
      const isGerente = !isSuperuser && rol === 'GERENTE';
      const isElaborador = !isSuperuser && rol === 'ELABORADOR';
      return isSuperuser || isGerente || isElaborador;
    };

    assert.equal(canEnviar('SUPERADMIN', true), true, 'SuperAdmin está autorizado');
    assert.equal(canEnviar('GERENTE', false), true, 'Gerente está autorizado');
    assert.equal(canEnviar('ELABORADOR', false), true, 'Elaborador está autorizado');
    assert.equal(canEnviar('PLANIFICACION', false), false, 'Planificador no está autorizado a enviar borradores');
    assert.equal(canEnviar('APROBADOR', false), false, 'Aprobador regular no está autorizado a enviar borradores');
  });

  test('La pestaña "En Espera" para SuperAdmin consolida todas las revisiones en curso', () => {
    const mockMemorias = [
      { id: 1, codigo: 'MEM-01', estado: 'BORRADOR' },
      { id: 2, codigo: 'MEM-02', estado: 'PENDIENTE_GERENCIA' },
      { id: 3, codigo: 'MEM-03', estado: 'PENDIENTE_PLANIFICACION' },
      { id: 4, codigo: 'MEM-04', estado: 'APROBADO_GERENCIA' },
      { id: 5, codigo: 'MEM-05', estado: 'APROBADO_PLANIFICACION' },
      { id: 6, codigo: 'MEM-06', estado: 'APROBADO_FINANZAS' },
      { id: 7, codigo: 'MEM-07', estado: 'RECHAZADO' },
    ];

    const isSuperuser = true;
    const isGerente = false;

    const filtrarEspera = (m: (typeof mockMemorias)[0]) => {
      if (isGerente && !isSuperuser) {
        return m.estado === 'PENDIENTE_GERENCIA';
      }
      return ['PENDIENTE_GERENCIA', 'PENDIENTE_PLANIFICACION', 'APROBADO_GERENCIA', 'APROBADO_PLANIFICACION'].includes(
        m.estado
      );
    };

    const memoriasEnEspera = mockMemorias.filter(filtrarEspera);

    assert.equal(memoriasEnEspera.length, 4, 'Debe incluir las 4 memorias en revisión');
    assert.deepEqual(
      memoriasEnEspera.map((m) => m.codigo),
      ['MEM-02', 'MEM-03', 'MEM-04', 'MEM-05']
    );
  });
});
