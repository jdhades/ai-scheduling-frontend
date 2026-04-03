import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  RotateCcw 
} from "lucide-react";
import type { DashboardData } from '../types/dashboard.types.ts';

// Mock data to simulate API response
const MOCK_DASHBOARD_DATA: DashboardData = {
  metrics: [
    { 
      id: "fleet",
      title: "Fleet Coverage", 
      value: "450", 
      subtitle: "Total", 
      icon: Users,
      trend: { value: "12 sectors active", isPositive: true },
      progress: 85
    },
    { 
      id: "shifts",
      title: "Live Shifts", 
      value: "120", 
      subtitle: "Ongoing", 
      icon: Clock,
      statusColor: "secondary",
      progress: 60
    },
    { 
      id: "alerts",
      title: "Alert Priority", 
      value: "03", 
      subtitle: "Critical", 
      icon: AlertTriangle,
      trend: { value: "Manual override req", isPositive: false },
      statusColor: "error",
      progress: 15
    }
  ],
  insights: [
    {
      id: "insight-1",
      type: "FAIRNESS_DEVIATION",
      message: "Detected structural imbalance in Ops Dept weekend rotation. Automatic redistribution proposed.",
      time: "09:42:11",
      icon: Sparkles,
      color: "primary",
      actions: ["Review Changes", "Dismiss"]
    },
    {
      id: "insight-2",
      type: "SELF-HEALING EVENT",
      message: "3 Sick Leaves detected in Logistics. System successfully re-routed 2 on-call agents to cover critical slots.",
      time: "08:15:44",
      icon: Activity,
      color: "secondary",
      status: "Service Level Maintained"
    },
    {
      id: "insight-3",
      type: "SYSTEM SYNC",
      message: "Global shift synchronization complete for Q3 scheduling window.",
      time: "07:00:00",
      icon: RotateCcw,
      color: "muted-foreground"
    }
  ],
  activities: [
    { id: "RUN_0942_A", dept: "Operations Main", status: "COMPLETED", time: "2m ago" },
    { id: "RUN_0811_X", dept: "Logistics Hub", status: "HEALED", time: "1h ago" },
    { id: "RUN_0702_Z", dept: "HR & Admin", status: "COMPLETED", time: "2h ago" },
  ],
  fairnessIndex: 94.2,
  computationalLoad: 22,
  activeNodes: "14/14"
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard_data'],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return MOCK_DASHBOARD_DATA;
    }
  });
};
