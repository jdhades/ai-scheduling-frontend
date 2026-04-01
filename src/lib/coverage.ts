export interface CoverageData {
    assigned: number
    required: number
}

export function calculateCoverageScore(data: CoverageData): number {
    if (data.required === 0) return 100 // No staff needed, perfectly covered

    // Calculate percentage, maxing out at 100% strictly for color logic unless overstaffing matters.
    // We'll return actual percentage.
    const score = Math.round((data.assigned / data.required) * 100)
    return score
}

export function getCoverageColorClass(score: number): string {
    if (score >= 95) return 'bg-green-500'
    if (score >= 80) return 'bg-yellow-500'
    return 'bg-red-500'
}
