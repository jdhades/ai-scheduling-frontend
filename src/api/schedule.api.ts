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
 * Respuesta del backend cuando USE_ASYNC_SCHEDULE_GEN=true (Fase 1):
 * el job se encoló y el worker lo procesa en background. El cliente
 * hace polling a /jobs/:jobId hasta state='completed'/'failed'/'cancelled'.
 */
export interface QueuedJobResponse {
    jobId: string
    status: 'queued'
}

export type GenerateMutationResult =
    | { kind: 'sync'; result: GenerateScheduleResult; weekStart: string }
    | { kind: 'async'; jobId: string; weekStart: string }

const isQueuedResponse = (
    r: GenerateScheduleResult | QueuedJobResponse,
): r is QueuedJobResponse =>
    typeof r === 'object' &&
    r !== null &&
    'jobId' in r &&
    (r as QueuedJobResponse).status === 'queued'

/**
 * Dispara una generación híbrida. Endpoint correcto: POST /schedules/generate
 * con strategy='hybrid' obligatorio (el DTO valida `@IsIn(['cost','fairness',
 * 'hybrid'])`). Phase 14 — soporta scope por departmentId + shiftTemplateId.
 *
 * Fase 1 — el backend puede responder en dos modos según
 * USE_ASYNC_SCHEDULE_GEN:
 *   - sync: HybridScheduleResult completo (path Fase 0 con lock)
 *   - async: { jobId, status: 'queued' } (worker pg-boss)
 * El caller distingue mirando `data.kind` y, si es 'async', hace
 * polling con `useJobQuery(jobId)`.
 */
export const useGenerateHybridForWeekMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (
            params: GenerateHybridParams,
        ): Promise<GenerateMutationResult> => {
            const { data } = await api.post<
                GenerateScheduleResult | QueuedJobResponse
            >('/schedules/generate', {
                weekStart: params.weekStart,
                strategy: 'hybrid',
                maxFairnessDeviation: params.maxFairnessDeviation,
                departmentId: params.departmentId,
                shiftTemplateId: params.shiftTemplateId,
            })
            if (isQueuedResponse(data)) {
                return {
                    kind: 'async',
                    jobId: data.jobId,
                    weekStart: params.weekStart,
                }
            }
            return {
                kind: 'sync',
                result: data,
                weekStart: params.weekStart,
            }
        },
        onSuccess: (data) => {
            // Sync → invalidamos enseguida. Async → la grilla se invalida
            // cuando el polling vea state='completed' (en useJobQuery).
            if (data.kind === 'sync') {
                queryClient.invalidateQueries({ queryKey: ['schedules'] })
                queryClient.invalidateQueries({
                    queryKey: ['schedules', data.weekStart],
                })
            }
        },
    })
}

// ─── Jobs API (Fase 1) ────────────────────────────────────────────────────────

export type JobState =
    | 'created'
    | 'retry'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'failed'

export interface JobStateDTO {
    id: string
    name: string
    state: JobState
    retryCount: number
    retryLimit: number
    createdOn: string
    startedOn: string | null
    completedOn: string | null
    payload: {
        companyId: string
        weekStart: string
        source: string
    }
}

const TERMINAL_STATES: JobState[] = ['completed', 'failed', 'cancelled']
export const isTerminalJobState = (s: JobState | undefined): boolean =>
    !!s && TERMINAL_STATES.includes(s)

/**
 * useJobQuery — polling cada 2s al endpoint /jobs/:id. Frena el polling
 * automáticamente cuando el estado es terminal (completed/failed/cancelled)
 * gracias a `refetchInterval` callback.
 *
 * El caller debe disparar `queryClient.invalidateQueries(['schedules', ...])`
 * vía `useEffect` cuando observa state='completed' (canónico en
 * TanStack Query v5 — `onSuccess` está deprecated).
 *
 * Multi-tenant: el backend devuelve 404 si companyId no matchea, con
 * lo cual `error.response.status === 404` también sirve como kill-switch.
 */
export const useJobQuery = (jobId: string | null) => {
    return useQuery({
        queryKey: ['jobs', jobId],
        enabled: !!jobId,
        queryFn: async (): Promise<JobStateDTO> => {
            const { data } = await api.get<JobStateDTO>(`/jobs/${jobId}`)
            return data
        },
        refetchInterval: (query) => {
            const state = query.state.data?.state
            return isTerminalJobState(state) ? false : 2000
        },
        refetchOnWindowFocus: false,
    })
}

/**
 * useActiveScheduleJobQuery — polea `GET /jobs/active` cada 3s y devuelve
 * los jobs `schedule.generate` en estados no-terminales (created/retry/
 * active) para la company actual. Sobrevive a navegaciones porque el
 * estado del job vive en el backend, no en el componente.
 *
 * Caller típico: layout-level banner o GeneratePage. Si necesitás
 * tracking fino de un job específico, usá `useJobQuery(jobId)` además.
 */
export const useActiveScheduleJobQuery = () => {
    return useQuery({
        queryKey: ['jobs', 'active'],
        queryFn: async (): Promise<JobStateDTO[]> => {
            const { data } = await api.get<JobStateDTO[]>('/jobs/active')
            return data
        },
        refetchInterval: 3000,
        refetchOnWindowFocus: true,
        staleTime: 0,
    })
}

/**
 * useCancelJobMutation — cancela un job en estado created/retry. El
 * backend rechaza con 409 si está active/completed/failed; ese caso
 * lo maneja el caller mostrando el mensaje del error.
 */
export const useCancelJobMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (jobId: string) => {
            await api.post(`/jobs/${jobId}/cancel`)
            return jobId
        },
        onSuccess: (jobId) => {
            queryClient.invalidateQueries({ queryKey: ['jobs', jobId] })
        },
    })
}
