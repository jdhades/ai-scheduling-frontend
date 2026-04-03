import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";
import type { DashboardMetric } from "../../types/dashboard.types.ts";

interface MetricCardWidgetProps {
  metric: DashboardMetric;
  className?: string;
}

export const MetricCardWidget = ({ metric, className }: MetricCardWidgetProps) => {
  const { title, value, subtitle, trend, icon: Icon, progress, statusColor } = metric;

  return (
    <Card
      hover="lift"
      className={cn(
        statusColor === "secondary" && "border-secondary/20 shadow-[0_0_15px_rgba(68,226,205,0.05)]",
        statusColor === "error" && "border-error/20",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
          {title}
        </span>
        {Icon && (
          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
            <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="text-4xl font-bold text-white tracking-tight leading-none">
          {value}
        </h3>
        {subtitle && (
          <span className={cn(
            "text-sm font-medium",
            statusColor === "secondary" ? "text-secondary" :
              statusColor === "error" ? "text-error" : "text-primary/80"
          )}>
            {subtitle}
          </span>
        )}
      </div>


      {/*   <div className="mt-4 flex items-center gap-2">
        {trend && (
          <div>
            <Badge variant={trend.isPositive ? "secondary" : "error"}>
              {trend.isPositive ? "+" : "-"}{trend.value}
            </Badge>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
              vs last period
            </span>
          </div>
        )}
      </div> */}


      {progress !== undefined && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full",
              statusColor === "secondary" ? "bg-secondary shadow-[0_0_10px_rgba(68,226,205,0.5)]" :
                statusColor === "error" ? "bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)]" :
                  "bg-primary shadow-[0_0_10px_rgba(192,193,255,0.5)]"
            )}
          />
        </div>
      )}
    </Card>
  );
};
