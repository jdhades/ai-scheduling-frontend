import { Card } from "../ui/Card";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "../../lib/utils.ts";

const data = [
  { time: "00:00", value: 30 },
  { time: "04:00", value: 45 },
  { time: "08:00", value: 35 },
  { time: "12:00", value: 60 },
  { time: "16:00", value: 50 },
  { time: "20:00", value: 75 },
  { time: "23:59", value: 85 },
];

export const NodeInsightsWidget = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("p-6 flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Node Insights</h3>
        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 min-h-[140px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#44e2cd" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#44e2cd" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#44e2cd" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl relative overflow-hidden group shadow-rim">
        <div className="absolute top-0 right-0 p-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest block mb-1">
          Efficiency Peak
        </span>
        <p className="text-sm font-bold text-white leading-tight">
          System identified 12% potential saving in night-shift overlaps.
        </p>
      </div>
    </Card>
  );
};
