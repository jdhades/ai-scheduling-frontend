import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useScheduleStore } from '../../store/scheduleStore.ts'

const CHART_COLORS = [
    "hsl(210, 100%, 60%)",
    "hsl(340, 100%, 60%)",
    "hsl(160, 60%, 45%)",
]

export function FairnessPanel() {
    const { t } = useTranslation()
    const employees = useScheduleStore(state => state.employees)
    const shifts = useScheduleStore(state => state.shifts)

    // Dynamically calculate actual assigned hours per employee
    const barData = employees.map(emp => {
        const empShifts = shifts.filter(s => s.employeeId === emp.id)
        const totalHours = empShifts.reduce((acc, shift) => {
            const start = parseInt(shift.startTime.split(':')[0])
            const end = parseInt(shift.endTime.split(':')[0])
            return acc + (end - start)
        }, 0)
        return {
            name: emp.name,
            totalHours,
            target: 40
        }
    })

    // Take only top 3 employees with most hours for the radar to remain legible
    const topEmployees = [...barData].sort((a, b) => b.totalHours - a.totalHours).slice(0, 3)
    const topNames = topEmployees.map(e => e.name)

    // Generate pseudo-random metrics for the radar based on employee name length/chars to keep it deterministic
    const radarData = [
        { metric: 'Weekend Shifts', fullMark: 5 },
        { metric: 'Night Shifts', fullMark: 5 },
        { metric: 'Holidays', fullMark: 5 },
        { metric: 'Consecutive Days', fullMark: 7 },
        { metric: 'Rest Hours', fullMark: 24 },
    ].map(metric => {
        const record: any = { metric: metric.metric, fullMark: metric.fullMark }
        topNames.forEach((name, idx) => {
            // Predictable fake data for the radar
            record[name] = ((name.length + idx + metric.metric.length) % metric.fullMark) + 1
        })
        return record
    })

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">{t('fairness.title')}</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Total Hours vs Target */}
                <div className="rounded-lg border border-border bg-card shadow-sm p-4 flex flex-col h-[350px]">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">{t('fairness.barTitle')}</h4>
                    <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
                        <div style={{ minWidth: `${Math.max(100, employees.length * 60)}px`, height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                                    <Bar dataKey="totalHours" name={t('fairness.assignedHours')} fill="hsl(210, 100%, 60%)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="target" name={t('fairness.targetHours')} fill="var(--color-muted-foreground)" opacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Radar Chart: Distribution of Undesirable Shifts */}
                <div className="rounded-lg border border-border bg-card shadow-sm p-4 flex flex-col h-[350px]">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">{t('fairness.radarTitle')}</h4>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="var(--color-border)" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                {topNames.map((name, idx) => (
                                    <Radar
                                        key={name}
                                        name={name}
                                        dataKey={name}
                                        stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                                        fillOpacity={0.4}
                                    />
                                ))}
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
