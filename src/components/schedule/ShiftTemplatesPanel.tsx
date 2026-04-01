import React, { useState } from 'react'
import {
    useShiftTemplatesQuery,
    useCreateTemplateMutation,
    useDeleteTemplateMutation,
    useInstantiateWeekMutation,
    type CreateShiftTemplatePayload,
} from '../../api/shift-templates.api'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const WEEK_START = '2024-03-04' // Matches the seed data Monday

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM: CreateShiftTemplatePayload = {
    name: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '16:00',
    demandScore: 2,
    undesirableWeight: 0,
}

export function ShiftTemplatesPanel() {
    const { data: templates = [], isLoading } = useShiftTemplatesQuery()
    const createMutation = useCreateTemplateMutation()
    const deleteMutation = useDeleteTemplateMutation()
    const instantiateMutation = useInstantiateWeekMutation()

    const [form, setForm] = useState<CreateShiftTemplatePayload>(EMPTY_FORM)
    const [showForm, setShowForm] = useState(false)
    const [instantiateResult, setInstantiateResult] = useState<{ generated: number } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await createMutation.mutateAsync(form)
        setForm(EMPTY_FORM)
        setShowForm(false)
    }

    const handleInstantiate = async () => {
        const result = await instantiateMutation.mutateAsync(WEEK_START)
        setInstantiateResult(result)
        setTimeout(() => setInstantiateResult(null), 5000)
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
                        📋 Plantillas de Turno
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Define una vez, genera semanas en 1 clic
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleInstantiate}
                        disabled={instantiateMutation.isPending || templates.length === 0}
                        style={{
                            padding: '8px 16px',
                            background: instantiateMutation.isPending ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: instantiateMutation.isPending || templates.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: templates.length === 0 ? 0.5 : 1,
                            transition: 'all 0.2s',
                        }}
                    >
                        {instantiateMutation.isPending ? '⏳ Generando…' : '⚡ Generar Semana'}
                    </button>
                    <button
                        onClick={() => setShowForm(v => !v)}
                        style={{
                            padding: '8px 14px',
                            background: showForm ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.2)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99,102,241,0.4)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        {showForm ? '✕ Cerrar' : '+ Nueva Plantilla'}
                    </button>
                </div>
            </div>

            {/* Success banner */}
            {instantiateResult && (
                <div style={{
                    padding: '10px 14px',
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    color: '#6ee7b7',
                    fontSize: '13px',
                    marginBottom: '12px',
                }}>
                    ✅ {instantiateResult.generated} turnos generados para la semana del {WEEK_START}
                </div>
            )}

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '10px',
                    padding: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    marginBottom: '14px',
                    border: '1px solid rgba(255,255,255,0.07)',
                }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Nombre</label>
                        <input
                            required
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="ej. Apertura Cocina"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Día</label>
                        <select
                            value={form.dayOfWeek}
                            onChange={e => setForm(f => ({ ...f, dayOfWeek: +e.target.value }))}
                            style={inputStyle}
                        >
                            {DAY_LABELS.map((d, i) => (
                                <option key={i} value={i}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Inicio</label>
                        <input
                            type="time"
                            required
                            value={form.startTime}
                            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Fin</label>
                        <input
                            type="time"
                            required
                            value={form.endTime}
                            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Demanda (1–5)</label>
                        <input
                            type="number"
                            min={1} max={5} step={0.5}
                            value={form.demandScore}
                            onChange={e => setForm(f => ({ ...f, demandScore: +e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={createMutation.isPending} style={submitBtnStyle}>
                            {createMutation.isPending ? 'Guardando…' : '💾 Guardar Plantilla'}
                        </button>
                    </div>
                </form>
            )}

            {/* Template list */}
            {isLoading ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Cargando plantillas…</p>
            ) : templates.length === 0 ? (
                <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                    No hay plantillas aún. Crea una para empezar.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {templates.map(t => (
                        <div key={t.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <span style={{
                                padding: '2px 8px',
                                background: 'rgba(99,102,241,0.2)',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#a5b4fc',
                                minWidth: '32px',
                                textAlign: 'center',
                            }}>
                                {DAY_LABELS[t.dayOfWeek]}
                            </span>
                            <span style={{ flex: 1, fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>
                                {t.name}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {t.startTime.slice(0, 5)}–{t.endTime.slice(0, 5)}
                            </span>
                            <span style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                padding: '2px 6px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '4px',
                            }}>
                                ⚡ {t.demandScore}
                            </span>
                            <button
                                onClick={() => deleteMutation.mutate(t.id)}
                                disabled={deleteMutation.isPending}
                                title="Eliminar plantilla"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                            >
                                🗑
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '4px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '13px',
    boxSizing: 'border-box',
}

const submitBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
}

const cancelBtnStyle: React.CSSProperties = {
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
}
