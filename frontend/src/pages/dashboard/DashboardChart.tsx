import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Ene", planificado: 4000, ejecutado: 2400 },
  { name: "Feb", planificado: 3000, ejecutado: 1398 },
  { name: "Mar", planificado: 2000, ejecutado: 9800 },
  { name: "Abr", planificado: 2780, ejecutado: 3908 },
  { name: "May", planificado: 1890, ejecutado: 4800 },
  { name: "Jun", planificado: 2390, ejecutado: 3800 },
];

export default function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: "var(--text-muted)", fontSize: 12 }} 
          dy={10} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: "var(--text-muted)", fontSize: 12 }} 
        />
        <Tooltip 
          cursor={{ fill: "var(--bg-base)" }}
          contentStyle={{ 
            backgroundColor: "var(--bg-surface)", 
            borderColor: "var(--border)",
            borderRadius: "0.75rem",
            color: "var(--text-main)"
          }}
          itemStyle={{ color: "var(--text-main)" }}
        />
        {/* Aquí usamos la triada recomendada para gráficos */}
        <Bar dataKey="planificado" fill="#05FFCD" radius={[4, 4, 0, 0]} />
        <Bar dataKey="ejecutado" fill="var(--theme-primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
