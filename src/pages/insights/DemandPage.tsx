import { HistoricalDemandHeatmap } from '../../components/heatmap/HistoricalDemandHeatmap';

export const DemandPage = () => (
  <div className="space-y-4">
    <header>
      <h1 className="text-xl font-bold text-foreground">Demand Heatmap</h1>
      <p className="text-sm text-muted-foreground">
        Demanda histórica por día y hora.
      </p>
    </header>
    <HistoricalDemandHeatmap />
  </div>
);
