import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/api-auth'
import { calculateCreditScore, getRiskLevel, getRecommendation } from '@/lib/scoring'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const unauth = await requireApiAuth()
  if (unauth) return unauth

  const memberId = parseInt(params.id)
  if (isNaN(memberId)) return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })

  try {
    const supabase = createServiceClient()

    const [memberRes, loansRes, configRes] = await Promise.all([
      supabase.from('members').select('*').eq('member_id', memberId).single(),
      supabase.from('loans').select('*').eq('member_id', memberId),
      supabase.from('credit_score_config').select('*'),
    ])

    if (memberRes.error || !memberRes.data) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const loans = loansRes.data ?? []
    const config = configRes.data ?? []

    if (!loans.length) {
      return NextResponse.json({
        member: memberRes.data, score: 50, riskLevel: 'Medium',
        loans: [], guaranteedLoans: [], missedInstallments: [],
        recommendation: 'Needs Review',
        reason: 'No loan history available for this member.',
        breakdown: { base: 50, onTimeBonus: 0, lateDeduction: 0, missedDeduction: 0, closedBonus: 0, goldSoldDeduction: 0, guarantorDeduction: 0, recencyMultiplier: 'N/A', final: 50 },
        repaymentChartData: [],
      })
    }

    const loanIds = loans.map(l => l.loan_id)

    const [repmtsRes, missedRes] = await Promise.all([
      supabase.from('repayments').select('*').in('loan_id', loanIds),
      supabase.from('missed_installments').select('*').eq('member_id', memberId),
    ])

    const repayments = repmtsRes.data ?? []
    const missedInstallments = missedRes.data ?? []

    const { data: guaranteedLoansRaw } = await supabase
      .from('loans')
      .select('*, members!loans_member_id_fkey(member_id, member_name)')
      .or(`guarantor_1_id.eq.${memberId},guarantor_2_id.eq.${memberId},guarantor_3_id.eq.${memberId},guarantor_4_id.eq.${memberId}`)

    const guaranteedLoans = []
    for (const gl of guaranteedLoansRaw ?? []) {
      const { data: borrowerScore } = await supabase
        .from('member_credit_scores').select('score').eq('member_id', gl.member_id).single()
      guaranteedLoans.push({ loan: gl, borrower: gl.members, borrowerScore: borrowerScore?.score ?? 50 })
    }

    const guaranteedForScoring = (guaranteedLoansRaw ?? []).map(gl => ({
      loan: gl, borrowerMissed: 0, goldSold: gl.gold_status === 'Sold',
    }))

    const breakdown = calculateCreditScore({ loans, repayments, missedInstallments, guaranteedLoans: guaranteedForScoring, config })
    const riskLevel = getRiskLevel(breakdown.final)
    const { recommendation, reason } = getRecommendation(breakdown.final, riskLevel)

    const loansWithRepayments = loans.map(loan => ({
      ...loan,
      repayments: repayments.filter(r => r.loan_id === loan.loan_id),
      paidCount: repayments.filter(r => r.loan_id === loan.loan_id).length,
      missedCount: missedInstallments.filter(m => m.loan_id === loan.loan_id).length,
      totalPaid: repayments.filter(r => r.loan_id === loan.loan_id).reduce((s, r) => s + r.paid_amount, 0),
    }))

    const chartMap: Record<string, { paid: number; missed: number }> = {}
    repayments.forEach(r => {
      const m = r.paid_date.slice(0, 7)
      if (!chartMap[m]) chartMap[m] = { paid: 0, missed: 0 }
      chartMap[m].paid++
    })
    missedInstallments.forEach(m => {
      const key = m.installment_due_date.slice(0, 7)
      if (!chartMap[key]) chartMap[key] = { paid: 0, missed: 0 }
      chartMap[key].missed++
    })
    const repaymentChartData = Object.entries(chartMap)
      .sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([month, vals]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...vals,
      }))

    await supabase.from('member_credit_scores').upsert({ member_id: memberId, score: breakdown.final, last_updated: new Date().toISOString() })

    return NextResponse.json({ member: memberRes.data, score: breakdown.final, riskLevel, loans: loansWithRepayments, guaranteedLoans, missedInstallments, recommendation, reason, breakdown, repaymentChartData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
