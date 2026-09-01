import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Layers3,
  FolderTree,
  Search,
  CheckCircle2,
  LayoutDashboard,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { organizacionalService } from '../../services/organizacionalService';
import { Area, Programa, Seccion } from '../../types/organizacional';
import { AreasList, ProgramasList, SeccionesList } from '../../components/organizacional';
import alertService from '../../utils/alerts';

type TabType = 'resumen' | 'areas' | 'secciones' | 'programas';

export default function OrganizacionalPage() {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPrograma, setSelectedPrograma] = useState<string>('TODOS');

  // Triggering creation from page header
  const [showCreateModal, setShowCreateModal] = useState(false);

  const cargarResumen = async () => {
    setLoading(true);
    try {
      const [programasRes, areasRes, seccionesRes] = await Promise.all([
        organizacionalService.getProgramas(),
        organizacionalService.getAreas(),
        organizacionalService.getSecciones(),
      ]);

      setProgramas(programasRes.data || []);
      setAreas(areasRes.data || []);
      setSecciones(seccionesRes.data || []);
    } catch (error) {
      console.error('Error cargando módulo organizacional:', error);
      alertService.error('Error al cargar datos', 'No se pudo sincronizar la información de la estructura organizacional.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const areasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return areas.filter((area) => {
      const coincideBusqueda =
        !term ||
        area.nombre.toLowerCase().includes(term) ||
        area.codigo.toLowerCase().includes(term) ||
        (area.programa_nombre ?? '').toLowerCase().includes(term);

      const coincidePrograma =
        selectedPrograma === 'TODOS' ||
        String(area.programa) === selectedPrograma;

      return coincideBusqueda && coincidePrograma;
    });
  }, [areas, search, selectedPrograma]);

  const programasActivos = programas.filter((programa) => programa.estado).length;
  const areasActivas = areas.filter((area) => area.estado).length;
  const seccionesActivas = secciones.filter((seccion) => seccion.estado).length;
  const totalRegistros = programas.length + areas.length + secciones.length;

  const handleHeaderCreate = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera Principal */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-theme-primary/15 text-theme-primary shadow-sm">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-theme-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-theme-primary">
                  Estructura Institucional
                </span>
              </div>
              <h1 className="text-2xl font-bold text-theme-main tracking-tight mt-0.5">
                Estructura Organizacional
              </h1>
              <p className="text-sm text-theme-muted">
                Programas institucionales, gerencias, unidades y secciones que formulan y ejecutan presupuestos POA.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleHeaderCreate}
            className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>
              {activeTab === 'programas'
                ? 'Nuevo Programa'
                : activeTab === 'secciones'
                ? 'Nueva Sección'
                : 'Nueva Área'}
            </span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('resumen')}
          className={`card p-5 cursor-pointer transition-all hover:-translate-y-0.5 ${
            activeTab === 'resumen' ? 'ring-2 ring-theme-primary bg-theme-primary/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-theme-primary/10 text-theme-primary">
              <LayoutDashboard size={20} />
            </div>
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">Estructura</span>
          </div>
          <p className="text-3xl font-bold text-theme-main mt-3">{totalRegistros}</p>
          <p className="text-xs text-theme-muted mt-1">Registros organizacionales totales</p>
        </div>

        <div
          onClick={() => setActiveTab('areas')}
          className={`card p-5 cursor-pointer transition-all hover:-translate-y-0.5 ${
            activeTab === 'areas' ? 'ring-2 ring-theme-primary bg-theme-primary/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Building2 size={20} />
            </div>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Áreas</span>
          </div>
          <p className="text-3xl font-bold text-theme-main mt-3">{areas.length}</p>
          <p className="text-xs text-theme-muted mt-1">{areasActivas} activas de {areas.length} registradas</p>
        </div>

        <div
          onClick={() => setActiveTab('secciones')}
          className={`card p-5 cursor-pointer transition-all hover:-translate-y-0.5 ${
            activeTab === 'secciones' ? 'ring-2 ring-theme-primary bg-theme-primary/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Layers3 size={20} />
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Secciones</span>
          </div>
          <p className="text-3xl font-bold text-theme-main mt-3">{secciones.length}</p>
          <p className="text-xs text-theme-muted mt-1">{seccionesActivas} activas de {secciones.length} registradas</p>
        </div>

        <div
          onClick={() => setActiveTab('programas')}
          className={`card p-5 cursor-pointer transition-all hover:-translate-y-0.5 ${
            activeTab === 'programas' ? 'ring-2 ring-theme-primary bg-theme-primary/5' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <FolderTree size={20} />
            </div>
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Programas</span>
          </div>
          <p className="text-3xl font-bold text-theme-main mt-3">{programas.length}</p>
          <p className="text-xs text-theme-muted mt-1">{programasActivos} activos de {programas.length} registrados</p>
        </div>
      </div>

      {/* Contenido según Pestaña */}
      {activeTab === 'resumen' && (
        <div className="space-y-4">
          {/* Buscador y Filtro en Resumen */}
          <div className="card p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="relative w-full md:max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted"
                />
                <input
                  type="text"
                  placeholder="Buscar área, gerencia o programa..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="input-theme pl-10 text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-theme-muted mr-1">
                  <SlidersHorizontal size={14} />
                  <span>Programa:</span>
                </div>
                <select
                  value={selectedPrograma}
                  onChange={(event) => setSelectedPrograma(event.target.value)}
                  className="border border-theme-border rounded-xl px-3 py-2 text-xs bg-theme-surface text-theme-main focus:outline-none focus:ring-2 focus:ring-theme-primary w-full md:w-auto"
                >
                  <option value="TODOS">Todos los Programas</option>
                  {programas.map((programa) => (
                    <option key={programa.id} value={String(programa.id)}>
                      {programa.codigo} - {programa.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(search.trim() || selectedPrograma !== 'TODOS') && (
              <div className="flex items-center justify-between pt-2 border-t border-theme-border text-xs text-theme-muted">
                <span>
                  Mostrando <strong>{areasFiltradas.length}</strong> de <strong>{areas.length}</strong> áreas
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedPrograma('TODOS');
                  }}
                  className="text-theme-primary hover:underline font-medium cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="card p-12 text-center text-theme-muted">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full mb-2" />
              <p className="text-sm">Cargando estructura organizacional...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areasFiltradas.map((area) => {
                const areaSecciones = secciones.filter((seccion) => seccion.area === area.id);
                const programaNombre = area.programa_nombre || programas.find((p) => p.id === area.programa)?.nombre;

                return (
                  <div key={area.id} className="card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                          {area.codigo}
                        </span>
                        <h3 className="text-base font-bold text-theme-main mt-1.5">{area.nombre}</h3>
                        <div className="mt-1">
                          <span className="text-xs text-theme-muted">
                            {area.tipo === 'GERENCIA' ? 'Gerencia de Área' : 'Unidad Operativa'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                        {programaNombre && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                            {programaNombre}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            area.estado
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              area.estado ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
                            }`}
                          />
                          {area.estado ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-theme-border pt-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">
                        Secciones Vinculadas ({areaSecciones.length})
                      </span>
                      <div className="mt-2 space-y-1.5">
                        {areaSecciones.length > 0 ? (
                          areaSecciones.map((seccion) => (
                            <div
                              key={seccion.id}
                              className="p-2.5 rounded-xl bg-theme-base text-xs font-medium text-theme-main flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-theme-primary shrink-0" />
                              <span className="truncate">{seccion.nombre}</span>
                              {seccion.estado && (
                                <CheckCircle2 size={14} className="ml-auto text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-theme-muted italic">Sin secciones registradas.</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveTab('areas')}
                        className="px-3 py-1.5 rounded-xl bg-theme-primary/10 hover:bg-theme-primary/20 text-theme-primary text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Administrar área</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {areasFiltradas.length === 0 && (
                <div className="md:col-span-2 card p-12 text-center text-theme-muted">
                  <Building2 size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No hay áreas que coincidan con la búsqueda.</p>
                  <p className="text-xs mt-1">Prueba ajustando los términos de búsqueda o filtros.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'areas' && (
        <AreasList
          externalShowCreate={showCreateModal}
          onCloseExternalCreate={() => setShowCreateModal(false)}
        />
      )}

      {activeTab === 'secciones' && (
        <SeccionesList
          externalShowCreate={showCreateModal}
          onCloseExternalCreate={() => setShowCreateModal(false)}
        />
      )}

      {activeTab === 'programas' && (
        <ProgramasList
          externalShowCreate={showCreateModal}
          onCloseExternalCreate={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
