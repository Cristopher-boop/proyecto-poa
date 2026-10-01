import React from 'react';
import { Building2, Layers3, Edit3, CheckCircle2, XCircle, Network } from 'lucide-react';
import { Modal, Button } from '../../../components/commons';
import type { Area, Programa } from '../types/organizacional.types';
import { formatProgramaShort } from '../utils/organizacionalUtils';

interface AreaDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: Area | null;
  programas: Programa[];
  onEdit?: (area: Area) => void;
  canEdit?: boolean;
}

export const AreaDetalleModal: React.FC<AreaDetalleModalProps> = ({
  isOpen,
  onClose,
  area,
  programas,
  onEdit,
  canEdit = false,
}) => {
  if (!isOpen || !area) return null;

  const progObj = programas.find((p) => p.id === area.programa);
  const progLabel = formatProgramaShort(progObj, area.programa_codigo, area.programa_nombre);
  const isActiva = Boolean(area.estado);
  const secciones = area.secciones || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de la Gerencia / Unidad"
      subtitle="Ficha técnica institucional y organigrama de dependencias operativas"
      badge={
        <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2.5 py-0.5 rounded-lg">
          {area.codigo}
        </span>
      }
      icon={<Building2 size={20} className="text-theme-primary" />}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {canEdit && onEdit && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onEdit(area)}
              className="flex items-center gap-1.5"
            >
              <Edit3 size={14} /> Editar Gerencia / Unidad
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Metadatos Rápidos: Programa, Clasificación y Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Programa
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono inline-block">
              {progLabel}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Clasificación
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 inline-block">
              {area.tipo === 'GERENCIA' ? 'Gerencia de Área' : 'Unidad Operativa'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block mb-1">
              Estado
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border select-none ${
                isActiva
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {isActiva ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {isActiva ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {/* Nombre Institucional y Descripción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
              Nombre Institucional
            </span>
            <p className="text-xs font-semibold text-theme-main">{area.nombre}</p>
          </div>

          <div className="p-3 rounded-xl bg-theme-surface border border-theme-border space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-theme-muted block">
              Descripción y Alcance
            </span>
            <p className="text-xs text-theme-main font-normal leading-relaxed line-clamp-3">
              {area.descripcion || <span className="italic text-theme-muted">Sin descripción registrada.</span>}
            </p>
          </div>
        </div>

        {/* MINI-DIAGRAMA DEL ORGANIGRAMA EN LA VISTA DETALLADA */}
        <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network size={16} className="text-theme-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-theme-main">
                Organigrama de la Unidad y Secciones
              </span>
            </div>
            <span className="text-[10px] text-theme-muted font-mono bg-theme-base px-2 py-0.5 rounded border border-theme-border">
              {secciones.length} {secciones.length === 1 ? 'sección dependiente' : 'secciones dependientes'}
            </span>
          </div>

          {/* Diagrama con Nodos y Conectores */}
          <div className="pt-1">
            {/* Nodo Raíz: Gerencia / Unidad */}
            <div className="p-3 rounded-xl bg-theme-base border border-theme-border space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 px-2 py-0.5 rounded">
                    {area.codigo}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50 font-mono">
                    {progLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {area.tipo === 'GERENCIA' ? 'Gerencia' : 'Unidad'}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border select-none ${
                    isActiva
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                      : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActiva ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {isActiva ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Building2 size={16} className="text-theme-primary shrink-0" />
                <h4 className="text-xs font-bold text-theme-main">
                  {area.nombre}
                </h4>
              </div>
            </div>

            {/* Tronco de Conexión del Árbol */}
            <div className="flex items-center pl-6">
              <div className="w-0.5 h-3 bg-slate-300 dark:bg-slate-600" />
            </div>

            {/* Ramificaciones a las Secciones */}
            <div className="border-l-2 border-slate-300 dark:border-slate-600 ml-6 pl-4 space-y-2 py-0.5">
              {secciones.length > 0 ? (
                secciones.map((sec) => (
                  <div key={sec.id} className="relative flex items-center gap-2">
                    {/* Conector horizontal tipo codo */}
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-300 dark:bg-slate-600" />

                    {/* Nodo de la Sección */}
                    <div className="flex-1 px-3 py-2 rounded-xl bg-theme-base border border-theme-border flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            sec.estado ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <Layers3 size={14} className="text-theme-muted shrink-0" />
                        <span className="text-xs font-semibold text-theme-main truncate">
                          {sec.nombre}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${
                          sec.estado
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {sec.estado ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative flex items-center gap-2 py-1">
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-300 dark:bg-slate-600" />
                  <span className="text-xs text-theme-muted italic">
                    Sin secciones operativas dependientes registradas en este momento.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
