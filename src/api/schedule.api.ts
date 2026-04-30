import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type { Shift } from '../store/scheduleStore'
import { api } from '../lib/api'

// In a real app, this API_URL would be inside an env variable like import.meta.env.VITE_API_URL
const API_URL = 'http://localhost:3000'

// Company ID for demo purposes
const COMPANY_ID = '11111111-2222-3333-4444-555555555555'
const WEEK_START = '2024-03-04' // Matching backend requirements for scenario 5

export const useScheduleQuery = () => {
    return useQuery({
        queryKey: ['schedules', COMPANY_ID, WEEK_START],
        queryFn: async () => {
            const { data } = await axios.get<Shift[]>(`${API_URL}/schedules`, {
                params: {
                    companyId: COMPANY_ID,
                    weekStart: WEEK_START
                },
                headers: {
                    'x-company-id': COMPANY_ID
                }
            })
            // Map the data appropriately if needed, assume the backend returns a list of shift assignments.
            return data.map((assignment: any) => {
                // Parse ISO strings from backend into "HH:mm" format for the frontend grid
                const startDate = new Date(assignment.shifts?.startTime || assignment.startTime);
                const endDate = new Date(assignment.shifts?.endTime || assignment.endTime);

                const formatTime = (date: Date) => {
                    if (isNaN(date.getTime())) return "00:00"; // fallback if missing
                    return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
                };

                return {
                    id: assignment.id,
                    employeeId: assignment.employeeId,
                    roleRequired: assignment.shifts?.requiredSkillId || "any",
                    startTime: formatTime(startDate),
                    endTime: formatTime(endDate),
                    status: 'assigned' as const
                };
            })
        }
    })
}

interface GenerateScheduleParams {
    strategy: 'cost' | 'fairness' | 'hybrid'
    maxFairnessDeviation?: number
}

// Deterministic Generation endpoint
export const useGenerateScheduleMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (params: GenerateScheduleParams) => {
            const { data } = await axios.post(`${API_URL}/schedules/generate`, {
                weekStart: WEEK_START,
                strategy: params.strategy,
                maxFairnessDeviation: params.maxFairnessDeviation
            }, {
                params: { companyId: COMPANY_ID },
                headers: { 'x-company-id': COMPANY_ID }
            })
            return data
        },
        onSuccess: () => {
            // Invalidate schedule query so it refetches via REST
            // We can optionally do this via the WS event as well
            queryClient.invalidateQueries({ queryKey: ['schedules', COMPANY_ID, WEEK_START] })
        }
    })
}

interface LegacyGenerateHybridParams {
    maxFairnessDeviation?: number
}

/**
 * Legacy — usa la WEEK_START hardcodeada (semana del rework demo).
 * Mantenido sólo para compat con `ScheduleGrid`. Fixes mínimos
 * aplicados al endpoint y la strategy obligatoria del DTO.
 */
export const useGenerateHybridMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (params: LegacyGenerateHybridParams) => {
            const { data } = await api.post<GenerateScheduleResult>(
                '/schedules/generate',
                {
                    weekStart: WEEK_START,
                    strategy: 'hybrid',
                    maxFairnessDeviation: params.maxFairnessDeviation,
                },
            )
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
        }
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
