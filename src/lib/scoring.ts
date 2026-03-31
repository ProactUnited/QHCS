import { Loan, Repayment, CreditScoreConfig } from '@/types'
import { differenceInMonths, parseISO, addMonths, format, isBefore, startOfMonth } from 'date-fns'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface BorrowerBehaviour {
  loan: Loan
  onTimeCount: number
  lateCount: number
  partialCount: number   // paid something but < threshold% of installment_amount
  missedCount: number    // no payment at all, or loan still open past installment period
  loanClosed: boolean
  goldSold: boolean
}

export interface GuarantorInput {
  loan: Loan & { borrowerName?: string }
  borrowerBehaviour: BorrowerBehaviour
  repayments: Repayment[]
}

export interface GuarantorLoanBreakdown {
  loanId: number
  borrowerName: string
  onTimeBonus: number
  lateDeduction: number
  partialDeduction: number
  missedDeduction: number
  closedBonus: number
  goldSoldDeduction: number
  netImpact: number
}

export interface ScoreBreakdown {
  base: number
  onTimeBonus: number
  lateDeduction: number
  partialDeduction: number   // partial payment penalties
  missedDeduction: number    // missed/overdue payment penalties
  closedBonus: number
  goldSoldDeduction: number
  guarantorOnTimeBonus: number
  guarantorLateDeduction: number
  guarantorPartialDeduction: number
  guarantorMissedDeduction: number
  guarantorClosedBonus: number
  guarantorGoldSoldDeduction: number
  guarantorNetImpact: number
  guarantorBreakdowns: GuarantorLoanBreakdown[]
  final: number
}

export interface ScoringInput {
  loans: Loan[]
  repayments: Repayment[]
  guarantorInputs: GuarantorInput[]
  config: CreditScoreConfig[]
}

// ─── Month classification ─────────────────────────────────────────────────────

export type MonthStatus = 'full' | 'partial' | 'missed' | 'overdue'
// full    → paid ≥ threshold% of installment_amount (on time or late)
// partial → paid > 0 but < threshold% of installment_amount
// missed  → zero paid
// overdue → loan still open past original installment period (treated as missed)

// ─── Constants ────────────────────────────────────────────────────────────────

const GUARANTOR_SCALE = 0.5

const DEFAULTS = {
  base_score:                  500,
  on_time_payment:              50,
  late_payment:                 30,
  missed_payment:              100,   // penalty per fully missed / overdue month
  partial_payment_threshold:    90,   // % of installment_amount below which = partial
  partial_payment_penalty:      50,   // penalty per partial month (half of missed by default)
  missed_payment_cap:          200,   // max total deduction per loan (partial + missed combined)
  loan_closed_successfully:    100,
  gold_sold:                   150,
  loan_start_date:        20210101,   // YYYYMMDD format - only loans from this date onwards are included
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function w(config: CreditScoreConfig[], rule: keyof typeof DEFAULTS): number {
  const val = config.find(c => c.rule_name === rule)?.weight ?? DEFAULTS[rule]
  return Math.abs(Number(val))
}

/**
 * Get loan start date from config as YYYY-MM-DD string.
 * The date is stored as YYYYMMDD number in the weight field.
 * Default: 2021-01-01
 */
export function getLoanStartDate(config: CreditScoreConfig[]): string {
  const val = config.find(c => c.rule_name === 'loan_start_date')?.weight ?? DEFAULTS.loan_start_date
  const num = Number(val)
  // Convert YYYYMMDD to YYYY-MM-DD
  const year = Math.floor(num / 10000)
  const month = Math.floor((num % 10000) / 100)
  const day = num % 100
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Recency multiplier for a specific event date.
 *   ≤ 12 months ago → 1.5×
 *   ≤ 24 months ago → 1.2×
 *   older           → 1.0×
 */
function recency(eventDate: string): number {
  try {
    const months = differenceInMonths(new Date(), parseISO(eventDate))
    if (months <= 12) return 1.5
    if (months <= 24) return 1.2
    return 1.0
  } catch {
    return 1.0
  }
}

// ─── Exported schedule helpers ────────────────────────────────────────────────

/**
 * Build the set of months (YYYY-MM) that a repayment was received for a loan.
 * Multiple payments in the same month are SUMMED (used for partial detection).
 */
export function paidMonthSet(loanId: number, repayments: Repayment[]): Set<string> {
  const set = new Set<string>()
  for (const r of repayments) {
    if (r.loan_id === loanId) set.add(r.paid_date.slice(0, 7))
  }
  return set
}

/**
 * Sum of paid_amount for a specific loan in a specific month (YYYY-MM).
 */
function monthPaidAmount(loanId: number, month: string, repayments: Repayment[]): number {
  return repayments
    .filter(r => r.loan_id === loanId && r.paid_date.slice(0, 7) === month)
    .reduce((sum, r) => sum + Number(r.paid_amount), 0)
}

/**
 * Generate the FULL schedule for a loan — two phases:
 *
 * Phase 1 — Original installment period (months 1..installments):
 *   Always included up to today (or close_date for closed loans).
 *
 * Phase 2 — Overdue period (months installments+1..today):
 *   Only for OPEN loans that have outlived their original schedule.
 *   These months are returned with status hint 'overdue' so the caller
 *   can apply full missed penalty without a threshold check.
 *
 * The current month is never included (payment could still arrive today).
 */
export function expectedMonths(loan: Loan): Array<{
  month: string
  isoDate: string
  overdue: boolean   // true = beyond original installment count
}> {
  const result: Array<{ month: string; isoDate: string; overdue: boolean }> = []
  const start     = parseISO(loan.repayment_start_date)
  const todayStart = startOfMonth(new Date())

  // Closed loans: stop at close_date month (inclusive search, exclusive result)
  const hardStop = loan.status === 'Close' && loan.close_date
    ? startOfMonth(parseISO(loan.close_date))
    : todayStart  // open loans: stop at start of current month

  // Phase 1: original schedule (months 1..installments, up to hardStop)
  for (let i = 0; i < loan.installments; i++) {
    const due = startOfMonth(addMonths(start, i))
    if (!isBefore(due, hardStop)) break   // due >= hardStop → stop
    result.push({ month: format(due, 'yyyy-MM'), isoDate: format(due, 'yyyy-MM-dd'), overdue: false })
  }

  // Phase 2: overdue months (open loans past original schedule only)
  if (loan.status === 'Open') {
    const originalEnd = startOfMonth(addMonths(start, loan.installments))
    if (isBefore(originalEnd, todayStart)) {
      // There are overdue months between originalEnd and today
      let cursor = originalEnd
      while (isBefore(cursor, todayStart)) {
        result.push({ month: format(cursor, 'yyyy-MM'), isoDate: format(cursor, 'yyyy-MM-dd'), overdue: true })
        cursor = addMonths(cursor, 1)
      }
    }
  }

  return result
}

/**
 * Classify a single month for a loan:
 *   'full'    → paid ≥ threshold% of installment_amount
 *   'partial' → paid > 0 but < threshold%
 *   'missed'  → nothing paid
 *   'overdue' → beyond original schedule (always treated as missed penalty)
 */
export function classifyMonth(
  loanId: number,
  month: string,
  installmentAmount: number,
  repayments: Repayment[],
  thresholdPct: number,   // e.g. 90
  overdue: boolean
): MonthStatus {
  if (overdue) return 'overdue'
  const paid = monthPaidAmount(loanId, month, repayments)
  if (paid === 0) return 'missed'
  const pct = (paid / installmentAmount) * 100
  return pct >= thresholdPct ? 'full' : 'partial'
}

// ─── Core delta function ──────────────────────────────────────────────────────

interface LoanDelta {
  onTimeBonus: number
  lateDeduction: number
  partialDeduction: number
  missedDeduction: number
  closedBonus: number
  goldSoldDeduction: number
}

/**
 * Score delta for ONE loan — three-tier payment classification.
 *
 * Per-month classification:
 *   full (on time)  → +on_time_payment × recency
 *   full (late)     → -late_payment    × recency
 *   partial         → -partial_payment_penalty × recency   (counts toward cap)
 *   missed/overdue  → -missed_payment  × recency           (counts toward cap)
 *
 * The combined (partial + missed) deduction is capped at missed_payment_cap
 * per loan, applied BEFORE the guarantor scale factor.
 *
 * "full" repayments are still classified on-time vs late by paid_date day-of-month.
 * "partial" months: the actual payment is late/early by day-of-month but the
 *   dominant signal is the underpayment, so we skip on-time/late and apply
 *   partial penalty instead.
 *
 * scale = 1.0 for own loans, GUARANTOR_SCALE (0.5) for guaranteed loans.
 */
function loanDelta(
  loan: Loan,
  repayments: Repayment[],
  config: CreditScoreConfig[],
  scale: number
): LoanDelta {
  const ON_TIME_W   = w(config, 'on_time_payment')
  const LATE_W      = w(config, 'late_payment')
  const MISSED_W    = w(config, 'missed_payment')
  const PARTIAL_W   = w(config, 'partial_payment_penalty')
  const THRESHOLD   = w(config, 'partial_payment_threshold')   // e.g. 90
  const CAP         = w(config, 'missed_payment_cap')
  const CLOSED_W    = w(config, 'loan_closed_successfully')
  const GOLD_W      = w(config, 'gold_sold')

  const installAmt  = Number(loan.installment_amount)
  const schedule    = expectedMonths(loan)

  let onTimeBonus    = 0
  let lateDeduction  = 0
  let rawPartial     = 0  // accumulates partial penalties (positive, capped later)
  let rawMissed      = 0  // accumulates missed/overdue (positive, capped later)

  for (const { month, isoDate, overdue } of schedule) {
    const status = classifyMonth(loan.loan_id, month, installAmt, repayments, THRESHOLD, overdue)
    const rw     = recency(isoDate)

    switch (status) {
      case 'full': {
        // Find the actual repayment date for on-time vs late classification
        // Use the latest payment in that month (most representative)
        const monthReps = repayments.filter(
          r => r.loan_id === loan.loan_id && r.paid_date.slice(0, 7) === month
        )
        const latestRep = monthReps.reduce((latest, r) =>
          r.paid_date > latest.paid_date ? r : latest, monthReps[0])
        if (latestRep) {
          const day = parseISO(latestRep.paid_date).getDate()
          if (day <= 10) {
            onTimeBonus   +=  ON_TIME_W * rw * scale
          } else {
            lateDeduction += -LATE_W    * rw * scale
          }
        }
        break
      }
      case 'partial':
        // Partial payment: penalty applies, no on-time bonus
        rawPartial += PARTIAL_W * rw
        break
      case 'missed':
      case 'overdue':
        // No payment or loan dragged past schedule
        rawMissed += MISSED_W * rw
        break
    }
  }

  // Cap combined partial+missed deduction per loan BEFORE applying scale
  const combinedRaw      = rawPartial + rawMissed
  const cappedCombined   = Math.min(combinedRaw, CAP)
  // Split cap proportionally between partial and missed
  const capRatio         = combinedRaw > 0 ? cappedCombined / combinedRaw : 0
  const cappedPartial    = rawPartial * capRatio
  const cappedMissed     = rawMissed * capRatio
  const partialDeduction = -(cappedPartial * scale)
  const missedDeduction  = -(cappedMissed * scale)

  // ── Loan closed bonus ─────────────────────────────────────────────────────
  let closedBonus = 0
  if (loan.status === 'Close') {
    const dateForRecency = loan.close_date ?? loan.start_date
    closedBonus = CLOSED_W * recency(dateForRecency) * scale
  }

  // ── Gold sold deduction ───────────────────────────────────────────────────
  const goldSoldDeduction = loan.gold_status === 'Sold'
    ? -GOLD_W * recency(loan.start_date) * scale
    : 0

  return { onTimeBonus, lateDeduction, partialDeduction, missedDeduction, closedBonus, goldSoldDeduction }
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * Build BorrowerBehaviour summary — counts for display only.
 * Uses the same three-tier classification as loanDelta().
 */
export function extractBorrowerBehaviour(
  loan: Loan,
  repayments: Repayment[],
  thresholdPct = 90
): BorrowerBehaviour {
  const installAmt = Number(loan.installment_amount)
  const schedule   = expectedMonths(loan)

  let onTime = 0, late = 0, partial = 0, missed = 0

  for (const { month, isoDate: _d, overdue } of schedule) {
    const status = classifyMonth(loan.loan_id, month, installAmt, repayments, thresholdPct, overdue)
    if (status === 'full') {
      const monthReps = repayments.filter(
        r => r.loan_id === loan.loan_id && r.paid_date.slice(0, 7) === month
      )
      const latestRep = monthReps.reduce((latest, r) =>
        r.paid_date > latest.paid_date ? r : latest, monthReps[0])
      if (latestRep && parseISO(latestRep.paid_date).getDate() <= 10) {
        onTime++
      } else {
        late++
      }
    } else if (status === 'partial') {
      partial++
    } else {
      missed++   // 'missed' or 'overdue'
    }
  }

  return {
    loan,
    onTimeCount:  onTime,
    lateCount:    late,
    partialCount: partial,
    missedCount:  missed,
    loanClosed:   loan.status === 'Close',
    goldSold:     loan.gold_status === 'Sold',
  }
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function calculateCreditScore(input: ScoringInput): ScoreBreakdown {
  const { loans, repayments, guarantorInputs, config } = input

  const BASE = w(config, 'base_score')

  // ── 1. Own-loan contributions ─────────────────────────────────────────────
  let ownOnTime    = 0, ownLate    = 0, ownPartial = 0, ownMissed = 0
  let ownClosed    = 0, ownGold     = 0

  for (const loan of loans) {
    const d = loanDelta(loan, repayments, config, 1.0)
    ownOnTime   += d.onTimeBonus
    ownLate     += d.lateDeduction
    ownPartial  += d.partialDeduction
    ownMissed   += d.missedDeduction
    ownClosed   += d.closedBonus
    ownGold     += d.goldSoldDeduction
  }

  // ── 2. Guarantor contributions ────────────────────────────────────────────
  let gOnTime = 0, gLate = 0, gPartial = 0, gMissed = 0
  let gClosed = 0, gGold  = 0
  const guarantorBreakdowns: GuarantorLoanBreakdown[] = []

  for (const { loan, repayments: bReps } of guarantorInputs) {
    const d = loanDelta(loan, bReps, config, GUARANTOR_SCALE)

    gOnTime  += d.onTimeBonus
    gLate    += d.lateDeduction
    gPartial += d.partialDeduction
    gMissed  += d.missedDeduction
    gClosed  += d.closedBonus
    gGold    += d.goldSoldDeduction

    const net = d.onTimeBonus + d.lateDeduction + d.partialDeduction + d.missedDeduction
              + d.closedBonus + d.goldSoldDeduction

    guarantorBreakdowns.push({
      loanId:            loan.loan_id,
      borrowerName:      (loan as any).borrowerName ?? `Member #${loan.member_id}`,
      onTimeBonus:       Math.round(d.onTimeBonus),
      lateDeduction:     Math.round(d.lateDeduction),
      partialDeduction:  Math.round(d.partialDeduction),
      missedDeduction:   Math.round(d.missedDeduction),
      closedBonus:       Math.round(d.closedBonus),
      goldSoldDeduction: Math.round(d.goldSoldDeduction),
      netImpact:         Math.round(net),
    })
  }

  const guarantorNetImpact = gOnTime + gLate + gPartial + gMissed + gClosed + gGold

  const rawScore = BASE
    + ownOnTime + ownLate + ownMissed + ownClosed + ownGold
    + guarantorNetImpact

  const final = Math.max(0, Math.min(BASE * 2, Math.round(rawScore)))

  return {
    base:                        BASE,
    onTimeBonus:                 Math.round(ownOnTime),
    lateDeduction:               Math.round(ownLate),
    partialDeduction:            Math.round(ownPartial),
    missedDeduction:             Math.round(ownMissed),
    closedBonus:                 Math.round(ownClosed),
    goldSoldDeduction:           Math.round(ownGold),
    guarantorOnTimeBonus:        Math.round(gOnTime),
    guarantorLateDeduction:      Math.round(gLate),
    guarantorPartialDeduction:   Math.round(gPartial),
    guarantorMissedDeduction:    Math.round(gMissed),
    guarantorClosedBonus:        Math.round(gClosed),
    guarantorGoldSoldDeduction:  Math.round(gGold),
    guarantorNetImpact:          Math.round(guarantorNetImpact),
    guarantorBreakdowns,
    final,
  }
}

// ─── Risk & recommendation ────────────────────────────────────────────────────

export function getRiskLevel(score: number, base = 1000): 'No' | 'Low' | 'Medium' | 'High' {
  const max = base * 1.25
  const pct = (score / max) * 100
  if (pct >= 85) return 'No'
  if (pct >= 70) return 'Low'
  if (pct >= 40) return 'Medium'
  return 'High'
}

export function getRecommendation(
  score: number,
  riskLevel: string,
  roles?: { isBorrower: boolean; isGuarantor: boolean }
): { recommendation: string; reason: string } {
  const context = roles?.isBorrower && roles?.isGuarantor
    ? 'Score consolidates own loan behaviour and guarantor exposure. '
    : roles?.isGuarantor && !roles?.isBorrower
    ? 'Score is based entirely on guarantor exposure (no own loans on record). '
    : ''

  if (riskLevel === 'No') return {
    recommendation: 'Nothing to worry',
    reason: `${context}Score ${score} — strong repayment history and guarantor obligations in good standing. Approval recommended.`,
  }
  if (riskLevel === 'Low') return {
    recommendation: 'Approve',
    reason: `${context}Score ${score} — strong repayment history and guarantor obligations in good standing. Approval recommended.`,
  }
  if (riskLevel === 'Medium') return {
    recommendation: 'Needs Review',
    reason: `${context}Score ${score} — moderate reliability. Some late or missed payments, or guarantor exposure on underperforming loans. Analyst review recommended.`,
  }
  return {
    recommendation: 'Reject',
    reason: `${context}Score ${score} — high risk. Significant missed installments, gold sold events, or heavy guarantor exposure on defaulting loans. Not recommended.`,
  }
}

export function getCollateralCoverage(goldValue: number | null, loanAmount: number): number | null {
  if (!goldValue || !loanAmount) return null
  return goldValue / loanAmount
}