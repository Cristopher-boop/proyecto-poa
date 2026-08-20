import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Layers3,
  FolderTree,
  Search,
  ChevronRight,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import { organizacionalService } from '../../services/organizacionalService';
import { Area, Programa, Seccion } from '../../types/organizacional';
import { AreasList, ProgramasList, SeccionesList } from '../../components/organizacional';

type Section = 'resumen' | 'secciones' | 'areas' | 'programas';

export default function OrganizacionalPage() {
  const [section, setSection] = useState<Section>('resumen');
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const cargarResumen = async () => {
    setLoading(true);
    try {
      const [programasRes, areasRes, seccionesRes] = await Promise.all([
        organizacionalService.getProgramas(),
        organizacionalService.getAreas(),
        organizacionalService.getSecciones(),
      ]);

      setProgramas(programasRes.data);
      setAreas(areasRes.data);
      setSecciones(seccionesRes.data);
    } catch (error) {
      console.error('Error cargando módulo organizacional:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResumen();
  }, []);

  const areasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return areas;

    return areas.filter((area) =>
      area.nombre.toLowerCase().includes(term) ||
      area.codigo.toLowerCase().includes(term) ||
      (area.programa_nombre ?? '').toLowerCase().includes(term),
    );
  }, [areas, search]);

  const programasActivos = programas.filter((programa) => programa.estado).length;
  const areasActivas = areas.filter((area) => area.estado).length;
  const seccionesActivas = secciones.filter((seccion) => seccion.estado).length;
  const totalRegistros = programas.length + areas.length + secciones.length;

  const selectorCards: Array<{
    key: Exclude<Section, 'resumen'>;
    label: string;
    total: number;
    activos: number;
    icon: typeof Building2;
  }> = [
    { key: 'secciones', label: 'Secciones', total: secciones.length, activos: seccionesActivas, icon: Layers3 },
    { key: 'areas', label: 'Áreas', total: areas.length, activos: areasActivas, icon: Building2 },
    { key: 'programas', label: 'Programas', total: programas.length, activos: programasActivos, icon: FolderTree },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera */}
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-theme-primary/15 text-theme-primary">
            <Building2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-main tracking-tight">
              Estructura Organizacional
            </h1>
            <p className="text-sm text-theme-muted">
              Programas institucionales, gerencias, unidades y secciones que formulan y ejecutan presupuestos POA.
            </p>
          </div>
        </div>
      </div>

      {/* Selector único mediante cards: Resumen → Secciones → Áreas → Programas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSection('resumen')}
          className={`card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-theme-primary ${
            section === 'resumen' ? 'ring-2 ring-theme-primary bg-theme-primary/5' : 'hover:bg-theme-base'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-theme-primary/10 text-theme-primary">
              <LayoutDashboard size={22} />
            </div>
            <ChevronRight size={18} className="text-theme-muted" />
          </div>
          <p className="text-xs uppercase tracking-wider font-semibold text-theme-muted mt-4">Resumen</p>
          <p className="text-3xl font-bold text-theme-main mt-1">{totalRegistros}</p>
          <p className="text-xs text-theme-muted mt-1">registros organizacionales</p>
        </button>

        {selectorCards.map(({ key, label, total, activos, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-theme-primary ${
              section === key ? 'ring-2 ring-theme-primary bg-theme-primary/5' : 'hover:bg-theme-base'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-theme-primary/10 text-theme-primary">
                <Icon size={22} />
              </div>
              <ChevronRight size={18} className="text-theme-muted" />
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold text-theme-muted mt-4">{label}</p>
            <p className="text-3xl font-bold text-theme-main mt-1">{total}</p>
            <p className="text-xs text-theme-muted mt-1">{activos} activas</p>
          </button>
        ))}
      </div>

      {section === 'resumen' && (
        <>
          <div className="card p-4">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
              <input
                type="text"
                placeholder="Buscar área, gerencia o programa..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input-theme pl-10 text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="card p-10 text-center text-theme-muted">Cargando estructura organizacional...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areasFiltradas.map((area) => {
                const areaSecciones = secciones.filter((seccion) => seccion.area === area.id);

                return (
                  <div key={area.id} className="card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-theme-primary/10 text-theme-primary">
                          {area.codigo}
                        </span>
                        <h3 className="text-base font-bold text-theme-main mt-1.5">{area.nombre}</h3>
                        <span className="text-xs text-theme-muted">
                          {area.tipo === 'GERENCIA' ? 'Gerencia de Área' : 'Unidad Operativa'}
                          {area.programa_nombre ? ` · ${area.programa_nombre}` : ''}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        area.estado
                          ? 'bg-triad-green-50 text-triad-green-600 dark:bg-triad-green-500/15 dark:text-triad-green-500'
                          : 'bg-triad-rose-50 text-triad-rose-600 dark:bg-triad-rose-500/15 dark:text-triad-rose-500'
                      }`}>
                        {area.estado ? 'Activa' : 'Inactiva'}
                      </span>
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
                              className="p-2 rounded-lg bg-theme-base text-xs font-medium text-theme-main flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-theme-primary" />
                              <span>{seccion.nombre}</span>
                              {seccion.estado && <CheckCircle2 size={13} className="ml-auto text-triad-green-600 dark:text-triad-green-500" />}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-theme-muted italic">Sin secciones registradas.</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSection('areas')}
                      className="text-xs font-semibold text-theme-primary hover:text-theme-primaryHover hover:underline"
                    >
                      Administrar área
                    </button>
                  </div>
                );
              })}

              {areasFiltradas.length === 0 && (
                <div className="md:col-span-2 card p-10 text-center text-theme-muted">
                  No hay áreas que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {section === 'secciones' && <SeccionesList />}
      {section === 'areas' && <AreasList />}
      {section === 'programas' && <ProgramasList />}
    </div>
  );
}
