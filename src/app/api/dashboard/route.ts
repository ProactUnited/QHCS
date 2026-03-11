import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function requireAuth() {
  const supabase = createSupabaseServer()
  const { data: { session }, error } = await supabase.auth.getSession()

  console.log("AUTH CHECK")
  console.log("session:", session)
  console.log("auth error:", error)

  return session
}

export async function GET() {
  try {

    console.log("----- DASHBOARD API START -----")

    const session = await requireAuth()

    if (!session) {
      console.log("No session found → Unauthorized")
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    console.log("User authenticated:", session.user.email)

    const supabase = createServiceClient()

    console.log("Running dashboard queries...")

    const [membersRes, loansRes, missedRes, scoresRes] = await Promise.all([
      supabase.from('members').select('member_id', { count: 'exact', head: true }),
      supabase.from('loans').select('loan_id, status'),
      supabase.from('missed_installments').select('loan_id', { count: 'exact', head: true }),
      supabase.from('member_credit_scores').select('score'),
    ])

    console.log("Query Results:")
    console.log("Members Count:", membersRes.count)
    console.log("Loans:", loansRes.data)
    console.log("Missed Installments:", missedRes.count)
    console.log("Scores:", scoresRes.data)

    const loans = loansRes.data ?? []
    const scores = scoresRes.data ?? []

    console.log("Loans array:", loans)
    console.log("Scores array:", scores)

    // Monthly activity calculation
    const monthlyMap: Record<string, { repayments: number; missed: number }> = {}

    const { data: repayments, error: repaymentsError } = await supabase
      .from('repayments')
      .select('paid_date')
      .gte(
        'paid_date',
        new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0]
      )

    console.log("Repayments Query Result:", repayments)
    console.log("Repayments Error:", repaymentsError)

    ;(repayments ?? []).forEach(r => {
      const m = r.paid_date.slice(0, 7)
      if (!monthlyMap[m]) monthlyMap[m] = { repayments: 0, missed: 0 }
      monthlyMap[m].repayments++
    })

    console.log("Monthly Map:", monthlyMap)

    const monthlyActivity = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        ...vals,
      }))

    console.log("Monthly Activity:", monthlyActivity)

    const highRisk = scores.filter(s => s.score < 40).length

    const avgCreditScore = scores.length
      ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
      : 0

    console.log("High Risk Members:", highRisk)
    console.log("Average Credit Score:", avgCreditScore)

    const activeLoans = loans.filter(l => l.status === 'Open').length
    const closedLoans = loans.filter(l => l.status === 'Close').length

    console.log("Active Loans:", activeLoans)
    console.log("Closed Loans:", closedLoans)

    const riskDistribution = [
      { name: 'Low Risk', value: scores.filter(s => s.score >= 70).length, color: '#10b981' },
      { name: 'Medium', value: scores.filter(s => s.score >= 40 && s.score < 70).length, color: '#fbbf24' },
      { name: 'High Risk', value: highRisk, color: '#f87171' },
    ]

    console.log("Risk Distribution:", riskDistribution)

    const response = {
      totalMembers: membersRes.count ?? 0,
      activeLoans,
      closedLoans,
      missedInstallmentsCount: missedRes.count ?? 0,
      highRiskMembers: highRisk,
      avgCreditScore,
      monthlyActivity,
      riskDistribution,
    }

    console.log("FINAL DASHBOARD RESPONSE:", response)
    console.log("----- DASHBOARD API END -----")

    return NextResponse.json(response)

  } catch (error: any) {

    console.error("DASHBOARD API ERROR:", error)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}