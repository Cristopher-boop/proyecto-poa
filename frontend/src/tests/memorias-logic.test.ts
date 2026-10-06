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

  test('Formulación Masiva Excel: Cálculo matemático de totales por hoja y libro', () => {
    const mockSheets = [
      {
        idOrigen: 1,
        codigoOrigen: 'MEM-2026-001',
        detalles: [
          { descripcion: 'Papelería y útiles de oficina', cantidad: 10, precio_unitario: 25.5 },
          { descripcion: 'Tóner para impresoras', cantidad: 4, precio_unitario: 350 },
        ],
      },
      {
        idOrigen: 2,
        codigoOrigen: 'MEM-2026-002',
        detalles: [
          { descripcion: 'Licencias de software', cantidad: 5, precio_unitario: 1200 },
        ],
      },
    ];

    // Total Hoja 1: (10 * 25.50) + (4 * 350) = 255 + 1400 = 1655
    const totalHoja1 = mockSheets[0].detalles.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0);
    assert.equal(totalHoja1, 1655, 'Total de la Hoja 1 debe ser 1655 Bs.');

    // Total Hoja 2: 5 * 1200 = 6000
    const totalHoja2 = mockSheets[1].detalles.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0);
    assert.equal(totalHoja2, 6000, 'Total de la Hoja 2 debe ser 6000 Bs.');

    // Total Libro: 1655 + 6000 = 7655
    const totalLibro = mockSheets.reduce((accSheet, sh) => {
      const tot = sh.detalles.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0);
      return accSheet + tot;
    }, 0);
    assert.equal(totalLibro, 7655, 'Total del Libro debe ser 7655 Bs.');
  });

  test('Formulación Masiva Excel: Ajuste porcentual de precios (+5% inflación)', () => {
    const renglon = { descripcion: 'Servicio de mantenimiento', cantidad: 2, precio_unitario: 1000 };
    const porcentaje = 5; // +5%
    const factor = 1 + porcentaje / 100;
    const precioAjustado = Math.round(renglon.precio_unitario * factor * 100) / 100;

    assert.equal(precioAjustado, 1050, 'El precio ajustado con +5% debe ser 1050 Bs.');
    const subtotalAjustado = renglon.cantidad * precioAjustado;
    assert.equal(subtotalAjustado, 2100, 'Subtotal ajustado debe ser 2100 Bs.');
  });

  test('Formulación Masiva Excel: Estado inicial al duplicar debe ser siempre BORRADOR', () => {
    const memoriaOriginal = { id: 10, codigo: 'MEM-2026-015', estado: 'APROBADO_FINANZAS' };
    const duplicar = (mem: typeof memoriaOriginal, anioDestino: number, correlativo: number) => ({
      codigo: `MEM-${anioDestino}-${String(correlativo).padStart(3, '0')}`,
      estado: 'BORRADOR',
      origen_id: mem.id,
    });

    const clonada = duplicar(memoriaOriginal, 2027, 1);
    assert.equal(clonada.estado, 'BORRADOR', 'Toda memoria duplicada debe nacer en BORRADOR');
    assert.equal(clonada.codigo, 'MEM-2027-001');
    assert.equal(clonada.origen_id, 10);
  });

  test('Ordenamiento Natural Correlativo: MCs ordenadas de 1 a N ascendentemente', () => {
    const rawList = [
      { id: 3, codigo: 'MEM-2026-010', total_presupuesto: '500' },
      { id: 1, codigo: 'MEM-2026-001', total_presupuesto: '1500' },
      { id: 2, codigo: 'MEM-2026-002', total_presupuesto: '200' },
      { id: 4, codigo: 'MEM-2026-003', total_presupuesto: '3000' },
    ];

    const sortedByCodigo = [...rawList].sort((a, b) => {
      return a.codigo.localeCompare(b.codigo, undefined, { numeric: true, sensitivity: 'base' }) || (a.id - b.id);
    });

    assert.deepEqual(
      sortedByCodigo.map(m => m.codigo),
      ['MEM-2026-001', 'MEM-2026-002', 'MEM-2026-003', 'MEM-2026-010'],
      'Las memorias deben estar ordenadas correlativamente 1 a N'
    );
  });
});

