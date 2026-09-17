import os

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\pages\memorias\MemoriasPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

header_code = '''
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-theme-primary/15 text-theme-main">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-primary"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-main tracking-tight">Módulo de Memorias de Cálculo</h1>
            <p className="mt-1 text-sm text-theme-muted">
              Formulación, sustento técnico ítem por ítem y ciclo de aprobación para la Planificación Operativa Anual (POA).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-theme-base/80 p-2 rounded-2xl border border-theme-border">
          <div className="flex items-center gap-2 px-3 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-theme-muted"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Gestión:</span>
            <select
              value={selectedGestionId || ''}
              onChange={(e) => setSelectedGestionId(Number(e.target.value))}
              className="bg-theme-surface font-bold text-sm px-3 py-1.5 rounded-xl border border-theme-border text-theme-main focus:outline-none"
            >
              {gestiones.map((g: any) => (
                <option key={g.id} value={g.id}>
                  Gestión {g.anio} ({g.estado_display})
                </option>
              ))}
            </select>
          </div>

          {canCreate && (
            <button
              onClick={handleCreate}
              disabled={isGestionBloqueada}
              className="btn-primary text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Formular Memoria
            </button>
          )}
        </div>
      </div>

      {isGestionBloqueada && (
        <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 rounded-xl flex items-center gap-3 text-xs text-blue-800 dark:text-blue-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-600 dark:text-blue-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>
            <strong>Formulación de la Gestión {activeGestion?.anio} cerrada:</strong> Las memorias de cálculo están consolidadas para el presupuesto y no admiten modificaciones.
          </span>
        </div>
      )}
'''

content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';\nimport api from '../../services/api';")
content = content.replace('const selectedGestionId = 1; // Reemplazar con el valor real\n  const areas: any[] = []; // Reemplazar con la obtenciÃ³n real de Ã¡reas', 'const [selectedGestionId, setSelectedGestionId] = useState<number | null>(null);\n  const [gestiones, setGestiones] = useState<any[]>([]);\n  const [areas, setAreas] = useState<any[]>([]);\n\n  useEffect(() => {\n    const fetchData = async () => {\n      try {\n        const [gRes, aRes] = await Promise.all([\n          api.get(\'/api/v1/presupuestos/gestiones/\'),\n          api.get(\'/api/v1/usuarios/areas/\')\n        ]);\n        setGestiones(gRes.data);\n        setAreas(aRes.data);\n        if (gRes.data.length > 0) {\n          setSelectedGestionId(gRes.data[0].id);\n        }\n      } catch (err) {\n        console.error(err);\n      }\n    };\n    fetchData();\n  }, []);\n\n  const activeGestion = gestiones.find(g => g.id === selectedGestionId);\n  const isGestionBloqueada = activeGestion?.estado === \'FINALIZADO\';\n')

start = content.find('      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">')
if start == -1:
    start = content.find('      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">')

end = content.find('      <MemoriasFilter')

if start != -1:
    content = content[:start] + header_code + '\n' + content[end:]

with open(r'c:\Users\hp\Desktop\proyecto-poa\frontend\src\pages\memorias\MemoriasPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done header replacement')
