import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Reglas de Negocio - Flujo de Certificaciones POA', () => {
  it('Validación estricta de Hoja de Ruta / CITE obligatoria', () => {
    const validarSolicitud = (datos: { hoja_ruta?: string; monto?: number }) => {
      if (!datos.hoja_ruta || !datos.hoja_ruta.trim()) {
        return { valid: false, error: 'La Hoja de Ruta / CITE es obligatoria.' };
      }
      if (!datos.monto || datos.monto <= 0) {
        return { valid: false, error: 'El monto solicitado debe ser mayor a 0.' };
      }
      return { valid: true };
    };

    assert.equal(validarSolicitud({ hoja_ruta: '', monto: 5000 }).valid, false);
    assert.equal(validarSolicitud({ hoja_ruta: '   ', monto: 5000 }).valid, false);
    assert.equal(validarSolicitud({ hoja_ruta: 'HR-2026-001', monto: 0 }).valid, false);
    assert.equal(validarSolicitud({ hoja_ruta: 'HR-2026-001', monto: 12500 }).valid, true);
  });

  it('Ruta institucional según si Pertenece a Contrataciones (es_contratacion)', () => {
    const determinarSiguienteEstado = (esContratacion: boolean) => {
      // Si es contratación, debe pasar a Planificación para certificación POA previa
      if (esContratacion) {
        return 'PENDIENTE_PLANIFICACION';
      }
      // Si NO es contratación (gasto directo), va directo a Presupuestos para visto bueno financiero
      return 'PENDIENTE_PRESUPUESTOS';
    };

    assert.equal(determinarSiguienteEstado(true), 'PENDIENTE_PLANIFICACION');
    assert.equal(determinarSiguienteEstado(false), 'PENDIENTE_PRESUPUESTOS');
  });

  it('Validación de saldo disponible en la Memoria de Cálculo', () => {
    const verificarSolvencia = (saldoDisponible: number, montoSolicitado: number) => {
      const saldoRestante = saldoDisponible - montoSolicitado;
      const esValido = saldoRestante >= 0 && montoSolicitado > 0;
      return {
        esValido,
        saldoRestante: Math.max(0, saldoRestante),
      };
    };

    const casoSuficiente = verificarSolvencia(50000, 15000);
    assert.equal(casoSuficiente.esValido, true);
    assert.equal(casoSuficiente.saldoRestante, 35000);

    const casoInsuficiente = verificarSolvencia(10000, 12000);
    assert.equal(casoInsuficiente.esValido, false);
  });

  it('Permisos de roles institucionales: Elaboradores y Trabajadores en modo solo lectura', () => {
    const getPermisosUsuario = (rol: string, isSuperuser: boolean) => {
      const isSuperAdmin = isSuperuser || rol === 'ADMINISTRADOR';
      const isPlanificador = isSuperAdmin || rol.includes('PLANIFIC');
      const isPresupuestos = isSuperAdmin || rol.includes('APROBAD') || rol.includes('PRESUPUEST');
      const isGerente = rol === 'GERENTE';
      const isReadOnly = !isSuperAdmin && !isPlanificador && !isPresupuestos && !isGerente;

      return {
        canCreate: isSuperAdmin || isGerente,
        canCertify: isSuperAdmin || isPlanificador,
        canApprovePresupuestos: isSuperAdmin || isPresupuestos,
        isReadOnly,
      };
    };

    // Elaborador
    const elab = getPermisosUsuario('ELABORADOR', false);
    assert.equal(elab.canCreate, false);
    assert.equal(elab.canCertify, false);
    assert.equal(elab.isReadOnly, true);

    // Trabajador
    const trab = getPermisosUsuario('TRABAJADOR', false);
    assert.equal(trab.canCreate, false);
    assert.equal(trab.isReadOnly, true);

    // Gerente
    const ger = getPermisosUsuario('GERENTE', false);
    assert.equal(ger.canCreate, true);
    assert.equal(ger.canCertify, false);
    assert.equal(ger.isReadOnly, false);

    // Planificador
    const plan = getPermisosUsuario('PLANIFICADOR', false);
    assert.equal(plan.canCreate, false);
    assert.equal(plan.canCertify, true);
    assert.equal(plan.isReadOnly, false);

    // Presupuestos / Aprobador
    const presup = getPermisosUsuario('APROBADOR', false);
    assert.equal(presup.canApprovePresupuestos, true);
    assert.equal(presup.isReadOnly, false);

    // SuperAdmin
    const admin = getPermisosUsuario('ADMINISTRADOR', true);
    assert.equal(admin.canCreate, true);
    assert.equal(admin.canCertify, true);
    assert.equal(admin.canApprovePresupuestos, true);
    assert.equal(admin.isReadOnly, false);
  });

  it('Generación y estructura de los 2 códigos oficiales (Global Planificación y Por Gerencia)', () => {
    const generarCodigos = (correlativoGlobal: number, correlativoArea: number, codigoArea: string, anio: number) => {
      const anio2Dig = String(anio).slice(-2);
      const codigoGlobal = `UPLANIF.EPTAM.CP. Nº ${String(correlativoGlobal).padStart(3, '0')}/${anio}`;
      const codigoAreaOficio = `${codigoArea}.EPTAM. STRÍA Nº ${String(correlativoArea).padStart(3, '0')}/${anio2Dig}`;
      return { codigoGlobal, codigoAreaOficio };
    };

    const res = generarCodigos(1, 1, 'GCIA.INF', 2026);
    assert.equal(res.codigoGlobal, 'UPLANIF.EPTAM.CP. Nº 001/2026');
    assert.equal(res.codigoAreaOficio, 'GCIA.INF.EPTAM. STRÍA Nº 001/26');

    const res2 = generarCodigos(5, 3, 'GCIA.OPS', 2026);
    assert.equal(res2.codigoGlobal, 'UPLANIF.EPTAM.CP. Nº 005/2026');
    assert.equal(res2.codigoAreaOficio, 'GCIA.OPS.EPTAM. STRÍA Nº 003/26');
  });

  it('Derivación de jerarquía institucional a partir de las Operaciones POA seleccionadas', () => {
    const derivarJerarquia = (operaciones: Array<{
      id: number;
      codigo: string;
      acp_codigo?: string;
      amp_codigo?: string;
      programa_codigo?: string;
    }>) => {
      const amps = new Set<string>();
      const acps = new Set<string>();
      const progs = new Set<string>();

      operaciones.forEach((op) => {
        if (op.amp_codigo) amps.add(op.amp_codigo);
        if (op.acp_codigo) acps.add(op.acp_codigo);
        if (op.programa_codigo) progs.add(op.programa_codigo);
      });

      return {
        amps: Array.from(amps),
        acps: Array.from(acps),
        programas: Array.from(progs),
      };
    };

    const ops = [
      { id: 1, codigo: 'OP-01', acp_codigo: 'ACP-01.1', amp_codigo: 'AMP-01', programa_codigo: 'PROG-01' },
      { id: 2, codigo: 'OP-02', acp_codigo: 'ACP-01.1', amp_codigo: 'AMP-01', programa_codigo: 'PROG-01' },
      { id: 3, codigo: 'OP-03', acp_codigo: 'ACP-02.3', amp_codigo: 'AMP-02', programa_codigo: 'PROG-02' },
    ];

    const jerarquia = derivarJerarquia(ops);
    assert.equal(jerarquia.acps.length, 2);
    assert.equal(jerarquia.amps.length, 2);
    assert.equal(jerarquia.programas.length, 2);
    assert.deepEqual(jerarquia.acps, ['ACP-01.1', 'ACP-02.3']);
  });
});
