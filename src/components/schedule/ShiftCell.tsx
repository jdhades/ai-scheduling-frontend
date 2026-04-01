import { memo } from 'react'
import { cn } from '../../lib/utils.ts'

interface ShiftCellProps {
    employeeName: string
    role: string
    status?: 'assigned' | 'conflict' | 'draft'
    onDelete?: () => void
}

export const ShiftCell = memo(function ShiftCell({ employeeName, role, status = 'assigned', onDelete }: ShiftCellProps) {

    const bgClass = status === 'conflict'
        ? 'bg-destructive/20 border-destructive text-destructive'
        : status === 'draft'
            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-400'
            : 'bg-primary/20 border-primary/50 text-primary-foreground text-primary dark:text-primary-foreground'

    return (
        <div
            className={cn(
                "h-full rounded-md border text-xs flex flex-col justify-center px-2 cursor-pointer transition-all shadow-sm hover:ring-2 ring-primary/50 pointer-events-auto relative group/shift",
                bgClass
            )}
            title={`${employeeName} - ${role}`}
        >
            <span className="font-medium truncate">{employeeName}</span>
            <span className="truncate opacity-80">{role}</span>

            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-background/50 hover:bg-destructive hover:text-destructive-foreground text-foreground/50 opacity-0 group-hover/shift:opacity-100 flex items-center justify-center transition-all"
                    title="Delete Shift"
                >
                    &times;
                </button>
            )}
        </div>
    )
})
