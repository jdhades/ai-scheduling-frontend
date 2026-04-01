import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = 'http://localhost:3000'
const COMPANY_ID = '11111111-2222-3333-4444-555555555555'

export interface ShiftTemplate {
    id: string
    name: string
    dayOfWeek: number       // 0=Sun … 6=Sat
    startTime: string       // "HH:MM:SS"
    endTime: string         // "HH:MM:SS"
    requiredSkillId: string | null
    demandScore: number
    undesirableWeight: number
    isActive: boolean
}

export interface CreateShiftTemplatePayload {
    name: string
    dayOfWeek: number
    startTime: string       // "HH:MM"
    endTime: string         // "HH:MM"
    requiredSkillId?: string | null
    demandScore?: number
    undesirableWeight?: number
}

const headers = { 'x-company-id': COMPANY_ID }
const params = { companyId: COMPANY_ID }

// ─── GET /shift-templates ────────────────────────────────────────────────────

export const useShiftTemplatesQuery = () =>
    useQuery({
        queryKey: ['shift-templates', COMPANY_ID],
        queryFn: async () => {
            const { data } = await axios.get<ShiftTemplate[]>(`${API_URL}/shift-templates`, { params, headers })
            return data
        },
    })

// ─── POST /shift-templates ───────────────────────────────────────────────────

export const useCreateTemplateMutation = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: CreateShiftTemplatePayload) => {
            const { data } = await axios.post<ShiftTemplate>(`${API_URL}/shift-templates`, payload, { params, headers })
            return data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-templates', COMPANY_ID] }),
    })
}

// ─── DELETE /shift-templates/:id ─────────────────────────────────────────────

export const useDeleteTemplateMutation = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`${API_URL}/shift-templates/${id}`, { params, headers })
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-templates', COMPANY_ID] }),
    })
}

// ─── POST /shift-templates/instantiate ───────────────────────────────────────

export const useInstantiateWeekMutation = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (weekStart: string) => {
            const { data } = await axios.post(
                `${API_URL}/shift-templates/instantiate`,
                { weekStart },
                { params, headers }
            )
            return data as { generated: number; shifts: any[] }
        },
        onSuccess: () => {
            // Invalidate shift-related queries so the schedule grid refreshes
            qc.invalidateQueries({ queryKey: ['schedules'] })
        },
    })
}
