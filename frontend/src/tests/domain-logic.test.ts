import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Reglas de Negocio Presupuestario - POA', () => {
  test('Cálculo de Monto Vigente: Monto Inicial + Modificaciones Netas', () => {
    const montoInicial = 50000.0;
    const traspasoEntrante = 10000.0;
    const traspasoSaliente = 5000.0;
    const modificacionesNetas = traspasoEntrante - traspasoSaliente;
    const montoVigente = montoInicial + modificacionesNetas;

    assert.equal(montoVigente, 55000.0);
  });

  test('Cálculo de Monto Disponible: Monto Vigente - Monto Comprometido', () => {
    const montoVigente = 55000.0;
    const montoComprometido = 20000.0;
    const montoDisponible = montoVigente - montoComprometido;

    assert.equal(montoDisponible, 35000.0);
  });

  test('Validación de Disponibilidad: No permitir gasto si monto excede disponible', () => {
    const montoDisponible = 5000.0;
    const montoRequerido = 6500.0;
    const esValido = montoRequerido <= montoDisponible;

    assert.equal(esValido, false);
  });

  test('Formato de Moneda BOB (Bolivianos)', () => {
    const formatMoney = (val: number) =>
      new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2 })
        .format(val)
        .replace(/\u00a0/g, ' ');

    const formatted = formatMoney(12500.5);
    assert.match(formatted, /12\.500,50/);
  });

  test('Validación de Traspaso Intra-Área: No permitir traspaso entre diferentes áreas', () => {
    const areaOrigenId = 1; // GAA
    const areaDestinoMismaAreaId = 1; // GAA
    const areaDestinoDistintaAreaId = 2; // GO

    const esValidoMismaArea = areaOrigenId === areaDestinoMismaAreaId;
    const esValidoDistintaArea = areaOrigenId === areaDestinoDistintaAreaId;

    assert.equal(esValidoMismaArea, true);
    assert.equal(esValidoDistintaArea, false);
  });
});
