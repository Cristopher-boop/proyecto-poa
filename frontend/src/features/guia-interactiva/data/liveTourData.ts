import type { ModuloGuiaId, RolTour, LiveTourStep, SimulatedModalConfig } from '../types/guia.types.ts';

export interface TourRoleInfo {
  role: RolTour;
  label: string;
  badge: string;
  description: string;
}

export const ROLES_TOUR_INFO: Record<RolTour, TourRoleInfo> = {
  gerente: {
    role: 'gerente',
    label: 'Gerente de Área',
    badge: 'Gerencia',
    description: 'Formula y avala requerimientos de su área, monitorea estado en espera y atiende readecuaciones de techos.',
  },
  elaborador: {
    role: 'elaborador',
    label: 'Técnico Elaborador',
    badge: 'Elaborador',
    description: 'Formula borradores técnicos ítem por ítem y los remite a su Gerente de Área.',
  },
  planificacion: {
    role: 'planificacion',
    label: 'Dirección de Planificación',
    badge: 'Planificación',
    description: 'Revisa operaciones del POA y concordancia con las metas del PEI. Otorga visto bueno técnico.',
  },
  presupuestos: {
    role: 'presupuestos',
    label: 'Dirección de Presupuestos',
    badge: 'Presupuestos',
    description: 'Dicta techos nuevos, aprueba MCs al POA oficial, evalúa traspasos y emite alertas de recorte.',
  },
  tesoreria: {
    role: 'tesoreria',
    label: 'Tesorería (Lic. Zaida)',
    badge: 'Tesorería',
    description: 'Verifica devengado y factura fiscal. Dicta formalmente: "Ya salió el dinero" y reduce saldo líquido.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOURS POR MÓDULO Y PERSPECTIVA DE ROL
// ─────────────────────────────────────────────────────────────────────────────
export const LIVE_TOUR_DATA_BY_ROLE: Record<
  ModuloGuiaId,
  Record<RolTour, { title: string; steps: LiveTourStep[] }>
> = {
  // ===========================================================================
  // 1. MEMORIAS DE CÁLCULO
  // ===========================================================================
  memorias: {
    gerente: {
      title: 'Guía Gerente: De Formulación de MCs a Seguimiento en Espera y Techos',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'memorias',
          route: '/',
          selector: '[data-tour="tour-nav-memorias"]',
          title: '1. En el Menú Lateral: Ir a Memorias de Cálculo',
          role: 'Gerente del Área',
          instruction:
            'Como Gerente de Área, en el menú lateral accede a la sección de "Memorias de Cálculo" para formular o revisar los borradores de tu unidad.',
          hint: 'Haz clic en el enlace del menú o en "Simular" para que el sistema te traslade de inmediato.',
          placement: 'right',
        },
        {
          stepIndex: 2,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-btn-memoria"], [data-tour="tour-btn-duplicar"]',
          title: '2. Formular o Duplicar Memorias de tu Área',
          role: 'Gerente del Área',
          instruction:
            'Como Gerente, puedes formular directamente las memorias para tu área y aprobarlas tú mismo, o presionar "Duplicar Memorias de Gestión Anterior" para trabajar sobre la base presupuestaria del año previo con reajustes de inflación.',
          hint: 'Toca el botón o presiona "Simular" para abrir el modal interactivo de la memoria.',
          placement: 'bottom',
          modalConfig: {
            type: 'memoria_form',
            title: 'Borrador de Memoria de Cálculo (POA 2026)',
            subtitle: 'Configuración técnica de partida, operación y monto asignado',
            actionButtonLabel: 'Aprobar Pertinencia y Enviar a Revisión',
            defaultData: {
              monto: '15,000.00',
              justificacion: 'Adquisición de combustible y lubricantes para el parque automotor operativo de la gerencia.',
            },
            roleAdvice:
              'Como Gerente de Área, tu labor es constatar que el requerimiento responda a las metas de tu gerencia y no sobrepase el techo dictado por Presupuestos.',
            onSuccessMessage: '✓ Pertinencia aprobada por Gerente: Memoria enviada al circuito de Planificación y Presupuestos.',
          },
        },
        {
          stepIndex: 3,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-tab-espera"]',
          title: '3. Monitorear Estado de tu Solicitud en "En Espera"',
          role: 'Gerente del Área',
          instruction:
            'En la pestaña "En Espera" (o Pendiente Gerencia) consultas el estado en trámite de las memorias de cálculo de tu unidad.',
          limiteRol:
            'LÍMITE DE RESPONSABILIDAD: Como Gerente de Área no tienes acceso ni permisos para autorizar las pestañas de Planificación ni Presupuestos. Tu labor concluye al dar la pertinencia. Ahora debes esperar a que Planificación revise operaciones y Presupuestos apruebe al POA oficial.',
          hint: 'Mientras la memoria esté en revisión técnica, queda en modo solo lectura para garantizar la trazabilidad institucional.',
          placement: 'bottom',
          targetTab: 'espera',
        },
        {
          stepIndex: 4,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-tab-aprobadas"]',
          title: '4. ¿Dónde Aparece al Finalizar? En "Aprobadas POA"',
          role: 'Gerente del Área',
          instruction:
            'Una vez que Presupuestos da la aprobación final, tu memoria se incorpora formalmente aquí en "Aprobadas POA". A partir de este momento ya cuenta con crédito vigente para gastos.',
          hint: 'Aquí podrás auditar el correlativo oficial y consultar el saldo disponible para futuras certificaciones.',
          placement: 'bottom',
          targetTab: 'aprobadas',
        },
        {
          stepIndex: 5,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-alerta-recorte"]',
          title: '5. ¿Qué Pasa si Presupuestos Reduce el Techo?',
          role: 'Dirección de Presupuestos',
          instruction:
            'En caso de recorte financiero, Presupuestos NO rechaza las MCs aisladas. Presupuestos dicta un nuevo techo y emite esta alerta formal notificando a tu gerencia para rebajar montos.',
          hint: 'Tu gerencia solo debe entrar a ajustar montos hasta igualar el nuevo saldo comunicado por Presupuestos.',
          placement: 'bottom',
        },
      ],
    },

    elaborador: {
      title: 'Guía Elaborador: Formulación de Ítems y Envío a Gerente',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'memorias',
          route: '/',
          selector: '[data-tour="tour-nav-memorias"]',
          title: '1. Ir a Memorias de Cálculo',
          role: 'Técnico Elaborador',
          instruction: 'En el menú lateral, dirígete a Memorias de Cálculo para crear tus borradores operativos.',
          placement: 'right',
        },
        {
          stepIndex: 2,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-btn-memoria"]',
          title: '2. Formular Detalle de Gastos',
          role: 'Técnico Elaborador',
          instruction: 'Presiona "+ Formular Memoria" para especificar precio unitario, cantidad y meses de gasto.',
          placement: 'bottom',
          modalConfig: {
            type: 'memoria_form',
            title: 'Formulación Técnica de Borrador',
            subtitle: 'Registro de ítems y detalle presupuestario',
            actionButtonLabel: 'Guardar Borrador y Enviar a Gerente',
            defaultData: { monto: '15,000.00' },
            onSuccessMessage: '✓ Borrador registrado y enviado para aprobación del Gerente de Área.',
          },
        },
        {
          stepIndex: 3,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-tab-espera"]',
          title: '3. Seguimiento de Aprobación por tu Gerente',
          role: 'Técnico Elaborador',
          instruction: 'Tu memoria pasa a "En Espera" hasta que tu Gerente apruebe la pertinencia operativa.',
          placement: 'bottom',
          targetTab: 'espera',
        },
      ],
    },

    planificacion: {
      title: 'Guía Planificación: Revisión de Operaciones POA y Metas PEI',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-tab-planificacion"]',
          title: '1. Pestaña Revisión Planificación SPO',
          role: 'Dirección de Planificación',
          instruction:
            'En esta pestaña, Planificación revisa las memorias formuladas por todas las gerencias, enfocado en las operaciones que manejan y su concordancia con el PEI.',
          placement: 'bottom',
          targetTab: 'planificacion',
        },
        {
          stepIndex: 2,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-tab-planificacion"]',
          title: '2. Dictamen Técnico de Planificación',
          role: 'Dirección de Planificación',
          instruction: 'Verifica la alineación estratégica de la memoria y emite el visto bueno técnico.',
          placement: 'bottom',
          modalConfig: {
            type: 'planif_review',
            title: 'Revisión Técnica de Operaciones (Planificación)',
            subtitle: 'Comprobación de objetivos estratégicos y actividades POA',
            actionButtonLabel: '✓ Otorgar Visto Bueno Técnico',
            onSuccessMessage: '✓ Visto bueno técnico otorgado: La memoria avanza a Presupuestos.',
          },
        },
      ],
    },

    presupuestos: {
      title: 'Guía Presupuestos: Techos Financieros y Aprobación al POA Oficial',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-gestion"]',
          title: '1. Presupuestos Dicta los Techos Nuevos',
          role: 'Dirección de Presupuestos',
          instruction:
            'La Dirección de Presupuestos dicta y fija los techos iniciales de cada gerencia para la gestión fiscal activa.',
          placement: 'bottom',
        },
        {
          stepIndex: 2,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-tab-finanzas"]',
          title: '2. Pestaña Revisión Presupuestos',
          role: 'Dirección de Presupuestos',
          instruction:
            'En la pestaña "Finanzas / Presupuestos", revisas que cada memoria cuente con crédito financiero y autorizas su paso al POA oficial.',
          placement: 'bottom',
          targetTab: 'finanzas',
          modalConfig: {
            type: 'presup_review',
            title: 'Aprobación Final al POA Oficial',
            subtitle: 'Verificación de crédito en clasificador presupuestario',
            actionButtonLabel: '✓ Incorporar al POA Oficial',
            onSuccessMessage: '✓ Memoria incorporada formalmente al POA oficial de la gestión.',
          },
        },
        {
          stepIndex: 3,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-alerta-recorte"]',
          title: '3. Procedimiento ante Recortes de Techo',
          role: 'Dirección de Presupuestos',
          instruction:
            'Si hay una reducción presupuestaria general, Presupuestos no rechaza MCs aisladas: emite la alerta formal indicando el nuevo techo para que las gerencias rebajen montos.',
          placement: 'bottom',
        },
      ],
    },

    tesoreria: {
      title: 'Guía Tesorería: Preparación para Desembolso de Memorias Aprobadas',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'memorias',
          route: '/memorias',
          selector: '[data-tour="tour-tab-aprobadas"]',
          title: '1. Memorias Disponibles para Ejecución',
          role: 'Dirección de Tesorería',
          instruction:
            'Tesorería supervisa las memorias aprobadas en el POA que servirán como base para la emisión de certificaciones y futuros pagos bancarios.',
          placement: 'bottom',
          targetTab: 'aprobadas',
        },
      ],
    },
  },

  // ===========================================================================
  // 2. MODIFICACIONES PRESUPUESTARIAS (TRASPASOS)
  // ===========================================================================
  modificaciones: {
    gerente: {
      title: 'Guía Gerente: Traspasos Internos vs Inter-Gerencias (Aceptación Previa)',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'modificaciones',
          route: '/',
          selector: '[data-tour="tour-nav-traspasos"]',
          title: '1. En el Menú Lateral: Ir a Modificaciones',
          role: 'Gerencia Solicitante',
          instruction:
            'En el menú lateral accede a "Modificaciones" para gestionar readecuaciones de saldo entre partidas presupuestarias.',
          placement: 'right',
        },
        {
          stepIndex: 2,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-btn-traspaso"]',
          title: '2. Iniciar Solicitud de Traspaso',
          role: 'Gerencia Solicitante',
          instruction:
            'Presiona "+ Nueva Solicitud". Podrás configurar un traspaso dentro de tu misma área o solicitar presupuesto a otra gerencia.',
          placement: 'bottom',
          modalConfig: {
            type: 'traspaso_form',
            title: 'Configurar Modificación Presupuestaria',
            subtitle: 'Traspaso de fondos compensado (Suma neta = 0.00 Bs)',
            actionButtonLabel: 'Registrar Solicitud de Traspaso',
            onSuccessMessage: '✓ Solicitud de traspaso registrada en el circuito institucional.',
          },
        },
        {
          stepIndex: 3,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-presup-mod"]',
          title: '3. Caso 1: Misma Gerencia (Directo a Presupuestos)',
          role: 'Presupuestos / Gerencia',
          instruction:
            'Cuando el traspaso es entre partidas de una misma gerencia, la solicitud viaja directo a Presupuestos. Presupuestos verifica que haya dinero disponible y efectúa la modificación.',
          placement: 'bottom',
          targetTab: 'presupuestos',
        },
        {
          stepIndex: 4,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-gerencia-mod"]',
          title: '4. Caso 2: Inter-Gerencias (LA OTRA GERENCIA TIENE QUE ACEPTAR)',
          role: 'Gerencia Cedente (Donante)',
          instruction:
            'En traspasos inter-gerencias, la gerencia solicitante pide dinero a otra gerencia. La solicitud llega a esta bandeja: LA OTRA GERENCIA TIENE QUE ACEPTAR PRIMERO.',
          limiteRol:
            'REGLA INDISPENSABLE: Sin la aceptación expresa en el sistema del Gerente donante en esta bandeja, la solicitud NUNCA llega a Presupuestos.',
          hint: 'Si tu gerencia es la donante, debes entrar aquí para aceptar ceder tus fondos.',
          placement: 'bottom',
          targetTab: 'gerencia_cedente',
        },
        {
          stepIndex: 5,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-aprobadas-mod"]',
          title: '5. Modificación Consumada en el POA',
          role: 'Sistema POA',
          instruction:
            'En "Aprobadas" se visualizan los traspasos concluidos. El disponible de las partidas se recalcula en tiempo real en la bitácora inmutable.',
          placement: 'bottom',
          targetTab: 'aprobadas',
        },
      ],
    },

    elaborador: {
      title: 'Guía Elaborador: Consulta de Modificaciones del Área',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-aprobadas-mod"]',
          title: '1. Consulta de Saldos Modificados',
          role: 'Técnico Elaborador',
          instruction: 'Revisa las partidas que han incrementado o disminuido saldo para formular gastos de acuerdo al disponible real.',
          placement: 'bottom',
        },
      ],
    },

    planificacion: {
      title: 'Guía Planificación: Trazabilidad de Metas en Modificaciones',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-aprobadas-mod"]',
          title: '1. Auditoría de Impacto en Metas PEI',
          role: 'Dirección de Planificación',
          instruction: 'Supervisa que las modificaciones entre partidas no desfinancien las operaciones prioritarias del POA.',
          placement: 'bottom',
        },
      ],
    },

    presupuestos: {
      title: 'Guía Presupuestos: Verificación de Fondos y Aprobación de Traspasos',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-presup-mod"]',
          title: '1. Bandeja de Evaluación de Traspasos',
          role: 'Dirección de Presupuestos',
          instruction:
            'En "Pendientes Presupuestos", verificas que haya dinero real en la partida donante y que, si fue inter-gerencias, la otra gerencia ya haya aceptado formalmente.',
          placement: 'bottom',
          targetTab: 'presupuestos',
          modalConfig: {
            type: 'presup_review',
            title: 'Verificación Financiera de Traspaso',
            subtitle: 'Comprobación de partida donante y receptora',
            actionButtonLabel: '✓ Aprobar Traspaso Presupuestario',
            onSuccessMessage: '✓ Traspaso autorizado y aplicado en el clasificador presupuestario.',
          },
        },
        {
          stepIndex: 2,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-aprobadas-mod"]',
          title: '2. Consolidación en la Bitácora',
          role: 'Dirección de Presupuestos',
          instruction: 'El movimiento queda asentado como registro inmutable garantizando la regla de suma neta cero.',
          placement: 'bottom',
          targetTab: 'aprobadas',
        },
      ],
    },

    tesoreria: {
      title: 'Guía Tesorería: Trazabilidad Financiera de Traspasos',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'modificaciones',
          route: '/traspasos',
          selector: '[data-tour="tour-tab-aprobadas-mod"]',
          title: '1. Monitoreo de Disponibilidad Líquida',
          role: 'Dirección de Tesorería',
          instruction: 'Verifica los nuevos techos por partida para preparar futuras órdenes de pago bancarias.',
          placement: 'bottom',
        },
      ],
    },
  },

  // ===========================================================================
  // 3. CERTIFICACIONES POA Y PAGOS
  // ===========================================================================
  certificaciones: {
    gerente: {
      title: 'Guía Gerente: Solicitud de Certificación (> 2,000 Bs) y Circuito de Pago',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'certificaciones',
          route: '/',
          selector: '[data-tour="tour-nav-certificaciones"]',
          title: '1. En el Menú Lateral: Ir a Certificación POA',
          role: 'Gerencia Solicitante',
          instruction: 'En el menú lateral accede a "Certificación POA" para tramitar reservas preventivas de presupuesto.',
          placement: 'right',
        },
        {
          stepIndex: 2,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-btn-certificacion"]',
          title: '2. Solicitar Gasto (> 2,000 Bs o Contratación)',
          role: 'Gerencia Solicitante',
          instruction:
            'Haz clic en "+ Nueva Solicitud". En caso de que el gasto sea mayor a 2,000 Bs o corresponda a contrataciones (PAC), va obligatoriamente a Certificación POA.',
          placement: 'bottom',
          modalConfig: {
            type: 'certificacion_form',
            title: 'Solicitud de Certificación POA Preventiva',
            subtitle: 'Reserva presupuestaria para procesos de compra o contratación',
            actionButtonLabel: 'Solicitar Certificación Preventiva POA',
            onSuccessMessage: '✓ Solicitud de certificación enviada para visto bueno de Planificación.',
          },
        },
        {
          stepIndex: 3,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-tab-pendiente_planificacion"]',
          title: '3. Planificación da el "OK" Técnico',
          role: 'Dirección de Planificación',
          instruction:
            'En "Pendientes Planificación", el equipo técnico revisa que el requerimiento coincida con las operaciones del POA y emite el "OK" técnico para que avance a Presupuestos.',
          limiteRol: 'Como Gerente de Área, puedes consultar que tu trámite está en revisión técnica sin poder forzar la aprobación.',
          placement: 'bottom',
          targetTab: 'pendiente_planificacion',
        },
        {
          stepIndex: 4,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-tab-pendiente_presupuestos"]',
          title: '4. Presupuestos Verifica y da el "OK" (Preventivo)',
          role: 'Dirección de Presupuestos',
          instruction:
            'Presupuestos verifica que haya crédito en la partida y aprueba el preventivo. Ya está aprobado, pero el dinero AÚN NO SALIÓ.',
          placement: 'bottom',
          targetTab: 'pendiente_presupuestos',
        },
        {
          stepIndex: 5,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-tab-pendiente_tesoreria"], [data-tour="tour-tab-aprobado"]',
          title: '5. La Lic. Zaida Dicta: "Ya Salió el Dinero" y Reduce Saldo',
          role: 'Lic. Zaida (Dirección de Tesorería)',
          instruction:
            'Una vez entregada la factura comercial, la Lic. Zaida es quien dicta formalmente: "Ya salió el dinero", ejecuta la transferencia bancaria y reduce efectivamente el dinero en el sistema.',
          hint: 'Tesorería liquida el comprobante y el saldo comprometido pasa a pagado definitivo.',
          placement: 'bottom',
          targetTab: 'aprobado',
        },
      ],
    },

    elaborador: {
      title: 'Guía Elaborador: Seguimiento de Certificaciones de su Gerencia',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-tab-aprobado"]',
          title: '1. Comprobar Certificaciones Aprobadas',
          role: 'Técnico Elaborador',
          instruction: 'Verifica los códigos oficiales de certificación para iniciar las órdenes de compra o términos de referencia.',
          placement: 'bottom',
        },
      ],
    },

    planificacion: {
      title: 'Guía Planificación: Emisión de Visto Bueno Técnico en Certificaciones',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-tab-pendiente_planificacion"]',
          title: '1. Bandeja de Certificaciones Pendientes de Planificación',
          role: 'Dirección de Planificación',
          instruction: 'Revisa las solicitudes de contratación y compras mayores a 2,000 Bs verificando la vinculación con el POA.',
          placement: 'bottom',
          targetTab: 'pendiente_planificacion',
          modalConfig: {
            type: 'planif_review',
            title: 'Validación Técnica de Certificación POA',
            subtitle: 'Conformidad con metas y operaciones institucionales',
            actionButtonLabel: '✓ Dar Visto Bueno Técnico (Pase a Presupuestos)',
            onSuccessMessage: '✓ Visto bueno técnico otorgado: Solicitud remitida a Presupuestos.',
          },
        },
      ],
    },

    presupuestos: {
      title: 'Guía Presupuestos: Control de Saldo y Emisión de Preventivo',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-tab-pendiente_presupuestos"]',
          title: '1. Comprobar Crédito y Emitir Preventivo',
          role: 'Dirección de Presupuestos',
          instruction:
            'Verifica que la partida tenga disponible y emite la aprobación preventiva. Recuerda que el dinero AÚN NO HA SALIDO.',
          placement: 'bottom',
          targetTab: 'pendiente_presupuestos',
          modalConfig: {
            type: 'presup_review',
            title: 'Aprobación Preventiva de Presupuestos',
            subtitle: 'Reserva formal de crédito en la partida',
            actionButtonLabel: '✓ Presupuestos: Aprobar Preventivo',
            onSuccessMessage: '✓ Preventivo aprobado: Crédito reservado en la partida institucional.',
          },
        },
      ],
    },

    tesoreria: {
      title: 'Guía Lic. Zaida (Tesorería): Liquidación y Salida Efectiva de Dinero',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'certificaciones',
          route: '/certificaciones',
          selector: '[data-tour="tour-tab-pendiente_tesoreria"], [data-tour="tour-tab-aprobado"]',
          title: '1. Recepción de Factura y Liquidación por la Lic. Zaida',
          role: 'Lic. Zaida (Tesorería)',
          instruction:
            'En esta bandeja, la Lic. Zaida constata la factura legal y dicta: "Ya salió el dinero", reduciendo el saldo del sistema tras la transferencia bancaria.',
          placement: 'bottom',
          modalConfig: {
            type: 'tesoreria_pago',
            title: 'Liquidación Bancaria y Salida de Fondos',
            subtitle: 'Imputación de factura comercial y comprobante de transferencia',
            actionButtonLabel: '🪙 Lic. Zaida: Declarar "Ya Salió el Dinero"',
            onSuccessMessage: '✓ Liquidación confirmada: El dinero ha salido formalmente del sistema.',
          },
        },
      ],
    },
  },

  // ===========================================================================
  // 4. EJECUCIÓN Y PAGOS
  // ===========================================================================
  ejecucion: {
    gerente: {
      title: 'Guía Gerente: Monitoreo de Saldo Líquido, Facturas y Desembolso',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'ejecucion',
          route: '/',
          selector: '[data-tour="tour-nav-ejecucion"]',
          title: '1. En el Menú Lateral: Ir a Ejecuciones',
          role: 'Control Presupuestario',
          instruction: 'En el menú lateral accede a "Ejecuciones" para auditar el gasto efectivo y la fórmula de saldos.',
          placement: 'right',
        },
        {
          stepIndex: 2,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-kpis-ejecucion"]',
          title: '2. Monitoreo de Indicadores de Saldo en Tiempo Real',
          role: 'Control Presupuestario',
          instruction:
            'Aquí supervisas la fórmula institucional del saldo: Techo Vigente - (Comprometido + Pagado) = Saldo Disponible Líquido.',
          hint: 'Cada aprobación preventiva eleva el Comprometido; cada liquidación de la Lic. Zaida lo traslada a Pagado.',
          placement: 'bottom',
        },
        {
          stepIndex: 3,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-tab-solicitudes"], [data-tour="tour-tab-solicitudes-ejec"]',
          title: '3. Preventivos Aprobados: El Dinero Aún No Salió',
          role: 'Presupuestos / Planificación',
          instruction:
            'En "Solicitudes de Gasto", observas los preventivos que ya tienen visto bueno pero cuya factura física o cheque bancario aún no se ha efectivizado.',
          placement: 'bottom',
          targetTab: 'solicitudes',
        },
        {
          stepIndex: 4,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-tab-gastos"], [data-tour="tour-tab-gastos-ejec"]',
          title: '4. Imputación de Factura y Liquidación por la Lic. Zaida',
          role: 'Lic. Zaida (Tesorería)',
          instruction:
            'En "Registro de Gastos", se asienta la factura comercial y la Lic. Zaida confirma el pago bancario dictando: "Ya salió el dinero", reduciendo el saldo del sistema.',
          placement: 'bottom',
          targetTab: 'gastos',
          modalConfig: {
            type: 'tesoreria_pago',
            title: 'Registro de Gasto y Liquidación de Factura',
            subtitle: 'Desembolso bancario efectivo por Tesorería',
            actionButtonLabel: '🪙 Lic. Zaida: Confirmar Pago y Reducir Dinero',
            onSuccessMessage: '✓ Pago bancario confirmado por la Lic. Zaida: Saldo reducido en el sistema.',
          },
        },
        {
          stepIndex: 5,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-tab-memorias"], [data-tour="tour-tab-saldos-ejec"]',
          title: '5. Memorias con Saldo Disponible para Nuevos Gastos',
          role: 'Gerencias y Contabilidad',
          instruction:
            'En "Memorias con Saldo", auditas exactamente qué partidas conservan crédito disponible para formular nuevas contrataciones o traspasos compensados.',
          placement: 'bottom',
          targetTab: 'memorias',
        },
      ],
    },

    elaborador: {
      title: 'Guía Elaborador: Consulta de Partidas y Facturas',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-tab-memorias"]',
          title: '1. Memorias con Crédito Disponible',
          role: 'Técnico Elaborador',
          instruction: 'Revisa qué saldo le queda a cada ítem para programar requerimientos futuros.',
          placement: 'bottom',
        },
      ],
    },

    planificacion: {
      title: 'Guía Planificación: Tasa de Ejecución Financiera del POA',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-kpis-ejecucion"]',
          title: '1. Seguimiento del Ritmo de Ejecución',
          role: 'Dirección de Planificación',
          instruction: 'Evalúa la brecha entre el ritmo de ejecución real frente al calendario del año fiscal.',
          placement: 'bottom',
        },
      ],
    },

    presupuestos: {
      title: 'Guía Presupuestos: Control de Ejecución Presupuestaria',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-kpis-ejecucion"]',
          title: '1. Supervisión de Techos y Partidas Comprometidas',
          role: 'Dirección de Presupuestos',
          instruction: 'Monitorea el disponible líquido global para evaluar modificaciones o traspasos entre áreas.',
          placement: 'bottom',
        },
      ],
    },

    tesoreria: {
      title: 'Guía Lic. Zaida: Liquidación de Facturas y Salida Efectiva',
      steps: [
        {
          stepIndex: 1,
          moduloId: 'ejecucion',
          route: '/ejecucion',
          selector: '[data-tour="tour-tab-gastos"]',
          title: '1. Asiento de Factura Comercial y Pago Efectivo',
          role: 'Lic. Zaida (Tesorería)',
          instruction:
            'Al recibir la factura física y comprobante de entrega, la Lic. Zaida declara: "Ya salió el dinero" y liquida la salida efectiva del dinero.',
          placement: 'bottom',
          modalConfig: {
            type: 'tesoreria_pago',
            title: 'Liquidación de Factura por Tesorería',
            subtitle: 'Emisión de transferencia bancaria y reducción de fondos',
            actionButtonLabel: '🪙 Lic. Zaida: Declarar "Ya Salió el Dinero"',
            onSuccessMessage: '✓ Pago bancario liquidado por la Lic. Zaida. Saldo actualizado en el sistema.',
          },
        },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPATIBILIDAD CON ESTRUCTURA ANTERIOR (LIVE_TOUR_DATA)
// ─────────────────────────────────────────────────────────────────────────────
export const LIVE_TOUR_DATA: Record<ModuloGuiaId, { title: string; steps: LiveTourStep[] }> = {
  memorias: {
    title: LIVE_TOUR_DATA_BY_ROLE.memorias.gerente.title,
    steps: LIVE_TOUR_DATA_BY_ROLE.memorias.gerente.steps,
  },
  modificaciones: {
    title: LIVE_TOUR_DATA_BY_ROLE.modificaciones.gerente.title,
    steps: LIVE_TOUR_DATA_BY_ROLE.modificaciones.gerente.steps,
  },
  certificaciones: {
    title: LIVE_TOUR_DATA_BY_ROLE.certificaciones.gerente.title,
    steps: LIVE_TOUR_DATA_BY_ROLE.certificaciones.gerente.steps,
  },
  ejecucion: {
    title: LIVE_TOUR_DATA_BY_ROLE.ejecucion.gerente.title,
    steps: LIVE_TOUR_DATA_BY_ROLE.ejecucion.gerente.steps,
  },
};

export const getLiveTourData = (moduloId: ModuloGuiaId, role: RolTour = 'gerente') => {
  const moduloRoles = LIVE_TOUR_DATA_BY_ROLE[moduloId];
  if (moduloRoles && moduloRoles[role]) {
    return moduloRoles[role];
  }
  return LIVE_TOUR_DATA[moduloId];
};
