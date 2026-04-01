import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useScheduleStore } from '../store/scheduleStore'

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

        // Invalidate/Refresh Schedule Grid on global rebuilds
        socketInstance.on('ScheduleGenerated', (payload) => {
            console.log('⚡ Received ScheduleGenerated event', payload)
            // Trigger React Query to refetch the GET /schedules endpoint automatically
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
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
    }, [queryClient, addIncident])

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}
