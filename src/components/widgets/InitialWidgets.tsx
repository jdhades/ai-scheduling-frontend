import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useScheduleStore } from '../../store/scheduleStore'

export function ScheduleStatusWidget() {
    const { t } = useTranslation()

    return (
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col p-6">
            <div className="flex flex-row items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                    <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{t('widgets.statusTitle')}</h3>
                    <span className="text-2xl font-bold">{t('widgets.statusOptimized')}</span>
                </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {t('widgets.statusLastUpdated')}
            </div>
        </div>
    )
}

export function CoverageAlertWidget() {
    const { t } = useTranslation()
    const incidents = useScheduleStore(state => state.incidents)
    const removeIncident = useScheduleStore(state => state.removeIncident)

    if (incidents.length === 0) {
        return (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 text-green-600 shadow-sm flex flex-col p-6 h-full justify-center">
                <div className="flex flex-row items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="tracking-tight text-sm font-medium">All Clear</h3>
                        <span className="text-xl font-bold">No Active Incidents</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive shadow-sm flex flex-col p-6 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex flex-row items-center gap-4 z-10 mb-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-destructive/20 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex flex-col">
                    <h3 className="tracking-tight text-sm font-medium text-destructive/80">{t('widgets.incidentsTitle')}</h3>
                    <span className="text-2xl font-bold">{incidents.length} {t('widgets.incidentsCount').split(' ')[1]}</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 z-10 mt-auto max-h-[100px] overflow-y-auto pr-2">
                {incidents.map(incident => (
                    <div key={incident.id} className="text-sm font-medium bg-destructive/10 p-2 rounded flex justify-between items-center group">
                        <span>{incident.message}</span>
                        <button
                            onClick={() => removeIncident(incident.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 bg-destructive/20 rounded hover:bg-destructive/30 transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
