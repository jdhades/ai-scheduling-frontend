import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Shift } from '../store/scheduleStore'
import { api } from '../lib/api'

/**
 * Shape moderno del endpoint GET /schedules (post-rework V3).
 * El handler `GetCompanyScheduleHandler` devuelve este DTO plano —
 * sin tabla `shifts` intermedia.
 */
export interface ScheduleAssignmentDTO {
    id: string
    employeeId: string
    templateId: string
    templateName: string
    /** YYYY-MM-DD */
    date: string
    /** ISO datetime UTC */
    actualStartTime: string
    /** ISO datetime UTC (puede cruzar medianoche). */
    actualEndTime: string
    origin: 'membership' | 'override' | 'exception'
}

interface UseScheduleQueryOpts {
    weekStart: string
    /** Phase 14 — opcional filter por departamento. */
    departmentId?: string
    /** Si false, no dispara el query (útil cuando el caller aún no eligió semana). */
    enabled?: boolean
}

/**
 * useScheduleQuery — lee assignments de la semana indicada. El caller
 * debe pasar `weekStart` (YYYY-MM-DD del lunes ISO). Devuelve `Shift[]`
 * adaptado al store de Zustand (formato HH:MM) para que la grilla
 * legacy lo consuma sin cambios. Si necesitás el shape rico
 * (templateName, origin, etc.), usá `useScheduleAssignmentsQuery`.
 */
export const useScheduleQuery = (opts: UseScheduleQueryOpts) => {
    const { weekStart, departmentId, enabled = true } = opts
    return useQuery({
        queryKey: ['schedules', weekStart, departmentId ?? null],
        enabled: enabled && !!weekStart,
        queryFn: async (): Promise<Shift[]> => {
            const { data } = await api.get<ScheduleAssignmentDTO[]>('/schedules', {
                params: {
                    weekStart,
                    ...(departmentId ? { departmentId } : {}),
                },
            })
            return data.map((a) => {
                const start = new Date(a.actualStartTime)
                const end = new Date(a.actualEndTime)
                const fmt = (d: Date) =>
                    isNaN(d.getTime())
                        ? '00:00'
                        : `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
                return {
                    id: a.id,
                    employeeId: a.employeeId,
                    roleRequired: a.templateId, // el "rol" lo derivamos del template para que el matcher viejo del Grid no rompa
                    startTime: fmt(start),
                    endTime: fmt(end),
                    status: 'assigned' as const,
                }
            })
        },
    })
}

/**
 * Variante moderna que devuelve el DTO crudo (sin adaptar a Zustand).
 * Para vistas nuevas que necesiten templateName, origin, fechas reales.
 */
export const useScheduleAssignmentsQuery = (opts: UseScheduleQueryOpts) => {
    const { weekStart, departmentId, enabled = true } = opts
    return useQuery({
        queryKey: ['schedules', 'raw', weekStart, departmentId ?? null],
        enabled: enabled && !!weekStart,
        queryFn: async (): Promise<ScheduleAssignmentDTO[]> => {
            const { data } = await api.get<ScheduleAssignmentDTO[]>('/schedules', {
                params: {
                    weekStart,
                    ...(departmentId ? { departmentId } : {}),
                },
            })
            return data
        },
    })
}

// ─── Generación con weekStart parametrizable (post-Phase 13) ──────────────────

export interface GenerateScheduleResult {
    assignmentsCount: number
    unfilledShiftsCount: number
    llmAccepted: number
    algorithmCorrected: number
    explanation: string
    warnings: string[]
    /**
     * Tokens consumidos durante la generación (LLM-proposer + catch-all
     * llm_runtime + traducción de rules). NO incluye los del classifier
     * conversacional (esos solo viajan en el flow WhatsApp).
     */
    llmUsage?: { calls: number; prompt: number; completion: number; total: number }
}

export interface GenerateHybridParams {
    weekStart: string
    maxFairnessDeviation?: number
    /** Phase 14 — restringe el run a un departamento (pisa solo sus templates). */
    departmentId?: string
    /** Restringe el run a un único template. Combinable con departmentId. */
    shiftTemplateId?: string
}

/**
 * Dispara una generación híbrida. Endpoint correcto: POST /schedules/generate
 * con strategy='hybrid' obligatorio (el DTO valida `@IsIn(['cost','fairness',
 * 'hybrid'])`). Phase 14 — soporta scope por departmentId + shiftTemplateId.
 */
export const useGenerateHybridForWeekMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (params: GenerateHybridParams) => {
            const { data } = await api.post<GenerateScheduleResult>(
                '/schedules/generate',
                {
                    weekStart: params.weekStart,
                    strategy: 'hybrid',
                    maxFairnessDeviation: params.maxFairnessDeviation,
                    departmentId: params.departmentId,
                    shiftTemplateId: params.shiftTemplateId,
                },
            )
            return { result: data, weekStart: params.weekStart }
        },
        onSuccess: ({ weekStart }) => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            queryClient.invalidateQueries({ queryKey: ['schedules', weekStart] })
        },
    })
}
