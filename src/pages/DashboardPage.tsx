import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { BentoGrid, BentoItem } from '../components/layout/BentoGrid';
import { MetricCardWidget } from '../components/widgets/MetricCardWidget';
import { AIInsightsWidget } from '../components/widgets/AIInsightsWidget';
import { FairnessGaugeWidget } from '../components/widgets/FairnessGaugeWidget';
import { SchedulingActivityWidget } from '../components/widgets/SchedulingActivityWidget';
import { CoreOrchestratorWidget } from '../components/widgets/CoreOrchestratorWidget';
import { NodeInsightsWidget } from '../components/widgets/NodeInsightsWidget';
import { useDashboardData } from '../api/dashboard.api';

/**
 * Dashboard original (Bento grid). Actualmente alimentado por
 * `useDashboardData()` que es mock — se reemplazará por queries reales
 * en F.6 (Insights).
 */
export const DashboardPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] animate-pulse">
          {t('dashboard:loading')}
        </span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-error text-xl font-bold font-mono">
          {t('dashboard:loadError')}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
        >
          {t('dashboard:retry')}
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <BentoGrid className="grid-cols-1 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
        {data.metrics.map((metric) => (
          <BentoItem key={metric.id} colSpan={1}>
            <MetricCardWidget metric={metric} />
          </BentoItem>
        ))}
        <BentoItem colSpan={3} rowSpan={1}>
          <AIInsightsWidget insights={data.insights} />
        </BentoItem>
        <BentoItem colSpan={1} rowSpan={2}>
          <FairnessGaugeWidget value={data.fairnessIndex} className="h-full" />
        </BentoItem>
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
  );
};
