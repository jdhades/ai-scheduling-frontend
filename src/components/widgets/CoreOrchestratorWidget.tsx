import { Card } from "../ui/Card";
import { motion } from "motion/react";
import { Settings2, Cpu } from "lucide-react";
import { cn } from "../../lib/utils.ts";

interface CoreOrchestratorWidgetProps {
  load: number;
  activeNodes: string;
  className?: string;
}

export const CoreOrchestratorWidget = ({ load, activeNodes, className }: CoreOrchestratorWidgetProps) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white">Core Orchestrator</h3>
        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between items-center mb-2 text-[10px] font-mono tracking-widest font-bold">
            <span className="text-muted-foreground uppercase">Computational Load</span>
            <span className="text-secondary">{load}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${load}%` }}
              className="h-full bg-secondary shadow-[0_0_10px_rgba(68,226,205,0.4)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="block text-[10px] text-muted-foreground uppercase font-mono mb-1 tracking-widest font-bold">Active Nodes</span>
            <span className="text-lg font-bold text-white tracking-tight">{activeNodes}</span>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
            <span className="block text-[10px] text-muted-foreground uppercase font-mono mb-1 tracking-widest font-bold">Latency</span>
            <span className="text-lg font-bold text-white tracking-tight">12ms</span>
          </div>
        </div>
      </div>

      <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all group shadow-rim">
         <Cpu className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
         <span className="text-xs font-bold tracking-widest text-muted-foreground group-hover:text-white uppercase transition-colors">Configuration Sync</span>
      </button>
    </Card>
  );
};
