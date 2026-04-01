import { useState } from 'react'
import { cn } from '../../lib/utils.ts'
import { useTranslation } from 'react-i18next'

// Dummy Data shared structure
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const hours = Array.from({ length: 14 }, (_, i) => `${8 + i}:00`) // 8am to 9pm

// Generate random historical demand (customers per hour) vs coverage
const generateHistoricalData = () => {
    const data: Record<string, Record<string, { customers: number, coverageGap: number }>> = {}
    days.forEach(day => {
        data[day] = {}
        hours.forEach(hour => {
            const h = parseInt(hour)
            // Peak hours are usually 12-14 and 18-20
            const isLunchPeak = h >= 12 && h <= 14
            const isDinnerPeak = h >= 18 && h <= 20
            const isWeekend = day === 'Saturday' || day === 'Sunday'

            let baseCustomers = 20
            if (isLunchPeak) baseCustomers += 40
            if (isDinnerPeak) baseCustomers += 50
            if (isWeekend) baseCustomers += 30

            // Randomize a bit
            const customers = Math.floor(baseCustomers * (0.8 + Math.random() * 0.4))

            // Negative gap means understaffed, positive means overstaffed, 0 means perfect
            const coverageGap = Math.floor(Math.random() * 5) - 2 // -2 to +2

            data[day][hour] = { customers, coverageGap }
        })
    })
    return data
}

const historicalData = generateHistoricalData()

// Helper to get color based on demand intensity
const getDemandColorClass = (customers: number) => {
    if (customers > 100) return 'bg-indigo-900 text-white'
    if (customers > 75) return 'bg-indigo-700 text-white'
    if (customers > 50) return 'bg-indigo-500 text-white'
    if (customers > 25) return 'bg-indigo-300 text-indigo-950'
    return 'bg-indigo-100 text-indigo-950'
}

export function HistoricalDemandHeatmap() {
    const [selectedCell, setSelectedCell] = useState<{ day: string, hour: string } | null>(null)
    const { t } = useTranslation()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">{t('demandHeatmap.title', 'Historical Demand & Coverage Overlay')}</h3>
                <div className="flex items-center gap-4 text-sm mt-2 md:mt-0">
                    <div className="flex items-center gap-2">Intensity:</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100"></span> Low</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500"></span> Med</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-900"></span> High</div>
                </div>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
                <div className="min-w-[800px]">
                    {/* Header Row (Hours) */}
                    <div className="flex bg-muted/50 border-b border-border">
                        <div className="w-32 shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border sticky left-0 bg-muted/50 z-10">
                            {t('heatmap.dayHour')}
                        </div>
                        {hours.map((h) => (
                            <div key={h} className="flex-1 p-3 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-0">
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Body Rows (Days) */}
                    {days.map((day) => (
                        <div key={day} className="flex border-b border-border last:border-0 group">
                            <div className="w-32 p-3 font-medium text-sm text-foreground shrink-0 border-r border-border sticky left-0 bg-card group-hover:bg-muted/30 z-10">
                                {day}
                            </div>
                            {hours.map((hour) => {
                                const data = historicalData[day][hour]
                                const colorClass = getDemandColorClass(data.customers)
                                const isSelected = selectedCell?.day === day && selectedCell?.hour === hour

                                // Overlay comparative indicator (red dot if understaffed)
                                const hasGap = data.coverageGap < 0

                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={cn(
                                            "flex-1 border-r border-border border-b-0 last:border-r-0 relative h-12 cursor-pointer transition-all hover:opacity-80 flex items-center justify-center group/cell",
                                            colorClass,
                                            isSelected && "ring-2 ring-foreground ring-inset z-20"
                                        )}
                                        onClick={() => setSelectedCell({ day, hour })}
                                        title={`Customers: ${data.customers} (Gap: ${data.coverageGap})`}
                                    >
                                        <span className="text-[10px] font-bold opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                            {data.customers} <span className="text-[8px] opacity-70">pax</span>
                                        </span>

                                        {/* Coverage Overlay Indicator */}
                                        {hasGap && (
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-sm animate-pulse" title="Coverage Gap Detected" />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {selectedCell && (
                <div className="p-4 rounded-md border border-border bg-muted/30 text-sm animated-in fade-in slide-in-from-bottom-2">
                    <strong>{selectedCell.day} at {selectedCell.hour}</strong>
                    <br />
                    <span className="text-muted-foreground">
                        Projected Demand: <span className="text-foreground font-medium">{historicalData[selectedCell.day][selectedCell.hour].customers} customers</span>
                    </span>
                    <br />
                    <span className="text-muted-foreground">
                        Coverage Overlay: {historicalData[selectedCell.day][selectedCell.hour].coverageGap < 0 ? (
                            <span className="text-red-500 font-medium ml-1">Understaffed (Gap: {Math.abs(historicalData[selectedCell.day][selectedCell.hour].coverageGap)})</span>
                        ) : (
                            <span className="text-green-500 font-medium ml-1">Sufficiently Staffed (+{historicalData[selectedCell.day][selectedCell.hour].coverageGap})</span>
                        )}
                    </span>
                </div>
            )}
        </div>
    )
}
