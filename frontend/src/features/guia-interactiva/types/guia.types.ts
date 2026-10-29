export type ModuloGuiaId = 'memorias' | 'modificaciones' | 'certificaciones' | 'ejecucion';

export type RolInstitucional =
  | 'GERENTE'
  | 'ELABORADOR'
  | 'PLANIFICACION'
  | 'PRESUPUESTOS'
  | 'TESORERIA'
  | 'SISTEMA'
  | 'ADMINISTRADOR';

export type RolTour = 'gerente' | 'elaborador' | 'planificacion' | 'presupuestos' | 'tesoreria';

export type FlowNodeType =
  | 'start'
  | 'process'
  | 'decision'
  | 'review'
  | 'success'
  | 'warning'
  | 'danger';

export interface FlowNode {
  id: string;
  label: string;
  subtitle?: string;
  role: RolInstitucional;
  type: FlowNodeType;
  column: number; // 0, 1, 2, 3, 4, 5
  row: number; // 0, 1, 2, 3
  description: string;
  responsable: string;
  requisitos?: string[];
  salida?: string;
  reglaNegocio?: string;
  sandboxStepId?: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
  animated?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
}

export interface AlternativaFlujo {
  id: string;
  nombre: string;
  descripcion: string;
  badge?: string;
  esPredeterminada?: boolean;
}

export interface SandboxStep {
  stepIndex: number;
  title: string;
  instruction: string;
  hint?: string;
  targetId: string;
  roleContext: string;
  cardPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  actionExpected: string;
  feedbackOnComplete: string;
  simulatedPreview?: any;
}

export interface SandboxScenario {
  id: string;
  moduloId: ModuloGuiaId;
  alternativaId: string;
  titulo: string;
  resumen: string;
  steps: SandboxStep[];
}

export interface GuiaProcesoInfo {
  id: ModuloGuiaId;
  titulo: string;
  subtitulo: string;
  icono: string;
  color: string;
  badge: string;
  descripcionLarga: string;
  alternativas: AlternativaFlujo[];
  normativaReferencial: {
    articulo: string;
    descripcion: string;
  }[];
}

export interface SimulatedModalConfig {
  type:
    | 'memoria_form'
    | 'traspaso_form'
    | 'certificacion_form'
    | 'planif_review'
    | 'presup_review'
    | 'tesoreria_pago';
  title: string;
  subtitle: string;
  actionButtonLabel: string;
  defaultData?: Record<string, any>;
  roleAdvice?: string;
  onSuccessMessage: string;
}

export interface LiveTourStep {
  stepIndex: number;
  moduloId: ModuloGuiaId;
  route: string;
  selector: string;
  title: string;
  role: string;
  instruction: string;
  hint?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  targetTab?: string;
  modalConfig?: SimulatedModalConfig;
  limiteRol?: string;
  forRoles?: RolTour[];
}
