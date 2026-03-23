// 'use client'
// import { useEffect, useState } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { motion, AnimatePresence } from 'framer-motion'
// import {
//   ArrowLeft, Phone, MapPin, AlertTriangle,
//   CheckCircle2, XCircle, Clock, TrendingUp,
//   Shield, Users, FileText, ChevronDown, ChevronUp,
//   TrendingDown, Minus, Info
// } from 'lucide-react'
// import AppLayout from '@/components/layout/AppLayout'
// import { Card, RiskBadge, StatusBadge, Button, Skeleton } from '@/components/ui'
// import ScoreGauge from '@/components/charts/ScoreGauge'
// import RepaymentChart from '@/components/charts/RepaymentChart'
// import ScoreBreakdownChart from '@/components/charts/ScoreBreakdownChart'
// import { formatCurrency, formatDate, getScoreColor, cn } from '@/lib/utils'
// import type {
//   LoanWithRepayments,
//   ScoreBreakdown,
//   GuaranteedLoanDisplay,
//   GuarantorLoanBreakdown
// } from '@/types'

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface ReportData {
//   member: any
//   score: number
//   riskLevel: 'Low' | 'Medium' | 'High'
//   loans: LoanWithRepayments[]
//   guaranteedLoans: GuaranteedLoanDisplay[]
//   missedInstallments: any[]
//   recommendation: string
//   reason: string
//   breakdown: ScoreBreakdown
//   repaymentChartData: any[]
//   roles: { isBorrower: boolean; isGuarantor: boolean; isBoth: boolean }
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function LoanRow({ loan }: { loan: LoanWithRepayments }) {
//   const [expanded, setExpanded] = useState(false)
//   const coverage = loan.gold_value && loan.amount
//     ? (Number(loan.gold_value) / Number(loan.amount)).toFixed(2)
//     : null

//   return (
//     <div className="border border-[var(--border)] rounded-xl overflow-hidden">
//       <div
//         className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
//         onClick={() => setExpanded(e => !e)}
//       >
//         <div className="flex items-center gap-3 flex-wrap min-w-0">
//           <span className="font-mono text-xs text-slate-500 shrink-0">#{loan.loan_id}</span>
//           <div className="min-w-0">
//             <div className="text-sm font-medium text-white truncate">{loan.purpose || 'General Loan'}</div>
//             <div className="text-xs text-slate-500 mt-px">{formatDate(loan.start_date)}</div>
//           </div>
//           <StatusBadge status={loan.status} />
//           {loan.gold_status === 'Sold' && (
//             <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
//               Gold Sold
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-4 shrink-0 ml-2">
//           <div className="text-right hidden md:block">
//             <div className="font-mono text-sm text-white">{formatCurrency(loan.amount)}</div>
//             <div className="text-xs text-slate-500">principal</div>
//           </div>
//           <div className="flex items-center gap-2 text-xs font-mono">
//             <span className="text-emerald-400">{loan.paidCount}✓</span>
//             <span className="text-red-400">{loan.missedCount}✗</span>
//             <span className="text-slate-500">/{loan.installments}</span>
//           </div>
//           {expanded
//             ? <ChevronUp size={13} className="text-slate-500" />
//             : <ChevronDown size={13} className="text-slate-500" />}
//         </div>
//       </div>

//       <AnimatePresence>
//         {expanded && (
//           <motion.div
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: 'auto', opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             className="overflow-hidden"
//           >
//             <div className="border-t border-[var(--border)] p-4 bg-white/[0.01]">
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
//                 <div>
//                   <div className="text-slate-500 mb-1">Installment</div>
//                   <div className="font-mono text-white">{loan.installments} × {formatCurrency(loan.installment_amount)}</div>
//                 </div>
//                 <div>
//                   <div className="text-slate-500 mb-1">Total Paid</div>
//                   <div className="font-mono text-emerald-400">{formatCurrency(loan.totalPaid)}</div>
//                 </div>
//                 <div>
//                   <div className="text-slate-500 mb-1">Gold Value</div>
//                   <div className="font-mono text-amber-400">
//                     {loan.gold_value ? formatCurrency(Number(loan.gold_value)) : '—'}
//                     {coverage && <span className="text-slate-500 ml-1">(×{coverage})</span>}
//                   </div>
//                 </div>
//                 <div>
//                   <div className="text-slate-500 mb-1">Repayment Start</div>
//                   <div className="font-mono text-white">{formatDate(loan.repayment_start_date)}</div>
//                 </div>
//               </div>
//               {loan.repayments.length > 0 && (
//                 <>
//                   <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Repayments</div>
//                   <div className="max-h-36 overflow-y-auto space-y-1">
//                     {loan.repayments.map((r, i) => (
//                       <div key={i} className="flex justify-between text-xs py-1 border-b border-white/[0.03]">
//                         <span className="text-slate-400 font-mono">{formatDate(r.paid_date)}</span>
//                         <span className="text-emerald-400 font-mono">{formatCurrency(Number(r.paid_amount))}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }

// // Delta pill: shows +N or −N with colour
// function DeltaPill({ value, invert = false }: { value: number; invert?: boolean }) {
//   const isPositive = value > 0
//   const isZero = value === 0
//   if (isZero) return <span className="font-mono text-xs text-slate-600">0</span>
//   return (
//     <span className={cn(
//       'font-mono text-xs font-semibold',
//       isPositive ? 'text-emerald-400' : 'text-red-400'
//     )}>
//       {isPositive ? '+' : ''}{value}
//     </span>
//   )
// }

// // Guarantor loan card — shows per-loan breakdown of how that borrower's behaviour affected THIS member's score
// function GuarantorLoanCard({ gl, breakdown }: {
//   gl: GuaranteedLoanDisplay
//   breakdown?: GuarantorLoanBreakdown
// }) {
//   const [expanded, setExpanded] = useState(false)
//   const borrowerScoreColor = getScoreColor(gl.borrowerScore)
//   const netImpact = breakdown?.netImpact ?? 0
//   const netPositive = netImpact > 0
//   const netZero = netImpact === 0

//   return (
//     <div className="border border-[var(--border)] rounded-xl overflow-hidden">
//       {/* Header row */}
//       <div
//         className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
//         onClick={() => setExpanded(e => !e)}
//       >
//         <div className="flex items-center gap-3 min-w-0">
//           {/* Borrower avatar */}
//           <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
//             <span className="font-display font-bold text-xs text-amber-400">
//               {(gl.borrower?.member_name ?? '?').charAt(0).toUpperCase()}
//             </span>
//           </div>
//           <div className="min-w-0">
//             <div className="text-sm font-medium text-white truncate">
//               {gl.borrower?.member_name ?? `Member #${gl.loan.member_id}`}
//             </div>
//             <div className="flex items-center gap-2 mt-px flex-wrap">
//               <span className="text-xs text-slate-500 font-mono">Loan #{gl.loan.loan_id}</span>
//               <span className="text-xs text-slate-500">{formatCurrency(Number(gl.loan.amount))}</span>
//               <StatusBadge status={gl.loan.status} />
//               {gl.goldSold && (
//                 <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-px rounded-full">
//                   Gold Sold
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-4 shrink-0 ml-2">
//           {/* Borrower score */}
//           <div className="text-right hidden sm:block">
//             <div className="font-mono font-bold text-base" style={{ color: borrowerScoreColor }}>
//               {gl.borrowerScore}
//             </div>
//             <div className="text-[10px] text-slate-500">borrower</div>
//           </div>

//           {/* Net impact on MY score */}
//           <div className="text-right">
//             <div className={cn(
//               'font-mono font-bold text-base',
//               netZero ? 'text-slate-500' : netPositive ? 'text-emerald-400' : 'text-red-400'
//             )}>
//               {netImpact > 0 ? '+' : ''}{netImpact}
//             </div>
//             <div className="text-[10px] text-slate-500">my score</div>
//           </div>

//           {expanded
//             ? <ChevronUp size={13} className="text-slate-500" />
//             : <ChevronDown size={13} className="text-slate-500" />}
//         </div>
//       </div>

//       {/* Expanded: per-event breakdown */}
//       <AnimatePresence>
//         {expanded && breakdown && (
//           <motion.div
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: 'auto', opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             className="overflow-hidden"
//           >
//             <div className="border-t border-[var(--border)] p-4 bg-white/[0.01]">
//               {/* Borrower behaviour summary */}
//               <div className="grid grid-cols-3 gap-3 mb-4">
//                 {[
//                   { label: 'On-Time', value: gl.borrowerOnTime, color: 'text-emerald-400' },
//                   { label: 'Late',    value: gl.borrowerLate,   color: 'text-amber-400' },
//                   { label: 'Missed',  value: gl.borrowerMissed, color: 'text-red-400' },
//                 ].map(s => (
//                   <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
//                     <div className={`font-mono font-bold text-lg ${s.color}`}>{s.value}</div>
//                     <div className="text-[10px] text-slate-500">{s.label}</div>
//                   </div>
//                 ))}
//               </div>

//               {/* Score delta table */}
//               <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest mb-2">
//                 Impact on your score (50% of borrower's events)
//               </div>
//               <div className="space-y-1.5">
//                 {[
//                   { label: 'On-Time Payments',  val: breakdown.onTimeBonus,       sign: '+' },
//                   { label: 'Late Payments',      val: breakdown.lateDeduction,     sign: '−' },
//                   { label: 'Missed Installments',val: breakdown.missedDeduction,   sign: '−' },
//                   { label: 'Loan Closed',        val: breakdown.closedBonus,       sign: '+' },
//                   { label: 'Gold Sold',          val: breakdown.goldSoldDeduction, sign: '−' },
//                 ].map(row => {
//                   if (row.val === 0) return null
//                   return (
//                     <div key={row.label} className="flex justify-between text-xs py-1 border-b border-white/[0.04]">
//                       <span className="text-slate-400">{row.label}</span>
//                       <DeltaPill value={row.val} />
//                     </div>
//                   )
//                 })}
//                 <div className="flex justify-between text-xs pt-2">
//                   <span className="font-semibold text-slate-300">Net Impact</span>
//                   <DeltaPill value={breakdown.netImpact} />
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }

// // ─── Main report page ─────────────────────────────────────────────────────────

// export default function ReportPage() {
//   const { id } = useParams()
//   const router = useRouter()
//   const [data, setData] = useState<ReportData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [analystNotes, setAnalystNotes] = useState('')
//   const [analystDecision, setAnalystDecision] = useState<'Approve' | 'Reject' | 'Override' | ''>('')
//   const [saving, setSaving] = useState(false)
//   const [saved, setSaved] = useState(false)

//   useEffect(() => {
//     if (!id) return
//     fetch(`/api/members/${id}/report`)
//       .then(r => r.json())
//       .then(d => { if (d.error) setError(d.error); else setData(d); setLoading(false) })
//       .catch(() => { setError('Failed to load report'); setLoading(false) })
//   }, [id])

//   const handleSaveDecision = async () => {
//     if (!analystDecision || !data) return
//     setSaving(true)
//     await fetch('/api/decisions', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         loan_id:           data.loans[0]?.loan_id ?? null,
//         member_id:         data.member.member_id,
//         ai_score:          data.score,
//         risk_level:        data.riskLevel,
//         ai_recommendation: data.recommendation,
//         ai_reason:         data.reason,
//         analyst_decision:  analystDecision,
//         analyst_notes:     analystNotes,
//       }),
//     })
//     setSaving(false)
//     setSaved(true)
//   }

//   if (loading) {
//     return (
//       <AppLayout>
//         <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
//           <Skeleton className="h-7 w-48" />
//           <Skeleton className="h-28 rounded-xl" />
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//             <Skeleton className="h-64 rounded-xl" />
//             <Skeleton className="h-64 rounded-xl lg:col-span-2" />
//           </div>
//         </div>
//       </AppLayout>
//     )
//   }

//   if (error || !data) {
//     return (
//       <AppLayout>
//         <div className="p-8 text-center">
//           <p className="text-red-400 mb-4">{error || 'Member not found'}</p>
//           <Button variant="ghost" onClick={() => router.push('/members')}>
//             <ArrowLeft size={14} /> Back to Members
//           </Button>
//         </div>
//       </AppLayout>
//     )
//   }

//   const { member, score, riskLevel, loans, guaranteedLoans, missedInstallments,
//           recommendation, reason, breakdown, repaymentChartData, roles } = data
//   const safeRoles = roles ?? { isBorrower: loans.length > 0, isGuarantor: guaranteedLoans.length > 0, isBoth: false }

//   const scoreColor = getScoreColor(score)

//   const recBg =
//     recommendation === 'Approve'      ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
//     recommendation === 'Reject'       ? 'bg-red-400/10 border-red-400/20 text-red-400' :
//                                         'bg-amber-400/10 border-amber-400/20 text-amber-400'

//   // Match guarantor display rows with their score breakdown
//   const guarantorBreakdowns = breakdown.guarantorBreakdowns ?? []
//   const getGBreakdown = (loanId: number) =>
//     guarantorBreakdowns.find(b => b.loanId === loanId)

//   // Guarantor net impact summary
//   const gNet = breakdown.guarantorNetImpact
//   const hasGuarantorImpact = guaranteedLoans.length > 0

//   return (
//     <AppLayout>
//       <div className="p-5 lg:p-8 max-w-5xl mx-auto">

//         {/* Back button */}
//         <div className="flex items-center gap-3 mb-6">
//           <button
//             onClick={() => router.push('/members')}
//             className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
//           >
//             <ArrowLeft size={14} />
//           </button>
//           <div>
//             <h1 className="font-display text-xl font-bold text-white">Credit Report</h1>
//             <p className="text-xs text-slate-500">Generated {new Date().toLocaleDateString()}</p>
//           </div>
//         </div>

//         {/* Member header */}
//         <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
//           <Card className="mb-4">
//             <div className="flex items-start justify-between flex-wrap gap-4">
//               <div className="flex items-center gap-4">
//                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/15 to-blue-700/15 border border-sky-400/20 flex items-center justify-center shrink-0">
//                   <span className="font-display font-bold text-2xl text-sky-300">
//                     {member.member_name.charAt(0).toUpperCase()}
//                   </span>
//                 </div>
//                 <div>
//                   <h2 className="font-display font-bold text-white text-xl">{member.member_name}</h2>
//                   <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
//                     <span className="font-mono">ID #{member.member_id}</span>
//                     {member.mobile && <span className="flex items-center gap-1"><Phone size={10}/>{member.mobile}</span>}
//                     {member.mohalla && <span className="flex items-center gap-1"><MapPin size={10}/>{member.mohalla}</span>}
//                   </div>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2 flex-wrap">
//                 <RiskBadge risk={riskLevel} />
//                 {safeRoles.isBoth && (
//                   <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-400/10 border border-purple-400/20 text-purple-300">
//                     <Users size={10} />
//                     Borrower + Guarantor
//                   </span>
//                 )}
//                 {!safeRoles.isBorrower && safeRoles.isGuarantor && (
//                   <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-400/10 border border-amber-400/20 text-amber-300">
//                     <Users size={10} />
//                     Guarantor Only
//                   </span>
//                 )}
//               </div>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Score + breakdown row */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
//           {/* Gauge */}
//           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
//             <Card className="flex flex-col items-center py-6 h-full justify-center">
//               <h3 className="font-display font-semibold text-white text-sm mb-4">Credit Score</h3>
//               <ScoreGauge score={score} />
//               <div className={cn('mt-4 px-4 py-2 rounded-xl border text-center text-xs font-semibold flex items-center gap-1.5', recBg)}>
//                 {recommendation === 'Approve'     && <CheckCircle2 size={12} />}
//                 {recommendation === 'Reject'      && <XCircle size={12} />}
//                 {recommendation === 'Needs Review'&& <Clock size={12} />}
//                 AI: {recommendation}
//               </div>
//               <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed px-3">{reason}</p>
//             </Card>
//           </motion.div>

//           {/* Score breakdown table */}
//           <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
//             <Card className="h-full">
//               <h3 className="font-display font-semibold text-white text-sm mb-4">Score Breakdown</h3>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                 <ScoreBreakdownChart breakdown={breakdown} />
//                 <div className="space-y-1.5 text-xs py-1">
//                   {/* Own behaviour */}
//                   <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-2">Own Loans</div>
//                   {[
//                     { label: 'Base Score',       val: `${breakdown.base}`,            col: 'text-slate-400' },
//                     { label: '+ On-Time',        val: `+${breakdown.onTimeBonus}`,    col: 'text-emerald-400' },
//                     { label: '+ Loan Closed',    val: `+${breakdown.closedBonus}`,    col: 'text-emerald-400' },
//                     { label: '− Late',           val: `${breakdown.lateDeduction}`,   col: 'text-amber-400' },
//                     { label: '− Missed',         val: `${breakdown.missedDeduction}`, col: 'text-red-400' },
//                     { label: '− Gold Sold',      val: `${breakdown.goldSoldDeduction}`,col:'text-red-400' },
//                   ].map(r => (
//                     <div key={r.label} className="flex justify-between border-b border-white/[0.04] pb-1">
//                       <span className="text-slate-500">{r.label}</span>
//                       <span className={`font-mono font-medium ${r.col}`}>{r.val}</span>
//                     </div>
//                   ))}

//                   {/* Guarantor section */}
//                   {hasGuarantorImpact && (
//                     <>
//                       <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-1 mt-3">
//                         As Guarantor ({guaranteedLoans.length} loans)
//                       </div>
//                       {[
//                         { label: '+ Borrower On-Time',  val: `+${breakdown.guarantorOnTimeBonus}`,       col: 'text-emerald-400' },
//                         { label: '+ Borrower Closed',   val: `+${breakdown.guarantorClosedBonus}`,       col: 'text-emerald-400' },
//                         { label: '− Borrower Late',     val: `${breakdown.guarantorLateDeduction}`,      col: 'text-amber-400' },
//                         { label: '− Borrower Missed',   val: `${breakdown.guarantorMissedDeduction}`,    col: 'text-red-400' },
//                         { label: '− Borrower Gold Sold',val: `${breakdown.guarantorGoldSoldDeduction}`,  col: 'text-red-400' },
//                       ].filter(r => r.val !== '+0' && r.val !== '0').map(r => (
//                         <div key={r.label} className="flex justify-between border-b border-white/[0.04] pb-1">
//                           <span className="text-slate-500">{r.label}</span>
//                           <span className={`font-mono font-medium ${r.col}`}>{r.val}</span>
//                         </div>
//                       ))}
//                       <div className="flex justify-between pb-1">
//                         <span className="text-slate-400 font-medium">Guarantor Net</span>
//                         <span className={cn('font-mono font-semibold', gNet >= 0 ? 'text-emerald-400' : 'text-red-400')}>
//                           {gNet >= 0 ? '+' : ''}{gNet}
//                         </span>
//                       </div>
//                     </>
//                   )}

//                   {/* Final */}
//                   <div className="flex justify-between pt-2 border-t border-white/[0.06]">
//                     <span className="font-semibold text-slate-200">Final Score</span>
//                     <span className="font-mono font-bold text-lg" style={{ color: scoreColor }}>{breakdown.final}</span>
//                   </div>
//                 </div>
//               </div>
//             </Card>
//           </motion.div>
//         </div>

//         {/* Repayment chart */}
//         {repaymentChartData.length > 0 && (
//           <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//             <Card className="mb-4">
//               <h3 className="font-display font-semibold text-white text-sm mb-4">Own Repayment History</h3>
//               <RepaymentChart data={repaymentChartData} />
//             </Card>
//           </motion.div>
//         )}

//         {/* Missed installments alert */}
//         {missedInstallments.length > 0 && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
//             <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 mb-4 flex items-start gap-3">
//               <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
//               <div>
//                 <p className="text-sm font-semibold text-red-400">
//                   {missedInstallments.length} Missed Installment{missedInstallments.length !== 1 ? 's' : ''} Detected
//                 </p>
//                 <div className="flex gap-2 flex-wrap mt-1.5">
//                   {missedInstallments.slice(0, 6).map((m: any, i: number) => (
//                     <span key={i} className="text-xs font-mono text-red-400/70 bg-red-500/10 px-2 py-0.5 rounded">
//                       {formatDate(m.installment_due_date)}
//                     </span>
//                   ))}
//                   {missedInstallments.length > 6 && (
//                     <span className="text-xs text-red-400/50">+{missedInstallments.length - 6} more</span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Own loan history */}
//         <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
//           <Card className="mb-4">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
//                 <FileText size={14} className="text-sky-400" />
//                 Own Loan History ({loans.length})
//               </h3>
//             </div>
//             {loans.length === 0
//               ? <p className="text-sm text-slate-500 text-center py-6">No loans on record</p>
//               : <div className="space-y-2">{loans.map(l => <LoanRow key={l.loan_id} loan={l} />)}</div>
//             }
//           </Card>
//         </motion.div>

//         {/* Guarantor exposure — full detailed impact */}
//         {guaranteedLoans.length > 0 && (
//           <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
//             <Card className="mb-4">
//               <div className="flex items-start justify-between mb-1">
//                 <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
//                   <Users size={14} className="text-amber-400" />
//                   Guarantor Exposure
//                   <span className="font-mono text-xs text-slate-500 font-normal">
//                     ({guaranteedLoans.length} loan{guaranteedLoans.length !== 1 ? 's' : ''} guaranteed)
//                   </span>
//                 </h3>
//                 {/* Net badge */}
//                 <div className={cn(
//                   'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono border',
//                   gNet > 0  ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
//                   gNet < 0  ? 'bg-red-400/10 border-red-400/20 text-red-400' :
//                                'bg-slate-700/30 border-slate-600/20 text-slate-400'
//                 )}>
//                   {gNet >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
//                   Net {gNet >= 0 ? '+' : ''}{gNet} pts
//                 </div>
//               </div>

//               {/* Explanatory note */}
//               <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3.5 py-3 mb-4 mt-3">
//                 <Info size={13} className="text-amber-400/70 shrink-0 mt-px" />
//                 <p className="text-xs text-amber-400/70 leading-relaxed">
//                   As a guarantor, every repayment event on the borrower's loan affects your credit score at{' '}
//                   <strong className="text-amber-400">50% of the borrower's impact</strong>, using the same
//                   scoring weights. On-time payments help you; missed payments and gold sold events penalise you.
//                 </p>
//               </div>

//               <div className="space-y-2">
//                 {guaranteedLoans.map((gl, i) => (
//                   <GuarantorLoanCard
//                     key={gl.loan.loan_id}
//                     gl={gl}
//                     breakdown={getGBreakdown(gl.loan.loan_id)}
//                   />
//                 ))}
//               </div>
//             </Card>
//           </motion.div>
//         )}

//         {/* Analyst decision */}
//         <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
//           <Card>
//             <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2 mb-4">
//               <Shield size={14} className="text-sky-400" />
//               Analyst Decision
//             </h3>
//             {saved ? (
//               <div className="flex items-center gap-2 text-emerald-400 text-sm">
//                 <CheckCircle2 size={16} />
//                 Decision recorded successfully.
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 <div className="flex gap-2 flex-wrap">
//                   {(['Approve', 'Reject', 'Override'] as const).map(d => (
//                     <button
//                       key={d}
//                       onClick={() => setAnalystDecision(d)}
//                       className={cn(
//                         'px-4 py-2 rounded-lg text-xs font-semibold border transition-all',
//                         analystDecision === d
//                           ? d === 'Approve' ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
//                             : d === 'Reject' ? 'bg-red-500/20 border-red-400/40 text-red-400'
//                             : 'bg-amber-500/20 border-amber-400/40 text-amber-400'
//                           : 'border-[var(--border)] text-slate-500 hover:border-slate-500 hover:text-slate-300'
//                       )}
//                     >
//                       {d}
//                     </button>
//                   ))}
//                 </div>
//                 <textarea
//                   value={analystNotes}
//                   onChange={e => setAnalystNotes(e.target.value)}
//                   placeholder="Analyst notes (optional)…"
//                   rows={3}
//                   className="w-full qhcs-input rounded-lg px-3.5 py-2.5 text-sm resize-none"
//                 />
//                 <Button onClick={handleSaveDecision} loading={saving} disabled={!analystDecision}>
//                   Save Decision
//                 </Button>
//               </div>
//             )}
//           </Card>
//         </motion.div>

//       </div>
//     </AppLayout>
//   )
// }


'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, MapPin, AlertTriangle,
  CheckCircle2, XCircle, Clock, TrendingUp,
  Shield, Users, FileText, ChevronDown, ChevronUp,
  TrendingDown, Minus, Info, Wallet
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, RiskBadge, StatusBadge, Button, Skeleton } from '@/components/ui'
import ScoreGauge from '@/components/charts/ScoreGauge'
import RepaymentChart from '@/components/charts/RepaymentChart'
import ScoreBreakdownChart from '@/components/charts/ScoreBreakdownChart'
import { formatCurrency, formatDate, getScoreColor, cn } from '@/lib/utils'
import type {
  LoanWithRepayments,
  ScoreBreakdown,
  GuaranteedLoanDisplay,
  GuarantorLoanBreakdown
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportData {
  member: any
  score: number
  riskLevel: 'Low' | 'Medium' | 'High'
  loans: LoanWithRepayments[]
  guaranteedLoans: GuaranteedLoanDisplay[]
  missedInstallments: any[]
  recommendation: string
  reason: string
  breakdown: ScoreBreakdown
  repaymentChartData: any[]
  roles: { isBorrower: boolean; isGuarantor: boolean; isBoth: boolean }
  ownTotalPending: number
  guarantorTotalPending: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoanRow({ loan }: { loan: LoanWithRepayments }) {
  const [expanded, setExpanded] = useState(false)
  const coverage = loan.gold_value && loan.amount
    ? (Number(loan.gold_value) / Number(loan.amount)).toFixed(2)
    : null

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span className="font-mono text-xs text-slate-500 shrink-0">#{loan.loan_id}</span>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{loan.purpose || 'General Loan'}</div>
            <div className="text-xs text-slate-500 mt-px">{formatDate(loan.start_date)}</div>
          </div>
          <StatusBadge status={loan.status} />
          {loan.gold_status === 'Sold' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
              Gold Sold
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0 ml-2">
          <div className="text-right hidden md:block">
            <div className="font-mono text-sm text-white">{formatCurrency(loan.amount)}</div>
            <div className="text-xs text-slate-500">principal</div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400">{loan.paidCount}✓</span>
            <span className="text-red-400">{loan.missedCount}✗</span>
            {loan.totalPending > 0 && (
              <span className="text-amber-400">{formatCurrency(loan.totalPending)}~</span>
            )}
            <span className="text-slate-500">/{loan.installments}</span>
          </div>
          {expanded
            ? <ChevronUp size={13} className="text-slate-500" />
            : <ChevronDown size={13} className="text-slate-500" />}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                <div>
                  <div className="text-slate-500 mb-1">Installment</div>
                  <div className="font-mono text-white">{loan.installments} × {formatCurrency(loan.installment_amount)}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Total Paid</div>
                  <div className="font-mono text-emerald-400">{formatCurrency(loan.totalPaid)}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Gold Value</div>
                  <div className="font-mono text-amber-400">
                    {loan.gold_value ? formatCurrency(Number(loan.gold_value)) : '—'}
                    {coverage && <span className="text-slate-500 ml-1">(×{coverage})</span>}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">Repayment Start</div>
                  <div className="font-mono text-white">{formatDate(loan.repayment_start_date)}</div>
                </div>
              </div>
              {loan.repayments.length > 0 && (
                <>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Repayments</div>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {loan.repayments.map((r, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-white/[0.03]">
                        <span className="text-slate-400 font-mono">{formatDate(r.paid_date)}</span>
                        <span className="text-emerald-400 font-mono">{formatCurrency(Number(r.paid_amount))}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Delta pill: shows +N or −N with colour
function DeltaPill({ value, invert = false }: { value: number; invert?: boolean }) {
  const isPositive = value > 0
  const isZero = value === 0
  if (isZero) return <span className="font-mono text-xs text-slate-600">0</span>
  return (
    <span className={cn(
      'font-mono text-xs font-semibold',
      isPositive ? 'text-emerald-400' : 'text-red-400'
    )}>
      {isPositive ? '+' : ''}{value}
    </span>
  )
}

// PendingCard: displays outstanding loan amounts
function PendingCard({
  ownTotalPending,
  guarantorTotalPending,
  hasOwnLoans,
  hasGuaranteedLoans
}: {
  ownTotalPending: number
  guarantorTotalPending: number
  hasOwnLoans: boolean
  hasGuaranteedLoans: boolean
}) {
  const totalPending = ownTotalPending + guarantorTotalPending
  const hasPending = totalPending > 0

  if (!hasPending) {
    return (
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <Wallet size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white text-sm">Pending Amounts</h3>
            <p className="text-xs text-emerald-400">No outstanding amounts — all caught up!</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
          <Wallet size={18} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-white text-sm">Pending Amounts</h3>
          <p className="text-xs text-slate-500">Outstanding loan balances</p>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-xl text-white">{formatCurrency(totalPending)}</div>
          <div className="text-[10px] text-slate-500">total exposure</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasOwnLoans && ownTotalPending > 0 && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Own Loans</span>
              <span className="font-mono font-bold text-amber-400">{formatCurrency(ownTotalPending)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${Math.min((ownTotalPending / totalPending) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {hasGuaranteedLoans && guarantorTotalPending > 0 && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">As Guarantor</span>
              <span className="font-mono font-bold text-amber-400">{formatCurrency(guarantorTotalPending)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${Math.min((guarantorTotalPending / totalPending) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {ownTotalPending > 0 && guarantorTotalPending > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
          <Info size={12} className="text-amber-400/70 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/70">
            Combined exposure from own loans and guaranteed loans.
            As a guarantor, you may be called upon if the borrower defaults.
          </p>
        </div>
      )}
    </Card>
  )
}

// Guarantor loan card — shows per-loan breakdown of how that borrower's behaviour affected THIS member's score
function GuarantorLoanCard({ gl, breakdown }: {
  gl: GuaranteedLoanDisplay
  breakdown?: GuarantorLoanBreakdown
}) {
  const [expanded, setExpanded] = useState(false)
  const borrowerScoreColor = getScoreColor(gl.borrowerScore, 500) // base passed as prop in future; 500 default
  const netImpact = breakdown?.netImpact ?? 0
  const netPositive = netImpact > 0
  const netZero = netImpact === 0

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Borrower avatar */}
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-xs text-amber-400">
              {(gl.borrower?.member_name ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {gl.borrower?.member_name ?? `Member #${gl.loan.member_id}`}
            </div>
            <div className="flex items-center gap-2 mt-px flex-wrap">
              <span className="text-xs text-slate-500 font-mono">Loan #{gl.loan.loan_id}</span>
              <span className="text-xs text-slate-500">{formatCurrency(Number(gl.loan.amount))}</span>
              <StatusBadge status={gl.loan.status} />
              {gl.guaranteedPending > 0 && (
                <span className="text-xs text-amber-400 font-mono">
                  {formatCurrency(gl.guaranteedPending)} pending
                </span>
              )}
              {gl.goldSold && (
                <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-px rounded-full">
                  Gold Sold
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-2">
          {/* Borrower score */}
          <div className="text-right hidden sm:block">
            <div className="font-mono font-bold text-base" style={{ color: borrowerScoreColor }}>
              {gl.borrowerScore}
            </div>
            <div className="text-[10px] text-slate-500">borrower</div>
          </div>

          {/* Net impact on MY score */}
          <div className="text-right">
            <div className={cn(
              'font-mono font-bold text-base',
              netZero ? 'text-slate-500' : netPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {netImpact > 0 ? '+' : ''}{netImpact}
            </div>
            <div className="text-[10px] text-slate-500">my score</div>
          </div>

          {expanded
            ? <ChevronUp size={13} className="text-slate-500" />
            : <ChevronDown size={13} className="text-slate-500" />}
        </div>
      </div>

      {/* Expanded: per-event breakdown */}
      <AnimatePresence>
        {expanded && breakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] p-4 bg-white/[0.01]">
              {/* Borrower behaviour summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'On-Time', value: gl.borrowerOnTime, color: 'text-emerald-400' },
                  { label: 'Late',    value: gl.borrowerLate,   color: 'text-amber-400' },
                  { label: 'Missed',  value: gl.borrowerMissed, color: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className={`font-mono font-bold text-lg ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Score delta table */}
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest mb-2">
                Impact on your score (50% of borrower's events)
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'On-Time Payments',  val: breakdown.onTimeBonus,       sign: '+' },
                  { label: 'Late Payments',      val: breakdown.lateDeduction,     sign: '−' },
                  { label: 'Missed Installments',val: breakdown.missedDeduction,   sign: '−' },
                  { label: 'Loan Closed',        val: breakdown.closedBonus,       sign: '+' },
                  { label: 'Gold Sold',          val: breakdown.goldSoldDeduction, sign: '−' },
                ].map(row => {
                  if (row.val === 0) return null
                  return (
                    <div key={row.label} className="flex justify-between text-xs py-1 border-b border-white/[0.04]">
                      <span className="text-slate-400">{row.label}</span>
                      <DeltaPill value={row.val} />
                    </div>
                  )
                })}
                <div className="flex justify-between text-xs pt-2">
                  <span className="font-semibold text-slate-300">Net Impact</span>
                  <DeltaPill value={breakdown.netImpact} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main report page ─────────────────────────────────────────────────────────

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
      .then(d => { if (d.error) setError(d.error); else setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load report'); setLoading(false) })
  }, [id])

  const handleSaveDecision = async () => {
    if (!analystDecision || !data) return
    setSaving(true)
    await fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loan_id:           data.loans[0]?.loan_id ?? null,
        member_id:         data.member.member_id,
        ai_score:          data.score,
        risk_level:        data.riskLevel,
        ai_recommendation: data.recommendation,
        ai_reason:         data.reason,
        analyst_decision:  analystDecision,
        analyst_notes:     analystNotes,
      }),
    })
    setSaving(false)
    setSaved(true)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-red-400 mb-4">{error || 'Member not found'}</p>
          <Button variant="ghost" onClick={() => router.push('/members')}>
            <ArrowLeft size={14} /> Back to Members
          </Button>
        </div>
      </AppLayout>
    )
  }

  const { member, score, riskLevel, loans, guaranteedLoans, missedInstallments,
          recommendation, reason, breakdown, repaymentChartData, roles } = data
  const safeRoles = roles ?? { isBorrower: loans.length > 0, isGuarantor: guaranteedLoans.length > 0, isBoth: false }

  const scoreColor = getScoreColor(score, breakdown?.base ?? 500)

  const recBg =
    recommendation === 'Approve'      ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
    recommendation === 'Reject'       ? 'bg-red-400/10 border-red-400/20 text-red-400' :
                                        'bg-amber-400/10 border-amber-400/20 text-amber-400'

  // Match guarantor display rows with their score breakdown
  const guarantorBreakdowns = breakdown.guarantorBreakdowns ?? []
  const getGBreakdown = (loanId: number) =>
    guarantorBreakdowns.find(b => b.loanId === loanId)

  // Guarantor net impact summary
  const gNet = breakdown.guarantorNetImpact
  const hasGuarantorImpact = guaranteedLoans.length > 0

  return (
    <AppLayout>
      <div className="p-5 lg:p-8 max-w-5xl mx-auto">

        {/* Back button */}
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

        {/* Member header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/15 to-blue-700/15 border border-sky-400/20 flex items-center justify-center shrink-0">
                  <span className="font-display font-bold text-2xl text-sky-300">
                    {member.member_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-display font-bold text-white text-xl">{member.member_name}</h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
                    <span className="font-mono">ID #{member.member_id}</span>
                    {member.mobile && <span className="flex items-center gap-1"><Phone size={10}/>{member.mobile}</span>}
                    {member.mohalla && <span className="flex items-center gap-1"><MapPin size={10}/>{member.mohalla}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <RiskBadge risk={riskLevel} />
                {safeRoles.isBoth && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-400/10 border border-purple-400/20 text-purple-300">
                    <Users size={10} />
                    Borrower + Guarantor
                  </span>
                )}
                {!safeRoles.isBorrower && safeRoles.isGuarantor && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-400/10 border border-amber-400/20 text-amber-300">
                    <Users size={10} />
                    Guarantor Only
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Score + breakdown row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Gauge */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="flex flex-col items-center py-6 h-full justify-center">
              <h3 className="font-display font-semibold text-white text-sm mb-4">Credit Score</h3>
              <ScoreGauge score={score} base={breakdown.base} />
              <div className={cn('mt-4 px-4 py-2 rounded-xl border text-center text-xs font-semibold flex items-center gap-1.5', recBg)}>
                {recommendation === 'Approve'     && <CheckCircle2 size={12} />}
                {recommendation === 'Reject'      && <XCircle size={12} />}
                {recommendation === 'Needs Review'&& <Clock size={12} />}
                AI: {recommendation}
              </div>
              <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed px-3">{reason}</p>
            </Card>
          </motion.div>

          {/* Score breakdown table */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
            <Card className="h-full">
              <h3 className="font-display font-semibold text-white text-sm mb-4">Score Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ScoreBreakdownChart breakdown={breakdown} />
                <div className="space-y-1.5 text-xs py-1">
                  {/* Own behaviour */}
                  <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-2">Own Loans</div>
                  {[
                    { label: 'Base Score',       val: `${breakdown.base}`,            col: 'text-slate-400' },
                    { label: '+ On-Time',        val: `+${breakdown.onTimeBonus}`,    col: 'text-emerald-400' },
                    { label: '+ Loan Closed',    val: `+${breakdown.closedBonus}`,    col: 'text-emerald-400' },
                    { label: '− Late',           val: `${breakdown.lateDeduction}`,   col: 'text-amber-400' },
                    { label: '− Missed',         val: `${breakdown.missedDeduction}`, col: 'text-red-400' },
                    { label: '− Gold Sold',      val: `${breakdown.goldSoldDeduction}`,col:'text-red-400' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between border-b border-white/[0.04] pb-1">
                      <span className="text-slate-500">{r.label}</span>
                      <span className={`font-mono font-medium ${r.col}`}>{r.val}</span>
                    </div>
                  ))}

                  {/* Guarantor section */}
                  {hasGuarantorImpact && (
                    <>
                      <div className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-1 mt-3">
                        As Guarantor ({guaranteedLoans.length} loans)
                      </div>
                      {[
                        { label: '+ Borrower On-Time',  val: `+${breakdown.guarantorOnTimeBonus}`,       col: 'text-emerald-400' },
                        { label: '+ Borrower Closed',   val: `+${breakdown.guarantorClosedBonus}`,       col: 'text-emerald-400' },
                        { label: '− Borrower Late',     val: `${breakdown.guarantorLateDeduction}`,      col: 'text-amber-400' },
                        { label: '− Borrower Missed',   val: `${breakdown.guarantorMissedDeduction}`,    col: 'text-red-400' },
                        { label: '− Borrower Gold Sold',val: `${breakdown.guarantorGoldSoldDeduction}`,  col: 'text-red-400' },
                      ].filter(r => r.val !== '+0' && r.val !== '0').map(r => (
                        <div key={r.label} className="flex justify-between border-b border-white/[0.04] pb-1">
                          <span className="text-slate-500">{r.label}</span>
                          <span className={`font-mono font-medium ${r.col}`}>{r.val}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-400 font-medium">Guarantor Net</span>
                        <span className={cn('font-mono font-semibold', gNet >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {gNet >= 0 ? '+' : ''}{gNet}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Final */}
                  <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                    <span className="font-semibold text-slate-200">Final Score</span>
                    <span className="font-mono font-bold text-lg" style={{ color: scoreColor }}>{breakdown.final}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Pending amounts card */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <PendingCard
            ownTotalPending={data.ownTotalPending ?? 0}
            guarantorTotalPending={data.guarantorTotalPending ?? 0}
            hasOwnLoans={loans.length > 0}
            hasGuaranteedLoans={guaranteedLoans.length > 0}
          />
        </motion.div>

        {/* Repayment chart */}
        {repaymentChartData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="mb-4">
              <h3 className="font-display font-semibold text-white text-sm mb-4">Own Repayment History</h3>
              <RepaymentChart data={repaymentChartData} />
            </Card>
          </motion.div>
        )}

        {/* Missed installments alert */}
        {missedInstallments.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4 mb-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  {missedInstallments.length} Missed Installment{missedInstallments.length !== 1 ? 's' : ''} Detected
                </p>
                <div className="flex gap-2 flex-wrap mt-1.5">
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

        {/* Own loan history */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                <FileText size={14} className="text-sky-400" />
                Own Loan History ({loans.length})
              </h3>
            </div>
            {loans.length === 0
              ? <p className="text-sm text-slate-500 text-center py-6">No loans on record</p>
              : <div className="space-y-2">{loans.map(l => <LoanRow key={l.loan_id} loan={l} />)}</div>
            }
          </Card>
        </motion.div>

        {/* Guarantor exposure — full detailed impact */}
        {guaranteedLoans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="mb-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                  <Users size={14} className="text-amber-400" />
                  Guarantor Exposure
                  <span className="font-mono text-xs text-slate-500 font-normal">
                    ({guaranteedLoans.length} loan{guaranteedLoans.length !== 1 ? 's' : ''} guaranteed)
                  </span>
                </h3>
                {/* Net badge */}
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono border',
                  gNet > 0  ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
                  gNet < 0  ? 'bg-red-400/10 border-red-400/20 text-red-400' :
                               'bg-slate-700/30 border-slate-600/20 text-slate-400'
                )}>
                  {gNet >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  Net {gNet >= 0 ? '+' : ''}{gNet} pts
                </div>
              </div>

              {/* Explanatory note */}
              <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3.5 py-3 mb-4 mt-3">
                <Info size={13} className="text-amber-400/70 shrink-0 mt-px" />
                <p className="text-xs text-amber-400/70 leading-relaxed">
                  As a guarantor, every repayment event on the borrower's loan affects your credit score at{' '}
                  <strong className="text-amber-400">50% of the borrower's impact</strong>, using the same
                  scoring weights. On-time payments help you; missed payments and gold sold events penalise you.
                </p>
              </div>

              <div className="space-y-2">
                {guaranteedLoans.map((gl, i) => (
                  <GuarantorLoanCard
                    key={gl.loan.loan_id}
                    gl={gl}
                    breakdown={getGBreakdown(gl.loan.loan_id)}
                  />
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Analyst decision */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2 mb-4">
              <Shield size={14} className="text-sky-400" />
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
                          ? d === 'Approve' ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
                            : d === 'Reject' ? 'bg-red-500/20 border-red-400/40 text-red-400'
                            : 'bg-amber-500/20 border-amber-400/40 text-amber-400'
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
                <Button onClick={handleSaveDecision} loading={saving} disabled={!analystDecision}>
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