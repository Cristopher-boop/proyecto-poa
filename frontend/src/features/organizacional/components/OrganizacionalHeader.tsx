import React from 'react';
import { Building2, Layers3, FolderTree, Network, Plus } from 'lucide-react';
import type { OrganizacionalTab } from '../types/organizacional.types';
import { PageHeader } from '../../../components/commons';

interface OrganizacionalHeaderProps {
  activeTab: OrganizacionalTab;
  onTabChange: (tab: OrganizacionalTab) => void;
  areasCount: number;
  seccionesCount: number;
  programasCount: number;
  totalCount: number;
  onOpenCreateArea: () => void;
  onOpenCreateSeccion: () => void;
  onOpenCreatePrograma: () => void;
}

export const OrganizacionalHeader: React.FC<OrganizacionalHeaderProps> = ({
  activeTab,
  onTabChange,
  areasCount,
  seccionesCount,
  programasCount,
  totalCount,
  onOpenCreateArea,
  onOpenCreateSeccion,
  onOpenCreatePrograma,
}) => {
  return (
    <div className="space-y-4">
      {/* Cabecera Principal Unificada */}
      <PageHeader
        icon={<Building2 size={26} />}
        title="Estructura Organizacional Institucional"
        subtitle="Catálogo oficial de programas, gerencias, unidades y secciones operativas que formulan y ejecutan el presupuesto POA."
        actions={
          <>
            {(activeTab === 'AREAS' || activeTab === 'JERARQUIA') && (
              <button
                type="button"
                onClick={onOpenCreateArea}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva Gerencia / Unidad
              </button>
            )}

            {activeTab === 'SECCIONES' && (
              <button
                type="button"
                onClick={onOpenCreateSeccion}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nueva Sección
              </button>
            )}

            {activeTab === 'PROGRAMAS' && (
              <button
                type="button"
                onClick={onOpenCreatePrograma}
                className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus size={15} /> Nuevo Programa
              </button>
            )}
          </>
        }
      />

      {/* Pestañas de Navegación */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme-border/80 pb-2.5">
        <button
          type="button"
          onClick={() => onTabChange('JERARQUIA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'JERARQUIA'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <Network size={15} />
          <span>Estructura Jerárquica</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'JERARQUIA'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('AREAS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'AREAS'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <Building2 size={15} />
          <span>Gerencia / Unidad</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'AREAS'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {areasCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('SECCIONES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'SECCIONES'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <Layers3 size={15} />
          <span>Secciones Operativas</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'SECCIONES'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {seccionesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('PROGRAMAS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
            activeTab === 'PROGRAMAS'
              ? 'bg-theme-primary text-theme-primaryText shadow-sm'
              : 'text-theme-muted hover:bg-theme-surface hover:text-theme-main'
          }`}
        >
          <FolderTree size={15} />
          <span>Programas Institucionales</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'PROGRAMAS'
                ? 'bg-black/10 dark:bg-white/20 text-theme-primaryText'
                : 'bg-slate-200/70 text-slate-700 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {programasCount}
          </span>
        </button>
      </div>
    </div>
  );
};
