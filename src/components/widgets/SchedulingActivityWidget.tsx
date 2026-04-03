import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { motion } from "motion/react";
import { cn } from "../../lib/utils.ts";
import type { SchedulingActivityItem } from "../../types/dashboard.types.ts";

interface SchedulingActivityWidgetProps {
  activities: SchedulingActivityItem[];
  className?: string;
}

export const SchedulingActivityWidget = ({ activities, className }: SchedulingActivityWidgetProps) => {
  return (
    <Card className={cn("p-6 flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white">Scheduling Activity</h3>
        <button className="text-[10px] font-mono text-muted-foreground hover:text-white uppercase tracking-widest transition-colors font-bold">
          Export Logs
        </button>
      </div>

      <div className="flex-1 min-w-full">
        <div className="grid grid-cols-4 pb-4 border-b border-white/5 mb-4">
          {["Execution ID", "Department", "Status", "Time"].map((header) => (
            <span key={header} className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">
              {header}
            </span>
          ))}
        </div>

        <div className="space-y-4">
          {activities.map((activity, i) => (
            <motion.div 
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-4 items-center group cursor-pointer"
            >
              <span className="text-sm font-mono text-primary/80 group-hover:text-primary transition-colors font-bold">
                {activity.id}
              </span>
              <span className="text-sm text-foreground/80">{activity.dept}</span>
              <div>
                <Badge variant={activity.status === "COMPLETED" ? "secondary" : "primary"}>
                  {activity.status}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
};
