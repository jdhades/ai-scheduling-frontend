import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";
import type { AIInsight } from "../../types/dashboard.types.ts";

interface AIInsightsWidgetProps {
  insights: AIInsight[];
  className?: string;
}

export const AIInsightsWidget = ({ insights, className }: AIInsightsWidgetProps) => {
  return (
    <Card padding="none" className={cn("overflow-hidden h-full flex flex-col", className)}>
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          AI Live Insights
          <Badge variant="secondary" animate="pulse">Live Stream</Badge>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
        {insights.map((insight) => (
          <motion.div 
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 hover:bg-white/5 transition-colors group flex gap-4"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 transition-all group-hover:scale-110",
              insight.color === "primary" ? "bg-primary/20 text-primary border-primary/20 shadow-[0_0_10px_rgba(192,193,255,0.1)]" : 
              insight.color === "secondary" ? "bg-secondary/20 text-secondary border-secondary/20 shadow-[0_0_10px_rgba(68,226,205,0.1)]" : 
              "bg-white/10 text-muted-foreground"
            )}>
              <insight.icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-[10px] font-mono font-bold tracking-widest uppercase",
                  insight.color === "primary" ? "text-primary" : 
                  insight.color === "secondary" ? "text-secondary" : 
                  "text-muted-foreground"
                )}>
                  {insight.type}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">{insight.time}</span>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{insight.message}</p>

              <div className="flex flex-wrap gap-2 items-center">
                {insight.actions?.map(action => (
                  <Badge key={action} variant={action === "Review Changes" ? "primary" : "ghost"} className="cursor-pointer">
                    {action}
                  </Badge>
                ))}
                {insight.status && (
                  <Badge variant="secondary">{insight.status}</Badge>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
