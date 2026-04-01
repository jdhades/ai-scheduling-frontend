import { useState } from 'react'
import { calculateCoverageScore, getCoverageColorClass } from '../../lib/coverage.ts'
import { cn } from '../../lib/utils.ts'
import { useTranslation } from 'react-i18next'

// Dummy Data
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const hours = Array.from({ length: 14 }, (_, i) => `${8 + i}:00`) // 8am to 9pm

// Generate some random coverage data for the demo
const generateDummyData = () => {
    const data: Record<string, Record<string, { assigned: number, required: number }>> = {}
    days.forEach(day => {
        data[day] = {}
        hours.forEach(hour => {
            // Create some intentional understaffing on Friday/Saturday nights
            const isWeekendNight = (day === 'Friday' || day === 'Saturday') && parseInt(hour) >= 18
            const required = isWeekendNight ? 8 : 4
            const assigned = isWeekendNight ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 3) + 3 // 2-5 or 3-5

            data[day][hour] = { assigned, required }
        })
    })
    return data
}

const dummyCoverageData = generateDummyData()

export function CoverageHeatmap() {
    const [selectedCell, setSelectedCell] = useState<{ day: string, hour: string } | null>(null)
    const { t } = useTranslation()

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">{t('heatmap.title')}</h3>
                <div className="flex items-center gap-4 text-sm mt-2 md:mt-0">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500"></span> {t('heatmap.optimal')} (95%+)</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-yellow-500"></span> {t('heatmap.warning')} (80-94%)</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500"></span> {t('heatmap.critical')} (&lt;80%)</div>
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
                                const data = dummyCoverageData[day][hour]
                                const score = calculateCoverageScore(data)
                                const colorClass = getCoverageColorClass(score)
                                const isSelected = selectedCell?.day === day && selectedCell?.hour === hour

                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={cn(
                                            "flex-1 border-r border-border last:border-0 relative h-12 cursor-pointer transition-all hover:opacity-80 flex items-center justify-center group/cell",
                                            colorClass,
                                            isSelected && "ring-2 ring-foreground ring-inset z-20"
                                        )}
                                        onClick={() => setSelectedCell({ day, hour })}
                                        title={`Coverage: ${score}% (${data.assigned}/${data.required})`}
                                    >
                                        <span className="text-[10px] font-bold text-black/60 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                            {score}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {selectedCell && (
                <div className="p-4 rounded-md border border-border bg-muted/30 text-sm animated-in fade-in slide-in-from-bottom-2">
                    <strong>{t('heatmap.selected')}: {selectedCell.day} at {selectedCell.hour}</strong>
                    <br />
                    <span className="text-muted-foreground">
                        {t('heatmap.coverage')}: {calculateCoverageScore(dummyCoverageData[selectedCell.day][selectedCell.hour])}%
                        ({dummyCoverageData[selectedCell.day][selectedCell.hour].assigned} {t('heatmap.assigned')} / {dummyCoverageData[selectedCell.day][selectedCell.hour].required} {t('heatmap.required')})
                    </span>
                    {calculateCoverageScore(dummyCoverageData[selectedCell.day][selectedCell.hour]) < 80 && (
                        <div className="mt-2 flex gap-2">
                            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors">
                                {t('heatmap.suggestBtn')}
                            </button>
                            <button className="px-3 py-1.5 bg-card border border-border text-foreground rounded-md text-xs font-medium hover:bg-muted transition-colors">
                                {t('heatmap.ackBtn')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
