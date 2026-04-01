import { useState } from 'react'
import { LayoutDashboard, CalendarDays, Users, AlertTriangle, Settings, LogOut, Menu, X, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../lib/utils.ts'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { t, i18n } = useTranslation()

    const toggleLang = () => {
        i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
    }

    return (
        <div className="flex relative h-screen w-full bg-background text-foreground overflow-hidden">

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:static md:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                        <h1 className="text-xl font-bold tracking-tight text-primary">{t('app.title')}</h1>
                        <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <nav className="flex flex-col gap-2 p-4">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-secondary text-secondary-foreground font-medium">
                            <LayoutDashboard size={18} /> {t('nav.dashboard')}
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <CalendarDays size={18} /> {t('nav.schedule')}
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Users size={18} /> {t('nav.staff')}
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <AlertTriangle size={18} /> {t('nav.incidents')}
                        </a>
                    </nav>
                </div>
                <div className="p-4 border-t border-border flex flex-col gap-2">
                    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Settings size={18} /> {t('nav.settings')}
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors mt-2">
                        <LogOut size={18} /> {t('nav.logout')}
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
                {/* Topbar */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 md:hidden text-muted-foreground hover:text-foreground"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-sm md:text-lg font-semibold text-foreground truncate">{t('app.scenario')}</h2>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button onClick={toggleLang} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mr-2">
                            <Globe size={16} /> <span className="uppercase">{i18n.language.split('-')[0]}</span>
                        </button>
                        <div className="hidden md:block text-sm text-muted-foreground">{t('app.managerView')}</div>
                        <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium text-primary">JD</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-auto p-4 md:p-6">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
