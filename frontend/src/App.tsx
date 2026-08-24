import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PresupuestosPage from "./pages/presupuestos/PresupuestosPage";
import PartidasPage from "./pages/partidas/PartidasPage";
import MemoriasPage from "./pages/memorias/MemoriasPage";
import EjecucionPage from "./pages/ejecucion/EjecucionPage";
import PlanificacionPage from "./pages/planificacion/PlanificacionPage";
import OrganizacionalPage from "./pages/organizacional/OrganizacionalPage";
import LogsPage from "./pages/logs/LogsPage";
import PartidasPage from "./pages/partidas/PartidasPage";
import TraspasosPage from "./pages/traspasos/TraspasosPage";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="poa-theme">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="presupuestos" element={<PresupuestosPage />} />
                <Route path="partidas" element={<PartidasPage />} />
                <Route path="memorias" element={<MemoriasPage />} />
                <Route path="traspasos" element={<TraspasosPage />} />
                <Route path="ejecucion" element={<EjecucionPage />} />
                <Route path="planificacion" element={<PlanificacionPage />} />
                <Route path="organizacional" element={<OrganizacionalPage />} />
                <Route path="logs" element={<LogsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
