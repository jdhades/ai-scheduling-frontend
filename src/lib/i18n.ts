import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
    en: {
        translation: {
            "app": {
                "title": "AI Scheduler",
                "scenario": "Scenario 6 Overview",
                "managerView": "Manager View"
            },
            "nav": {
                "dashboard": "Dashboard",
                "schedule": "Schedule",
                "staff": "Staff",
                "incidents": "Incidents",
                "settings": "Settings",
                "logout": "Logout"
            },
            "scheduleGrid": {
                "title": "Interactive Schedule",
                "autoFill": "Auto-Fill",
                "publish": "Publish",
                "employee": "Employee"
            },
            "widgets": {
                "statusTitle": "Current Schedule Status",
                "statusOptimized": "Optimized",
                "statusLastUpdated": "Last AI regeneration: 10 mins ago",
                "incidentsTitle": "Active Incidents",
                "incidentsCount": "2 Understaffed Shifts",
                "incidentsMessage": "Friday Night Rush requires attention."
            },
            "heatmap": {
                "title": "Weekly Coverage Heatmap",
                "optimal": "Optimal",
                "warning": "Warning",
                "critical": "Critical",
                "dayHour": "Day / Hour",
                "selected": "Selected",
                "coverage": "Coverage",
                "assigned": "assigned",
                "required": "required",
                "suggestBtn": "Suggest Reinforcements",
                "ackBtn": "Acknowledge"
            },
            "fairness": {
                "title": "Fairness & Equity Insights",
                "barTitle": "Total Assigned Hours vs Target",
                "radarTitle": "Workload Distribution (Quality)",
                "assignedHours": "Assigned Hours",
                "targetHours": "Target Hours"
            }
        }
    },
    es: {
        translation: {
            "app": {
                "title": "Planificador IA",
                "scenario": "Resumen Escenario 6",
                "managerView": "Vista de Gestor"
            },
            "nav": {
                "dashboard": "Panel Principal",
                "schedule": "Horarios",
                "staff": "Personal",
                "incidents": "Incidentes",
                "settings": "Ajustes",
                "logout": "Cerrar Sesión"
            },
            "scheduleGrid": {
                "title": "Horario Interactivo",
                "autoFill": "Llenado Automático",
                "publish": "Publicar",
                "employee": "Empleado"
            },
            "widgets": {
                "statusTitle": "Estado Actual del Horario",
                "statusOptimized": "Optimizados",
                "statusLastUpdated": "Última regeneración IA: hace 10 mins",
                "incidentsTitle": "Incidentes Activos",
                "incidentsCount": "2 Turnos Falto de Personal",
                "incidentsMessage": "El turno de noche del Viernes requiere atención."
            },
            "heatmap": {
                "title": "Mapa de Calor de Cobertura Semanal",
                "optimal": "Óptimo",
                "warning": "Aviso",
                "critical": "Crítico",
                "dayHour": "Día / Hora",
                "selected": "Seleccionado",
                "coverage": "Cobertura",
                "assigned": "asignado(s)",
                "required": "requerido(s)",
                "suggestBtn": "Sugerir Refuerzos",
                "ackBtn": "Reconocer"
            },
            "fairness": {
                "title": "Perspectivas de Equidad y Justicia",
                "barTitle": "Horas Totales Asignadas vs Objetivo",
                "radarTitle": "Distribución de Carga (Calidad)",
                "assignedHours": "Horas Asignadas",
                "targetHours": "Horas Objetivo"
            }
        }
    }
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    })

export default i18n
