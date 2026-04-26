import { Search, Bell, User } from "lucide-react";
import { Badge } from "../ui/Badge";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { cn } from "../../lib/utils.ts";

export const DashboardHeader = () => {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md border-b border-white/5 z-20 shrink-0">
      <div className="flex items-center gap-8 min-w-0">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
          Orchestrator AI
          <Badge variant="ghost" className="border-white/5 bg-white/5 text-[9px] px-2 py-0">v2.4.0</Badge>
        </h2>
        <nav className="hidden lg:flex items-center gap-6">
          {["Dashboard", "Employees", "Departments", "Analytics"].map((item, i) => (
            <a 
              key={item} 
              href="#" 
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider transition-all",
                i === 0 ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search system node..." 
            className="bg-surface-container/30 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[12px] text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 w-48 lg:w-64 transition-all"
          />
        </div>
        
        <LanguageSwitcher />

        <button className="relative p-2 text-muted-foreground hover:text-white transition-colors group">
          <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-background shadow-[0_0_8px_rgba(68,226,205,0.6)]" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10 ml-2">
          <div className="w-9 h-9 rounded-full bg-surface-highest border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 transition-colors group">
            <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
};
