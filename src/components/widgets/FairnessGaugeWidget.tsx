import { Card } from "../ui/Card";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";

interface FairnessGaugeWidgetProps {
  value: number;
  className?: string;
}

export const FairnessGaugeWidget = ({ value, className }: FairnessGaugeWidgetProps) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <Card className={cn("flex flex-col items-center justify-center p-8", className)}>
       <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mb-8">Global Fairness Index</h3>
      
      <div className="relative w-48 h-48 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96" cy="96" r={radius}
            stroke="currentColor" strokeWidth="12" fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="96" cy="96" r={radius}
            stroke="currentColor" strokeWidth="12" fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-secondary shadow-[0_0_20px_rgba(68,226,205,0.4)]"
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-bold text-white"
          >
            {value}%
          </motion.span>
          <span className="text-[10px] font-mono text-secondary tracking-widest uppercase">Optimal</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
          <span className="block text-[10px] text-muted-foreground uppercase font-mono mb-1">Variance</span>
          <span className="text-sm font-bold text-white">±1.4%</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
          <span className="block text-[10px] text-muted-foreground uppercase font-mono mb-1">Equity</span>
          <span className="text-sm font-bold text-white">High</span>
        </div>
      </div>
    </Card>
  );
};
