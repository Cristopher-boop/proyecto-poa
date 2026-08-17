export default function Footer() {
  return (
    <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-400 flex items-center justify-between">
      <span>© {new Date().getFullYear()} POA — Planificación Operativa Anual</span>
      <span>v0.1.0 · entorno de desarrollo</span>
    </footer>
  );
}
