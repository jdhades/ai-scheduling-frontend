import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useScheduleStore } from '../store/scheduleStore'
import { TENANT_ID } from '../config'

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false
})

export const useSocket = () => useContext(SocketContext)

// Mock Backend URL (In a real app this would be an env var pointing to NestJS)
const SOCKET_URL = 'http://localhost:3000'

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const addIncident = useScheduleStore(state => state.addIncident)
    const queryClient = useQueryClient()
    const { t } = useTranslation()

    useEffect(() => {
        // Initialize socket connection
        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            // For this demo, we can use polling or just let it fail gracefully if no backend exists
            transports: ['websocket', 'polling']
        })

        setSocket(socketInstance)

        socketInstance.on('connect', () => {
            setIsConnected(true)
            console.log('🔗 WebSocket Connected:', socketInstance.id)
        })

        socketInstance.on('disconnect', () => {
            setIsConnected(false)
            console.log('❌ WebSocket Disconnected')
        })

        // -- Business Logic Events --

        // Invalidate/Refresh Schedule Grid on global rebuilds + toast.
        // El gateway emite globalmente (sin rooms por company); filtramos
        // en el cliente por TENANT_ID. Cuando exista auth multi-tenant,
        // el gateway debería emitir a una room scopeada y este filtro se
        // borra.
        socketInstance.on('ScheduleGenerated', (payload: { companyId?: string; weekStart?: string }) => {
            console.log('⚡ Received ScheduleGenerated event', payload)
            if (payload?.companyId && payload.companyId !== TENANT_ID) return
            // Refresca grilla + lista de jobs activos (el job ya no está
            // in-flight, así desaparece el banner global).
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            queryClient.invalidateQueries({ queryKey: ['jobs', 'active'] })
            toast.success(
                t('common:scheduleToast.successTitle'),
                {
                    description: t('common:scheduleToast.successBody', {
                        weekStart: payload?.weekStart ?? '',
                    }),
                },
            )
        })

        socketInstance.on('ScheduleGenerationFailed', (payload: { companyId?: string; weekStart?: string; reason?: string }) => {
            console.log('💥 Received ScheduleGenerationFailed event', payload)
            if (payload?.companyId && payload.companyId !== TENANT_ID) return
            queryClient.invalidateQueries({ queryKey: ['jobs', 'active'] })
            toast.error(
                t('common:scheduleToast.failTitle'),
                {
                    description: t('common:scheduleToast.failBody', {
                        weekStart: payload?.weekStart ?? '',
                    }),
                },
            )
        })

        // Listen for new incidents (simulated)
        socketInstance.on('IncidentCreated', (payload) => {
            console.log('🚨 Received IncidentCreated event', payload)
            addIncident({
                message: payload.message || 'New scheduling incident detected',
                severity: payload.severity || 'warning'
            })
        })

        return () => {
            socketInstance.disconnect()
        }
    }, [queryClient, addIncident, t])

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}
