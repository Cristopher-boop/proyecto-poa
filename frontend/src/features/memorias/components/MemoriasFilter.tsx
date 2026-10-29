import React, { useMemo } from 'react';
import { Search, RefreshCw, Send, Layers, Clock, CheckSquare, CheckCircle, XCircle } from 'lucide-react';
import { Dropdown, type DropdownItem } from '../../../components/commons';
import { useGuia } from '../../guia-interactiva';

interface MemoriasFilterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filtroArea: string;
  setFiltroArea: (area: string) => void;
  areas: any[];
  canCreate: boolean;
  canGlobalView: boolean;
  canEnviarBorradores?: boolean;
  isGestionBloqueada?: boolean;
  onRefresh: () => void;
  onCreate: () => void;
  onEnviarTodas: () => void;
  actionLoading: boolean;
  conteos?: any;
  isElaborador?: boolean;
  isTrabajador?: boolean;
  isGerente?: boolean;
  isSuperuser?: boolean;
  isAprobador?: boolean;
  isPlanificador?: boolean;
  gestionAnio?: number;
  filteredCount?: number;
  totalCount?: number;
}

export const MemoriasFilter: React.FC<MemoriasFilterProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  filtroArea,
  setFiltroArea,
  areas,
  canGlobalView,
  canEnviarBorradores,
  isGestionBloqueada = false,
  onRefresh,
  onEnviarTodas,
  actionLoading,
  conteos = { todas: 0, borrador: 0, espera: 0, planificacion: 0, finanzas: 0, aprobadas: 0, rechazadas: 0 },
  isElaborador,
  isTrabajador,
  isGerente,
  isSuperuser,
  isAprobador,
  isPlanificador,
  gestionAnio,
  filteredCount,
  totalCount,
}) => {
  // Convertir áreas a items institucionales para el Dropdown
  const areaDropdownItems: DropdownItem[] = useMemo(() => [
    {
      id: 'todas',
      label: 'Todas las Áreas',
      badge: 'GLOBAL',
      badgeClassName: 'bg-theme-primary/10 text-theme-primary font-bold',
    },
    ...areas.map((a: any) => ({
      id: String(a.id),
      label: a.nombre,
      badge: a.codigo || a.sigla,
      badgeClassName: 'bg-theme-border/60 text-theme-main font-mono text-[10px]',
      sublabel: `${a.tipo || 'Área'} institucional`,
    })),
  ], [areas]);

  const cantBorradores = conteos?.borrador ?? 0;
  const cantEspera = conteos?.pendiente ?? conteos?.espera ?? 0;
  const cantPlanif = conteos?.planificacion ?? 0;
  const cantFinanzas = conteos?.finanzas ?? 0;
  const cantAprobadas = conteos?.aprobadas ?? 0;
  const cantRechazadas = conteos?.rechazadas ?? 0;
  const cantTodas = conteos?.todas ?? 0;

  const { activeLiveTour } = useGuia();
  const isTourMemorias = activeLiveTour?.moduloId === 'memorias';

  return (
    <div className="card p-4 border border-theme-border bg-theme-surface shadow-sm space-y-4 mb-6">
      {/* Pestañas de Estado con Insignias Contadoras */}
      <div className="flex border-b border-theme-border overflow-x-auto no-scrollbar gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('todas')}
          data-tour="tour-tab-todas"
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'todas'
              ? 'border-theme-primary text-theme-main font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <Layers size={13} />
          <span>Todas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-theme-border/60 text-theme-main font-mono">
            {cantTodas}
          </span>
        </button>

        {(isElaborador || isTrabajador || isGerente || isSuperuser) && (
          <button
            type="button"
            onClick={() => setActiveTab('borrador')}
            data-tour="tour-tab-borrador"
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'borrador'
                ? 'border-theme-primary text-theme-main font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <Clock size={13} />
            <span>En Borrador</span>
            {cantBorradores > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-theme-border/60 text-theme-main font-mono">
                {cantBorradores}
              </span>
            )}
          </button>
        )}

        {(isTrabajador || isElaborador || isGerente || isSuperuser) && (
          <button
            type="button"
            onClick={() => setActiveTab('espera')}
            data-tour="tour-tab-espera"
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'espera' || activeTab === 'pendiente'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
            title="Memorias en trámite de revisión (Gerencia, Planificación y Presupuestos)"
          >
            <Clock size={13} />
            <span>
              {isGerente && !isSuperuser ? 'Pendiente Gerencia' : 'En Espera'}
            </span>
            {cantEspera > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold font-mono">
                {cantEspera}
              </span>
            )}
          </button>
        )}

        {((isPlanificador && !isSuperuser) || (isSuperuser && isTourMemorias)) && (
          <button
            type="button"
            onClick={() => setActiveTab('planificacion')}
            data-tour="tour-tab-planificacion"
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'planificacion'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <CheckSquare size={13} />
            <span>Revisión Planificación SPO</span>
            {cantPlanif > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold font-mono">
                {cantPlanif}
              </span>
            )}
          </button>
        )}

        {((isAprobador && !isSuperuser) || (isSuperuser && isTourMemorias)) && (
          <button
            type="button"
            onClick={() => setActiveTab('finanzas')}
            data-tour="tour-tab-finanzas"
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'finanzas'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-theme-muted hover:text-theme-main'
            }`}
          >
            <CheckCircle size={13} />
            <span>Revisión Presupuestos</span>
            {cantFinanzas > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold font-mono">
                {cantFinanzas}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('aprobadas')}
          data-tour="tour-tab-aprobadas"
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'aprobadas'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <CheckCircle size={13} />
          <span>Aprobadas POA</span>
          {cantAprobadas > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold font-mono">
              {cantAprobadas}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rechazadas')}
          data-tour="tour-tab-rechazadas"
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'rechazadas'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-main'
          }`}
        >
          <XCircle size={13} />
          <span>Rechazadas</span>
          {cantRechazadas > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold font-mono">
              {cantRechazadas}
            </span>
          )}
        </button>
      </div>

      {/* Buscador, Dropdown Institucional de Área y Acciones */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          {/* Input de Búsqueda */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, justificación o partida..."
              className="input-theme pl-9 text-xs w-full"
            />
          </div>

          {/* Dropdown Desplegable Institucional de Área */}
          {canGlobalView && (
            <div className="w-full sm:w-72">
              <Dropdown
                items={areaDropdownItems}
                value={filtroArea}
                onChange={(val) => setFiltroArea(String(val))}
                placeholder="Todas las Áreas"
                searchable={true}
                searchPlaceholder="Buscar área..."
                size="sm"
              />
            </div>
          )}

          {/* Botón Enviar Borradores */}
          {canEnviarBorradores && (activeTab === 'borrador' || (cantBorradores > 0 && activeTab === 'todas')) && (
            <button
              onClick={onEnviarTodas}
              disabled={actionLoading || isGestionBloqueada || cantBorradores === 0}
              className="btn-primary text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title={
                isGestionBloqueada
                  ? 'La formulación de esta gestión está cerrada'
                  : cantBorradores === 0
                  ? 'No hay memorias de cálculo en borrador'
                  : 'Enviar todos los borradores a revisión'
              }
            >
              <Send size={14} className="shrink-0" />
              <span>Enviar Borradores {cantBorradores > 0 ? `(${cantBorradores})` : ''}</span>
            </button>
          )}

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 border border-theme-border rounded-xl bg-theme-base text-theme-muted hover:text-theme-main transition-colors"
            title="Refrescar memorias"
          >
            <RefreshCw size={15} className={actionLoading ? 'animate-spin text-theme-primary' : ''} />
          </button>
        </div>

        {gestionAnio && (
          <p className="text-xs text-theme-muted font-medium shrink-0">
            Mostrando <strong className="text-theme-main">{filteredCount ?? cantTodas}</strong> de{' '}
            <strong className="text-theme-main">{totalCount ?? cantTodas}</strong> memorias en Gestión {gestionAnio}
          </p>
        )}
      </div>
    </div>
  );
};
