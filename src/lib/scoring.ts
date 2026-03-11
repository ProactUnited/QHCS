import { Loan, Repayment, MissedInstallment, CreditScoreConfig } from '@/types'
import { differenceInMonths, parseISO, isAfter } from 'date-fns'

export interface ScoringInput {
  loans: Loan[]
  repayments: Repayment[]
  missedInstallments: MissedInstallment[]
  guaranteedLoans: Array<{ loan: Loan; borrowerMissed: number; goldSold: boolean }>
  config: CreditScoreConfig[]
}

export interface ScoreBreakdown {
  base: number
  onTimeBonus: number
  lateDeduction: number
  missedDeduction: number
  closedBonus: number
  goldSoldDeduction: number
  guarantorDeduction: number
  recencyMultiplier: string
  final: number
}

function getWeight(config: CreditScoreConfig[], ruleName: string, defaultVal: number): number {
  return config.find(c => c.rule_name === ruleName)?.weight ?? defaultVal
}

// Recency: loans in last 12 months = 1.5x, 12-24 = 1.2x, older = 1.0x
function recencyWeight(startDate: string): number {
  const months = differenceInMonths(new Date(), parseISO(startDate))
  if (months <= 12) return 1.5
  if (months <= 24) return 1.2
  return 1.0
}

function detectLatePayments(loan: Loan, repayments: Repayment[]): number {
  // Payments within 0–7 days after month start are on-time; beyond = late
  const loanRepayments = repayments.filter(r => r.loan_id === loan.loan_id)
  let lateCount = 0
  loanRepayments.forEach(r => {
    const paid = parseISO(r.paid_date)
    const expected = parseISO(loan.repayment_start_date)
    // If paid more than 7 days after expected month start, count as late
    const dayOfMonth = paid.getDate()
    if (dayOfMonth > 10) lateCount++
  })
  return lateCount
}

export function calculateCreditScore(input: ScoringInput): ScoreBreakdown {
  const { loans, repayments, missedInstallments, guaranteedLoans, config } = input

  const BASE = 50
  const ON_TIME_W = getWeight(config, 'on_time_payment', 5)
  const LATE_W = getWeight(config, 'late_payment', -3)
  const MISSED_W = getWeight(config, 'missed_payment', -10)
  const CLOSED_W = getWeight(config, 'loan_closed_successfully', 10)
  const GOLD_SOLD_W = getWeight(config, 'gold_sold', -15)
  const GUARANTOR_W = getWeight(config, 'guarantor_default', -8)

  let onTimeBonus = 0
  let lateDeduction = 0
  let missedDeduction = 0
  let closedBonus = 0
  let goldSoldDeduction = 0

  for (const loan of loans) {
    const rw = recencyWeight(loan.start_date)
    const loanRepayments = repayments.filter(r => r.loan_id === loan.loan_id)
    const loanMissed = missedInstallments.filter(m => m.loan_id === loan.loan_id).length
    const lateCount = detectLatePayments(loan, loanRepayments)
    const onTimeCount = Math.max(0, loanRepayments.length - lateCount)

    onTimeBonus += onTimeCount * ON_TIME_W * rw
    lateDeduction += lateCount * LATE_W * rw
    missedDeduction += loanMissed * MISSED_W * rw

    if (loan.status === 'Close') closedBonus += CLOSED_W * rw
    if (loan.gold_status === 'Sold') goldSoldDeduction += GOLD_SOLD_W * rw
  }

  // Guarantor impact
  let guarantorDeduction = 0
  for (const gl of guaranteedLoans) {
    if (gl.borrowerMissed > 2 || gl.goldSold) {
      const rw = recencyWeight(gl.loan.start_date)
      guarantorDeduction += GUARANTOR_W * rw
    }
  }

  const rawScore = BASE + onTimeBonus + lateDeduction + missedDeduction + closedBonus + goldSoldDeduction + guarantorDeduction
  const final = Math.max(0, Math.min(100, Math.round(rawScore)))

  return {
    base: BASE,
    onTimeBonus: Math.round(onTimeBonus),
    lateDeduction: Math.round(lateDeduction),
    missedDeduction: Math.round(missedDeduction),
    closedBonus: Math.round(closedBonus),
    goldSoldDeduction: Math.round(goldSoldDeduction),
    guarantorDeduction: Math.round(guarantorDeduction),
    recencyMultiplier: 'applied per loan age',
    final,
  }
}

export function getRiskLevel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 70) return 'Low'
  if (score >= 40) return 'Medium'
  return 'High'
}

export function getRecommendation(score: number, riskLevel: string): { recommendation: string; reason: string } {
  if (riskLevel === 'Low') {
    return {
      recommendation: 'Approve',
      reason: `Credit score of ${score} indicates reliable repayment behavior with minimal missed installments. Loan approval recommended.`,
    }
  }
  if (riskLevel === 'Medium') {
    return {
      recommendation: 'Needs Review',
      reason: `Credit score of ${score} indicates moderate repayment reliability. Manual analyst review recommended before approval.`,
    }
  }
  return {
    recommendation: 'Reject',
    reason: `Credit score of ${score} indicates high risk due to multiple missed installments or guarantor defaults. Loan not recommended.`,
  }
}

export function getCollateralCoverage(goldValue: number | null, loanAmount: number): number | null {
  if (!goldValue || !loanAmount) return null
  return goldValue / loanAmount
}
