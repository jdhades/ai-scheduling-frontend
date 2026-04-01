import { DashboardLayout } from './layout/DashboardLayout.tsx'
import { ScheduleStatusWidget, CoverageAlertWidget } from './components/widgets/InitialWidgets.tsx'
import { ScheduleGrid } from './components/schedule/ScheduleGrid.tsx'
import { CoverageHeatmap } from './components/heatmap/CoverageHeatmap.tsx'
import { FairnessPanel } from './components/fairness/FairnessPanel.tsx'
import { HistoricalDemandHeatmap } from './components/heatmap/HistoricalDemandHeatmap.tsx'

function App() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ScheduleStatusWidget />
        </div>
        <div className="lg:col-span-2">
          <CoverageAlertWidget />
        </div>
      </div>

      <div className="flex-1 min-h-[500px] mb-8">
        <ScheduleGrid />
      </div>

      <div className="mb-8">
        <CoverageHeatmap />
      </div>

      <div className="mb-8">
        <HistoricalDemandHeatmap />
      </div>

      <div className="mb-8">
        <FairnessPanel />
      </div>
    </DashboardLayout>
  )
}

export default App
