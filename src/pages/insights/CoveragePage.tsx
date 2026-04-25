import { CoverageHeatmap } from '../../components/heatmap/CoverageHeatmap';

export const CoveragePage = () => (
  <div className="space-y-4">
    <header>
      <h1 className="text-xl font-bold text-foreground">Coverage Heatmap</h1>
      <p className="text-sm text-muted-foreground">
        Cobertura por día y hora del horario actual.
      </p>
    </header>
    <CoverageHeatmap />
  </div>
);
