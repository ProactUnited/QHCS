// import { NextResponse } from 'next/server'
// import { createServiceClient } from '@/lib/supabase/service'
// import { requireApiAuth } from '@/lib/api-auth'
// import { expectedMonths, classifyMonth } from '@/lib/scoring'

// export async function GET() {
//   const unauth = await requireApiAuth()
//   if (unauth) return unauth

//   try {
//     const supabase = createServiceClient()

//     // ── Counts ─────────────────────────────────────────────────────────────
//     const [membersRes, openLoansRes, closedLoansRes, scoresRes] = await Promise.all([
//       supabase.from('members').select('*', { count: 'exact', head: true }),
//       supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
//       supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'Close'),
//       supabase.from('member_credit_scores').select('score').limit(100000),
//     ])

//     const scores = scoresRes.data ?? []

//     // ── Fetch threshold config ──────────────────────────────────────────────
//     const { data: configData } = await supabase
//       .from('credit_score_config')
//       .select('rule_name, weight')
//       .eq('rule_name', 'partial_payment_threshold')
//       .single()
//     const threshold = configData ? Math.abs(Number(configData.weight)) : 90

//     // ── Fetch all open loans only ───────────────────────────────────────────
//     // We only care about open loans for the activity chart and missed count.
//     // Closed loans are settled — their history doesn't affect current status.
//     const { data: openLoansData } = await supabase
//       .from('loans')
//       .select('loan_id, repayment_start_date, installments, installment_amount, status, close_date, start_date, gold_status')
//       .eq('status', 'Open')
//       .limit(100000)

//     const openLoans = openLoansData ?? []

//     // ── Fetch ALL repayments for open loans only ────────────────────────────
//     // Single fetch — no two-step, no partial overwrites.
//     const openLoanIds = openLoans.map(l => l.loan_id)
//     const allRepayments = openLoanIds.length > 0
//       ? (await supabase
//           .from('repayments')
//           .select('loan_id, paid_date, paid_amount')
//           .in('loan_id', openLoanIds)
//           .limit(100000)
//         ).data ?? []
//       : []

//     // ── 6-month window (YYYY-MM strings, oldest first) ─────────────────────
//     const windowMonths: string[] = []
//     for (let i = 5; i >= 0; i--) {
//       const d = new Date()
//       d.setMonth(d.getMonth() - i)
//       // Use local year/month to avoid UTC offset shifting the month
//       const y = d.getFullYear()
//       const m = String(d.getMonth() + 1).padStart(2, '0')
//       windowMonths.push(`${y}-${m}`)
//     }
//     const windowSet = new Set(windowMonths)

//     // ── Build chart data ────────────────────────────────────────────────────
// //     // ── Repayment activity — last 6 months ─────────────────────────────────
// //     const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0]
// //     const { data: repayments } = await supabase
// //       .from('repayments')
// //       .select('paid_date')
// //       .gte('paid_date', sixMonthsAgo)
// //       .limit(100000)

// //     const monthlyMap: Record<string, { repayments: number; missed: number }> = {}
// //     ;(repayments ?? []).forEach(r => {
// //       const m = r.paid_date.slice(0, 7)
// //       if (!monthlyMap[m]) monthlyMap[m] = { repayments: 0, missed: 0 }
// //       monthlyMap[m].repayments++
// //     })

// //     const monthlyActivity = Object.entries(monthlyMap)
// //       .sort(([a], [b]) => a.localeCompare(b))
// //       .map(([month, vals]) => ({
// //         month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
// //         ...vals,
// //       }))

// // For each open loan, classify each month in the 6-month window.
//     const monthlyMap: Record<string, { repayments: number; missed: number }> = {}
//     for (const m of windowMonths) {
//       monthlyMap[m] = { repayments: 0, missed: 0 }
//     }

//     for (const loan of openLoans) {
//       const installAmt = Number(loan.installment_amount)
//       const schedule   = expectedMonths(loan as any)

//       for (const { month, overdue } of schedule) {
//         if (!windowSet.has(month)) continue   // outside 6-month window — skip

//         const status = classifyMonth(
//           loan.loan_id, month, installAmt,
//           allRepayments as any, threshold, overdue
//         )

//         if (status === 'full') {
//           monthlyMap[month].repayments++
//         } else {
//           // partial, missed, overdue all count as missed on the chart
//           monthlyMap[month].missed++
//         }
//       }
//     }

//     // ── Missed installments stat card ───────────────────────────────────────
//     // Count of open-loan installment months (all time) that are not fully paid.
//     // Only open loans — closed loans are settled history.
//     let missedInstallmentsCount = 0
//     for (const loan of openLoans) {
//       const installAmt = Number(loan.installment_amount)
//       const schedule   = expectedMonths(loan as any)

//       for (const { month, overdue } of schedule) {
//         const status = classifyMonth(
//           loan.loan_id, month, installAmt,
//           allRepayments as any, threshold, overdue
//         )
//         if (status !== 'full') missedInstallmentsCount++
//       }
//     }

//     // ── Format chart output ─────────────────────────────────────────────────
//     const monthlyActivity = windowMonths.map(month => ({
//       month:       new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
//       repayments:  monthlyMap[month].repayments,
//       missed:      monthlyMap[month].missed,
//     }))

//     const highRisk = scores.filter(s => s.score < 400).length

//     return NextResponse.json({
//       totalMembers:            membersRes.count     ?? 0,
//       activeLoans:             openLoansRes.count   ?? 0,
//       closedLoans:             closedLoansRes.count ?? 0,
//       missedInstallmentsCount,
//       highRiskMembers:         highRisk,
//       avgCreditScore:          scores.length
//         ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
//         : 0,
//       monthlyActivity,
//       riskDistribution: [
//         { name: 'Low Risk',  value: scores.filter(s => s.score >= 700).length,                 color: '#10b981' },
//         { name: 'Medium',    value: scores.filter(s => s.score >= 400 && s.score < 700).length, color: '#fbbf24' },
//         { name: 'High Risk', value: highRisk,                                                   color: '#f87171' },
//       ],
//     })
//   } catch (error: any) {
//     console.error('[dashboard]', error)
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }


import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/api-auth'
import { expectedMonths, classifyMonth, getLoanStartDate } from '@/lib/scoring'

export async function GET() {
  const unauth = await requireApiAuth()
  if (unauth) return unauth

  try {
    const supabase = createServiceClient()

    // ── Counts for members and loans ─────────────────────────────────────────────
    const [membersRes, openLoansRes, closedLoansRes, scoresRes] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
      supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'Close'),
      supabase.from('member_credit_scores').select('score')
    ])

    const scores = scoresRes.data ?? []

    // ── Fetch config ────────────────────────────────────────────────────────
    const { data: configData } = await supabase
      .from('credit_score_config')
      .select('rule_name, weight')
    const config = configData ?? []
    const threshold = config.find(c => c.rule_name === 'partial_payment_threshold')
      ? Math.abs(Number(config.find(c => c.rule_name === 'partial_payment_threshold')!.weight))
      : 90
    const loanStartDateStr = getLoanStartDate(config)

    // ── Fetch all loans ──────────────────────────────────────────────────────
    let allLoans: any[] = []
    const LOAN_PAGE = 10000
    let loanOffset = 0
    while (true) {
      const { data: loanPage } = await supabase
        .from('loans')
        .select('loan_id, member_id, repayment_start_date, installments, installment_amount, status, close_date, start_date, gold_status')
        .range(loanOffset, loanOffset + LOAN_PAGE - 1)
      if (!loanPage || loanPage.length === 0) break
      allLoans.push(...loanPage.map(l => ({ ...l, loan_id: Number(l.loan_id) })))
      if (loanPage.length < LOAN_PAGE) break
      loanOffset += LOAN_PAGE
    }

    // Filter loans by start date (only loans from configured date onwards)
    allLoans = allLoans.filter(loan => loan.start_date >= loanStartDateStr)

    const loanIds = allLoans.map(l => l.loan_id)

    // ── 6-month window (YYYY-MM strings, oldest first) ─────────────────────
    const windowMonths: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      windowMonths.push(`${y}-${m}`)
    }
    const windowSet = new Set(windowMonths)
    const sixMonthsAgo = windowMonths[0] + '-01'

    // ── Fetch all repayments (no loan filter) ───────────────────────────────
    let allRepayments: { loan_id: number; paid_date: string; paid_amount: number }[] = []
    const PAGE_SIZE = 10000
    let offset = 0
    while (true) {
      const { data: page, error } = await supabase
        .from('repayments')
        .select('loan_id, paid_date, paid_amount')
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        console.error('Error fetching repayments:', error)
        break
      }

      if (!page || page.length === 0) break

      allRepayments.push(...page.map(r => ({ ...r, loan_id: Number(r.loan_id) })))
      if (page.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    // ── Build monthly chart data ────────────────────────────────────────────
    const monthlyMap: Record<string, { repayments: number; missed: number }> = {}
    for (const m of windowMonths) {
      monthlyMap[m] = { repayments: 0, missed: 0 }
    }

    for (const loan of allLoans) {
      const installAmt = Number(loan.installment_amount)
      const schedule = expectedMonths(loan as any)

      for (const { month, overdue } of schedule) {
        if (!windowSet.has(month)) continue

        const status = classifyMonth(
          loan.loan_id, month, installAmt,
          allRepayments as any, threshold, overdue
        )

        if (status === 'full') {
          monthlyMap[month].repayments++
        } else {
          monthlyMap[month].missed++
        }
      }
    }

    // ── Missed installments stat card (all-time) ───────────────────────────
    let missedInstallmentsCount = 0
    for (const loan of allLoans) {
      const installAmt = Number(loan.installment_amount)
      const schedule = expectedMonths(loan as any)

      for (const { month, overdue } of schedule) {
        const status = classifyMonth(
          loan.loan_id, month, installAmt,
          allRepayments as any, threshold, overdue
        )
        if (status !== 'full') missedInstallmentsCount++
      }
    }

    // ── Format chart output ─────────────────────────────────────────────────
    const monthlyActivity = windowMonths.map(month => ({
      month:      new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      repayments: monthlyMap[month].repayments,
      missed:     monthlyMap[month].missed,
    }))

    const highRisk = scores.filter(s => s.score < 400).length

    return NextResponse.json({
      totalMembers:            membersRes.count     ?? 0,
      activeLoans:             openLoansRes.count   ?? 0,
      closedLoans:             closedLoansRes.count ?? 0,
      missedInstallmentsCount,
      highRiskMembers:         highRisk,
      avgCreditScore:          scores.length
        ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
        : 0,
      monthlyActivity,
      riskDistribution: [
        { name: 'Low Risk',  value: scores.filter(s => s.score >= 700).length,                  color: '#10b981' },
        { name: 'Medium Risk',    value: scores.filter(s => s.score >= 400 && s.score < 700).length, color: '#fbbf24' },
        { name: 'High Risk', value: highRisk,                                                    color: '#f87171' },
      ],
    })

  } catch (error: any) {
    console.error('[dashboard]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
    
// import { NextResponse } from 'next/server'
// import { createServiceClient } from '@/lib/supabase/service'
// import { requireApiAuth } from '@/lib/api-auth'
// import { expectedMonths, classifyMonth } from '@/lib/scoring'

// export async function GET() {
//   const unauth = await requireApiAuth()
//   if (unauth) return unauth

//   try {
//     const supabase = createServiceClient()

//     // ── Counts ─────────────────────────────────────────────────────────────
//     const [membersRes, openLoansRes, closedLoansRes, scoresRes] = await Promise.all([
//       supabase.from('members').select('*', { count: 'exact', head: true }),
//       supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
//       supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'Close'),
//       supabase.from('member_credit_scores').select('score').limit(100000),
//     ])

//     const scores = scoresRes.data ?? []

//     // ── Fetch threshold config ──────────────────────────────────────────────
//     const { data: configData } = await supabase
//       .from('credit_score_config')
//       .select('rule_name, weight')
//       .eq('rule_name', 'partial_payment_threshold')
//       .single()
//     const threshold = configData ? Math.abs(Number(configData.weight)) : 90

//     // ── Fetch all open loans ────────────────────────────────────────────────
//     const { data: openLoansData } = await supabase
//       .from('loans')
//       .select('loan_id, repayment_start_date, installments, installment_amount, status, close_date, start_date, gold_status')
//       .eq('status', 'Open')
//       .limit(100000)

//     const openLoans = (openLoansData ?? []).map(l => ({ ...l, loan_id: Number(l.loan_id) }))
//     const openLoanIds = openLoans.map(l => l.loan_id)

//     // ── 6-month window (YYYY-MM strings, oldest first) ─────────────────────
//     const windowMonths: string[] = []
//     for (let i = 5; i >= 0; i--) {
//       const d = new Date()
//       d.setMonth(d.getMonth() - i)
//       const y = d.getFullYear()
//       const m = String(d.getMonth() + 1).padStart(2, '0')
//       windowMonths.push(`${y}-${m}`)
//     }
//     const windowSet = new Set(windowMonths)
//     const sixMonthsAgo = windowMonths[0] + '-01'

//     // ── Fetch repayments for chart — last 6 months only ─────────────────────
//     // Scoped to the window so the result set stays small and under any limit.
//     const chartRepayments = openLoanIds.length > 0
//       ? ((await supabase
//           .from('repayments')
//           .select('loan_id, paid_date, paid_amount')
//           .in('loan_id', openLoanIds)
//           .gte('paid_date', sixMonthsAgo)
//         ).data ?? []).map(r => ({ ...r, loan_id: Number(r.loan_id) }))
//       : []

//     // ── Fetch ALL repayments for missed-installments count ──────────────────
//     // Must cover all time because overdue loans have schedule months going back years.
//     // Paginate in chunks of 10 000 to avoid the 1 000-row default cap.
//     let allRepayments: { loan_id: number; paid_date: string; paid_amount: number }[] = []
//     if (openLoanIds.length > 0) {
//       const PAGE = 10000
//       let from = 0
//       while (true) {
//         const { data: page } = await supabase
//           .from('repayments')
//           .select('loan_id, paid_date, paid_amount')
//           .in('loan_id', openLoanIds)
//           .range(from, from + PAGE - 1)
//         if (!page || page.length === 0) break
//         allRepayments.push(...page.map(r => ({ ...r, loan_id: Number(r.loan_id) })))
//         if (page.length < PAGE) break
//         from += PAGE
//       }
//     }

//     // ── Build chart data ────────────────────────────────────────────────────
//     const monthlyMap: Record<string, { repayments: number; missed: number }> = {}
//     for (const m of windowMonths) {
//       monthlyMap[m] = { repayments: 0, missed: 0 }
//     }

//     for (const loan of openLoans) {
//       const installAmt = Number(loan.installment_amount)
//       const schedule   = expectedMonths(loan as any)

//       for (const { month, overdue } of schedule) {
//         if (!windowSet.has(month)) continue

//         const status = classifyMonth(
//           loan.loan_id, month, installAmt,
//           chartRepayments as any, threshold, overdue
//         )

//         if (status === 'full') {
//           monthlyMap[month].repayments++
//         } else {
//           monthlyMap[month].missed++
//         }
//       }
//     }

//     // ── Missed installments stat card (all-time, all open loans) ───────────
//     let missedInstallmentsCount = 0
//     for (const loan of openLoans) {
//       const installAmt = Number(loan.installment_amount)
//       const schedule   = expectedMonths(loan as any)

//       for (const { month, overdue } of schedule) {
//         const status = classifyMonth(
//           loan.loan_id, month, installAmt,
//           allRepayments as any, threshold, overdue
//         )
//         if (status !== 'full') missedInstallmentsCount++
//       }
//     }

//     // ── Format chart output ─────────────────────────────────────────────────
//     const monthlyActivity = windowMonths.map(month => ({
//       month:      new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
//       repayments: monthlyMap[month].repayments,
//       missed:     monthlyMap[month].missed,
//     }))

//     const highRisk = scores.filter(s => s.score < 400).length

//     return NextResponse.json({
//       totalMembers:            membersRes.count     ?? 0,
//       activeLoans:             openLoansRes.count   ?? 0,
//       closedLoans:             closedLoansRes.count ?? 0,
//       missedInstallmentsCount,
//       highRiskMembers:         highRisk,
//       avgCreditScore:          scores.length
//         ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
//         : 0,
//       monthlyActivity,
//       riskDistribution: [
//         { name: 'Low Risk',  value: scores.filter(s => s.score >= 700).length,                  color: '#10b981' },
//         { name: 'Medium',    value: scores.filter(s => s.score >= 400 && s.score < 700).length, color: '#fbbf24' },
//         { name: 'High Risk', value: highRisk,                                                    color: '#f87171' },
//       ],
//     })
//   } catch (error: any) {
//     console.error('[dashboard]', error)
//     return NextResponse.json({ error: error.message }, { status: 500 })
//   }
// }