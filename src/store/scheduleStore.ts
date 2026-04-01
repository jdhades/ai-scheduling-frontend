import { create } from 'zustand'

export interface Employee {
    id: string
    name: string
    role: string
    skills: string[]
}

export interface Shift {
    id: string
    employeeId: string
    startTime: string // "08:00" format
    endTime: string   // "16:00" format
    roleRequired: string
    status: 'assigned' | 'draft' | 'conflict'
}

export interface Incident {
    id: string;
    message: string;
    severity: 'warning' | 'critical';
    timestamp: Date;
}

interface ScheduleState {
    employees: Employee[];
    shifts: Shift[];
    incidents: Incident[];

    // Actions
    addShift: (shift: Omit<Shift, 'id'>) => void;
    updateShift: (id: string, updates: Partial<Shift>) => void;
    removeShift: (id: string) => void;
    addIncident: (incident: Omit<Incident, 'id' | 'timestamp'>) => void;
    removeIncident: (id: string) => void;
    setShifts: (shifts: Shift[]) => void;
    setEmployees: (employees: Employee[]) => void;
    loadMockData: () => void;
}

const mockEmployees: Employee[] = [
    { id: '1', name: 'Alice Smith', role: 'Senior Waitress', skills: ['waitress', 'cashier'] },
    { id: '2', name: 'Bob Jones', role: 'Cook', skills: ['cook'] },
    { id: '3', name: 'Carol Davis', role: 'Manager', skills: ['manager', 'waitress', 'cashier'] },
]

const mockShifts: Shift[] = [
    { id: 's1', employeeId: '1', startTime: '09:00', endTime: '17:00', roleRequired: 'waitress', status: 'assigned' },
    { id: 's2', employeeId: '2', startTime: '08:00', endTime: '16:00', roleRequired: 'cook', status: 'assigned' },
    { id: 's3', employeeId: '3', startTime: '12:00', endTime: '20:00', roleRequired: 'manager', status: 'assigned' },
    // Adding a conflicting shift as an example
    { id: 's4', employeeId: '1', startTime: '16:00', endTime: '22:00', roleRequired: 'cashier', status: 'conflict' }
]

export const useScheduleStore = create<ScheduleState>((set) => ({
    employees: [],
    shifts: [],
    incidents: [],

    addShift: (shift) => set((state) => ({
        shifts: [...state.shifts, { ...shift, id: Math.random().toString(36).substring(7) }]
    })),

    updateShift: (id, updates) => set((state) => ({
        shifts: state.shifts.map(s => s.id === id ? { ...s, ...updates } : s)
    })),

    removeShift: (id) => set((state) => ({
        shifts: state.shifts.filter(s => s.id !== id)
    })),

    addIncident: (incident) => set((state) => ({
        incidents: [{ ...incident, id: Math.random().toString(36).substring(7), timestamp: new Date() }, ...state.incidents]
    })),

    removeIncident: (id) => set((state) => ({
        incidents: state.incidents.filter(i => i.id !== id)
    })),

    setShifts: (shifts) => set({ shifts }),

    setEmployees: (employees) => set({ employees }),

    loadMockData: () => set({ employees: mockEmployees, shifts: mockShifts })
}))
