import { useEffect } from 'react'
import { EmployeeRow } from './EmployeeRow.tsx'
import { ShiftTemplatesPanel } from './ShiftTemplatesPanel.tsx'
import { useTranslation } from 'react-i18next'
import { useScheduleStore } from '../../store/scheduleStore.ts'
import { useEmployeesQuery } from '../../api/employees.api'
import { useScheduleQuery, useGenerateScheduleMutation, useGenerateHybridMutation } from '../../api/schedule.api.ts'
import { RotateCcw, Wand2 } from 'lucide-react'

// Constants
const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`) // 8am to 8pm

export function ScheduleGrid() {
    const { t } = useTranslation()
    const { setEmployees, setShifts } = useScheduleStore()

    // REST API Integration
    const { data: employeesData } = useEmployeesQuery()
    const employeesToRender = employeesData || []
    const { data: remoteShifts, isLoading, isError } = useScheduleQuery()
    const generateDeterministic = useGenerateScheduleMutation()
    const generateHybrid = useGenerateHybridMutation()

    useEffect(() => {
        // Sync REST employees into the store
        if (employeesData && employeesData.length > 0) {
            setEmployees(employeesData)
        }
    }, [employeesData, setEmployees])

    useEffect(() => {
        // Sync REST shifts into the high-performance Zustand store
        if (remoteShifts) {
            setShifts(remoteShifts)
        }
    }, [remoteShifts, setShifts])

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">{t('scheduleGrid.title')}</h3>
                    {isLoading && <span className="text-xs text-muted-foreground animate-pulse ml-2">Loading...</span>}
                    {isError && <span className="text-xs text-destructive ml-2">Connection Error</span>}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => generateDeterministic.mutate({ strategy: 'cost' })}
                        disabled={generateDeterministic.isPending || generateHybrid.isPending}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {generateDeterministic.isPending ? 'Generating...' : 'Auto Fill (Cost)'}
                    </button>
                    <button
                        onClick={() => generateHybrid.mutate({ maxFairnessDeviation: 1 })}
                        disabled={generateDeterministic.isPending || generateHybrid.isPending}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Wand2 className="w-4 h-4" />
                        {generateHybrid.isPending ? 'Agents Thinking...' : 'AI Hybrid Repair'}
                    </button>
                </div>
            </div>

            {/* Phase 2: Shift Templates Panel — above the schedule grid */}
            <ShiftTemplatesPanel />

            <div className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-border bg-card shadow-sm">
                <div className="min-w-[800px]">
                    {/* Header Row (Hours) */}
                    <div className="flex bg-muted/50 border-b border-border sticky top-0 z-20">
                        <div className="w-48 p-3 font-medium text-sm text-muted-foreground border-r border-border shrink-0 sticky left-0 bg-muted/50 z-30">
                            {t('scheduleGrid.employee')}
                        </div>
                        {hours.map((h) => (
                            <div key={h} className="flex-1 p-3 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-0">
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Employee Rows */}
                    <div className="relative">
                        {employeesToRender.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground w-full">
                                Cargando empleados de Supabase...
                            </div>
                        )}
                        {employeesToRender.map(emp => (
                            <EmployeeRow
                                key={emp.id}
                                employee={emp}
                                hours={hours}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
