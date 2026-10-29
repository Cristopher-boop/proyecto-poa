import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  PlayCircle,
  HelpCircle,
  Info,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { FlowNode, FlowEdge, AlternativaFlujo } from '../../types/guia.types';
import { FlowNodeCard } from './FlowNodeCard';
import { NodeDetailDrawer } from './NodeDetailDrawer';
import { Button } from '../../../../components/commons';

interface InteractiveFlowDiagramProps {
  titulo: string;
  subtitulo: string;
  alternativas: AlternativaFlujo[];
  activeAlternativaId: string;
  onSelectAlternativa: (id: string) => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onStartSimulation: (stepId?: number) => void;
}

export const InteractiveFlowDiagram: React.FC<InteractiveFlowDiagramProps> = ({
  titulo,
  subtitulo,
  alternativas,
  activeAlternativaId,
  onSelectAlternativa,
  nodes,
  edges,
  onStartSimulation,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dimensiones para la rejilla del grafo
  const COL_WIDTH = 300;
  const ROW_HEIGHT = 190;
  const PADDING_X = 60;
  const PADDING_Y = 60;

  // Nodo seleccionado
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Cálculo de coordenadas de los nodos
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => {
      const x = PADDING_X + n.column * COL_WIDTH;
      const y = PADDING_Y + n.row * ROW_HEIGHT;
      map.set(n.id, { x, y });
    });
    return map;
  }, [nodes]);

  // Dimensiones totales del canvas
  const { totalWidth, totalHeight } = useMemo(() => {
    let maxCol = 0;
    let maxRow = 0;
    nodes.forEach((n) => {
      if (n.column > maxCol) maxCol = n.column;
      if (n.row > maxRow) maxRow = n.row;
    });
    return {
      totalWidth: PADDING_X * 2 + (maxCol + 1) * COL_WIDTH,
      totalHeight: PADDING_Y * 2 + (maxRow + 1) * ROW_HEIGHT,
    };
  }, [nodes]);

  const handleZoomIn = () => setZoom((z) => Math.min(1.4, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.65, z - 0.15));
  const handleResetZoom = () => setZoom(1);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Restablecer selección cuando cambia de alternativa
  useEffect(() => {
    setSelectedNodeId(null);
  }, [activeAlternativaId]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-theme-surface border border-theme-border rounded-2xl shadow-panel overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : 'min-h-[560px] h-[640px]'
      }`}
    >
      {/* ── BARRA SUPERIOR: ALTERNATIVAS Y ACCIONES ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-theme-border bg-theme-base/50 backdrop-blur z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-theme-primary/10 text-theme-primary">
              <Layers size={17} />
            </span>
            <h3 className="text-sm font-bold text-theme-main">{titulo}</h3>
          </div>
          <p className="text-xs text-theme-muted mt-0.5">{subtitulo}</p>
        </div>

        {/* Selector de Alternativas de Camino */}
        <div className="flex items-center gap-1.5 p-1 bg-theme-surface rounded-xl border border-theme-border">
          {alternativas.map((alt) => {
            const isActive = alt.id === activeAlternativaId;
            return (
              <button
                key={alt.id}
                type="button"
                onClick={() => onSelectAlternativa(alt.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-theme-primary text-theme-primaryText shadow-sm'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-border/40'
                }`}
              >
                <span>{alt.nombre}</span>
                {alt.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-theme-border text-theme-muted'
                    }`}
                  >
                    {alt.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controles de Vista y Botón del Simulador */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="flex items-center gap-2 py-1.5 px-3 text-xs shadow-sm bg-gradient-to-r from-theme-primary to-indigo-600 hover:opacity-95"
            onClick={() => onStartSimulation()}
          >
            <Sparkles size={15} /> Simular en el Sistema Real
          </Button>

          <div className="h-6 w-px bg-theme-border" />

          <div className="flex items-center bg-theme-surface rounded-xl border border-theme-border p-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-theme-muted hover:text-theme-main hover:bg-theme-border/50 rounded-lg transition-colors"
              title="Acercar (+)"
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-[11px] font-bold text-theme-muted hover:text-theme-main transition-colors"
              title="Restablecer (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-theme-muted hover:text-theme-main hover:bg-theme-border/50 rounded-lg transition-colors"
              title="Alejar (-)"
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-theme-muted hover:text-theme-main hover:bg-theme-border/50 rounded-lg transition-colors border-l border-theme-border ml-1"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── ÁREA DE TRABAJO DEL GRAFO CON SCROLL / ZOOM ───────────────────── */}
      <div className="relative flex-1 overflow-auto bg-slate-900/5 dark:bg-black/20 p-4">
        {/* Patrón de Rejilla de Fondo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(var(--border, #cbd5e1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div
          className="relative transition-transform duration-150 origin-top-left"
          style={{
            transform: `scale(${zoom})`,
            width: `${totalWidth}px`,
            height: `${totalHeight}px`,
          }}
        >
          {/* ── CANVAS SVG PARA LAS CONEXIONES BEZIER FLUIDAS ─────────── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ width: `${totalWidth}px`, height: `${totalHeight}px` }}
          >
            <defs>
              {/* Marcadores de flecha para los caminos */}
              <marker
                id="arrow-primary"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#3b82f6" />
              </marker>
              <marker
                id="arrow-success"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker
                id="arrow-warning"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
              </marker>
              <marker
                id="arrow-danger"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
              </marker>

              {/* Filtro de Resplandor Neón */}
              <filter id="glow-primary" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Renderizado de Aristas */}
            {edges.map((edge) => {
              const start = nodePositions.get(edge.from);
              const end = nodePositions.get(edge.to);
              if (!start || !end) return null;

              // Ancho y Alto de la tarjeta: W=256 (w-64), H=130
              const CARD_W = 256;
              const CARD_H = 130;

              let x1 = start.x + CARD_W;
              let y1 = start.y + CARD_H / 2;
              let x2 = end.x;
              let y2 = end.y + CARD_H / 2;

              // Si es un camino de retorno o salto vertical
              if (end.y > start.y && end.x <= start.x) {
                x1 = start.x + CARD_W / 2;
                y1 = start.y + CARD_H;
                x2 = end.x + CARD_W / 2;
                y2 = end.y;
              } else if (end.x < start.x) {
                x1 = start.x;
                y1 = start.y + CARD_H / 2;
                x2 = end.x + CARD_W;
                y2 = end.y + CARD_H / 2;
              }

              const dx = Math.abs(x2 - x1);
              const controlOffset = Math.max(dx * 0.45, 50);

              const pathD = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${
                x2 - controlOffset
              } ${y2}, ${x2} ${y2}`;

              const strokeColor =
                edge.variant === 'success'
                  ? '#10b981'
                  : edge.variant === 'warning'
                  ? '#f59e0b'
                  : edge.variant === 'danger'
                  ? '#f43f5e'
                  : '#3b82f6';

              const markerId = `arrow-${edge.variant || 'primary'}`;

              return (
                <g key={edge.id}>
                  {/* Línea de Fondo Resplandeciente */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={edge.animated ? '3' : '2'}
                    strokeDasharray={edge.style === 'dashed' ? '6,6' : 'none'}
                    opacity={edge.animated ? 0.8 : 0.4}
                    markerEnd={`url(#${markerId})`}
                  />

                  {/* Pulso de Partículas en Movimiento para Simular Flujo Activo */}
                  {edge.animated && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeDasharray="8,24"
                      className="animate-flow-dash"
                      opacity="0.9"
                    />
                  )}

                  {/* Etiqueta flotante en el camino */}
                  {edge.label && (
                    <g
                      transform={`translate(${(x1 + x2) / 2}, ${
                        (y1 + y2) / 2 - 10
                      })`}
                    >
                      <rect
                        x="-45"
                        y="-10"
                        width="90"
                        height="20"
                        rx="10"
                        fill="var(--bg-surface, #ffffff)"
                        stroke="var(--border, #e2e8f0)"
                        strokeWidth="1"
                        className="shadow-sm"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="var(--text-main, #0f172a)"
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* ── NODOS EN POSICIÓN ABSOLUTA ──────────────────────────── */}
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                }}
              >
                <FlowNodeCard
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() =>
                    setSelectedNodeId(
                      selectedNodeId === node.id ? null : node.id
                    )
                  }
                  onSimulateStep={(stepId) => onStartSimulation(stepId)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PANEL DERECHO DE INSPECCIÓN DETALLADA DEL NODO ───────────────── */}
      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
        onSimulate={(stepId) => onStartSimulation(stepId)}
      />

      {/* Pie con Ayuda Rápida */}
      <div className="flex items-center justify-between px-4 py-2 bg-theme-base/60 border-t border-theme-border text-[11px] text-theme-muted z-20">
        <div className="flex items-center gap-2">
          <Info size={13} className="text-theme-primary" />
          <span>
            Haz clic sobre cualquier paso para inspeccionar responsables, reglas y requisitos.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Flujo activo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Decisión / Aceptación
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Conforme
          </span>
        </div>
      </div>
    </div>
  );
};
