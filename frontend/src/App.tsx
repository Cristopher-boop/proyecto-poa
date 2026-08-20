import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PresupuestosPage from "./pages/presupuestos/PresupuestosPage";
import MemoriasPage from "./pages/memorias/MemoriasPage";
import EjecucionPage from "./pages/ejecucion/EjecucionPage";
import OrganizacionalPage from "./pages/organizacional/OrganizacionalPage";

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
                <Route path="memorias" element={<MemoriasPage />} />
                <Route path="ejecucion" element={<EjecucionPage />} />
                <Route path="organizacional" element={<OrganizacionalPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
