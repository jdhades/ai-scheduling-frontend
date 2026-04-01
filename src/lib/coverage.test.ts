import { describe, it, expect } from 'vitest'
import { calculateCoverageScore, getCoverageColorClass } from './coverage'

describe('Coverage Logic', () => {
    it('calculates perfect coverage', () => {
        expect(calculateCoverageScore({ assigned: 5, required: 5 })).toBe(100)
    })

    it('calculates partial coverage', () => {
        expect(calculateCoverageScore({ assigned: 4, required: 5 })).toBe(80)
    })

    it('calculates severe understaffing', () => {
        expect(calculateCoverageScore({ assigned: 1, required: 5 })).toBe(20)
    })

    it('handles zero required staff', () => {
        expect(calculateCoverageScore({ assigned: 0, required: 0 })).toBe(100)
    })

    it('returns appropriate color classes based on Agent skills guidelines', () => {
        expect(getCoverageColorClass(100)).toBe('bg-green-500')
        expect(getCoverageColorClass(95)).toBe('bg-green-500')
        expect(getCoverageColorClass(85)).toBe('bg-yellow-500')
        expect(getCoverageColorClass(80)).toBe('bg-yellow-500')
        expect(getCoverageColorClass(79)).toBe('bg-red-500')
        expect(getCoverageColorClass(20)).toBe('bg-red-500')
    })
})
