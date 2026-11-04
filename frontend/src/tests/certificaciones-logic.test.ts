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

  it('Cotejo de Planificación: Sugerencia de Partida Presupuestaria sin mutación directa', () => {
    // Planificación no sobreescribe la partida en la BD; genera una sugerencia para devolver a la gerencia
    const generarSugerenciaPartida = (
      memoriaSugerida: { codigo: string; partida_codigo: string; partida_nombre: string; saldo: number },
      motivo?: string
    ) => {
      const { codigo, partida_codigo, partida_nombre, saldo } = memoriaSugerida;
      return `Asignación incorrecta de Partida / MC. Sugerencia: Reasignar a la Partida ${partida_codigo} — ${partida_nombre} (Memoria de Cálculo ${codigo}, Saldo disponible: Bs. ${saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}). Motivo: ${motivo || 'Se adecúa con mayor precisión al concepto de gasto.'}`;
    };

    const sugerencia = generarSugerenciaPartida(
      { codigo: 'MEM-IF-2026-005', partida_codigo: '25600', partida_nombre: 'Servicios de Imprenta', saldo: 15400 },
      'El gasto corresponde a material impreso, no a equipo de computación.'
    );

    assert.ok(sugerencia.includes('Asignación incorrecta'));
    assert.ok(sugerencia.includes('25600'));
    assert.ok(sugerencia.includes('Servicios de Imprenta'));
    assert.ok(sugerencia.includes('MEM-IF-2026-005'));
    assert.ok(sugerencia.includes('15.400,00'));
  });

  it('Cotejo de Planificación: Sugerencia de Operación POA sin mutación directa', () => {
    const generarSugerenciaOperacion = (
      opSugerida: { codigo: string; descripcion: string; acp_codigo?: string },
      motivo?: string
    ) => {
      return `Asignación incorrecta de Operación POA. Sugerencia: Reasignar a la operación ${opSugerida.codigo} — ${opSugerida.descripcion}${opSugerida.acp_codigo ? ` (ACP: ${opSugerida.acp_codigo})` : ''}. Motivo: ${motivo || 'No corresponde al concepto de gasto solicitado.'}`;
    };

    const sugerenciaOp = generarSugerenciaOperacion(
      { codigo: 'OP-IF-2026-02', descripcion: 'Soporte y Mantenimiento de Servidores', acp_codigo: 'ACP-P1-2026' },
      'El gasto es soporte técnico y no adquisición de activos.'
    );

    assert.ok(sugerenciaOp.includes('Asignación incorrecta de Operación POA'));
    assert.ok(sugerenciaOp.includes('OP-IF-2026-02'));
    assert.ok(sugerenciaOp.includes('ACP-P1-2026'));
  });

  it('Combinación inteligente de Sugerencia de Operación y Sugerencia de Partida sin sobrescritura', () => {
    const TAG_SUG_OP = '[SUGERENCIA OPERACIÓN POA]';
    const TAG_SUG_PARTIDA = '[SUGERENCIA PARTIDA / MC]';

    const actualizarTextoObservacion = (
      prevText: string,
      tipo: 'operacion' | 'partida',
      detalle: string
    ): string => {
      const opRegex = /(?:\[SUGERENCIA OPERACIÓN POA\]|Asignación incorrecta de Operación POA)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;
      const partRegex = /(?:\[SUGERENCIA PARTIDA \/ MC\]|Asignación incorrecta de Partida \/ MC)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;

      let currentOpBlock = '';
      let currentPartidaBlock = '';
      let cleanText = prevText || '';

      const opMatch = cleanText.match(opRegex);
      if (opMatch) {
        currentOpBlock = opMatch[0].trim();
        cleanText = cleanText.replace(opRegex, '').trim();
      }

      const partMatch = cleanText.match(partRegex);
      if (partMatch) {
        currentPartidaBlock = partMatch[0].trim();
        cleanText = cleanText.replace(partRegex, '').trim();
      }

      if (tipo === 'operacion') {
        currentOpBlock = `${TAG_SUG_OP}: ${detalle}`;
      } else {
        currentPartidaBlock = `${TAG_SUG_PARTIDA}: ${detalle}`;
      }

      const sections: string[] = [];
      if (cleanText) sections.push(cleanText);
      if (currentOpBlock) sections.push(currentOpBlock);
      if (currentPartidaBlock) sections.push(currentPartidaBlock);

      return sections.join('\n\n');
    };

    // Caso 1: Se sugiere primero Operación
    let obs = actualizarTextoObservacion('', 'operacion', 'Reasignar a OP-01');
    assert.ok(obs.includes('[SUGERENCIA OPERACIÓN POA]: Reasignar a OP-01'));

    // Caso 2: Se sugiere luego Partida (ambas deben coexistir)
    obs = actualizarTextoObservacion(obs, 'partida', 'Reasignar a Partida 22110 (MEM-01)');
    assert.ok(obs.includes('[SUGERENCIA OPERACIÓN POA]: Reasignar a OP-01'));
    assert.ok(obs.includes('[SUGERENCIA PARTIDA / MC]: Reasignar a Partida 22110 (MEM-01)'));

    // Caso 3: Se cambia la sugerencia de Operación (Partida se conserva intacta)
    obs = actualizarTextoObservacion(obs, 'operacion', 'Reasignar a OP-02');
    assert.ok(obs.includes('[SUGERENCIA OPERACIÓN POA]: Reasignar a OP-02'));
    assert.ok(!obs.includes('Reasignar a OP-01'));
    assert.ok(obs.includes('[SUGERENCIA PARTIDA / MC]: Reasignar a Partida 22110 (MEM-01)'));
  });

  it('Remoción limpia de sugerencia específica al validar correspondiente', () => {
    const removerSugerencia = (
      prevText: string,
      tipo: 'operacion' | 'partida'
    ): string => {
      const opRegex = /(?:\[SUGERENCIA OPERACIÓN POA\]|Asignación incorrecta de Operación POA)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;
      const partRegex = /(?:\[SUGERENCIA PARTIDA \/ MC\]|Asignación incorrecta de Partida \/ MC)[^\n]*(?:\n(?!\s*\[SUGERENCIA|\s*Asignación incorrecta)[^\n]*)*/gi;

      let res = prevText || '';
      if (tipo === 'operacion') {
        res = res.replace(opRegex, '').trim();
      } else {
        res = res.replace(partRegex, '').trim();
      }
      return res.replace(/\n{3,}/g, '\n\n').trim();
    };

    const combined = '[SUGERENCIA OPERACIÓN POA]: Reasignar a OP-02\n\n[SUGERENCIA PARTIDA / MC]: Reasignar a Partida 22110';
    const removedOp = removerSugerencia(combined, 'operacion');
    assert.equal(removedOp, '[SUGERENCIA PARTIDA / MC]: Reasignar a Partida 22110');

    const removedAll = removerSugerencia(removedOp, 'partida');
    assert.equal(removedAll, '');
  });

  it('Detección y auto-aplicación de sugerencias técnicas en SolicitudGastoModal', () => {
    const catalogoOps = [
      { id: 10, codigo: '2.210.1.01', descripcion: 'Operación 1' },
      { id: 11, codigo: '2.210.1.02', descripcion: 'Operación 2' },
    ];
    const catalogoMemorias = [
      { id: 101, codigo: 'MEM-SMS-2026-001', justificacion: 'Pasajes' },
      { id: 102, codigo: 'MEM-SMS-2026-002', justificacion: 'Viáticos' },
    ];

    const observacionPlanif = '[SUGERENCIA OPERACIÓN POA]: REASIGNAR A LA OPERACIÓN 2.210.1.02\n[SUGERENCIA PARTIDA / MC]: REASIGNAR A MEM-SMS-2026-001';
    const textUpper = observacionPlanif.toUpperCase();

    const matchedOp = catalogoOps.find((op) => textUpper.includes(op.codigo.toUpperCase()));
    const matchedMem = catalogoMemorias.find((m) => textUpper.includes(m.codigo.toUpperCase()));

    assert.equal(matchedOp?.id, 11);
    assert.equal(matchedOp?.codigo, '2.210.1.02');
    assert.equal(matchedMem?.id, 101);
    assert.equal(matchedMem?.codigo, 'MEM-SMS-2026-001');
  });

  it('Resolución robusta de Partida: Garantiza que la partida asignada siempre aparezca', () => {
    const resolverPartidaAsignada = (cert: {
      partida_codigo?: string | null;
      partida_nombre?: string | null;
      partida_literal?: string | null;
      memoria?: { partida_codigo?: string; partida_nombre?: string } | null;
    }) => {
      if (cert.partida_codigo) {
        return { codigo: cert.partida_codigo, nombre: cert.partida_nombre || '' };
      }
      if (cert.memoria?.partida_codigo) {
        return { codigo: cert.memoria.partida_codigo, nombre: cert.memoria.partida_nombre || '' };
      }
      if (cert.partida_literal) {
        return { codigo: '', nombre: cert.partida_literal };
      }
      return null;
    };

    // Caso 1: Certificación con partida explícita
    const p1 = resolverPartidaAsignada({ partida_codigo: '43120', partida_nombre: 'Equipo de Computación' });
    assert.deepEqual(p1, { codigo: '43120', nombre: 'Equipo de Computación' });

    // Caso 2: Certificación sin partida_codigo pero con memoria vinculada que tiene partida
    const p2 = resolverPartidaAsignada({
      partida_codigo: null,
      memoria: { partida_codigo: '25600', partida_nombre: 'Imprenta y Reproducción' },
    });
    assert.deepEqual(p2, { codigo: '25600', nombre: 'Imprenta y Reproducción' });

    // Caso 3: Fallback a partida_literal
    const p3 = resolverPartidaAsignada({ partida_literal: 'Consultorías por Producto' });
    assert.deepEqual(p3, { codigo: '', nombre: 'Consultorías por Producto' });
  });
});
