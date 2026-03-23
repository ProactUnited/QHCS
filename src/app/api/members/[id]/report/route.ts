// // // import { NextResponse } from 'next/server'
// // // import { createServiceClient } from '@/lib/supabase/service'
// // // import { requireApiAuth } from '@/lib/api-auth'
// // // import {
// // //   calculateCreditScore,
// // //   getRiskLevel,
// // //   getRecommendation,
// // //   extractBorrowerBehaviour,
// // //   type GuarantorInput,
// // // } from '@/lib/scoring'

// // // export async function GET(req: Request, { params }: { params: { id: string } }) {
// // //   const unauth = await requireApiAuth()
// // //   if (unauth) return unauth

// // //   const memberId = parseInt(params.id)
// // //   if (isNaN(memberId)) return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })

// // //   try {
// // //     const supabase = createServiceClient()

// // //     // ── Fetch member, own loans, and config in parallel ────────────────────
// // //     const [memberRes, loansRes, configRes] = await Promise.all([
// // //       supabase.from('members').select('*').eq('member_id', memberId).single(),
// // //       supabase.from('loans').select('*').eq('member_id', memberId),
// // //       supabase.from('credit_score_config').select('*'),
// // //     ])

// // //     if (memberRes.error || !memberRes.data) {
// // //       return NextResponse.json({ error: 'Member not found' }, { status: 404 })
// // //     }

// // //     const loans  = loansRes.data  ?? []
// // //     const config = configRes.data ?? []

// // //     // ── Own repayments & missed installments ───────────────────────────────
// // //     const ownLoanIds = loans.map(l => l.loan_id)

// // //     const [repmtsRes, missedRes] = await Promise.all([
// // //       ownLoanIds.length
// // //         ? supabase.from('repayments').select('*').in('loan_id', ownLoanIds)
// // //         : Promise.resolve({ data: [] as any[] }),
// // //       supabase.from('missed_installments').select('*').eq('member_id', memberId),
// // //     ])

// // //     const ownRepayments        = repmtsRes.data ?? []
// // //     const ownMissedInstallments = missedRes.data ?? []

// // //     // ── Loans where this member appears as guarantor ───────────────────────
// // //     // NOTE: a member can simultaneously be a borrower on their own loans AND a
// // //     // guarantor on someone else's — both paths are ALWAYS evaluated and the
// // //     // final score consolidates both contributions into one number.
// // //     const { data: guaranteedLoansRaw } = await supabase
// // //       .from('loans')
// // //       .select(`*, borrower:members!loans_member_id_fkey(member_id, member_name)`)
// // //       .or(
// // //         `guarantor_1_id.eq.${memberId},guarantor_2_id.eq.${memberId},` +
// // //         `guarantor_3_id.eq.${memberId},guarantor_4_id.eq.${memberId}`
// // //       )

// // //     const guaranteedRaw = guaranteedLoansRaw ?? []

// // //     // ── For each guaranteed loan, fetch the borrower's actual behaviour ────
// // //     const guarantorInputs: GuarantorInput[]  = []
// // //     const guaranteedLoansForDisplay: any[]   = []

// // //     await Promise.all(
// // //       guaranteedRaw.map(async (gl) => {
// // //         const [borrowerRepmts, borrowerMissed, borrowerScoreRow] = await Promise.all([
// // //           supabase.from('repayments').select('*').eq('loan_id', gl.loan_id),
// // //           supabase.from('missed_installments').select('*').eq('loan_id', gl.loan_id),
// // //           supabase.from('member_credit_scores').select('score').eq('member_id', gl.member_id).single(),
// // //         ])

// // //         const bReps   = borrowerRepmts.data ?? []
// // //         const bMissed = borrowerMissed.data ?? []
// // //         const behaviour = extractBorrowerBehaviour(gl, bReps, bMissed)

// // //         guarantorInputs.push({
// // //           loan: { ...gl, borrowerName: gl.borrower?.member_name ?? `Member #${gl.member_id}` },
// // //           borrowerBehaviour: behaviour,
// // //         })

// // //         guaranteedLoansForDisplay.push({
// // //           loan:          gl,
// // //           borrower:      gl.borrower,
// // //           borrowerScore: borrowerScoreRow.data?.score ?? 50,
// // //           borrowerOnTime: behaviour.onTimeCount,
// // //           borrowerLate:   behaviour.lateCount,
// // //           borrowerMissed: behaviour.missedCount,
// // //           borrowerClosed: behaviour.loanClosed,
// // //           goldSold:       behaviour.goldSold,
// // //         })
// // //       })
// // //     )

// // //     // ── Consolidated score: own-borrower behaviour + guarantor exposure ────
// // //     // A member with no own loans still gets a score from their guarantor role.
// // //     // A member with both gets the full combined picture in one number.
// // //     const breakdown = calculateCreditScore({
// // //       loans,
// // //       repayments:         ownRepayments,
// // //       missedInstallments: ownMissedInstallments,
// // //       guarantorInputs,
// // //       config,
// // //     })

// // //     const riskLevel = getRiskLevel(breakdown.final, breakdown.base)
// // //     const roles = {
// // //       isBorrower:  loans.length > 0,
// // //       isGuarantor: guaranteedRaw.length > 0,
// // //       isBoth:      loans.length > 0 && guaranteedRaw.length > 0,
// // //     }
// // //     const { recommendation, reason } = getRecommendation(breakdown.final, riskLevel, roles)

// // //     // ── Enrich own loans for display ───────────────────────────────────────
// // //     const loansWithRepayments = loans.map(loan => ({
// // //       ...loan,
// // //       repayments:  ownRepayments.filter(r => r.loan_id === loan.loan_id),
// // //       paidCount:   ownRepayments.filter(r => r.loan_id === loan.loan_id).length,
// // //       missedCount: ownMissedInstallments.filter(m => m.loan_id === loan.loan_id).length,
// // //       totalPaid:   ownRepayments
// // //         .filter(r => r.loan_id === loan.loan_id)
// // //         .reduce((s, r) => s + Number(r.paid_amount), 0),
// // //     }))

// // //     // ── Repayment chart (own loans, last 12 months) ────────────────────────
// // //     const chartMap: Record<string, { paid: number; missed: number }> = {}
// // //     ownRepayments.forEach(r => {
// // //       const m = r.paid_date.slice(0, 7)
// // //       if (!chartMap[m]) chartMap[m] = { paid: 0, missed: 0 }
// // //       chartMap[m].paid++
// // //     })
// // //     ownMissedInstallments.forEach(m => {
// // //       const key = m.installment_due_date.slice(0, 7)
// // //       if (!chartMap[key]) chartMap[key] = { paid: 0, missed: 0 }
// // //       chartMap[key].missed++
// // //     })
// // //     const repaymentChartData = Object.entries(chartMap)
// // //       .sort(([a], [b]) => a.localeCompare(b)).slice(-12)
// // //       .map(([month, vals]) => ({
// // //         month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
// // //         ...vals,
// // //       }))

// // //     // ── Persist consolidated score ─────────────────────────────────────────
// // //     await supabase.from('member_credit_scores').upsert({
// // //       member_id:    memberId,
// // //       score:        breakdown.final,
// // //       last_updated: new Date().toISOString(),
// // //     })

// // //     return NextResponse.json({
// // //       member:             memberRes.data,
// // //       score:              breakdown.final,
// // //       riskLevel,
// // //       loans:              loansWithRepayments,
// // //       guaranteedLoans:    guaranteedLoansForDisplay,
// // //       missedInstallments: ownMissedInstallments,
// // //       recommendation,
// // //       reason,
// // //       breakdown,
// // //       repaymentChartData,
// // //       roles,
// // //     })
// // //   } catch (error: any) {
// // //     console.error('[report]', error)
// // //     return NextResponse.json({ error: error.message }, { status: 500 })
// // //   }
// // // }
// // import { NextResponse } from 'next/server'
// // import { createServiceClient } from '@/lib/supabase/service'
// // import { requireApiAuth } from '@/lib/api-auth'
// // import {
// //   calculateCreditScore,
// //   getRiskLevel,
// //   getRecommendation,
// //   extractBorrowerBehaviour,
// //   type GuarantorInput,
// // } from '@/lib/scoring'

// // export async function GET(req: Request, { params }: { params: { id: string } }) {
// //   const unauth = await requireApiAuth()
// //   if (unauth) return unauth

// //   const memberId = parseInt(params.id)
// //   if (isNaN(memberId)) return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })

// //   try {
// //     const supabase = createServiceClient()

// //     // ── Fetch member, own loans, and config in parallel ────────────────────
// //     const [memberRes, loansRes, configRes] = await Promise.all([
// //       supabase.from('members').select('*').eq('member_id', memberId).single(),
// //       supabase.from('loans').select('*').eq('member_id', memberId),
// //       supabase.from('credit_score_config').select('*'),
// //     ])

// //     if (memberRes.error || !memberRes.data) {
// //       return NextResponse.json({ error: 'Member not found' }, { status: 404 })
// //     }

// //     const loans  = loansRes.data  ?? []
// //     const config = configRes.data ?? []

// //     // ── Own repayments & missed installments ───────────────────────────────
// //     const ownLoanIds = loans.map(l => l.loan_id)

// //     const [repmtsRes, missedRes] = await Promise.all([
// //       ownLoanIds.length
// //         ? supabase.from('repayments').select('*').in('loan_id', ownLoanIds)
// //         : Promise.resolve({ data: [] as any[] }),
// //       supabase.from('missed_installments').select('*').eq('member_id', memberId),
// //     ])

// //     const ownRepayments        = repmtsRes.data ?? []
// //     const ownMissedInstallments = missedRes.data ?? []

// //     // ── Loans where this member appears as guarantor ───────────────────────
// //     // NOTE: a member can simultaneously be a borrower on their own loans AND a
// //     // guarantor on someone else's — both paths are ALWAYS evaluated and the
// //     // final score consolidates both contributions into one number.
// //     const { data: guaranteedLoansRaw } = await supabase
// //       .from('loans')
// //       .select(`*, borrower:members!loans_member_id_fkey(member_id, member_name)`)
// //       .or(
// //         `guarantor_1_id.eq.${memberId},guarantor_2_id.eq.${memberId},` +
// //         `guarantor_3_id.eq.${memberId},guarantor_4_id.eq.${memberId}`
// //       )

// //     const guaranteedRaw = guaranteedLoansRaw ?? []

// //     // ── For each guaranteed loan, fetch the borrower's actual behaviour ────
// //     const guarantorInputs: GuarantorInput[]  = []
// //     const guaranteedLoansForDisplay: any[]   = []

// //     await Promise.all(
// //       guaranteedRaw.map(async (gl) => {
// //         const [borrowerRepmts, borrowerMissed, borrowerScoreRow] = await Promise.all([
// //           supabase.from('repayments').select('*').eq('loan_id', gl.loan_id),
// //           supabase.from('missed_installments').select('*').eq('loan_id', gl.loan_id),
// //           supabase.from('member_credit_scores').select('score').eq('member_id', gl.member_id).single(),
// //         ])

// //         const bReps   = borrowerRepmts.data ?? []
// //         const bMissed = borrowerMissed.data ?? []
// //         const behaviour = extractBorrowerBehaviour(gl, bReps, bMissed)

// //         guarantorInputs.push({
// //           loan:              { ...gl, borrowerName: gl.borrower?.member_name ?? `Member #${gl.member_id}` },
// //           borrowerBehaviour: behaviour,
// //           // Pass the real arrays so the scoring engine can apply per-event
// //           // recency using each payment's paid_date and each miss's due date.
// //           // Without these, missed months on old loans would all get loan
// //           // start_date as their recency anchor — wrong.
// //           repayments:        bReps,
// //           missedInstallments: bMissed,
// //         })

// //         guaranteedLoansForDisplay.push({
// //           loan:          gl,
// //           borrower:      gl.borrower,
// //           borrowerScore: borrowerScoreRow.data?.score ?? 50,
// //           borrowerOnTime: behaviour.onTimeCount,
// //           borrowerLate:   behaviour.lateCount,
// //           borrowerMissed: behaviour.missedCount,
// //           borrowerClosed: behaviour.loanClosed,
// //           goldSold:       behaviour.goldSold,
// //         })
// //       })
// //     )

// //     // ── Consolidated score: own-borrower behaviour + guarantor exposure ────
// //     // A member with no own loans still gets a score from their guarantor role.
// //     // A member with both gets the full combined picture in one number.
// //     const breakdown = calculateCreditScore({
// //       loans,
// //       repayments:         ownRepayments,
// //       missedInstallments: ownMissedInstallments,
// //       guarantorInputs,
// //       config,
// //     })

// //     const riskLevel = getRiskLevel(breakdown.final, breakdown.base)
// //     const roles = {
// //       isBorrower:  loans.length > 0,
// //       isGuarantor: guaranteedRaw.length > 0,
// //       isBoth:      loans.length > 0 && guaranteedRaw.length > 0,
// //     }
// //     const { recommendation, reason } = getRecommendation(breakdown.final, riskLevel, roles)

// //     // ── Enrich own loans for display ───────────────────────────────────────
// //     const loansWithRepayments = loans.map(loan => ({
// //       ...loan,
// //       repayments:  ownRepayments.filter(r => r.loan_id === loan.loan_id),
// //       paidCount:   ownRepayments.filter(r => r.loan_id === loan.loan_id).length,
// //       missedCount: ownMissedInstallments.filter(m => m.loan_id === loan.loan_id).length,
// //       totalPaid:   ownRepayments
// //         .filter(r => r.loan_id === loan.loan_id)
// //         .reduce((s, r) => s + Number(r.paid_amount), 0),
// //     }))

// //     // ── Repayment chart (own loans, last 12 months) ────────────────────────
// //     const chartMap: Record<string, { paid: number; missed: number }> = {}
// //     ownRepayments.forEach(r => {
// //       const m = r.paid_date.slice(0, 7)
// //       if (!chartMap[m]) chartMap[m] = { paid: 0, missed: 0 }
// //       chartMap[m].paid++
// //     })
// //     ownMissedInstallments.forEach(m => {
// //       const key = m.installment_due_date.slice(0, 7)
// //       if (!chartMap[key]) chartMap[key] = { paid: 0, missed: 0 }
// //       chartMap[key].missed++
// //     })
// //     const repaymentChartData = Object.entries(chartMap)
// //       .sort(([a], [b]) => a.localeCompare(b)).slice(-12)
// //       .map(([month, vals]) => ({
// //         month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
// //         ...vals,
// //       }))

// //     // ── Persist consolidated score ─────────────────────────────────────────
// //     await supabase.from('member_credit_scores').upsert({
// //       member_id:    memberId,
// //       score:        breakdown.final,
// //       last_updated: new Date().toISOString(),
// //     })

// //     return NextResponse.json({
// //       member:             memberRes.data,
// //       score:              breakdown.final,
// //       riskLevel,
// //       loans:              loansWithRepayments,
// //       guaranteedLoans:    guaranteedLoansForDisplay,
// //       missedInstallments: ownMissedInstallments,
// //       recommendation,
// //       reason,
// //       breakdown,
// //       repaymentChartData,
// //       roles,
// //     })
// //   } catch (error: any) {
// //     console.error('[report]', error)
// //     return NextResponse.json({ error: error.message }, { status: 500 })
// //   }
// // }
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/api-auth'
import {
  calculateCreditScore,
  getRiskLevel,
  getRecommendation,
  extractBorrowerBehaviour,
  expectedMonths,
  paidMonthSet,
  type GuarantorInput,
} from '@/lib/scoring'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const unauth = await requireApiAuth()
  if (unauth) return unauth

  const memberId = parseInt(params.id)
  if (isNaN(memberId)) return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })

  try {
    const supabase = createServiceClient()

    // ── Fetch member, own loans, config ───────────────────────────────────
    const [memberRes, loansRes, configRes] = await Promise.all([
      supabase.from('members').select('*').eq('member_id', memberId).single(),
      supabase.from('loans').select('*').eq('member_id', memberId),
      supabase.from('credit_score_config').select('*'),
    ])

    if (memberRes.error || !memberRes.data) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const loans  = loansRes.data  ?? []
    const config = configRes.data ?? []

    // ── Own repayments only — no missed_installments view needed ──────────
    // Missed months are computed inside the scoring engine from the schedule.
    const ownLoanIds = loans.map(l => l.loan_id)
    const { data: ownRepsData } = ownLoanIds.length
      ? await supabase.from('repayments').select('*').in('loan_id', ownLoanIds).limit(100000)
      : { data: [] as any[] }
    const ownRepayments = ownRepsData ?? []

    // ── Loans where this member is a guarantor ────────────────────────────
    const { data: guaranteedLoansRaw } = await supabase
      .from('loans')
      .select('*, borrower:members!loans_member_id_fkey(member_id, member_name)')
      .or(
        `guarantor_1_id.eq.${memberId},guarantor_2_id.eq.${memberId},` +
        `guarantor_3_id.eq.${memberId},guarantor_4_id.eq.${memberId}`
      )
      .limit(100000)

    const guaranteedRaw = guaranteedLoansRaw ?? []

    // ── For each guaranteed loan, fetch borrower's repayments only ────────
    const guarantorInputs: GuarantorInput[]  = []
    const guaranteedLoansForDisplay: any[]   = []

    await Promise.all(
      guaranteedRaw.map(async (gl) => {
        const [borrowerRepmts, borrowerScoreRow] = await Promise.all([
          supabase.from('repayments').select('*').eq('loan_id', gl.loan_id).limit(100000),
          supabase.from('member_credit_scores').select('score').eq('member_id', gl.member_id).single(),
        ])

        const bReps    = borrowerRepmts.data ?? []
        const behaviour = extractBorrowerBehaviour(gl, bReps)

        // Calculate borrower's pending amount for this guaranteed loan
        const borrowerPaid = bReps.reduce((s, r) => s + Number(r.paid_amount), 0)
        const guaranteedPending = Number(gl.amount) - borrowerPaid

        guarantorInputs.push({
          loan:              { ...gl, borrowerName: gl.borrower?.member_name ?? `Member #${gl.member_id}` },
          borrowerBehaviour: behaviour,
          repayments:        bReps,
        })

        guaranteedLoansForDisplay.push({
          loan:           gl,
          borrower:       gl.borrower,
          borrowerScore:  borrowerScoreRow.data?.score ?? 500,
          borrowerOnTime: behaviour.onTimeCount,
          borrowerLate:   behaviour.lateCount,
          borrowerMissed: behaviour.missedCount,
          borrowerClosed: behaviour.loanClosed,
          goldSold:       behaviour.goldSold,
          guaranteedPending: guaranteedPending > 0 ? guaranteedPending : 0,
        })
      })
    )

    // Calculate guarantor total pending from all guaranteed loans
    const guarantorTotalPending = guaranteedLoansForDisplay.reduce(
      (sum, gl) => sum + gl.guaranteedPending, 0
    )

    // ── Consolidated score ────────────────────────────────────────────────
    const breakdown = calculateCreditScore({
      loans,
      repayments:    ownRepayments,
      guarantorInputs,
      config,
    })

    const riskLevel = getRiskLevel(breakdown.final, breakdown.base)
    const roles = {
      isBorrower:  loans.length > 0,
      isGuarantor: guaranteedRaw.length > 0,
      isBoth:      loans.length > 0 && guaranteedRaw.length > 0,
    }
    const { recommendation, reason } = getRecommendation(breakdown.final, riskLevel, roles)

    // ── Enrich own loans for display ──────────────────────────────────────
    // Compute missed months in JS (same logic as scoring engine)
    const loansWithRepayments = loans.map(loan => {
      const loanReps    = ownRepayments.filter(r => r.loan_id === loan.loan_id)
      const paid        = paidMonthSet(loan.loan_id, ownRepayments)
      const missedMonths = expectedMonths(loan).filter(({ month }) => !paid.has(month))
      const totalPaid   = loanReps.reduce((s, r) => s + Number(r.paid_amount), 0)
      const totalPending = Number(loan.amount) - totalPaid
      return {
        ...loan,
        repayments:  loanReps,
        paidCount:   loanReps.length,
        missedCount: missedMonths.length,
        totalPaid,
        totalPending: totalPending > 0 ? totalPending : 0,
      }
    })

    // Calculate own total pending
    const ownTotalPending = loansWithRepayments.reduce((sum, loan) => sum + loan.totalPending, 0)

    // ── Repayment chart (last 12 months) ──────────────────────────────────
    const chartMap: Record<string, { paid: number; missed: number }> = {}

    ownRepayments.forEach(r => {
      const m = r.paid_date.slice(0, 7)
      if (!chartMap[m]) chartMap[m] = { paid: 0, missed: 0 }
      chartMap[m].paid++
    })

    // Missed months across all own loans for the chart
    loans.forEach(loan => {
      const paid = paidMonthSet(loan.loan_id, ownRepayments)
      expectedMonths(loan).forEach(({ month }) => {
        if (!paid.has(month)) {
          if (!chartMap[month]) chartMap[month] = { paid: 0, missed: 0 }
          chartMap[month].missed++
        }
      })
    })

    const repaymentChartData = Object.entries(chartMap)
      .sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([month, vals]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...vals,
      }))

    // ── Persist score ─────────────────────────────────────────────────────
    await supabase.from('member_credit_scores').upsert({
      member_id:    memberId,
      score:        breakdown.final,
      last_updated: new Date().toISOString(),
    })

    // Build missedInstallments-like array for UI compatibility
    const missedInstallments = loans.flatMap(loan => {
      const paid = paidMonthSet(loan.loan_id, ownRepayments)
      return expectedMonths(loan)
        .filter(({ month }) => !paid.has(month))
        .map(({ isoDate }) => ({
          loan_id:               loan.loan_id,
          member_id:             memberId,
          installment_due_date:  isoDate,
        }))
    })

    return NextResponse.json({
      member:             memberRes.data,
      score:              breakdown.final,
      riskLevel,
      loans:              loansWithRepayments,
      guaranteedLoans:    guaranteedLoansForDisplay,
      missedInstallments,
      recommendation,
      reason,
      breakdown,
      repaymentChartData,
      roles,
      ownTotalPending,
      guarantorTotalPending,
    })
  } catch (error: any) {
    console.error('[report]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
