// import { clsx, type ClassValue } from 'clsx'
// import { twMerge } from 'tailwind-merge'

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }

// export function formatCurrency(amount: number) {
//   return new Intl.NumberFormat('en-KW', {
//       style: 'currency',
//       currency: 'KWD'
//      }).format(amount)

// }
// // export function formatCurrency(amount: number): string {
// //   return new Intl.NumberFormat('en-PK', {
// //     style: 'currency',
// //     currency: 'PKR',
// //     maximumFractionDigits: 0,
// //   }).format(amount)
// // }

// export function formatDate(dateStr: string | null | undefined): string {
//   if (!dateStr) return '—'
//   try {
//     return new Date(dateStr).toLocaleDateString('en-PK', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     })
//   } catch {
//     return dateStr
//   }
// }

// export function getRiskColor(risk: string) {
//   if (risk === 'Low') return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' }
//   if (risk === 'Medium') return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' }
//   return { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' }
// }

// export function getScoreColor(score: number): string {
//   if (score >= 70) return '#34d399' // emerald
//   if (score >= 40) return '#fbbf24' // amber
//   return '#f87171' // red
// }

// export function getScoreGrade(score: number): string {
//   if (score >= 85) return 'Excellent'
//   if (score >= 70) return 'Good'
//   if (score >= 55) return 'Fair'
//   if (score >= 40) return 'Poor'
//   return 'Critical'
// }


import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency: 'KWD',
    maximumFractionDigits: 3,
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function getRiskColor(risk: string) {
  if (risk === 'Low')    return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' }
  if (risk === 'Medium') return { text: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30'   }
  return                        { text: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30'     }
}

/**
 * Score colour based on percentage of max (base × 2).
 * Accepts optional base so it scales with whatever base_score is configured.
 * Default base = 1000, so max = 1250.
 *   ≥ 70% of max → green   (≥700 at base 500)
 *   ≥ 40% of max → amber   (≥400 at base 500)
 *   <  40% of max → red    ( <400 at base 500)
 */
export function getScoreColor(score: number, base = 1000): string {
  const max = base * 1.25
  const pct = (score / max) * 100
  if (pct >= 90) return '#34d399' // emerald
  if (pct >= 70) return '#fbbf24' // amber
  return '#f87171'                // red
}

/**
 * Score grade based on percentage of max.
 *   ≥ 85% → Excellent
 *   ≥ 70% → Good
 *   ≥ 55% → Fair
 *   ≥ 40% → Poor
 *   <  40% → Critical
 */
export function getScoreGrade(score: number, base = 1000): string {
  const max = base * 1.25
  const pct = (score / max) * 100
  if (pct >= 90) return 'Excellent'
  if (pct >= 80) return 'Good'
  if (pct >= 60) return 'Fair'
  if (pct >= 30) return 'Poor'
  return 'Critical'
}