import os

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriasList.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

table_code = '''
  return (
    <div className="bg-theme-surface rounded-xl border border-theme-border overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-theme-border bg-theme-base/60 text-xs font-semibold uppercase tracking-wider text-theme-muted">
            <th className="py-3.5 px-4">Código</th>
            <th className="py-3.5 px-4">Área</th>
            <th className="py-3.5 px-4">Partida Presupuestaria</th>
            <th className="py-3.5 px-4">Operación POA & Justificación</th>
            <th className="py-3.5 px-4 text-center">Ítems</th>
            <th className="py-3.5 px-4 text-right">Total Presupuestado</th>
            <th className="py-3.5 px-4 text-center">Estado</th>
            <th className="py-3.5 px-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-border">
          {memorias.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-theme-muted">
                <FileText size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">No se encontraron memorias en esta bandeja.</p>
              </td>
            </tr>
          ) : (
            memorias.map((memoria) => {
              const total = parseFloat(String(memoria.total_presupuestado || memoria.total_presupuesto || '0'));
              const formatMoney = (val: any) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(val) || 0);

              const getEstadoBadge = (estado: string) => {
                const est = estado || '';
                if (est.includes('BORRADOR')) return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 rounded-md text-[10px] font-bold">Borrador</span>;
                if (est.includes('GERENCIA')) return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold">Rev. Gerencia</span>;
                if (est.includes('PLANIFICACION')) return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-bold">Rev. Planificación</span>;
                if (est.includes('FINANZAS')) return <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-md text-[10px] font-bold">Aprobado</span>;
                if (est.includes('RECHAZADO')) return <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold">Rechazado</span>;
                return <span className="px-2 py-0.5 bg-theme-border/30 text-theme-muted rounded-md text-[10px] font-bold">{est.replace(/_/g, ' ')}</span>;
              };

              return (
                <tr key={memoria.id} className="transition-all duration-500 hover:bg-theme-border/20">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-theme-main">{memoria.codigo}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-theme-main text-xs">{memoria.area_nombre || memoria.seccion_nombre}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-xs text-theme-main">{memoria.partida_codigo || 'Partida'}</p>
                    <p className="text-[11px] text-theme-muted line-clamp-1">{memoria.partida_nombre || 'Sin partida'}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      {memoria.operacion_codigo && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-theme-base text-theme-main border border-theme-border">
                          POA: {memoria.operacion_codigo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-theme-main line-clamp-2">{memoria.justificacion}</p>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-theme-primary/10 text-theme-primary">
                      {memoria.total_items ?? ((memoria as any).detalles ? (memoria as any).detalles.length : 0)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-theme-main text-xs">{formatMoney(total)}</td>
                  <td className="py-3.5 px-4 text-center">
                    {getEstadoBadge(memoria.estado)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                      <button onClick={() => onView(memoria.id)} className="p-2 text-theme-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors" title="Ver Ficha Técnica y Acciones de Revisión">
                        <Eye size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
'''

start = content.find('  return (')
end = content.find('  );\n};')

content = content[:start] + table_code + content[end:]

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\features\memorias\components\MemoriasList.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated MemoriasList.tsx')
