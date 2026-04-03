import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";
import { useDashboardStore } from "../../store/dashboardStore.ts";

const navItems = [
  { id: 'command_center', icon: LayoutDashboard, label: "COMMAND CENTER" },
  { id: 'timeline', icon: Clock, label: "TIMELINE" },
  { id: 'fleet', icon: Users, label: "FLEET STATUS" },
  { id: 'analytics', icon: BarChart3, label: "ANALYTICS" },
  { id: 'logs', icon: FileText, label: "LOGS" },
] as const;

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar, activeView, setActiveView } = useDashboardStore();

  return (
    <aside className={cn(
      "h-screen bg-surface-low border-r border-white/5 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative",
      sidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Collapse Toggle */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 w-6 h-6 bg-surface-highest border border-white/10 rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-colors z-50 shadow-xl"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={cn("flex items-center gap-3 p-6 mb-8 transition-all", sidebarCollapsed && "px-4")}>
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(192,193,255,0.2)]">
          <Zap className="text-primary w-6 h-6 fill-primary/20" />
        </div>
        {!sidebarCollapsed && (
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold tracking-tight text-white truncate"
          >
            AI Master
          </motion.h1>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-surface-container text-primary shadow-rim" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full" 
                />
              )}
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-300",
                isActive ? "text-primary scale-110" : "group-hover:text-white group-hover:scale-110"
              )} />
              {!sidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-bold font-mono uppercase tracking-widest truncate leading-none"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 space-y-4 pt-6 border-t border-white/5">
        <button className={cn(
          "w-full bg-primary-container/20 hover:bg-primary-container/30 text-primary p-3 rounded-xl flex items-center justify-center gap-2 border border-primary/20 transition-all shadow-rim group",
          sidebarCollapsed && "px-0"
        )}>
          <Zap className="w-4 h-4 fill-primary shrink-0" />
          {!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Schedule Run</span>}
        </button>
        
        <button className={cn("w-full flex items-center gap-4 px-3 py-2 text-muted-foreground hover:text-white transition-colors", sidebarCollapsed && "justify-center")}>
          <Settings className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Support</span>}
        </button>
        <button className={cn("w-full flex items-center gap-4 px-3 py-2 text-muted-foreground hover:text-white transition-colors", sidebarCollapsed && "justify-center")}>
          <LogOut className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
