import os

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriasFilter.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

props_start = content.find('interface MemoriasFilterProps {')
props_end = content.find('}', props_start)
new_props = '''interface MemoriasFilterProps {
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
}'''

content = content[:props_start] + new_props + content[props_end+1:]

content = content.replace('  actionLoading\n})', '  actionLoading,\n  conteos = { todas: 0, borrador: 0, espera: 0, planificacion: 0, finanzas: 0, aprobadas: 0, rechazadas: 0 },\n  isElaborador,\n  isTrabajador,\n  isGerente,\n  isSuperuser,\n  isAprobador,\n  isPlanificador\n})')

tabs_code = '''
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
'''

content = content.replace('const tabs = [', '/* const tabs = [')
content = content.replace('];', ']; */')

tabs_start = content.find('      {/* Pesta')
tabs_end = content.find('      </div>', tabs_start) + 12

content = content[:tabs_start] + tabs_code + content[tabs_end:]

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriasFilter.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated MemoriasFilter.tsx')
