import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODULOS_GUIA_INFO,
  FLUJOS_GRAPH_DATA,
  ESCENARIOS_SANDBOX,
} from '../features/guia-interactiva/data/flujosData.ts';
import {
  LIVE_TOUR_DATA,
  LIVE_TOUR_DATA_BY_ROLE,
  getLiveTourData,
  ROLES_TOUR_INFO,
} from '../features/guia-interactiva/data/liveTourData.ts';
import type { ModuloGuiaId, RolTour } from '../features/guia-interactiva/types/guia.types.ts';

test('Centro de Guía y Flujos Interactivos - Estructura de Módulos', async (t) => {
  await t.test('Los 4 módulos requeridos existen con información institucional completa', () => {
    const requiredModules: ModuloGuiaId[] = [
      'memorias',
      'modificaciones',
      'certificaciones',
      'ejecucion',
    ];

    for (const modId of requiredModules) {
      const info = MODULOS_GUIA_INFO[modId];
      assert.ok(info, `El módulo ${modId} debe estar configurado`);
      assert.ok(info.titulo.length > 0, `El módulo ${modId} debe tener título`);
      assert.ok(info.alternativas.length >= 2, `El módulo ${modId} debe tener al menos 2 alternativas`);
      assert.ok(info.normativaReferencial.length >= 1, `El módulo ${modId} debe incluir normativa`);
    }
  });

  await t.test('Diagramas de Flujo - Integridad de Nodos y Conexiones (Edges)', () => {
    const moduleKeys = Object.keys(FLUJOS_GRAPH_DATA) as ModuloGuiaId[];

    for (const modKey of moduleKeys) {
      const alternatives = FLUJOS_GRAPH_DATA[modKey];
      for (const [altId, graph] of Object.entries(alternatives)) {
        assert.ok(
          graph.nodes.length >= 2,
          `El camino ${modKey}.${altId} debe tener al menos 2 nodos`
        );
        assert.ok(
          graph.edges.length >= 1,
          `El camino ${modKey}.${altId} debe tener al menos 1 conexión`
        );

        const nodeIds = new Set(graph.nodes.map((n) => n.id));

        // Verificar que cada conexión parte y llega a nodos existentes
        for (const edge of graph.edges) {
          assert.ok(
            nodeIds.has(edge.from),
            `Arista ${edge.id} en ${modKey}.${altId} tiene 'from' inexistente: ${edge.from}`
          );
          assert.ok(
            nodeIds.has(edge.to),
            `Arista ${edge.id} en ${modKey}.${altId} tiene 'to' inexistente: ${edge.to}`
          );
        }
      }
    }
  });

  await t.test('Memorias de Cálculo - Circuito de Techos Nuevos a Aprobación POA y Alerta de Recorte', () => {
    const mcNodes = FLUJOS_GRAPH_DATA['memorias']['mc-individual'].nodes;
    assert.equal(mcNodes[0].label, '1. Dictamen de Techos Nuevos');
    assert.equal(mcNodes[0].role, 'PRESUPUESTOS');

    assert.equal(mcNodes[1].label, '2. Formulación de Borradores');
    assert.equal(mcNodes[1].role, 'ELABORADOR');

    assert.equal(mcNodes[2].label, '3. Aprobación del Gerente de Área');
    assert.equal(mcNodes[2].role, 'GERENTE');

    assert.equal(mcNodes[3].label, '4. Revisión por Planificación');
    assert.equal(mcNodes[3].role, 'PLANIFICACION');

    assert.equal(mcNodes[4].label, '5. Aprobación Final de Presupuestos');
    assert.equal(mcNodes[4].role, 'PRESUPUESTOS');

    // Alerta de recorte de techo
    const recorteNode = mcNodes.find((n) => n.id === 'mc-recorte-notif');
    assert.ok(recorteNode, 'Debe existir el nodo de alerta de reducción de techo');
    assert.ok(recorteNode.description.includes('notifica a todos'));
  });

  await t.test('Modificaciones Presupuestarias - Cobertura de Caminos Intra e Inter Gerencias', () => {
    const modGraph = FLUJOS_GRAPH_DATA['modificaciones'];
    assert.ok(modGraph['mod-intra'], 'Debe existir flujo de traspaso intra-área');
    assert.ok(modGraph['mod-inter'], 'Debe existir flujo de traspaso inter-gerencias');

    // Verificar nodo clave de Aceptación del Gerente Cedente en Inter-Gerencias
    const interNodes = modGraph['mod-inter'].nodes;
    const cedenteAcceptNode = interNodes.find((n) => n.id === 'modinter-2');
    assert.ok(cedenteAcceptNode, 'Debe existir el nodo de aceptación del gerente cedente');
    assert.equal(cedenteAcceptNode.role, 'GERENTE');
    assert.ok(
      cedenteAcceptNode.label.includes('LA OTRA GERENCIA TIENE QUE ACEPTAR'),
      'Debe remarcar que la otra gerencia tiene que aceptar'
    );
  });

  await t.test('Certificaciones POA - Umbral de 2,000 Bs y Desembolso por Lic. Zaida', () => {
    const certGraph = FLUJOS_GRAPH_DATA['certificaciones'];
    assert.ok(certGraph['cert-estandar'], 'Debe existir el flujo estándar');

    const estandarNodes = certGraph['cert-estandar'].nodes;
    
    // Condición > 2,000 Bs
    const condNode = estandarNodes.find((n) => n.id === 'cert-2');
    assert.ok(condNode, 'Debe existir nodo de condición > 2,000 Bs o contratación');
    assert.ok(condNode.label.includes('2,000 Bs'));

    // Preventivo (el dinero NO salió)
    const presupNode = estandarNodes.find((n) => n.id === 'cert-4');
    assert.ok(presupNode, 'Debe existir nodo de verificación de presupuestos');
    assert.ok(presupNode.subtitle?.includes('NO SALIÓ'));

    // Lic. Zaida dicta "Ya salió el dinero"
    const zaidaNode = estandarNodes.find((n) => n.id === 'cert-5');
    assert.ok(zaidaNode, 'Debe existir nodo de desembolso de la Lic. Zaida');
    assert.equal(zaidaNode.role, 'TESORERIA');
    assert.ok(zaidaNode.label.includes('Lic. Zaida'));
    assert.ok(zaidaNode.subtitle?.includes('Reduce el dinero'));
  });

  await t.test('Escenarios de Prueba (Sandbox) - Pasos interactivos y numeración estricta', () => {
    const scenarioKeys = Object.keys(ESCENARIOS_SANDBOX) as ModuloGuiaId[];

    for (const modId of scenarioKeys) {
      const scenario = ESCENARIOS_SANDBOX[modId];
      assert.ok(scenario.steps.length >= 3, `El sandbox de ${modId} debe tener al menos 3 pasos`);

      // Verificar numeración correlativa estricta 1..N
      scenario.steps.forEach((step, idx) => {
        assert.equal(step.stepIndex, idx + 1, `Paso index correlativo en ${modId}`);
        assert.ok(step.targetId.length > 0, `Paso ${step.stepIndex} de ${modId} debe tener targetId`);
        assert.ok(step.instruction.length > 0, `Paso ${step.stepIndex} de ${modId} debe tener instrucción`);
        assert.ok(step.feedbackOnComplete.length > 0, `Paso ${step.stepIndex} de ${modId} debe tener feedback`);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // NUEVAS PRUEBAS: SIMULACIÓN EN VIVO MULTI-ROL Y MODALES INTERACTIVOS
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('Tours en Vivo Multi-Rol - Roles Institucionales Soportados', () => {
    const roles: RolTour[] = ['gerente', 'elaborador', 'planificacion', 'presupuestos', 'tesoreria'];
    for (const role of roles) {
      const info = ROLES_TOUR_INFO[role];
      assert.ok(info, `El rol ${role} debe tener configuración de tour`);
      assert.ok(info.label.length > 0, `El rol ${role} debe tener etiqueta`);
    }

    const modules: ModuloGuiaId[] = ['memorias', 'modificaciones', 'certificaciones', 'ejecucion'];
    for (const mod of modules) {
      for (const role of roles) {
        const tour = getLiveTourData(mod, role);
        assert.ok(tour, `Debe existir tour para módulo ${mod} y rol ${role}`);
        assert.ok(tour.steps.length >= 1, `Debe tener al menos 1 paso para ${mod}.${role}`);
        // Numeración 1..N
        tour.steps.forEach((s, idx) => {
          assert.equal(s.stepIndex, idx + 1, `Paso correlativo ${s.stepIndex} en ${mod}.${role}`);
          assert.ok(s.selector.length > 0, `Selector en ${mod}.${role} paso ${s.stepIndex}`);
        });
      }
    }
  });

  await t.test('Tour en Vivo Gerente - Guiado desde Sidebar, Modal Interactivo y Límite de Rol', () => {
    const tourGerente = getLiveTourData('memorias', 'gerente');
    
    // Paso 1: Guiar desde el menú lateral
    const paso1 = tourGerente.steps[0];
    assert.equal(paso1.stepIndex, 1);
    assert.ok(paso1.selector.includes('tour-nav-memorias'), 'Paso 1 debe guiar desde el Sidebar');

    // Paso 2: Formular o Duplicar Memoria con Modal Interactivo
    const paso2 = tourGerente.steps[1];
    assert.ok(paso2.selector.includes('tour-btn-memoria') && paso2.selector.includes('tour-btn-duplicar'));
    assert.ok(paso2.instruction.includes('Duplicar Memorias de Gestión Anterior'));
    assert.ok(paso2.modalConfig, 'Paso 2 debe incluir modalConfig para abrir el modal');
    assert.equal(paso2.modalConfig?.type, 'memoria_form');
    assert.ok(paso2.modalConfig?.actionButtonLabel.includes('Aprobar Pertinencia'));

    // Paso 3: Límite del Rol en la pestaña "En Espera"
    const paso3 = tourGerente.steps[2];
    assert.ok(paso3.selector.includes('tour-tab-espera'));
    assert.ok(paso3.limiteRol, 'Paso 3 debe explicar el límite de responsabilidad del Gerente');
    assert.ok(
      paso3.limiteRol?.includes('no tienes acceso') && paso3.limiteRol?.includes('Planificación'),
      'Debe advertir que no autoriza en Planificación y debe esperar'
    );

    // Paso 4: Finalización en Aprobadas POA
    const paso4 = tourGerente.steps[3];
    assert.ok(paso4.selector.includes('tour-tab-aprobadas'));

    // Paso 5: Alerta de reducción de techos por Presupuestos
    const paso5 = tourGerente.steps[4];
    assert.ok(paso5.selector.includes('tour-alerta-recorte'));
    assert.ok(paso5.instruction.includes('Presupuestos'));
  });

  await t.test('Tour en Vivo Modificaciones - Inter-Gerencias requiere Aceptación de la otra gerencia', () => {
    const tourMod = getLiveTourData('modificaciones', 'gerente');
    const pasoAceptacion = tourMod.steps.find((s) => s.selector.includes('tour-tab-gerencia-mod'));
    assert.ok(pasoAceptacion, 'Debe existir paso guiando a la pestaña de aceptación gerencial');
    assert.ok(
      pasoAceptacion.limiteRol?.includes('LA OTRA GERENCIA TIENE QUE ACEPTAR') ||
      pasoAceptacion.instruction.includes('LA OTRA GERENCIA TIENE QUE ACEPTAR')
    );
  });

  await t.test('Tour en Vivo Certificaciones - Salida efectiva por Lic. Zaida en Tesorería', () => {
    const tourCert = getLiveTourData('certificaciones', 'gerente');
    const pasoZaida = tourCert.steps.find((s) => s.role.includes('Lic. Zaida'));
    assert.ok(pasoZaida, 'Debe existir paso correspondiente a la Lic. Zaida');
    assert.ok(pasoZaida.instruction.includes('Ya salió el dinero'));
  });
});
