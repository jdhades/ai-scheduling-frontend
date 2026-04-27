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
            },
            "errors": {
                "EMPLOYEE_PHONE_DUPLICATE": "An employee with that phone number already exists.",
                "EMPLOYEE_EXTERNAL_ID_DUPLICATE": "An employee with that external ID already exists.",
                "MEMBERSHIP_DUPLICATE": "A membership for that employee, template and start date already exists.",
                "SKILL_DUPLICATE": "That skill is already in your tenant catalog.",
                "POLICY_INTERPRETER_DUPLICATE": "There is already an active policy for that pattern. Edit or deactivate the existing one first.",
                "UNIQUE_VIOLATION": "A record with these values already exists.",
                "NOT_NULL_VIOLATION": "The field \"{{field}}\" is required.",
                "FOREIGN_KEY_VIOLATION": "The operation references a record that no longer exists.",
                "CHECK_VIOLATION": "The submitted data does not meet a validation rule.",
                "INTERNAL_ERROR": "An unexpected error occurred. Please try again or contact support.",
                "GENERIC_HTTP": "Server error ({{status}}). Please try again.",
                "UNKNOWN": "Something went wrong."
            },
            "languageSwitcher": {
                "toggleTo": "Switch to {{lang}}"
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
            },
            "errors": {
                "EMPLOYEE_PHONE_DUPLICATE": "Ya existe un empleado con ese número de teléfono.",
                "EMPLOYEE_EXTERNAL_ID_DUPLICATE": "Ya existe un empleado con ese ID externo.",
                "MEMBERSHIP_DUPLICATE": "Ya existe un vínculo para ese empleado, template y fecha de inicio.",
                "SKILL_DUPLICATE": "Esa skill ya está en el catálogo del tenant.",
                "POLICY_INTERPRETER_DUPLICATE": "Ya existe una política activa para ese patrón. Editá o desactivá la existente primero.",
                "UNIQUE_VIOLATION": "Ya existe un registro con esos datos.",
                "NOT_NULL_VIOLATION": "El campo \"{{field}}\" es obligatorio.",
                "FOREIGN_KEY_VIOLATION": "La operación referencia un registro que ya no existe.",
                "CHECK_VIOLATION": "Los datos enviados no cumplen una regla de validación.",
                "INTERNAL_ERROR": "Ocurrió un error inesperado. Probá de nuevo o contactá al soporte.",
                "GENERIC_HTTP": "Error del servidor ({{status}}). Probá de nuevo.",
                "UNKNOWN": "Algo salió mal."
            },
            "languageSwitcher": {
                "toggleTo": "Cambiar a {{lang}}"
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
        supportedLngs: ['en', 'es'],
        // Strip región: 'en-US' resuelve contra 'en'.
        load: 'languageOnly',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
    })

export default i18n
