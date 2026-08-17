import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar, { ModuleKey } from "./Sidebar";
import Footer from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
  activeModule: ModuleKey;
  onModuleChange: (module: ModuleKey) => void;
}

export default function MainLayout({ children, activeModule, onModuleChange }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar activeModule={activeModule} onModuleChange={onModuleChange} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
