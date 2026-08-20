import React, { useState, useEffect } from 'react';
import { Building2, Plus, Layers, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Area, Seccion, getAreas, getSecciones } from '../../services/presupuestoService';

export default function OrganizacionalPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const data = await getAreas();
      setAreas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const areasFiltradas = areas.filter(
    (a) =>
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="card p-6 bg-gradient-to-r from-theme-surface via-theme-surface to-brand-50/20 dark:to-brand-900/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-theme-primary/15 text-theme-main">
            <Building2 size={28} className="text-theme-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-main tracking-tight">Estructura Organizacional</h1>
            <p className="text-sm text-theme-muted">
              Programas Institucionales, Gerencias, Unidades y Secciones que formulan y ejecutan presupuestos POA.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder="Buscar área o gerencia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-theme pl-10 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areasFiltradas.map((area) => (
          <div key={area.id} className="card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  {area.codigo}
                </span>
                <h3 className="text-base font-bold text-theme-main mt-1.5">{area.nombre}</h3>
                <span className="text-xs text-theme-muted">{area.tipo === 'GERENCIA' ? 'Gerencia de Área' : 'Unidad Operativa'}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Activa
              </span>
            </div>

            <div className="border-t border-theme-border pt-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Secciones Vinculadas:</span>
              <div className="mt-2 space-y-1.5">
                {area.secciones && area.secciones.length > 0 ? (
                  area.secciones.map((sec) => (
                    <div key={sec.id} className="p-2 rounded-lg bg-theme-base text-xs font-medium text-theme-main flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-theme-primary" />
                      <span>{sec.nombre}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-theme-muted italic">Sin secciones registradas.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
