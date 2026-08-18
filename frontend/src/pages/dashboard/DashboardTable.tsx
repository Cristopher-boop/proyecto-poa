const rows = [
  { id: "TR-001", de: "Marketing", para: "Operaciones", monto: "$12,500", estado: "Aprobado" },
  { id: "TR-002", de: "RRHH", para: "TI", monto: "$5,300", estado: "Pendiente" },
  { id: "TR-003", de: "Ventas", para: "Logística", monto: "$8,900", estado: "Aprobado" },
  { id: "TR-004", de: "Dirección", para: "Marketing", monto: "$25,000", estado: "Rechazado" },
];

export default function DashboardTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-theme-muted uppercase bg-theme-base/50">
          <tr>
            <th className="px-5 py-3 font-semibold">ID</th>
            <th className="px-5 py-3 font-semibold">Origen</th>
            <th className="px-5 py-3 font-semibold">Destino</th>
            <th className="px-5 py-3 font-semibold text-right">Monto</th>
            <th className="px-5 py-3 font-semibold text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-theme-border/20 transition-colors">
              <td className="px-5 py-3 font-medium text-theme-main">{row.id}</td>
              <td className="px-5 py-3 text-theme-muted">{row.de}</td>
              <td className="px-5 py-3 text-theme-muted">{row.para}</td>
              <td className="px-5 py-3 text-theme-main font-mono text-right">{row.monto}</td>
              <td className="px-5 py-3 text-center">
                <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  row.estado === 'Aprobado' 
                    ? 'bg-triad-green-50 text-triad-green-600 dark:bg-triad-green-500/10 dark:text-triad-green-500' 
                    : row.estado === 'Pendiente'
                    ? 'bg-accent/10 text-theme-primaryText'
                    : 'bg-triad-rose-50 text-triad-rose-600 dark:bg-triad-rose-500/10 dark:text-triad-rose-500'
                }`}>
                  {row.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
