import type { LucideIcon } from "lucide-react";

export type Trend = {
  value: string;
  isPositive: boolean;
};

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: Trend;
  icon?: LucideIcon;
  progress?: number;
  statusColor?: "primary" | "secondary" | "error" | "muted";
}

export interface AIInsight {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: LucideIcon;
  color: "primary" | "secondary" | "muted-foreground";
  actions?: string[];
  status?: string;
}

export interface SchedulingActivityItem {
  id: string;
  dept: string;
  status: "COMPLETED" | "HEALED" | "CRITICAL";
  time: string;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  insights: AIInsight[];
  activities: SchedulingActivityItem[];
  fairnessIndex: number;
  computationalLoad: number;
  activeNodes: string;
}
