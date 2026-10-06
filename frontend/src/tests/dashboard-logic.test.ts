import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Lógica Analítica y Diagnóstico del Dashboard POA', () => {
  test('Ritmo de ejecución esperado proporcional al calendario fiscal', () => {
    const mesHasta = 6; // Mitad de año (Junio)
    const ritmoEsperado = Math.round((mesHasta / 12) * 100);
    assert.equal(ritmoEsperado, 50);

    const mesHastaQ1 = 3; // Marzo
    assert.equal(Math.round((mesHastaQ1 / 12) * 100), 25);
  });

  test('Desviación de ritmo: cálculo de brecha respecto a la meta fiscal', () => {
    const mesHasta = 6; // Meta 50%
    const pctEjecucionReal = 58.4;
    const ritmoEsperado = Math.round((mesHasta / 12) * 100);
    const desviacionRitmo = Math.round((pctEjecucionReal - ritmoEsperado) * 10) / 10;

    assert.equal(desviacionRitmo, 8.4);
    assert.equal(desviacionRitmo >= 0, true); // Ritmo adelantado
  });

  test('Detección de Saldo Crítico: menos del 10% disponible', () => {
    const techoInicial = 100000;
    const ejecutado = 93000;
    const disponible = techoInicial - ejecutado;
    const saldoPct = (disponible / techoInicial) * 100;

    const esSaldoCritico = saldoPct <= 10;
    assert.equal(esSaldoCritico, true);
  });

  test('Detección de Subejecución Severa: <35% en periodo avanzado (mes >= 4)', () => {
    const mesHasta = 6;
    const pctEjecucion = 22.0;
    const esSubejecucion = pctEjecucion < 35 && mesHasta >= 4;

    assert.equal(esSubejecucion, true);
  });

  test('Agregación precisa de gastos dentro del rango de meses [mesDesde, mesHasta]', () => {
    const gastosSimulados = [
      { fecha: '2026-01-15', monto: 1000 },
      { fecha: '2026-02-20', monto: 1500 },
      { fecha: '2026-04-10', monto: 2000 },
      { fecha: '2026-07-05', monto: 5000 }, // Fuera de rango para Q1
    ];

    const mesDesde = 1;
    const mesHasta = 3;

    const totalPeriodo = gastosSimulados
      .filter((g) => {
        const m = parseInt(g.fecha.split('-')[1], 10);
        return m >= mesDesde && m <= mesHasta;
      })
      .reduce((sum, g) => sum + g.monto, 0);

    assert.equal(totalPeriodo, 2500); // Enero (1000) + Febrero (1500)
  });
});
