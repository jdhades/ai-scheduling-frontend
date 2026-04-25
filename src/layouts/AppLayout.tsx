import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { DashboardHeader } from '../components/layout/DashboardHeader';

/**
 * Layout principal: sidebar + header + outlet para las rutas hijas.
 * El contenido se scrollea dentro del main; sidebar y header quedan fijos.
 */
export const AppLayout = () => (
  <div className="flex bg-background text-foreground h-screen overflow-hidden selection:bg-primary/30">
    <AppSidebar />

    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      <DashboardHeader />

      <main className="flex-1 overflow-y-auto custom-scrollbar relative px-6 py-6">
        <Outlet />
      </main>
    </div>
  </div>
);
