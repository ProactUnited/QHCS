'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, User, Phone, MapPin, AlertTriangle,
  CheckCircle2, XCircle, Clock, TrendingUp,
  Shield, Coins, Users, FileText, ChevronDown, ChevronUp
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, PageHeader, RiskBadge, StatusBadge, Button, Skeleton } from '@/components/ui'
import ScoreGauge from '@/components/charts/ScoreGauge'
import RepaymentChart from '@/components/charts/RepaymentChart'
import ScoreBreakdownChart from '@/components/charts/ScoreBreakdownChart'
import { formatCurrency, formatDate, getScoreColor, getRiskColor, cn } from '@/lib/utils'
import type { LoanWithRepayments } from '@/types'

interface ReportData {
  member: any
  score: number
  riskLevel: 'Low' | 'Medium' | 'High'
  loans: LoanWithRepayments[]
  guaranteedLoans: any[]
  missedInstallments: any[]
  recommendation: string
  reason: string
  breakdown: any
  repaymentChartData: any[]
}

function LoanRow({ loan }: { loan: LoanWithRepayments }) {
  const [expanded, setExpanded] = useState(false)
  const coverage = loan.gold_value && loan.amount
    ? (loan.gold_value / loan.amount).toFixed(2)
    : null

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/2 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="font-mono text-xs text-slate-500">#{loan.loan_id}</div>
          <div>
            <div className="text-sm font-medium text-white">{loan.purpose || 'General Loan'}</div>
            <div className="text-xs text-slate-500 mt-0.5">{formatDate(loan.start_date)}</div>
          </div>
          <StatusBadge status={loan.status} />
          {loan.gold_status === 'Sold' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              Gold Sold
            </span>
          )}
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right hidden md:block">
            <div className="font-mono text-sm text-white font-medium">{formatCurrency(loan.amount)}</div>
            <div className="text-xs text-slate-500">principal</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-400 font-mono">{loan.paidCount}✓</span>
            <span className="text-red-400 font-mono">{loan.missedCount}✗</span>
            <span className="text-slate-500">/{loan.installments}</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] p-4 bg-white/[0.01]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 mb-1">Installments</div>
                  <div className="font-mono text-white">{loan.installments} × {formatCurrency(loan.installment_amount)}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Total Paid</div>
                  <div className="font-mono text-emerald-400">{formatCurrency(loan.totalPaid)}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Gold Value</div>
                  <div className="font-mono text-amber-400">
                    {loan.gold_value ? formatCurrency(loan.gold_value) : '—'}
                    {coverage && <span className="text-slate-500 ml-1">(×{coverage})</span>}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Repayment Start</div>
                  <div className="font-mono text-white">{formatDate(loan.repayment_start_date)}</div>
                </div>
              </div>

              {/* Repayment list */}
              {loan.repayments.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Repayments</div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {loan.repayments.map((r, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-white/3">
                        <span className="text-slate-400 font-mono">{formatDate(r.paid_date)}</span>
                        <span className="text-emerald-400 font-mono">{formatCurrency(r.paid_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ReportPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analystNotes, setAnalystNotes] = useState('')
  const [analystDecision, setAnalystDecision] = useState<'Approve' | 'Reject' | 'Override' | ''>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/members/${id}/report`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load report'); setLoading(false) })
  }, [id])

  const handleSaveDecision = async () => {
    if (!analystDecision || !data) return
    setSaving(true)
    await fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loan_id: data.loans[0]?.loan_id ?? null,
        member_id: data.member.member_id,
        ai_score: data.score,
        risk_level: data.riskLevel,
        ai_recommendation: data.recommendation,
        ai_reason: data.reason,
        analyst_decision: analystDecision,
        analyst_notes: analystNotes,
      }),
    })
    setSaving(false)
    setSaved(true)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-red-400">{error || 'Member not found'}</p>
          <Button variant="ghost" className="mt-4" onClick={() => router.push('/members')}>
            <ArrowLeft size={14} /> Back
          </Button>
        </div>
      </AppLayout>
    )
  }

  const { member, score, riskLevel, loans, guaranteedLoans, missedInstallments, recommendation, reason, breakdown, repaymentChartData } = data
  const riskColors = getRiskColor(riskLevel)
  const scoreColor = getScoreColor(score)

  const recBg = recommendation === 'Approve' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
    : recommendation === 'Reject' ? 'bg-red-400/10 border-red-400/20 text-red-400'
    : 'bg-amber-400/10 border-amber-400/20 text-amber-400'

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/members')}
            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Credit Report</h1>
            <p className="text-xs text-slate-500">Generated {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Member header card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-700/20 border border-sky-400/20 flex items-center justify-center">
                  <span className="font-display font-bold text-2xl text-sky-300">
                    {member.member_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-display font-bold text-white text-xl">{member.member_name}</h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="font-mono text-xs text-slate-500">ID #{member.member_id}</span>
                    {member.mobile && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone size={10} />{member.mobile}
                      </span>
                    )}
                    {member.mohalla && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={10} />{member.mohalla}
                      </span>
                    )}
                    <span className="text-xs text-slate-600">Since {formatDate(member.created_at)}</span>
                  </div>
                </div>
              </div>
              <RiskBadge risk={riskLevel} />
            </div>
          </Card>
        </motion.div>

        {/* Score + breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Score gauge */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Card className="flex flex-col items-center justify-center py-6">
              <h3 className="font-display font-semibold text-white text-sm mb-4">Credit Score</h3>
              <ScoreGauge score={score} />
              <div className={cn('mt-4 px-4 py-2 rounded-xl border text-center text-xs font-semibold', recBg)}>
                {recommendation === 'Approve' && <CheckCircle2 size={12} className="inline mr-1" />}
                {recommendation === 'Reject' && <XCircle size={12} className="inline mr-1" />}
                {recommendation === 'Needs Review' && <Clock size={12} className="inline mr-1" />}
                AI: {recommendation}
              </div>
              <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed px-2">{reason}</p>
            </Card>
          </motion.div>

          {/* Score breakdown radar */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <Card>
              <h3 className="font-display font-semibold text-white text-sm mb-4">Score Breakdown</h3>
              <div className="grid grid-cols-2 gap-6">
                <ScoreBreakdownChart breakdown={breakdown} />
                <div className="space-y-2 text-xs py-2">
                  {[
                    { label: 'Base Score', val: breakdown.base, col: 'text-slate-400' },
                    { label: '+ On-Time Bonus', val: `+${breakdown.onTimeBonus}`, col: 'text-emerald-400' },
                    { label: '+ Closed Bonus', val: `+${breakdown.closedBonus}`, col: 'text-emerald-400' },
                    { label: '− Late Penalty', val: breakdown.lateDeduction, col: 'text-amber-400' },
                    { label: '− Missed Penalty', val: breakdown.missedDeduction, col: 'text-red-400' },
                    { label: '− Gold Sold', val: breakdown.goldSoldDeduction, col: 'text-red-400' },
                    { label: '− Guarantor', val: breakdown.guarantorDeduction, col: 'text-red-400' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between border-b border-white/4 pb-1">
                      <span className="text-slate-500">{row.label}</span>
                      <span className={`font-mono font-medium ${row.col}`}>{row.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-slate-300">Final Score</span>
                    <span className="font-mono font-bold text-lg" style={{ color: scoreColor }}>{breakdown.final}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Repayment chart */}
        {repaymentChartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="mb-4">
              <h3 className="font-display font-semibold text-white text-sm mb-4">Repayment History</h3>
              <RepaymentChart data={repaymentChartData} />
            </Card>
          </motion.div>
        )}

        {/* Missed installments alert */}
        {missedInstallments.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">{missedInstallments.length} Missed Installment{missedInstallments.length > 1 ? 's' : ''} Detected</p>
                <div className="flex gap-2 flex-wrap mt-1">
                  {missedInstallments.slice(0, 6).map((m: any, i: number) => (
                    <span key={i} className="text-xs font-mono text-red-400/70 bg-red-500/10 px-2 py-0.5 rounded">
                      {formatDate(m.installment_due_date)}
                    </span>
                  ))}
                  {missedInstallments.length > 6 && (
                    <span className="text-xs text-red-400/50">+{missedInstallments.length - 6} more</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loan history */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                <FileText size={15} className="text-sky-400" />
                Loan History ({loans.length})
              </h3>
            </div>
            {loans.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No loans on record</p>
            ) : (
              <div className="space-y-2">
                {loans.map(loan => <LoanRow key={loan.loan_id} loan={loan} />)}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Guarantor exposure */}
        {guaranteedLoans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="mb-4">
              <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2 mb-4">
                <Users size={15} className="text-amber-400" />
                Guarantor Exposure ({guaranteedLoans.length} loans guaranteed)
              </h3>
              <div className="space-y-2">
                {guaranteedLoans.map((gl: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border border-[var(--border)] rounded-lg p-3 text-xs">
                    <div>
                      <div className="text-slate-300 font-medium">{gl.borrower?.member_name ?? 'Unknown'}</div>
                      <div className="text-slate-500 mt-0.5">Loan #{gl.loan?.loan_id} · {formatCurrency(gl.loan?.amount ?? 0)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={gl.loan?.status ?? 'Open'} />
                      <div className="text-right">
                        <div className="font-mono text-white">{gl.borrowerScore ?? '—'}</div>
                        <div className="text-slate-500">borrower score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Analyst decision */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2 mb-4">
              <Shield size={15} className="text-sky-400" />
              Analyst Decision
            </h3>
            {saved ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 size={16} />
                Decision recorded successfully.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {(['Approve', 'Reject', 'Override'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setAnalystDecision(d)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs font-semibold border transition-all',
                        analystDecision === d
                          ? d === 'Approve' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : d === 'Reject' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'border-[var(--border)] text-slate-500 hover:border-slate-500 hover:text-slate-300'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <textarea
                  value={analystNotes}
                  onChange={e => setAnalystNotes(e.target.value)}
                  placeholder="Analyst notes (optional)…"
                  rows={3}
                  className="w-full qhcs-input rounded-lg px-3.5 py-2.5 text-sm resize-none"
                />
                <Button
                  onClick={handleSaveDecision}
                  loading={saving}
                  disabled={!analystDecision}
                >
                  Save Decision
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
