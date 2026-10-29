import type {
  ModuloGuiaId,
  GuiaProcesoInfo,
  FlowNode,
  FlowEdge,
  SandboxScenario,
} from '../types/guia.types.ts';

export const MODULOS_GUIA_INFO: Record<ModuloGuiaId, GuiaProcesoInfo> = {
  memorias: {
    id: 'memorias',
    titulo: 'Memorias de Cálculo (MCs)',
    subtitulo: 'Techos fijados por Presupuestos, formulación de borradores y circuito de aprobación',
    icono: 'BookOpen',
    color: 'from-blue-600 to-indigo-700',
    badge: 'Formulación POA',
    descripcionLarga:
      'La Dirección de Presupuestos dicta inicialmente los techos nuevos para cada gerencia. Los elaboradores formulan borradores (creando nuevos o usando la base de la gestión anterior), el Gerente de área aprueba la pertinencia, Planificación revisa las operaciones que manejan y Presupuestos aprueba cada MC para que pasen formalmente al POA oficial. En caso de reducción de techo global, Presupuestos no rechaza las MCs sino que notifica a todas las gerencias para que rebajen montos y cuadre a futuro.',
    alternativas: [
      {
        id: 'mc-individual',
        nombre: 'Flujo Completo Institucional (Techo a POA)',
        descripcion: 'Techo Presupuestos $\\rightarrow$ Borrador Elaborador $\\rightarrow$ Gerente $\\rightarrow$ Planificación $\\rightarrow$ Aprobación POA.',
        badge: 'Oficial',
        esPredeterminada: true,
      },
      {
        id: 'mc-copia',
        nombre: 'Base de Gestión Anterior',
        descripcion: 'Uso de la base histórica y partidas del año anterior para formular la nueva gestión.',
        badge: 'Histórico',
      },
      {
        id: 'mc-recorte',
        nombre: 'Circuito de Reducción de Techo',
        descripcion: 'Notificación oficial a todas las gerencias para reajustar y rebajar memorias.',
        badge: 'Adecuación',
      },
    ],
    normativaReferencial: [
      {
        articulo: 'Art. 4 (Circuito de Validación)',
        descripcion:
          'Toda MC pasa por Elaborador (borrador) $\\rightarrow$ Gerente de Área (visto bueno) $\\rightarrow$ Planificación (operaciones POA) $\\rightarrow$ Presupuestos (inclusión oficial al POA).',
      },
      {
        articulo: 'Art. 12 (Política de Recorte de Techos)',
        descripcion:
          'Ante un recorte presupuestario institucional, no se rechazan las MCs de forma aislada: se emite notificación de adecuación a todas las gerencias para que reajusten sus montos.',
      },
    ],
  },

  modificaciones: {
    id: 'modificaciones',
    titulo: 'Modificaciones Presupuestarias',
    subtitulo: 'Traspasos entre partidas de la misma gerencia e inter-gerencias con consentimiento',
    icono: 'ArrowRightLeft',
    color: 'from-amber-500 to-orange-600',
    badge: 'Ajuste Dinámico',
    descripcionLarga:
      'Maneja dos vías operativas estrictas: 1) Traspasos entre partidas de una misma gerencia, donde se solicita a Presupuestos, quien verifica que haya dinero y el por qué para efectuar la modificación; 2) Traspasos inter-gerencias, donde la gerencia solicitante pide a otra gerencia disponer del dinero de sus partidas; la otra gerencia TIENE QUE ACEPTAR primero; y una vez aceptado, recién va a Presupuestos para su aprobación o rechazo final.',
    alternativas: [
      {
        id: 'mod-intra',
        nombre: 'Misma Gerencia (Intra-Área)',
        descripcion: 'Solicitud a Presupuestos $\\rightarrow$ Presupuestos verifica dinero y causa $\\rightarrow$ Efectúa modificación.',
        badge: 'Directo',
        esPredeterminada: true,
      },
      {
        id: 'mod-inter',
        nombre: 'Inter-Gerencias (Entre Áreas)',
        descripcion: 'Solicitante pide a otra Gerencia $\\rightarrow$ Gerencia Cedente ACEPTA $\\rightarrow$ Presupuestos aprueba.',
        badge: 'Consentimiento',
      },
      {
        id: 'mod-nueva-partida',
        nombre: 'Inclusión de Nueva Partida',
        descripcion: 'Habilitación de una partida que no existía originalmente en el POA de la gerencia.',
        badge: 'Ampliación',
      },
    ],
    normativaReferencial: [
      {
        articulo: 'Art. 24 (Verificación de Causa)',
        descripcion:
          'En traspasos de la misma gerencia, Presupuestos verifica obligatoriamente la existencia de saldo líquido y el motivo justificado de la modificación.',
      },
      {
        articulo: 'Art. 28 (Aceptación Previa Inter-Gerencias)',
        descripcion:
          'Una solicitud entre gerencias distintas NO PUEDE llegar a Presupuestos hasta que la Gerencia Cedente acepte expresamente en el sistema ceder sus fondos.',
      },
    ],
  },

  certificaciones: {
    id: 'certificaciones',
    titulo: 'Gastos, Certificaciones POA y Pagos',
    subtitulo: 'Umbral de 2,000 Bs o contrataciones, preventivo y desembolso por Lic. Zaida',
    icono: 'ShieldCheck',
    color: 'from-emerald-600 to-teal-700',
    badge: 'Control y Salida',
    descripcionLarga:
      'La Gerencia solicita el gasto. Si el monto es mayor a 2,000 Bs o corresponde a contrataciones, va obligatoriamente a Certificación POA. Planificación da el OK técnico; avanza a Presupuestos, quien verifica y da el OK preventivo (el dinero aún no salió). Finalmente, la Lic. Zaida (Tesorería) dicta "Ya salió el dinero" y reduce el saldo en el sistema una vez liquidado el pago.',
    alternativas: [
      {
        id: 'cert-estandar',
        nombre: 'Gasto Mayor a 2,000 Bs / Contrataciones',
        descripcion: 'Gerencia Solicita $\\rightarrow$ Planificación OK $\\rightarrow$ Presupuestos OK $\\rightarrow$ Lic. Zaida reduce el dinero.',
        badge: 'Formal',
        esPredeterminada: true,
      },
      {
        id: 'cert-menor',
        nombre: 'Gasto Menor (<= 2,000 Bs sin Contratación)',
        descripcion: 'Imputación directa y oportuna autorizada sin certificación preventiva prolongada.',
        badge: 'Directo',
      },
      {
        id: 'cert-rechazo',
        nombre: 'Rechazo de Solicitud de Gasto',
        descripcion: 'Ruta cuando no hay fondos o existen inconsistencias técnicas insubsanables.',
        badge: 'Cierre',
      },
    ],
    normativaReferencial: [
      {
        articulo: 'Art. 35 (Umbral de 2,000 Bs y Contrataciones)',
        descripcion:
          'Todo requerimiento superior a 2,000.00 Bs o contrataciones/PAC exige Certificación POA previa con visto bueno de Planificación y Presupuestos.',
      },
      {
        articulo: 'Art. 42 (Desembolso Real por Tesorería)',
        descripcion:
          'El visto bueno de Presupuestos solo reserva los fondos preventivamente; la reducción efectiva del dinero la realiza la Lic. Zaida al registrar la salida bancaria.',
      },
    ],
  },

  ejecucion: {
    id: 'ejecucion',
    titulo: 'Ejecución y Salida de Fondos',
    subtitulo: 'Afectación del compromiso, liquidación de facturas y control de caja',
    icono: 'Coins',
    color: 'from-violet-600 to-purple-800',
    badge: 'Tesorería',
    descripcionLarga:
      'Distingue el momento en que Presupuestos aprueba el preventivo (el dinero sigue en la cuenta) del momento en que Tesorería (Lic. Zaida) confirma "Ya salió el dinero", reduciendo el saldo del sistema y reflejando el gasto pagado definitivo.',
    alternativas: [
      {
        id: 'ejec-cert',
        nombre: 'Ejecución con Certificación POA',
        descripcion: 'Imputación sobre preventivo previamente aprobado por Planificación y Presupuestos.',
        badge: 'Vía Certificación',
        esPredeterminada: true,
      },
      {
        id: 'ejec-directo',
        nombre: 'Gasto Menor / Caja Chica (<= 2,000 Bs)',
        descripcion: 'Salida directa para compras inmediatas autorizadas de bajo monto.',
        badge: 'Caja Menor',
      },
      {
        id: 'ejec-anulacion',
        nombre: 'Liberación de Sobrantes',
        descripcion: 'Si la compra costó menos de lo reservado, la diferencia retorna al disponible.',
        badge: 'Ahorro',
      },
    ],
    normativaReferencial: [
      {
        articulo: 'Art. 45 (Ledger y Salida Efectiva)',
        descripcion:
          'El saldo del sistema se decrementa de forma inmutable únicamente tras la confirmación de desembolso por la Lic. Zaida.',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DIAGRAMAS DE FLUJO INTERACTIVOS (NODOS Y CONEXIONES)
// ─────────────────────────────────────────────────────────────────────────────

export const FLUJOS_GRAPH_DATA: Record<
  ModuloGuiaId,
  Record<string, { nodes: FlowNode[]; edges: FlowEdge[] }>
> = {
  // ── 1. MEMORIAS DE CÁLCULO ──
  memorias: {
    'mc-individual': {
      nodes: [
        {
          id: 'mc-1',
          label: '1. Dictamen de Techos Nuevos',
          subtitle: 'Presupuestos dicta techos a cada gerencia',
          role: 'PRESUPUESTOS',
          type: 'start',
          column: 0,
          row: 1,
          description:
            'La Dirección de Presupuestos fija y dicta los techos presupuestarios máximos habilitados para cada Gerencia de Área para el nuevo año fiscal.',
          responsable: 'Dirección de Presupuestos',
          requisitos: ['Aprobación de política presupuestaria institucional'],
          salida: 'Techos presupuestarios cargados por Gerencia',
          reglaNegocio: 'Ningún área puede formular por encima del techo dictado.',
          sandboxStepId: 1,
        },
        {
          id: 'mc-2',
          label: '2. Formulación de Borradores',
          subtitle: 'Nuevas MCs o base de gestión anterior',
          role: 'ELABORADOR',
          type: 'process',
          column: 1,
          row: 1,
          description:
            'El elaborador realiza los borradores de las memorias de cálculo, ya sea formulando ítems nuevos desde cero o tomando como base la gestión anterior.',
          responsable: 'Elaborador de la Sección o Área',
          requisitos: ['Partida presupuestaria', 'Cotización referencial'],
          salida: 'Memorias en estado BORRADOR',
          reglaNegocio: 'Cálculo exacto: Monto Total = Cantidad × Precio Unitario.',
          sandboxStepId: 2,
        },
        {
          id: 'mc-3',
          label: '3. Aprobación del Gerente de Área',
          subtitle: 'Visto bueno del Gerente correspondiente',
          role: 'GERENTE',
          type: 'review',
          column: 2,
          row: 1,
          description:
            'El Gerente correspondiente del área revisa que las memorias de cálculo de su personal se ajusten al techo y aprueba formalmente su pertinencia.',
          responsable: 'Gerente del Área Titular',
          requisitos: ['Estar dentro del techo presupuestario del área'],
          salida: 'Estado: ENVIADO_PLANIFICACION',
          reglaNegocio: 'El Gerente valida la prioridad operativa antes de remitir a instancias centrales.',
          sandboxStepId: 3,
        },
        {
          id: 'mc-4',
          label: '4. Revisión por Planificación',
          subtitle: 'Verificación de operaciones y coherencia',
          role: 'PLANIFICACION',
          type: 'decision',
          column: 3,
          row: 1,
          description:
            'Planificación revisa las memorias más que nada para verificar las operaciones POA que manejan y comprobar si todo está correcto con el PEI.',
          responsable: 'Dirección de Planificación',
          requisitos: ['Operación POA vigente y metas concordantes'],
          salida: 'Estado: APROBADO_PLANIFICACION',
          reglaNegocio: 'Si el requerimiento no articula con una meta operativa, se devuelve con observaciones.',
          sandboxStepId: 4,
        },
        {
          id: 'mc-5',
          label: '5. Aprobación Final de Presupuestos',
          subtitle: 'Aprueba cada MC para pasar al POA oficial',
          role: 'PRESUPUESTOS',
          type: 'success',
          column: 4,
          row: 1,
          description:
            'Presupuestos aprueba cada una de las memorias de cálculo para que pasen formalmente al POA consolidado institucional.',
          responsable: 'Dirección de Presupuestos',
          salida: 'Estado: APROBADO_FINANZAS (Vigente en el POA)',
          reglaNegocio: 'Habilita las partidas para futuras certificaciones y ejecuciones.',
          sandboxStepId: 5,
        },
        {
          id: 'mc-recorte-notif',
          label: 'Presupuestos Dicta Recorte de Techo',
          subtitle: 'Notificación oficial para rebajar y cuadrar',
          role: 'PRESUPUESTOS',
          type: 'warning',
          column: 4,
          row: 2,
          description:
            'Quien dicta los techos para volver a hacerse es estrictamente PRESUPUESTOS (no Planificación). En caso de reducción de techo global, Presupuestos no rechaza las MCs de forma aislada: dicta el nuevo techo reducido y notifica a todos indicando que deben rebajar memorias para que cuadre a futuro.',
          responsable: 'Dirección de Presupuestos',
          salida: 'Nuevo techo reducido y notificación a gerencias',
          reglaNegocio: 'Presupuestos es la única autoridad que fija y reajusta los techos presupuestarios.',
        },
      ],
      edges: [
        { id: 'emc-1-2', from: 'mc-1', to: 'mc-2', animated: true, variant: 'primary', label: 'Techo dictado' },
        { id: 'emc-2-3', from: 'mc-2', to: 'mc-3', animated: true, variant: 'primary', label: 'Borrador remitido' },
        { id: 'emc-3-4', from: 'mc-3', to: 'mc-4', animated: true, variant: 'primary', label: 'Gerente aprueba' },
        { id: 'emc-4-5', from: 'mc-4', to: 'mc-5', animated: true, variant: 'success', label: 'Planif. Conforme' },
        { id: 'emc-5-recorte', from: 'mc-5', to: 'mc-recorte-notif', style: 'dashed', variant: 'warning', label: 'Presupuestos dicta recorte' },
        { id: 'emc-recorte-2', from: 'mc-recorte-notif', to: 'mc-2', style: 'dashed', variant: 'warning', label: 'Rebajar montos' },
      ],
    },
    'mc-copia': {
      nodes: [
        {
          id: 'mcc-1',
          label: 'Selección de Gestión Anterior',
          subtitle: 'Uso de la base histórica',
          role: 'ELABORADOR',
          type: 'start',
          column: 0,
          row: 1,
          description: 'Elaborador elige la gestión anterior como base para no formular desde cero partidas recurrentes.',
          responsable: 'Elaborador',
        },
        {
          id: 'mcc-2',
          label: 'Clonación y Ajuste de Precios',
          subtitle: 'Generación de borradores',
          role: 'ELABORADOR',
          type: 'process',
          column: 2,
          row: 1,
          description: 'Se clonan los ítems y se ajustan precios y cantidades según el techo nuevo asignado.',
          responsable: 'Elaborador',
        },
        {
          id: 'mcc-3',
          label: 'Remisión al Circuito Aprobador',
          subtitle: 'Pase a Gerente y Planificación',
          role: 'GERENTE',
          type: 'success',
          column: 4,
          row: 1,
          description: 'Los borradores ingresan al circuito regular de aprobaciones hasta ingresar al POA.',
          responsable: 'Gerente / Presupuestos',
        },
      ],
      edges: [
        { id: 'ecc-1-2', from: 'mcc-1', to: 'mcc-2', animated: true, variant: 'primary' },
        { id: 'ecc-2-3', from: 'mcc-2', to: 'mcc-3', animated: true, variant: 'success' },
      ],
    },
    'mc-recorte': {
      nodes: [
        {
          id: 'mcr-1',
          label: 'Reducción de Techo Institucional',
          subtitle: 'Directriz superior de austeridad',
          role: 'PRESUPUESTOS',
          type: 'start',
          column: 0,
          row: 1,
          description: 'Presupuestos recibe la instrucción de rebajar el techo presupuestario asignado.',
          responsable: 'Presupuestos',
        },
        {
          id: 'mcr-2',
          label: 'Notificación Masiva de Adecuación',
          subtitle: 'Aviso a todas las gerencias',
          role: 'PRESUPUESTOS',
          type: 'warning',
          column: 2,
          row: 1,
          description: 'Se emite la notificación oficial a todos los gerentes: deben rebajar memorias para que cuadre a futuro.',
          responsable: 'Presupuestos',
        },
        {
          id: 'mcr-3',
          label: 'Readecuación y Cuadre de Techos',
          subtitle: 'Nuevo equilibrio presupuestario',
          role: 'GERENTE',
          type: 'success',
          column: 4,
          row: 1,
          description: 'Cada gerencia ajusta sus partidas hasta que la sumatoria total coincide exactamente con el nuevo techo.',
          responsable: 'Gerencias de Área',
        },
      ],
      edges: [
        { id: 'ecr-1-2', from: 'mcr-1', to: 'mcr-2', animated: true, variant: 'warning' },
        { id: 'ecr-2-3', from: 'mcr-2', to: 'mcr-3', animated: true, variant: 'success' },
      ],
    },
  },

  // ── 2. MODIFICACIONES PRESUPUESTARIAS ──
  modificaciones: {
    'mod-intra': {
      nodes: [
        {
          id: 'modi-1',
          label: '1. Solicitud a Presupuestos',
          subtitle: 'Traspaso entre partidas de la misma gerencia',
          role: 'GERENTE',
          type: 'start',
          column: 0,
          row: 1,
          description:
            'La Gerencia solicita a Presupuestos mover recursos entre partidas de su misma área, indicando partida cedente, partida receptora y motivo.',
          responsable: 'Gerente del Área',
          requisitos: ['Partida cedente con saldo disponible'],
          salida: 'Solicitud de traspaso interno remitida',
          reglaNegocio: 'Ambas partidas deben pertenecer estrictamente a la misma gerencia.',
          sandboxStepId: 1,
        },
        {
          id: 'modi-2',
          label: '2. Verificación de Dinero y Justificativo',
          subtitle: 'Presupuestos verifica saldo y el por qué',
          role: 'PRESUPUESTOS',
          type: 'process',
          column: 2,
          row: 1,
          description:
            'La Dirección de Presupuestos verifica que haya dinero disponible suficiente en la partida origen y evalúa el por qué de la solicitud.',
          responsable: 'Dirección de Presupuestos',
          salida: 'Evaluación de viabilidad financiera',
          reglaNegocio: 'No se aprueba si el saldo cedente está comprometido en certificaciones.',
          sandboxStepId: 2,
        },
        {
          id: 'modi-3',
          label: '3. Presupuestos Efectúa la Modificación',
          subtitle: 'Aplicación directa de saldos en el POA',
          role: 'PRESUPUESTOS',
          type: 'success',
          column: 4,
          row: 1,
          description:
            'Habiéndose comprobado el dinero y la justificación, Presupuestos hace la modificación, actualizando el saldo de ambas partidas al instante.',
          responsable: 'Dirección de Presupuestos',
          salida: 'Modificación aplicada con saldo equilibrado',
          reglaNegocio: 'Suma neta del movimiento = 0.00 Bs.',
          sandboxStepId: 3,
        },
      ],
      edges: [
        { id: 'emi-1-2', from: 'modi-1', to: 'modi-2', animated: true, variant: 'primary', label: 'Solicita a Presupuestos' },
        { id: 'emi-2-3', from: 'modi-2', to: 'modi-3', animated: true, variant: 'success', label: 'Verifica y Modifica' },
      ],
    },

    'mod-inter': {
      nodes: [
        {
          id: 'modinter-1',
          label: '1. Petición de Fondos a otra Gerencia',
          subtitle: 'Solicita disponer del dinero de x partidas',
          role: 'GERENTE',
          type: 'start',
          column: 0,
          row: 1,
          description:
            'La gerencia solicitante pide a otra gerencia disponer del dinero de partidas específicas por requerimiento institucional.',
          responsable: 'Gerente Solicitante (Receptor)',
          requisitos: ['Coordinación inter-áreas'],
          salida: 'Petición inter-gerencias remitida al cedente',
          sandboxStepId: 1,
        },
        {
          id: 'modinter-2',
          label: '2. LA OTRA GERENCIA TIENE QUE ACEPTAR',
          subtitle: 'Aceptación formal obligatoria del cedente',
          role: 'GERENTE',
          type: 'decision',
          column: 2,
          row: 1,
          description:
            'La otra gerencia recibe la petición y TIENE QUE ACEPTAR formalmente en el sistema ceder su dinero. Sin su aceptación, el trámite NO avanza.',
          responsable: 'Gerente del Área Donante (Cedente)',
          requisitos: ['Aceptación expresa en sistema del Gerente Donante'],
          salida: 'Estado: ACEPTADO_POR_GERENCIA',
          reglaNegocio: 'REGLA ESTRICTA: Ninguna gerencia pierde presupuesto sin su aceptación expresa.',
          sandboxStepId: 2,
        },
        {
          id: 'modinter-3',
          label: '3. Evaluación Final en Presupuestos',
          subtitle: 'Una vez aceptado, recién va a Presupuestos',
          role: 'PRESUPUESTOS',
          type: 'review',
          column: 3,
          row: 1,
          description:
            'Una vez que la otra gerencia acepta, recién va a Presupuestos para ver si lo aprueba o no, emitiendo la resolución oficial correspondiente.',
          responsable: 'Dirección de Presupuestos',
          salida: 'Dictamen de aprobación o rechazo institucional',
          sandboxStepId: 3,
        },
        {
          id: 'modinter-4',
          label: '4. Traspaso Consumado en el POA',
          subtitle: 'Reasignación bilateral de techos y partidas',
          role: 'SISTEMA',
          type: 'success',
          column: 4,
          row: 1,
          description:
            'Se rebaja el saldo de la gerencia donante y se incrementa el saldo de la gerencia solicitante en el Ledger inmutable.',
          responsable: 'Sistema POA',
          salida: 'Modificación Inter-Gerencial Consumada',
          sandboxStepId: 4,
        },
        {
          id: 'modinter-rechazo',
          label: 'Rechazo de Cesión',
          subtitle: 'La otra gerencia niega o Presupuestos rechaza',
          role: 'GERENTE',
          type: 'danger',
          column: 2,
          row: 2,
          description:
            'Si la otra gerencia no acepta ceder sus recursos, o si Presupuestos determina inviabilidad, la modificación se rechaza sin alterar saldos.',
          responsable: 'Gerente Donante / Presupuestos',
          salida: 'Estado: RECHAZADO',
        },
      ],
      edges: [
        { id: 'einter-1-2', from: 'modinter-1', to: 'modinter-2', animated: true, variant: 'primary', label: 'Petición a otra Gerencia' },
        { id: 'einter-2-3', from: 'modinter-2', to: 'modinter-3', animated: true, variant: 'success', label: 'Otra Gerencia Acepta' },
        { id: 'einter-2-alt', from: 'modinter-2', to: 'modinter-rechazo', style: 'dashed', variant: 'danger', label: 'No Acepta' },
        { id: 'einter-3-4', from: 'modinter-3', to: 'modinter-4', animated: true, variant: 'success', label: 'Presupuestos Aprueba' },
        { id: 'einter-3-alt', from: 'modinter-3', to: 'modinter-rechazo', style: 'dashed', variant: 'danger', label: 'Presupuestos Rechaza' },
      ],
    },

    'mod-nueva-partida': {
      nodes: [
        {
          id: 'modnp-1',
          label: 'Solicitud con Partida No Existente',
          subtitle: 'Requerimiento de código no presupuestado',
          role: 'GERENTE',
          type: 'start',
          column: 0,
          row: 1,
          description: 'La gerencia requiere fondos en una partida que no existía en su POA inicial.',
          responsable: 'Gerente Solicitante',
        },
        {
          id: 'modnp-2',
          label: 'Creación Dinámica y Verificación',
          subtitle: 'Presupuestos valida pertinencia',
          role: 'PRESUPUESTOS',
          type: 'process',
          column: 2,
          row: 1,
          description: 'Presupuestos habilita la nueva partida asignándole el monto traspasado.',
          responsable: 'Presupuestos',
        },
        {
          id: 'modnp-3',
          label: 'Partida Habilitada en el POA',
          subtitle: 'Lista para ejecutar gastos',
          role: 'SISTEMA',
          type: 'success',
          column: 4,
          row: 1,
          description: 'La partida queda incorporada en el árbol presupuestario del área receptora.',
          responsable: 'Sistema POA',
        },
      ],
      edges: [
        { id: 'enp-1-2', from: 'modnp-1', to: 'modnp-2', animated: true, variant: 'primary' },
        { id: 'enp-2-3', from: 'modnp-2', to: 'modnp-3', animated: true, variant: 'success' },
      ],
    },
  },

  // ── 3. CERTIFICACIONES POA Y GASTOS ──
  certificaciones: {
    'cert-estandar': {
      nodes: [
        {
          id: 'cert-1',
          label: '1. Gerencia Solicita Gasto',
          subtitle: 'Formulación de necesidad por el Área',
          role: 'GERENTE',
          type: 'start',
          column: 0,
          row: 1,
          description:
            'La Gerencia formula la solicitud del requerimiento indicando justificación, memoria de cálculo e importe estimado.',
          responsable: 'Gerente del Área Solicitante',
          requisitos: ['Memoria con saldo disponible'],
          salida: 'Solicitud de gasto formulada',
          sandboxStepId: 1,
        },
        {
          id: 'cert-2',
          label: '2. ¿Monto > 2,000 Bs o Contratación?',
          subtitle: 'Umbral normativo de Certificación POA',
          role: 'SISTEMA',
          type: 'decision',
          column: 1,
          row: 1,
          description:
            'En caso de que sea mayor a 2,000 Bs o corresponda a contrataciones (PAC), va obligatoriamente a Certificación POA preventiva. Si es menor a 2,000 Bs y compra menor, puede tramitarse directamente.',
          responsable: 'Reglamento de Contrataciones POA',
          salida: 'Pase obligatorio a Certificación POA',
          reglaNegocio: 'Gasto > 2,000 Bs o Contratación = Certificación POA Preventiva.',
          sandboxStepId: 2,
        },
        {
          id: 'cert-3',
          label: '3. Planificación da el OK Técnico',
          subtitle: 'Avanza la revisión técnica',
          role: 'PLANIFICACION',
          type: 'process',
          column: 2,
          row: 1,
          description:
            'Planificación revisa la pertinencia técnica con la Operación POA correspondiente y da el "OK". La solicitud avanza a Presupuestos.',
          responsable: 'Dirección de Planificación',
          salida: 'Visto Bueno Técnico Emitido',
          reglaNegocio: 'Planificación certifica articulación con metas, no disponibilidad financiera.',
          sandboxStepId: 3,
        },
        {
          id: 'cert-4',
          label: '4. Presupuestos Verifica y da el OK',
          subtitle: 'Ya está aprobado, pero el dinero NO SALIÓ',
          role: 'PRESUPUESTOS',
          type: 'review',
          column: 3,
          row: 1,
          description:
            'Presupuestos verifica que haya dinero en la partida y da el "OK". La certificación está formalmente aprobada con reserva preventiva, pero el dinero físico AÚN NO SALIÓ.',
          responsable: 'Dirección de Presupuestos',
          salida: 'Preventivo Aprobado (Fondo Congelado)',
          reglaNegocio: 'El dinero queda bloqueado para evitar sobregiro, pero sigue en caja hasta el pago.',
          sandboxStepId: 4,
        },
        {
          id: 'cert-5',
          label: '5. "Ya Salió el Dinero" (Lic. Zaida)',
          subtitle: 'Reduce el dinero en el sistema',
          role: 'TESORERIA',
          type: 'success',
          column: 4,
          row: 1,
          description:
            'Una vez entregado el bien o servicio y procesada la factura, la Lic. Zaida es quien dicta: "Ya salió el dinero", reduciendo efectivamente el dinero que tiene en el sistema.',
          responsable: 'Lic. Zaida (Dirección de Tesorería)',
          salida: 'Desembolso bancario y saldo reducido',
          reglaNegocio: 'Consolida la salida efectiva de fondos con comprobante de pago.',
          sandboxStepId: 5,
        },
        {
          id: 'cert-alt-rechazo',
          label: 'Rechazo de Solicitud de Gasto',
          subtitle: 'Por falta de saldo u observaciones',
          role: 'PRESUPUESTOS',
          type: 'danger',
          column: 2,
          row: 2,
          description:
            'Si la partida no tiene saldo disponible o si existen observaciones técnicas insubsanables, Planificación o Presupuestos rechazan la solicitud.',
          responsable: 'Planificación / Presupuestos',
          salida: 'Solicitud rechazada con motivo fundamentado',
        },
      ],
      edges: [
        { id: 'ecert-1-2', from: 'cert-1', to: 'cert-2', animated: true, variant: 'primary', label: 'Evaluar monto' },
        { id: 'ecert-2-3', from: 'cert-2', to: 'cert-3', animated: true, variant: 'primary', label: '> 2,000 Bs o Contratación' },
        { id: 'ecert-3-4', from: 'cert-3', to: 'cert-4', animated: true, variant: 'primary', label: 'Planificación da el OK' },
        { id: 'ecert-4-5', from: 'cert-4', to: 'cert-5', animated: true, variant: 'success', label: 'Presupuestos da el OK' },
        { id: 'ecert-3-alt', from: 'cert-3', to: 'cert-alt-rechazo', style: 'dashed', variant: 'danger', label: 'Rechazo Planif.' },
        { id: 'ecert-4-alt', from: 'cert-4', to: 'cert-alt-rechazo', style: 'dashed', variant: 'danger', label: 'Rechazo Presup.' },
      ],
    },

    'cert-menor': {
      nodes: [
        {
          id: 'certm-1',
          label: 'Gasto Menor (<= 2,000 Bs)',
          subtitle: 'Compra menor de caja chica sin contratación',
          role: 'GERENTE',
          type: 'start',
          column: 0,
          row: 1,
          description: 'Gastos operativos menores que no superan los 2,000 Bs y no corresponden a contrataciones.',
          responsable: 'Responsable de Caja / Gerente',
        },
        {
          id: 'certm-2',
          label: 'Imputación Directa',
          subtitle: 'Afectación inmediata de la partida',
          role: 'PRESUPUESTOS',
          type: 'process',
          column: 2,
          row: 1,
          description: 'Se descuenta directamente el monto del saldo disponible de la memoria.',
          responsable: 'Presupuestos / Contabilidad',
        },
        {
          id: 'certm-3',
          label: 'Descargo Contable Aprobado',
          subtitle: 'Cierre de gasto menor',
          role: 'SISTEMA',
          type: 'success',
          column: 4,
          row: 1,
          description: 'El gasto menor queda liquidado con factura o recibo oficial.',
          responsable: 'Sistema POA',
        },
      ],
      edges: [
        { id: 'ecm-1-2', from: 'certm-1', to: 'certm-2', animated: true, variant: 'primary' },
        { id: 'ecm-2-3', from: 'certm-2', to: 'certm-3', animated: true, variant: 'success' },
      ],
    },

    'cert-rechazo': {
      nodes: [
        {
          id: 'certr-1',
          label: 'Detección de Inconsistencia o Falta de Saldo',
          subtitle: 'Fondos insuficientes en la partida',
          role: 'PRESUPUESTOS',
          type: 'start',
          column: 0,
          row: 1,
          description: 'La solicitud excede el disponible real o no concuerda con las normas de gasto.',
          responsable: 'Presupuestos / Planificación',
        },
        {
          id: 'certr-2',
          label: 'Dictamen de Rechazo Oficial',
          subtitle: 'Notificación fundamentada a la gerencia',
          role: 'PRESUPUESTOS',
          type: 'danger',
          column: 2,
          row: 1,
          description: 'Se emite la nota oficial de rechazo y el dinero nunca es comprometido.',
          responsable: 'Presupuestos',
        },
        {
          id: 'certr-3',
          label: 'Saldo Íntegro en la Partida',
          subtitle: 'Disponibilidad preservada',
          role: 'SISTEMA',
          type: 'success',
          column: 4,
          row: 1,
          description: 'No se altera el saldo líquido del área, quedando libre para otros requerimientos.',
          responsable: 'Sistema POA',
        },
      ],
      edges: [
        { id: 'ecr-1-2', from: 'certr-1', to: 'certr-2', animated: true, variant: 'danger' },
        { id: 'ecr-2-3', from: 'certr-2', to: 'certr-3', animated: true, variant: 'primary' },
      ],
    },
  },

  // ── 4. EJECUCIONES Y SALIDA DE DINERO ──
  ejecucion: {
    'ejec-cert': {
      nodes: [
        {
          id: 'ej-1',
          label: '1. Preventivo Aprobado (Dinero en Cuenta)',
          subtitle: 'Certificación aprobada por Planif. y Presup.',
          role: 'PRESUPUESTOS',
          type: 'start',
          column: 0,
          row: 1,
          description:
            'La Certificación POA fue aprobada: Planificación dio el OK y Presupuestos verificó el dinero. El dinero aún no salió físicamente.',
          responsable: 'Unidad Solicitante',
          sandboxStepId: 1,
        },
        {
          id: 'ej-2',
          label: '2. Recepción de Factura y Conformidad',
          subtitle: 'Entrega del bien o servicio',
          role: 'GERENTE',
          type: 'process',
          column: 1,
          row: 1,
          description:
            'El proveedor entrega el producto o servicio contratado junto con su factura fiscal y acta de conformidad del área.',
          responsable: 'Gerencia Solicitante',
          sandboxStepId: 2,
        },
        {
          id: 'ej-3',
          label: '3. Imputación del Devengado',
          subtitle: 'Afectación del compromiso preventivo',
          role: 'PRESUPUESTOS',
          type: 'process',
          column: 2,
          row: 1,
          description:
            'Se registra el monto exacto de la factura. Si el gasto fue menor a lo presupuestado, el excedente retorna automáticamente al saldo disponible.',
          responsable: 'Presupuestos / Contabilidad',
          sandboxStepId: 3,
        },
        {
          id: 'ej-4',
          label: '4. "Ya Salió el Dinero" (Lic. Zaida)',
          subtitle: 'Reducción del dinero en el sistema',
          role: 'TESORERIA',
          type: 'decision',
          column: 3,
          row: 1,
          description:
            'La Lic. Zaida dicta "Ya salió el dinero", emite la transferencia/cheque bancario y reduce el dinero en el sistema, completando la ejecución financiera.',
          responsable: 'Lic. Zaida (Tesorería)',
          sandboxStepId: 4,
        },
        {
          id: 'ej-5',
          label: '5. Saldo Pagado en el Sistema',
          subtitle: 'Gasto formalmente ejecutado',
          role: 'SISTEMA',
          type: 'success',
          column: 4,
          row: 1,
          description:
            'El sistema actualiza en tiempo real el saldo ejecutado y la bitácora inmutable de auditoría.',
          responsable: 'Sistema POA',
        },
      ],
      edges: [
        { id: 'eej-1-2', from: 'ej-1', to: 'ej-2', animated: true, variant: 'primary' },
        { id: 'eej-2-3', from: 'ej-2', to: 'ej-3', animated: true, variant: 'primary', label: 'Factura devengada' },
        { id: 'eej-3-4', from: 'ej-3', to: 'ej-4', animated: true, variant: 'success', label: 'Pase a Tesorería' },
        { id: 'eej-4-5', from: 'ej-4', to: 'ej-5', animated: true, variant: 'success', label: 'Dinero desembolsado' },
      ],
    },

    'ejec-directo': {
      nodes: [
        {
          id: 'ejd-1',
          label: 'Gasto Menor (<= 2,000 Bs)',
          subtitle: 'Sin requerimiento de contratación',
          role: 'GERENTE',
          type: 'start',
          column: 0,
          row: 1,
          description: 'Gasto de baja cuantía liquidado inmediatamente.',
          responsable: 'Caja Chica',
        },
        {
          id: 'ejd-2',
          label: 'Imputación Directa en Ejecución',
          subtitle: 'Reducción líquida inmediata',
          role: 'PRESUPUESTOS',
          type: 'process',
          column: 2,
          row: 1,
          description: 'Se descuenta del saldo disponible sin reserva preventiva previa.',
          responsable: 'Contabilidad',
        },
        {
          id: 'ejd-3',
          label: 'Pago y Cierre Contable',
          subtitle: 'Gasto menor asentado',
          role: 'SISTEMA',
          type: 'success',
          column: 4,
          row: 1,
          description: 'El gasto menor queda registrado en el reporte de ejecuciones.',
          responsable: 'Sistema POA',
        },
      ],
      edges: [
        { id: 'eejd-1-2', from: 'ejd-1', to: 'ejd-2', animated: true, variant: 'primary' },
        { id: 'eejd-2-3', from: 'ejd-2', to: 'ejd-3', animated: true, variant: 'success' },
      ],
    },

    'ejec-anulacion': {
      nodes: [
        {
          id: 'eja-1',
          label: 'Ahorro / Saldo Sobrante',
          subtitle: 'Factura menor al preventivo aprobado',
          role: 'GERENTE',
          type: 'start',
          column: 0,
          row: 1,
          description: 'La compra se concretó por un monto menor al preventivo reservado.',
          responsable: 'Gerencia Solicitante',
        },
        {
          id: 'eja-2',
          label: 'Liberación Inmediata de Diferencia',
          subtitle: 'Retorno al disponible del área',
          role: 'SISTEMA',
          type: 'process',
          column: 2,
          row: 1,
          description: 'El remanente no gastado regresa al disponible de la gerencia.',
          responsable: 'Motor POA',
        },
        {
          id: 'eja-3',
          label: 'Techo Disponible Rehabilitado',
          subtitle: 'Fondos libres para nuevos gastos',
          role: 'PRESUPUESTOS',
          type: 'success',
          column: 4,
          row: 1,
          description: 'El presupuesto no se pierde ni se congela.',
          responsable: 'Presupuestos',
        },
      ],
      edges: [
        { id: 'eeja-1-2', from: 'eja-1', to: 'eja-2', animated: true, variant: 'warning' },
        { id: 'eeja-2-3', from: 'eja-2', to: 'eja-3', animated: true, variant: 'success' },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ESCENARIOS DE PRUEBA / SIMULADOR GUIADO (SANDBOX)
// ─────────────────────────────────────────────────────────────────────────────

export const ESCENARIOS_SANDBOX: Record<ModuloGuiaId, SandboxScenario> = {
  // 1. SIMULADOR MC
  memorias: {
    id: 'sim-memorias',
    moduloId: 'memorias',
    alternativaId: 'mc-individual',
    titulo: 'Simulador: De Techos Nuevos a Aprobación Oficial en el POA',
    resumen:
      'Experimenta cómo Presupuestos dicta techos, el elaborador formula borradores, el Gerente aprueba, Planificación revisa operaciones y Presupuestos formaliza en el POA.',
    steps: [
      {
        stepIndex: 1,
        title: 'Presupuestos Dicta Techos Nuevos',
        instruction:
          'Observa el Techo Dictado por Presupuestos para tu Gerencia (ej: 150,000.00 Bs) y haz clic en "+ Nueva Memoria" para inicializar el borrador.',
        hint: 'Ninguna gerencia puede formular por encima del techo asignado por Presupuestos.',
        targetId: 'btn-nueva-memoria',
        roleContext: 'Rol: Presupuestos / Elaborador',
        cardPosition: 'bottom',
        actionExpected: 'click',
        feedbackOnComplete: 'Techo verificado y modal de formulación de borrador desplegado.',
      },
      {
        stepIndex: 2,
        title: 'Elaborador Formula Borrador (Nuevo o Base Anterior)',
        instruction:
          'Selecciona la partida presupuestaria (ej: 34110 Combustibles) y la Operación POA correspondiente.',
        hint: 'Puedes formular ítems nuevos o apoyarte en la base de gastos de la gestión pasada.',
        targetId: 'select-partida-operacion',
        roleContext: 'Rol: Elaborador de Área',
        cardPosition: 'bottom',
        actionExpected: 'select',
        feedbackOnComplete: 'Partida vinculada y articulada a la Operación POA.',
      },
      {
        stepIndex: 3,
        title: 'Aprobación del Gerente de Área',
        instruction:
          'Haz clic en "Aprobar Borrador (Gerente de Área)" para validar la pertinencia técnica del requerimiento.',
        hint: 'El Gerente correspondiente debe dar el visto bueno formal antes de remitir a Planificación.',
        targetId: 'btn-aprobar-gerente-mc',
        roleContext: 'Rol: Gerente del Área Correspondiente',
        cardPosition: 'top',
        actionExpected: 'confirm',
        feedbackOnComplete: 'Gerente aprueba pertinencia: Estado pasa a ENVIADO_PLANIFICACION.',
      },
      {
        stepIndex: 4,
        title: 'Revisión por Planificación (Operaciones POA)',
        instruction:
          'Haz clic en "Verificar Operaciones (Planificación)" para constatar que las operaciones que manejan estén correctas.',
        hint: 'Planificación verifica la concordancia de metas con el PEI/POA institucional.',
        targetId: 'btn-planif-check-mc',
        roleContext: 'Rol: Dirección de Planificación',
        cardPosition: 'top',
        actionExpected: 'confirm',
        feedbackOnComplete: 'Planificación certifica que las operaciones son correctas y concordantes.',
      },
      {
        stepIndex: 5,
        title: 'Aprobación Final de Presupuestos para el POA',
        instruction:
          'Presiona "Aprobar para el POA Oficial (Presupuestos)" para consolidar la MC en el presupuesto definitivo.',
        hint: 'En caso de negación por recorte global, Presupuestos notifica a todos para rebajar y cuadrar a futuro.',
        targetId: 'btn-presup-aprobar-mc',
        roleContext: 'Rol: Dirección de Presupuestos',
        cardPosition: 'top',
        actionExpected: 'confirm',
        feedbackOnComplete: '¡Memoria incorporada al POA Oficial consolidado con éxito!',
      },
    ],
  },

  // 2. SIMULADOR MODIFICACIONES
  modificaciones: {
    id: 'sim-modificaciones',
    moduloId: 'modificaciones',
    alternativaId: 'mod-inter',
    titulo: 'Simulador: Traspasos Intra-Gerencia e Inter-Gerencias con Aceptación',
    resumen:
      'Aprende a realizar un traspaso entre partidas de la misma gerencia y el circuito inter-gerencias donde la otra gerencia tiene que aceptar antes de Presupuestos.',
    steps: [
      {
        stepIndex: 1,
        title: 'Iniciar Modificación Presupuestaria',
        instruction:
          'Haz clic en "+ Nuevo Traspaso / Modificación" para seleccionar la modalidad del movimiento.',
        hint: 'Distingue entre movimientos de la misma gerencia o peticiones inter-gerenciales.',
        targetId: 'btn-nueva-modificacion',
        roleContext: 'Rol: Gerente del Área Solicitante',
        cardPosition: 'bottom',
        actionExpected: 'click',
        feedbackOnComplete: 'Modal de reasignación presupuestaria desplegado.',
      },
      {
        stepIndex: 2,
        title: 'Petición a Otra Gerencia (Inter-Gerencias)',
        instruction:
          'Activa la pestaña "Traspaso Inter-Áreas" y formula la petición de 5,000.00 Bs a la Gerencia de Infraestructura.',
        hint: 'La gerencia solicitante pide a otra gerencia para disponer del dinero de sus partidas.',
        targetId: 'tab-traspaso-inter',
        roleContext: 'Rol: Gerente Solicitante',
        cardPosition: 'bottom',
        actionExpected: 'select',
        feedbackOnComplete: 'Petición inter-gerencias remitida a la bandeja de la otra gerencia.',
      },
      {
        stepIndex: 3,
        title: 'LA OTRA GERENCIA TIENE QUE ACEPTAR',
        instruction:
          'Haz clic en "Aceptar Cesión de Presupuesto" simulando la aceptación formal de la otra gerencia.',
        hint: 'Regla indispensable: Sin la aceptación de la gerencia dueña del dinero, nunca va a Presupuestos.',
        targetId: 'btn-aceptar-cedente',
        roleContext: 'Rol: Gerente de la Otra Gerencia (Cedente)',
        cardPosition: 'top',
        actionExpected: 'confirm',
        feedbackOnComplete: '¡La otra gerencia ha aceptado! Recién ahora avanza a Presupuestos.',
      },
      {
        stepIndex: 4,
        title: 'Evaluación y Dictamen en Presupuestos',
        instruction:
          'Presiona "Verificar Dinero y Aprobar Traspaso" para que Presupuestos oficialice la modificación.',
        hint: 'Presupuestos verifica que haya dinero disponible y el por qué para emitir la resolución.',
        targetId: 'btn-aprobar-presupuestos',
        roleContext: 'Rol: Dirección de Presupuestos',
        cardPosition: 'top',
        actionExpected: 'click',
        feedbackOnComplete: '¡Modificación consumada! Techos y partidas reasignados con éxito.',
      },
    ],
  },

  // 3. SIMULADOR CERTIFICACIONES
  certificaciones: {
    id: 'sim-certificaciones',
    moduloId: 'certificaciones',
    alternativaId: 'cert-estandar',
    titulo: 'Simulador: Gasto > 2,000 Bs, Certificación POA y Desembolso por Lic. Zaida',
    resumen:
      'Comprueba el umbral de 2,000 Bs o contrataciones, el OK de Planificación, el OK de Presupuestos y el dictamen "Ya salió el dinero" de la Lic. Zaida.',
    steps: [
      {
        stepIndex: 1,
        title: 'Gerencia Solicita Gasto (> 2,000 Bs)',
        instruction:
          'Haz clic en "+ Nueva Solicitud de Certificación" para registrar un gasto de 4,800.00 Bs (mayor a 2,000 Bs o contratación).',
        hint: 'Al ser mayor a 2,000 Bs o contratación, la Certificación POA preventiva es obligatoria.',
        targetId: 'btn-nueva-certificacion',
        roleContext: 'Rol: Gerencia Solicitante',
        cardPosition: 'bottom',
        actionExpected: 'click',
        feedbackOnComplete: 'Solicitud formal de 4,800.00 Bs ingresada.',
      },
      {
        stepIndex: 2,
        title: 'Planificación da el "OK" Técnico',
        instruction:
          'Haz clic en "Planificación: Dar OK Técnico" tras comprobar la articulación con las metas operativas.',
        hint: 'Planificación da el visto bueno técnico y la solicitud avanza a Presupuestos.',
        targetId: 'btn-certificar-planificacion',
        roleContext: 'Rol: Dirección de Planificación',
        cardPosition: 'top',
        actionExpected: 'confirm',
        feedbackOnComplete: 'Planificación da el OK: Solicitud avanza a Presupuestos.',
      },
      {
        stepIndex: 3,
        title: 'Presupuestos Verifica y da el "OK"',
        instruction:
          'Presiona "Presupuestos: Verificar Dinero y Dar OK". Ya está aprobado, pero el dinero AÚN NO SALIÓ.',
        hint: 'Presupuestos reserva el crédito preventivamente. El dinero sigue en caja hasta que Tesorería pague.',
        targetId: 'btn-aprobar-preventivo',
        roleContext: 'Rol: Dirección de Presupuestos',
        cardPosition: 'top',
        actionExpected: 'confirm',
        feedbackOnComplete: 'Presupuestos da el OK: Preventivo aprobado (el dinero aún no salió).',
      },
      {
        stepIndex: 4,
        title: 'Lic. Zaida dicta "Ya Salió el Dinero" y Reduce Saldo',
        instruction:
          'Haz clic en "Lic. Zaida (Tesorería): Dictar \'Ya Salió el Dinero\' y Reducir Saldo".',
        hint: 'La Lic. Zaida ejecuta el pago formal y reduce efectivamente el dinero en el sistema.',
        targetId: 'btn-zaida-desembolso',
        roleContext: 'Rol: Lic. Zaida (Dirección de Tesorería)',
        cardPosition: 'top',
        actionExpected: 'click',
        feedbackOnComplete: '¡La Lic. Zaida dicta "Ya salió el dinero" y reduce el saldo en el sistema exitosamente!',
      },
    ],
  },

  // 4. SIMULADOR EJECUCION
  ejecucion: {
    id: 'sim-ejecucion',
    moduloId: 'ejecucion',
    alternativaId: 'ejec-cert',
    titulo: 'Simulador: Preventivo Aprobado a Reducción de Dinero por Lic. Zaida',
    resumen:
      'Observa cómo el visto bueno de Presupuestos mantiene el dinero en reserva y cómo la Lic. Zaida confirma la salida efectiva de fondos.',
    steps: [
      {
        stepIndex: 1,
        title: 'Identificar Certificación Preventiva Aprobada',
        instruction:
          'Localiza la Certificación POA aprobada (4,800.00 Bs en reserva) y haz clic en "Ejecutar Factura / Gasto".',
        hint: 'El dinero está garantizado preventivamente pero no ha salido físicamente de la cuenta.',
        targetId: 'btn-ejecutar-desde-cert',
        roleContext: 'Rol: Contabilidad / Gerencia',
        cardPosition: 'bottom',
        actionExpected: 'click',
        feedbackOnComplete: 'Formulario de devengado contra preventivo desplegado.',
      },
      {
        stepIndex: 2,
        title: 'Registrar Factura y Conformidad',
        instruction:
          'Ingresa el número de factura fiscal (Factura N° 84920) y haz clic para imputar el devengado.',
        hint: 'Se constata la recepción a conformidad del bien o servicio.',
        targetId: 'input-factura-monto',
        roleContext: 'Rol: Contabilidad / Finanzas',
        cardPosition: 'top',
        actionExpected: 'type',
        feedbackOnComplete: 'Factura devengada y lista para desembolso de Tesorería.',
      },
      {
        stepIndex: 3,
        title: 'Lic. Zaida Dicta "Ya Salió el Dinero"',
        instruction:
          'Haz clic en "Lic. Zaida: Confirmar Pago y Reducir Dinero del Sistema" para asentar la salida bancaria.',
        hint: 'En este instante exacto, la Lic. Zaida reduce el dinero en el sistema y liquida la obligación.',
        targetId: 'btn-confirmar-pago',
        roleContext: 'Rol: Lic. Zaida (Tesorería)',
        cardPosition: 'top',
        actionExpected: 'confirm',
        feedbackOnComplete: 'La Lic. Zaida reduce el dinero en el sistema: Gasto Pagado Definitivo.',
      },
      {
        stepIndex: 4,
        title: 'Verificar Reducción Efectiva en Indicadores',
        instruction:
          'Comprueba cómo los KPIs actualizan: Comprometido pasa de 4,800 a 0.00 Bs y Pagado sube a 4,800.00 Bs.',
        hint: 'El sistema refleja la salida real de fondos en la bitácora inmutable.',
        targetId: 'kpi-saldo-vigente',
        roleContext: 'Rol: Consulta Institucional',
        cardPosition: 'top',
        actionExpected: 'click',
        feedbackOnComplete: '¡Ciclo de gasto, certificación preventiva y desembolso concluido con éxito!',
      },
    ],
  },
};
