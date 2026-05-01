import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    useShiftTemplatesQuery,
    useCreateTemplateMutation,
    useDeleteTemplateMutation,
    type CreateShiftTemplatePayload,
} from '../../api/shift-templates.api'

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
    const { t } = useTranslation()
    const { data: templates = [], isLoading } = useShiftTemplatesQuery()
    const createMutation = useCreateTemplateMutation()
    const deleteMutation = useDeleteTemplateMutation()
    const dayLabel = (d: number | null): string =>
        d === null ? t('scheduling:templatesPanel.values.allDays') : t(`templates:days.${d}`)

    const [form, setForm] = useState<CreateShiftTemplatePayload>(EMPTY_FORM)
    const [showForm, setShowForm] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await createMutation.mutateAsync(form)
        setForm(EMPTY_FORM)
        setShowForm(false)
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
                        📋 {t('scheduling:templatesPanel.title')}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                        {t('scheduling:templatesPanel.subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                        {showForm
                            ? t('scheduling:templatesPanel.closeCreate')
                            : t('scheduling:templatesPanel.openCreate')}
                    </button>
                </div>
            </div>

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
                        <label style={labelStyle}>{t('scheduling:templatesPanel.fields.name')}</label>
                        <input
                            required
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder={t('scheduling:templatesPanel.fields.namePlaceholder')}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('scheduling:templatesPanel.fields.day')}</label>
                        <select
                            value={form.dayOfWeek ?? 1}
                            onChange={e => setForm(f => ({ ...f, dayOfWeek: +e.target.value }))}
                            style={inputStyle}
                        >
                            {[0, 1, 2, 3, 4, 5, 6].map(i => (
                                <option key={i} value={i}>{t(`templates:days.${i}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>{t('scheduling:templatesPanel.fields.start')}</label>
                        <input
                            type="time"
                            required
                            value={form.startTime}
                            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('scheduling:templatesPanel.fields.end')}</label>
                        <input
                            type="time"
                            required
                            value={form.endTime}
                            onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>{t('scheduling:templatesPanel.fields.demand')}</label>
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
                            {t('scheduling:templatesPanel.actions.cancel')}
                        </button>
                        <button type="submit" disabled={createMutation.isPending} style={submitBtnStyle}>
                            {createMutation.isPending
                                ? t('scheduling:templatesPanel.actions.submitting')
                                : t('scheduling:templatesPanel.actions.submit')}
                        </button>
                    </div>
                </form>
            )}

            {/* Template list */}
            {isLoading ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>{t('scheduling:templatesPanel.loading')}</p>
            ) : templates.length === 0 ? (
                <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                    {t('scheduling:templatesPanel.empty')}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {templates.map(tpl => (
                        <div key={tpl.id} style={{
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
                                {dayLabel(tpl.dayOfWeek)}
                            </span>
                            <span style={{ flex: 1, fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>
                                {tpl.name}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {tpl.startTime.slice(0, 5)}–{tpl.endTime.slice(0, 5)}
                            </span>
                            <span style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                padding: '2px 6px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '4px',
                            }}>
                                ⚡ {tpl.demandScore}
                            </span>
                            <button
                                onClick={() => deleteMutation.mutate(tpl.id)}
                                disabled={deleteMutation.isPending}
                                title={t('scheduling:templatesPanel.actions.delete')}
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
