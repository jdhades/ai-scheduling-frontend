import { Sidebar } from "./components/layout/Sidebar.tsx";
import { DashboardHeader } from "./components/layout/DashboardHeader.tsx";
import { BentoGrid, BentoItem } from "./components/layout/BentoGrid.tsx";
import { MetricCardWidget } from "./components/widgets/MetricCardWidget.tsx";
import { AIInsightsWidget } from "./components/widgets/AIInsightsWidget.tsx";
import { FairnessGaugeWidget } from "./components/widgets/FairnessGaugeWidget.tsx";
import { SchedulingActivityWidget } from "./components/widgets/SchedulingActivityWidget.tsx";
import { CoreOrchestratorWidget } from "./components/widgets/CoreOrchestratorWidget.tsx";
import { NodeInsightsWidget } from "./components/widgets/NodeInsightsWidget.tsx";
import { useDashboardData } from "./api/dashboard.api.ts";
import { AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";


function App() {
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] animate-pulse">Initializing System...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-error text-xl font-bold font-mono tracking-tighter">CRITICAL_SYSTEM_FAILURE</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          Reboot System
        </button>
      </div>
    );
  }

  return (
    <div className="flex bg-background text-foreground h-screen overflow-hidden selection:bg-primary/30">
      {/* Sidebar - Integrated with Zustand */}
      <Sidebar />

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <BentoGrid className="grid-cols-1 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
              
              {/* Top Row: Quick Metrics */}
              {data.metrics.map((metric) => (
                <BentoItem key={metric.id} colSpan={1}>
                  <MetricCardWidget metric={metric} />
                </BentoItem>
              ))}
              
              {/* Middle Row: AI Insights & Fairness */}
              <BentoItem colSpan={3} rowSpan={1}>
                <AIInsightsWidget insights={data.insights} />
              </BentoItem>
              <BentoItem colSpan={1} rowSpan={2}>
                <FairnessGaugeWidget value={data.fairnessIndex} className="h-full" />
              </BentoItem>

              {/* Bottom Row: Logs & Technicals */}
              <BentoItem colSpan={2}>
                <SchedulingActivityWidget activities={data.activities} />
              </BentoItem>
              <BentoItem colSpan={1} className="flex flex-col gap-6">
                <CoreOrchestratorWidget 
                  load={data.computationalLoad} 
                  activeNodes={data.activeNodes} 
                />
                <NodeInsightsWidget />
              </BentoItem>

            </BentoGrid>
          </AnimatePresence>
          
          <div className="h-20" /> {/* Bottom spacing */}
        </main>
      </div>
    </div>
  );
}

export default App;
