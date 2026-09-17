import React from 'react';
import { Search, Filter, RefreshCw, Plus, Send, Layers, Edit3, Clock, CheckSquare, CheckCircle, XCircle } from 'lucide-react';

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
}

export const MemoriasFilter: React.FC<MemoriasFilterProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  filtroArea,
  setFiltroArea,
  areas,
  canCreate,
  canGlobalView,
  onRefresh,
  onCreate,
  onEnviarTodas,
  actionLoading,
  conteos = { todas: 0, borrador: 0, espera: 0, planificacion: 0, finanzas: 0, aprobadas: 0, rechazadas: 0 },
  isElaborador,
  isTrabajador,
  isGerente,
  isSuperuser,
  isAprobador,
  isPlanificador
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Pestañas de estado */}
      <div className="flex border-b border-theme-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('todas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'todas' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'}`}
        >
          <Layers size={16} /> Todas ({conteos.todas})
        </button>

        {(isElaborador || isTrabajador || isGerente || isSuperuser) && (
          <button
            onClick={() => setActiveTab('borrador')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'borrador' ? 'border-theme-primary text-theme-main font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'}`}
          >
            <Clock size={16} /> En Borrador ({conteos.borrador})
          </button>
        )}

        {(isTrabajador || isElaborador || isGerente || isSuperuser) && (
          <button
            onClick={() => setActiveTab('espera')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'espera' ? 'border-amber-500 text-amber-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'}`}
            title="Memorias en trámite de revisión (Gerencia, Planificación y Presupuestos)"
          >
            <Clock size={16} /> En Espera ({conteos.espera})
          </button>
        )}

        {isPlanificador && (
          <button
            onClick={() => setActiveTab('planificacion')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'planificacion' ? 'border-indigo-500 text-indigo-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'}`}
          >
            <CheckSquare size={16} /> Revisión Planificación SPO ({conteos.planificacion})
          </button>
        )}

        {isAprobador && !isSuperuser && (
          <button
            onClick={() => setActiveTab('finanzas')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'finanzas' ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'}`}
          >
            <CheckCircle size={16} /> Revisión Presupuestos ({conteos.finanzas})
          </button>
        )}

        <button
          onClick={() => setActiveTab('aprobadas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'aprobadas' ? 'border-emerald-500 text-emerald-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'}`}
        >
          <CheckCircle size={16} /> Aprobadas POA ({conteos.aprobadas})
        </button>

        <button
          onClick={() => setActiveTab('rechazadas')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'rechazadas' ? 'border-rose-500 text-rose-600 font-bold' : 'border-transparent text-theme-muted hover:text-theme-main'}`}
        >
          <XCircle size={16} /> Rechazadas ({conteos.rechazadas})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-theme-muted" />
            </div>
            <input
              type="text"
              placeholder="Buscar por código o partida..."
              className="block w-full pl-9 pr-3 py-2 bg-theme-base border border-theme-border rounded-lg text-theme-main text-sm focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro Área */}
          {canGlobalView && (
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-theme-muted" />
              </div>
              <select
                className="block w-full pl-9 pr-8 py-2 bg-theme-base border border-theme-border rounded-lg text-theme-main text-sm focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary appearance-none"
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
              >
                <option value="todas">Todas las Áreas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Acciones Generales */}
        <div className="flex gap-2 w-full sm:w-auto">
          {canCreate && activeTab === 'borrador' && (
             <button
               onClick={onEnviarTodas}
               disabled={actionLoading}
               className="flex-1 sm:flex-none btn border border-theme-border hover:bg-theme-border/10 text-theme-main px-4 py-2 rounded-lg text-sm font-semibold flex justify-center items-center gap-2 disabled:opacity-50 transition-all"
             >
               <Send size={16} className="text-green-500" />
               <span>Enviar Borradores</span>
             </button>
          )}
          {canCreate && (
            <button
              onClick={onCreate}
              className="flex-1 sm:flex-none btn-primary px-4 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Plus size={16} />
              <span>Nueva Memoria</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="p-2 border border-theme-border rounded-lg bg-theme-base text-theme-muted hover:text-theme-main transition-colors"
            title="Refrescar"
          >
            <RefreshCw size={18} className={actionLoading ? 'animate-spin text-theme-primary' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};
