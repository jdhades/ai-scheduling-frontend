import { memo } from 'react'
import { ShiftCell } from './ShiftCell.tsx'
import type { Employee } from '../../store/scheduleStore.ts'
import { useScheduleStore } from '../../store/scheduleStore.ts'
import { useShallow } from 'zustand/react/shallow'

interface EmployeeRowProps {
    employee: Employee
    hours: string[]
}

export const EmployeeRow = memo(function EmployeeRow({ employee, hours }: EmployeeRowProps) {
    const addShift = useScheduleStore(state => state.addShift)
    const removeShift = useScheduleStore(state => state.removeShift)

    // Scoped subscription: Only re-render if THIS employee's shifts change
    const shifts = useScheduleStore(useShallow(state => state.shifts.filter(s => s.employeeId === employee.id)))

    // Utility to convert time like "08:00" to index based on hours array
    const getHourIndex = (time: string, isEnd = false) => {
        let hour = parseInt(time.split(':')[0])
        if (isEnd && hour === 0) hour = 24 // 00:00 as end time means midnight of next day
        const firstHour = parseInt(hours[0].split(':')[0])
        return hour - firstHour
    }

    // Calculate total hours to display predictive fairness alert
    const totalHours = shifts.reduce((acc, shift) => {
        const start = getHourIndex(shift.startTime)
        const end = getHourIndex(shift.endTime, true)
        return acc + (end - start)
    }, 0)

    // Fairness threshold (e.g. max 8 hours per day)
    const isOverworked = totalHours > 8

    return (
        <div className="flex border-b border-border hover:bg-muted/30 transition-colors group">
            {/* Employee Info Col */}
            <div className="w-48 shrink-0 p-3 bg-card group-hover:bg-muted/30 z-10 flex flex-col justify-center">
                <div className="font-medium text-sm text-foreground flex items-center justify-between">
                    <span>{employee.name}</span>
                    {totalHours > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isOverworked ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`} title={isOverworked ? "Overworked (>8h)" : "Total Assigned Hours"}>
                            {totalHours}h
                        </span>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">{employee.role}</div>
            </div>

            {/* Hours Col */}
            <div className="flex flex-1 relative overflow-hidden">
                {/* Background Grid Lines (Clickable) */}
                {hours.map((h) => {
                    const nextHourStr = `${parseInt(h.split(':')[0]) + 4}:00` // default 4hr shift
                    return (
                        <div
                            key={h}
                            onClick={() => addShift({
                                employeeId: employee.id,
                                startTime: h,
                                endTime: nextHourStr,
                                roleRequired: employee.role,
                                status: 'draft'
                            })}
                            className="flex-1 border-r border-border/50 min-w-[60px] relative h-16 cursor-pointer hover:bg-primary/5 transition-colors"
                            title={`Click to add shift at ${h} `}
                        />
                    )
                })}

                {/* Rendered Shifts overlayed on the grid */}
                {shifts.map(shift => {
                    const originalStartIndex = getHourIndex(shift.startTime)
                    const originalEndIndex = getHourIndex(shift.endTime, true)

                    // Clamp to visible hours
                    const startIndex = Math.max(0, Math.min(originalStartIndex, hours.length))
                    const endIndex = Math.max(0, Math.min(originalEndIndex, hours.length))
                    const durationH = endIndex - startIndex

                    if (durationH <= 0) return null // Shift is outside the visible hours

                    // Simple formula assuming each column is exactly one hour fraction.
                    // Left offset based on start index, width based on duration.
                    // hours.length is the total number of hours in the view.
                    const leftPercent = (startIndex / hours.length) * 100
                    const widthPercent = (durationH / hours.length) * 100

                    // Cross-skill validation predictive alert
                    const isMissingSkill = !employee.skills.includes(shift.roleRequired.toLowerCase())
                    const displayStatus = isMissingSkill ? 'conflict' : shift.status

                    return (
                        <div
                            key={shift.id}
                            className="absolute top-2 bottom-2 px-1"
                            style={{
                                left: `calc(${leftPercent}%)`,
                                width: `calc(${widthPercent}%)`
                            }}
                        >
                            <ShiftCell
                                employeeName={employee.name}
                                role={shift.roleRequired}
                                status={displayStatus}
                                onDelete={() => removeShift(shift.id)}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
})
