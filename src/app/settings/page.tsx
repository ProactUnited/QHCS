// // // 'use client'
// // // import { useEffect, useState } from 'react'
// // // import { motion } from 'framer-motion'
// // // import { Save, Info, Settings2 } from 'lucide-react'
// // // import AppLayout from '@/components/layout/AppLayout'
// // // import { Card, PageHeader, Button, Input } from '@/components/ui'
// // // import type { CreditScoreConfig } from '@/types'

// // // const RULE_LABELS: Record<string, { label: string; desc: string; sign: '+' | '-' }> = {
// // //   on_time_payment:       { label: 'On-Time Payment',         desc: 'Points added per on-time installment',    sign: '+' },
// // //   late_payment:          { label: 'Late Payment',            desc: 'Points deducted per late installment',    sign: '-' },
// // //   missed_payment:        { label: 'Missed Payment',          desc: 'Points deducted per missed installment',  sign: '-' },
// // //   loan_closed_successfully: { label: 'Loan Closed',         desc: 'Points added when loan is fully repaid',  sign: '+' },
// // //   gold_sold:             { label: 'Gold Sold',               desc: 'Points deducted when gold is sold',       sign: '-' },
// // //   guarantor_default:     { label: 'Guarantor Default',       desc: 'Points deducted if guaranteed borrower defaults', sign: '-' },
// // // }

// // // export default function SettingsPage() {
// // //   const [config, setConfig] = useState<CreditScoreConfig[]>([])
// // //   const [loading, setLoading] = useState(true)
// // //   const [saving, setSaving] = useState(false)
// // //   const [saved, setSaved] = useState(false)

// // //   useEffect(() => {
// // //     fetch('/api/score/config')
// // //       .then(r => r.json())
// // //       .then(d => { setConfig(d); setLoading(false) })
// // //   }, [])

// // //   const updateWeight = (rule: string, val: string) => {
// // //     setConfig(prev => prev.map(c =>
// // //       c.rule_name === rule ? { ...c, weight: parseInt(val) || 0 } : c
// // //     ))
// // //     setSaved(false)
// // //   }

// // //   const handleSave = async () => {
// // //     setSaving(true)
// // //     await fetch('/api/score/config', {
// // //       method: 'PUT',
// // //       headers: { 'Content-Type': 'application/json' },
// // //       body: JSON.stringify(config),
// // //     })
// // //     setSaving(false)
// // //     setSaved(true)
// // //     setTimeout(() => setSaved(false), 3000)
// // //   }

// // //   return (
// // //     <AppLayout>
// // //       <div className="p-6 lg:p-8 max-w-3xl mx-auto">
// // //         <PageHeader
// // //           title="Settings"
// // //           subtitle="Configure credit scoring weights"
// // //           action={
// // //             <Button onClick={handleSave} loading={saving}>
// // //               <Save size={14} />
// // //               {saved ? 'Saved!' : 'Save Changes'}
// // //             </Button>
// // //           }
// // //         />

// // //         <Card className="mb-4">
// // //           <div className="flex items-start gap-3 p-1">
// // //             <Info size={16} className="text-sky-400 mt-0.5 shrink-0" />
// // //             <div className="text-sm text-slate-400">
// // //               <p>These weights control how the credit score is calculated. The base score is <strong className="text-white">50</strong>.</p>
// // //               <p className="mt-1">Positive values increase the score; set negative rules as positive numbers (the system applies the deduction automatically).</p>
// // //             </div>
// // //           </div>
// // //         </Card>

// // //         <Card>
// // //           <div className="flex items-center gap-2 mb-5">
// // //             <Settings2 size={16} className="text-sky-400" />
// // //             <h3 className="font-display font-semibold text-white text-sm">Scoring Rules</h3>
// // //           </div>

// // //           {loading ? (
// // //             <div className="space-y-4">
// // //               {[...Array(6)].map((_, i) => (
// // //                 <div key={i} className="flex justify-between items-center border-b border-[var(--border)] pb-4">
// // //                   <div className="h-4 bg-[var(--bg-surface)] rounded w-40 skeleton" />
// // //                   <div className="h-8 bg-[var(--bg-surface)] rounded w-20 skeleton" />
// // //                 </div>
// // //               ))}
// // //             </div>
// // //           ) : (
// // //             <div className="space-y-4">
// // //               {config.map((rule, i) => {
// // //                 const info = RULE_LABELS[rule.rule_name]
// // //                 if (!info) return null
// // //                 return (
// // //                   <motion.div
// // //                     key={rule.rule_name}
// // //                     initial={{ opacity: 0, x: -8 }}
// // //                     animate={{ opacity: 1, x: 0 }}
// // //                     transition={{ delay: i * 0.05 }}
// // //                     className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0"
// // //                   >
// // //                     <div className="flex-1">
// // //                       <div className="flex items-center gap-2">
// // //                         <span className={`text-sm font-medium ${info.sign === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
// // //                           {info.sign}
// // //                         </span>
// // //                         <span className="text-sm text-slate-200">{info.label}</span>
// // //                       </div>
// // //                       <p className="text-xs text-slate-500 mt-0.5">{info.desc}</p>
// // //                     </div>
// // //                     <div className="flex items-center gap-2 shrink-0">
// // //                       <Input
// // //                         type="number"
// // //                         value={Math.abs(rule.weight)}
// // //                         onChange={e => updateWeight(rule.rule_name, e.target.value)}
// // //                         className="w-20 text-center font-mono"
// // //                         min={0}
// // //                         max={50}
// // //                       />
// // //                       <span className="text-xs text-slate-500 w-8">pts</span>
// // //                     </div>
// // //                   </motion.div>
// // //                 )
// // //               })}
// // //             </div>
// // //           )}
// // //         </Card>

// // //         {/* Score range reference */}
// // //         <Card className="mt-4">
// // //           <h3 className="font-display font-semibold text-white text-sm mb-4">Risk Level Reference</h3>
// // //           <div className="grid grid-cols-3 gap-3 text-center text-xs">
// // //             <div className="p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
// // //               <div className="font-mono font-bold text-emerald-400 text-lg">70–100</div>
// // //               <div className="text-emerald-400/70 mt-1">Low Risk</div>
// // //             </div>
// // //             <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
// // //               <div className="font-mono font-bold text-amber-400 text-lg">40–69</div>
// // //               <div className="text-amber-400/70 mt-1">Medium Risk</div>
// // //             </div>
// // //             <div className="p-3 rounded-xl bg-red-400/5 border border-red-400/20">
// // //               <div className="font-mono font-bold text-red-400 text-lg">0–39</div>
// // //               <div className="text-red-400/70 mt-1">High Risk</div>
// // //             </div>
// // //           </div>
// // //         </Card>
// // //       </div>
// // //     </AppLayout>
// // //   )
// // // }


// // 'use client'
// // import { useEffect, useState } from 'react'
// // import { motion } from 'framer-motion'
// // import { Save, Info, Settings2, Users } from 'lucide-react'
// // import AppLayout from '@/components/layout/AppLayout'
// // import { Card, PageHeader, Button, Input } from '@/components/ui'
// // import type { CreditScoreConfig } from '@/types'

// // // Rules that actually exist in the scoring engine
// // const RULE_META: Record<string, { label: string; desc: string; sign: '+' | '-' | '=' }> = {
// //   base_score: {
// //     label: 'Base Score',
// //     desc: 'Starting score for every member before any loan behaviour is applied.',
// //     sign: '=',
// //   },
// //   on_time_payment: {
// //     label: 'On-Time Payment',
// //     desc: 'Points added per on-time installment (paid by 10th of month). Also applies at 50% to each guarantor.',
// //     sign: '+',
// //   },
// //   late_payment: {
// //     label: 'Late Payment',
// //     desc: 'Points deducted per late installment (paid after 10th). Also deducted at 50% from each guarantor.',
// //     sign: '-',
// //   },
// //   missed_payment: {
// //     label: 'Missed Payment',
// //     desc: 'Points deducted per missed installment. Also deducted at 50% from each guarantor.',
// //     sign: '-',
// //   },
// //   loan_closed_successfully: {
// //     label: 'Loan Closed Successfully',
// //     desc: 'Points added when a loan is fully repaid. Also applied at 50% to each guarantor.',
// //     sign: '+',
// //   },
// //   gold_sold: {
// //     label: 'Gold Sold',
// //     desc: 'Points deducted when collateral gold is sold. Also deducted at 50% from each guarantor.',
// //     sign: '-',
// //   },
// // }

// // // Display order
// // const RULE_ORDER = [
// //   'base_score',
// //   'on_time_payment',
// //   'late_payment',
// //   'missed_payment',
// //   'loan_closed_successfully',
// //   'gold_sold',
// // ]

// // export default function SettingsPage() {
// //   const [config, setConfig] = useState<CreditScoreConfig[]>([])
// //   const [loading, setLoading] = useState(true)
// //   const [saving, setSaving] = useState(false)
// //   const [saved, setSaved] = useState(false)

// //   useEffect(() => {
// //     fetch('/api/score/config')
// //       .then(r => r.json())
// //       .then((d: CreditScoreConfig[]) => {
// //         // Only keep rules the engine actually uses
// //         const filtered = d.filter(r => RULE_ORDER.includes(r.rule_name))
// //         // Preserve order
// //         filtered.sort((a, b) => RULE_ORDER.indexOf(a.rule_name) - RULE_ORDER.indexOf(b.rule_name))
// //         setConfig(filtered)
// //         setLoading(false)
// //       })
// //   }, [])

// //   const updateWeight = (rule: string, val: string) => {
// //     setConfig(prev =>
// //       prev.map(c => c.rule_name === rule ? { ...c, weight: Math.max(0, parseInt(val) || 0) } : c)
// //     )
// //     setSaved(false)
// //   }

// //   const handleSave = async () => {
// //     setSaving(true)
// //     await fetch('/api/score/config', {
// //       method: 'PUT',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify(config),
// //     })
// //     setSaving(false)
// //     setSaved(true)
// //     setTimeout(() => setSaved(false), 3000)
// //   }

// //   return (
// //     <AppLayout>
// //       <div className="p-6 lg:p-8 max-w-3xl mx-auto">
// //         <PageHeader
// //           title="Settings"
// //           subtitle="Configure credit scoring weights"
// //           action={
// //             <Button onClick={handleSave} loading={saving}>
// //               <Save size={14} />
// //               {saved ? 'Saved!' : 'Save Changes'}
// //             </Button>
// //           }
// //         />

// //         {/* How it works */}
// //         <Card className="mb-4">
// //           <div className="flex items-start gap-3">
// //             <Info size={15} className="text-sky-400 mt-0.5 shrink-0" />
// //             <div className="text-sm text-slate-400 space-y-1 leading-relaxed">
// //               <p>
// //                 Base score is <strong className="text-white">50</strong>. Each rule adjusts the score
// //                 per event, multiplied by a recency factor (≤12 mo: ×1.5, ≤24 mo: ×1.2, older: ×1.0).
// //               </p>
// //               <p>
// //                 Enter weights as positive integers — the system applies the correct sign automatically.
// //               </p>
// //             </div>
// //           </div>
// //         </Card>

// //         {/* Guarantor propagation note */}
// //         <Card className="mb-4">
// //           <div className="flex items-start gap-3">
// //             <Users size={15} className="text-amber-400 mt-0.5 shrink-0" />
// //             <div className="text-sm text-slate-400 leading-relaxed">
// //               <p className="font-medium text-amber-400 mb-1">Guarantor Score Propagation — 50% rule</p>
// //               <p>
// //                 Every borrower event on a guaranteed loan <strong className="text-white">also affects each guarantor</strong> at
// //                 {' '}<strong className="text-white">50% of the borrower's impact</strong>, using the same weights below.
// //                 Good borrower behaviour rewards guarantors; missed payments and gold-sold events penalise them.
// //               </p>
// //               <p className="mt-1.5 text-xs text-slate-500">
// //                 Example: On-Time weight = 5 pts.  Borrower gets +5 pts per payment.  Each guarantor gets +2.5 pts (rounded) per the borrower's on-time payment.
// //               </p>
// //             </div>
// //           </div>
// //         </Card>

// //         {/* Rules */}
// //         <Card>
// //           <div className="flex items-center gap-2 mb-5">
// //             <Settings2 size={15} className="text-sky-400" />
// //             <h3 className="font-display font-semibold text-white text-sm">Scoring Rules</h3>
// //           </div>

// //           {loading ? (
// //             <div className="space-y-5">
// //               {RULE_ORDER.map(r => (
// //                 <div key={r} className="flex justify-between items-center border-b border-[var(--border)] pb-5">
// //                   <div className="h-4 bg-[var(--bg-surface)] rounded w-44 animate-pulse" />
// //                   <div className="h-9 bg-[var(--bg-surface)] rounded w-20 animate-pulse" />
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <div className="space-y-5">
// //               {config.map((rule, i) => {
// //                 const meta = RULE_META[rule.rule_name]
// //                 if (!meta) return null
// //                 return (
// //                   <motion.div
// //                     key={rule.rule_name}
// //                     initial={{ opacity: 0, x: -10 }}
// //                     animate={{ opacity: 1, x: 0 }}
// //                     transition={{ delay: i * 0.06 }}
// //                     className="flex items-center justify-between gap-4 pb-5 border-b border-[var(--border)] last:border-0 last:pb-0"
// //                   >
// //                     <div className="flex-1 min-w-0">
// //                       <div className="flex items-center gap-2">
// //                         <span className={`font-mono font-bold text-base ${meta.sign === '+' ? 'text-emerald-400' : meta.sign === '=' ? 'text-sky-400' : 'text-red-400'}`}>
// //                           {meta.sign}
// //                         </span>
// //                         <span className="text-sm font-medium text-slate-200">{meta.label}</span>
// //                       </div>
// //                       <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{meta.desc}</p>
// //                     </div>
// //                     <div className="flex items-center gap-2 shrink-0">
// //                       <Input
// //                         type="number"
// //                         value={Math.abs(rule.weight)}
// //                         onChange={e => updateWeight(rule.rule_name, e.target.value)}
// //                         className="w-20 text-center font-mono"
// //                         min={0}
// //                         max={rule.rule_name === 'base_score' ? 9999 : 100}
// //                       />
// //                       <span className="text-xs text-slate-500 w-6">pts</span>
// //                     </div>
// //                   </motion.div>
// //                 )
// //               })}
// //             </div>
// //           )}
// //         </Card>

// //         {/* Risk level reference */}
// //         <Card className="mt-4">
// //           <h3 className="font-display font-semibold text-white text-sm mb-1">Risk Level Reference</h3>
// //           <p className="text-xs text-slate-500 mb-4">Thresholds are % of max score (Base × 2). Low ≥ 70%, Medium ≥ 40%, High &lt; 40%.</p>
// //           <div className="grid grid-cols-3 gap-3 text-center text-xs">
// //             {[
// //               { range: '≥ 70%', label: 'Low Risk',    color: 'emerald', example: '700+' },
// //               { range: '40–69%', label: 'Medium Risk', color: 'amber',   example: '400–699' },
// //               { range: '< 40%',  label: 'High Risk',   color: 'red',     example: '0–399' },
// //             ].map(r => (
// //               <div
// //                 key={r.label}
// //                 className={`p-3 rounded-xl bg-${r.color}-400/5 border border-${r.color}-400/20`}
// //               >
// //                 <div className={`font-mono font-bold text-${r.color}-400 text-base`}>{r.range}</div>
// //                 <div className={`font-mono text-xs text-${r.color}-400/50 mt-0.5`}>{r.example} pts</div>
// //                 <div className={`text-${r.color}-400/70 mt-1`}>{r.label}</div>
// //               </div>
// //             ))}
// //           </div>
// //         </Card>
// //       </div>
// //     </AppLayout>
// //   )
// // }
// 'use client'
// import { useEffect, useState } from 'react'
// import { motion } from 'framer-motion'
// import { Save, Info, Settings2, Users } from 'lucide-react'
// import AppLayout from '@/components/layout/AppLayout'
// import { Card, PageHeader, Button, Input } from '@/components/ui'
// import type { CreditScoreConfig } from '@/types'

// // Rules that actually exist in the scoring engine
// const RULE_META: Record<string, { label: string; desc: string; sign: '+' | '-' | '=' }> = {
//   base_score: {
//     label: 'Base Score',
//     desc: 'Starting score for every member before any loan behaviour is applied.',
//     sign: '=',
//   },
//   on_time_payment: {
//     label: 'On-Time Payment',
//     desc: 'Points added per on-time installment (paid by 10th of month). Also applies at 50% to each guarantor.',
//     sign: '+',
//   },
//   late_payment: {
//     label: 'Late Payment',
//     desc: 'Points deducted per late installment (paid after 10th). Also deducted at 50% from each guarantor.',
//     sign: '-',
//   },
//   missed_payment: {
//     label: 'Missed Payment',
//     desc: 'Points deducted per missed installment (per month). Also deducted at 50% from each guarantor.',
//     sign: '-',
//   },
//   missed_payment_cap: {
//     label: 'Missed Payment Cap',
//     desc: 'Maximum total deduction per loan for missed payments, regardless of how many months were missed.',
//     sign: '⌀',
//   },
//   loan_closed_successfully: {
//     label: 'Loan Closed Successfully',
//     desc: 'Points added when a loan is fully repaid. Also applied at 50% to each guarantor.',
//     sign: '+',
//   },
//   gold_sold: {
//     label: 'Gold Sold',
//     desc: 'Points deducted when collateral gold is sold. Also deducted at 50% from each guarantor.',
//     sign: '-',
//   },
// }

// // Display order
// const RULE_ORDER = [
//   'base_score',
//   'on_time_payment',
//   'late_payment',
//   'missed_payment',
//   'missed_payment_cap',
//   'loan_closed_successfully',
//   'gold_sold',
// ]

// export default function SettingsPage() {
//   const [config, setConfig] = useState<CreditScoreConfig[]>([])
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [saved, setSaved] = useState(false)

//   useEffect(() => {
//     fetch('/api/score/config')
//       .then(r => r.json())
//       .then((d: CreditScoreConfig[]) => {
//         // Only keep rules the engine actually uses
//         const filtered = d.filter(r => RULE_ORDER.includes(r.rule_name))
//         // Preserve order
//         filtered.sort((a, b) => RULE_ORDER.indexOf(a.rule_name) - RULE_ORDER.indexOf(b.rule_name))
//         setConfig(filtered)
//         setLoading(false)
//       })
//   }, [])

//   const updateWeight = (rule: string, val: string) => {
//     setConfig(prev =>
//       prev.map(c => c.rule_name === rule ? { ...c, weight: Math.max(0, parseInt(val) || 0) } : c)
//     )
//     setSaved(false)
//   }

//   const handleSave = async () => {
//     setSaving(true)
//     await fetch('/api/score/config', {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(config),
//     })
//     setSaving(false)
//     setSaved(true)
//     setTimeout(() => setSaved(false), 3000)
//   }

//   return (
//     <AppLayout>
//       <div className="p-6 lg:p-8 max-w-3xl mx-auto">
//         <PageHeader
//           title="Settings"
//           subtitle="Configure credit scoring weights"
//           action={
//             <Button onClick={handleSave} loading={saving}>
//               <Save size={14} />
//               {saved ? 'Saved!' : 'Save Changes'}
//             </Button>
//           }
//         />

//         {/* How it works */}
//         <Card className="mb-4">
//           <div className="flex items-start gap-3">
//             <Info size={15} className="text-sky-400 mt-0.5 shrink-0" />
//             <div className="text-sm text-slate-400 space-y-1 leading-relaxed">
//               <p>
//                 Base score is <strong className="text-white">500</strong>. Each rule adjusts the score
//                 per event, multiplied by a recency factor (≤12 mo: ×1.5, ≤24 mo: ×1.2, older: ×1.0).
//                 Missed payments are capped at <strong className="text-white">Missed Payment Cap</strong> per loan.
//               </p>
//               <p>
//                 Enter weights as positive integers — the system applies the correct sign automatically.
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Guarantor propagation note */}
//         <Card className="mb-4">
//           <div className="flex items-start gap-3">
//             <Users size={15} className="text-amber-400 mt-0.5 shrink-0" />
//             <div className="text-sm text-slate-400 leading-relaxed">
//               <p className="font-medium text-amber-400 mb-1">Guarantor Score Propagation — 50% rule</p>
//               <p>
//                 Every borrower event on a guaranteed loan <strong className="text-white">also affects each guarantor</strong> at
//                 {' '}<strong className="text-white">50% of the borrower's impact</strong>, using the same weights below.
//                 Good borrower behaviour rewards guarantors; missed payments and gold-sold events penalise them.
//               </p>
//               <p className="mt-1.5 text-xs text-slate-500">
//                 Example: On-Time weight = 5 pts.  Borrower gets +5 pts per payment.  Each guarantor gets +2.5 pts (rounded) per the borrower's on-time payment.
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Rules */}
//         <Card>
//           <div className="flex items-center gap-2 mb-5">
//             <Settings2 size={15} className="text-sky-400" />
//             <h3 className="font-display font-semibold text-white text-sm">Scoring Rules</h3>
//           </div>

//           {loading ? (
//             <div className="space-y-5">
//               {RULE_ORDER.map(r => (
//                 <div key={r} className="flex justify-between items-center border-b border-[var(--border)] pb-5">
//                   <div className="h-4 bg-[var(--bg-surface)] rounded w-44 animate-pulse" />
//                   <div className="h-9 bg-[var(--bg-surface)] rounded w-20 animate-pulse" />
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="space-y-5">
//               {config.map((rule, i) => {
//                 const meta = RULE_META[rule.rule_name]
//                 if (!meta) return null
//                 return (
//                   <motion.div
//                     key={rule.rule_name}
//                     initial={{ opacity: 0, x: -10 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: i * 0.06 }}
//                     className="flex items-center justify-between gap-4 pb-5 border-b border-[var(--border)] last:border-0 last:pb-0"
//                   >
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2">
//                         <span className={`font-mono font-bold text-base ${
//                           meta.sign === '+' ? 'text-emerald-400' :
//                           meta.sign === '=' ? 'text-sky-400' :
//                           meta.sign === '⌀' ? 'text-orange-400' :
//                           'text-red-400'}`}>
//                           {meta.sign}
//                         </span>
//                         <span className="text-sm font-medium text-slate-200">{meta.label}</span>
//                       </div>
//                       <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{meta.desc}</p>
//                     </div>
//                     <div className="flex items-center gap-2 shrink-0">
//                       <Input
//                         type="number"
//                         value={Math.abs(rule.weight)}
//                         onChange={e => updateWeight(rule.rule_name, e.target.value)}
//                         className="w-20 text-center font-mono"
//                         min={0}
//                         max={
//                           rule.rule_name === 'base_score'        ? 9999 :
//                           rule.rule_name === 'missed_payment_cap' ? 9999 :
//                           500
//                         }
//                       />
//                       <span className="text-xs text-slate-500 w-6">pts</span>
//                     </div>
//                   </motion.div>
//                 )
//               })}
//             </div>
//           )}
//         </Card>

//         {/* Risk level reference */}
//         <Card className="mt-4">
//           <h3 className="font-display font-semibold text-white text-sm mb-1">Risk Level Reference</h3>
//           <p className="text-xs text-slate-500 mb-4">Thresholds are % of max score (Base × 2). Low ≥ 70%, Medium ≥ 40%, High &lt; 40%.</p>
//           <div className="grid grid-cols-3 gap-3 text-center text-xs">
//             {[
//               { range: '≥ 70%', label: 'Low Risk',    color: 'emerald', example: '700+' },
//               { range: '40–69%', label: 'Medium Risk', color: 'amber',   example: '400–699' },
//               { range: '< 40%',  label: 'High Risk',   color: 'red',     example: '0–399' },
//             ].map(r => (
//               <div
//                 key={r.label}
//                 className={`p-3 rounded-xl bg-${r.color}-400/5 border border-${r.color}-400/20`}
//               >
//                 <div className={`font-mono font-bold text-${r.color}-400 text-base`}>{r.range}</div>
//                 <div className={`font-mono text-xs text-${r.color}-400/50 mt-0.5`}>{r.example} pts</div>
//                 <div className={`text-${r.color}-400/70 mt-1`}>{r.label}</div>
//               </div>
//             ))}
//           </div>
//         </Card>
//       </div>
//     </AppLayout>
//   )
// }
'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Info, Settings2, Users } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, PageHeader, Button, Input } from '@/components/ui'
import type { CreditScoreConfig } from '@/types'

// Rules that actually exist in the scoring engine
const RULE_META: Record<string, { label: string; desc: string; sign: '+' | '-' | '=' | '⌀' | '%' | '📅' }> = {
  base_score: {
    label: 'Base Score',
    desc: 'Starting score for every member before any loan behaviour is applied.',
    sign: '=',
  },
  loan_start_date: {
    label: 'Loan Start Date',
    desc: 'Only loans from this date onwards will be included in credit score calculations. Loans and repayments before this date are excluded.',
    sign: '📅',
  },
  on_time_payment: {
    label: 'On-Time Payment',
    desc: 'Points added per on-time installment (paid by 10th of month). Also applies at 50% to each guarantor.',
    sign: '+',
  },
  late_payment: {
    label: 'Late Payment',
    desc: 'Points deducted per late installment (paid after 10th). Also deducted at 50% from each guarantor.',
    sign: '-',
  },
  missed_payment: {
    label: 'Missed Payment',
    desc: 'Points deducted for a month with zero payment. Also deducted at 50% from each guarantor.',
    sign: '-',
  },
  partial_payment_threshold: {
    label: 'Partial Payment Threshold',
    desc: 'If payment received is below this % of the committed installment amount, the month is classified as Partial (not fully paid).',
    sign: '%',
  },
  partial_payment_penalty: {
    label: 'Partial Payment Penalty',
    desc: 'Points deducted for a month where payment was received but below the threshold. Counts toward the missed payment cap.',
    sign: '-',
  },
  missed_payment_cap: {
    label: 'Missed Payment Cap',
    desc: 'Maximum total deduction per loan for partial + missed months combined, regardless of how many months were affected.',
    sign: '⌀',
  },
  loan_closed_successfully: {
    label: 'Loan Closed Successfully',
    desc: 'Points added when a loan is fully repaid. Also applied at 50% to each guarantor.',
    sign: '+',
  },
  gold_sold: {
    label: 'Gold Sold',
    desc: 'Points deducted when collateral gold is sold. Also deducted at 50% from each guarantor.',
    sign: '-',
  },
}

// Display order
const RULE_ORDER = [
  'base_score',
  'loan_start_date',
  'on_time_payment',
  'late_payment',
  'missed_payment',
  'partial_payment_threshold',
  'partial_payment_penalty',
  'missed_payment_cap',
  'loan_closed_successfully',
  'gold_sold',
]

export default function SettingsPage() {
  const [config, setConfig] = useState<CreditScoreConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/score/config')
      .then(r => r.json())
      .then((d: CreditScoreConfig[]) => {
        // Only keep rules the engine actually uses
        const filtered = d.filter(r => RULE_ORDER.includes(r.rule_name))
        // Preserve order
        filtered.sort((a, b) => RULE_ORDER.indexOf(a.rule_name) - RULE_ORDER.indexOf(b.rule_name))
        setConfig(filtered)
        setLoading(false)
      })
  }, [])

  // Convert YYYYMMDD number to YYYY-MM-DD string for date input
  const weightToDateString = (weight: number): string => {
    const num = Math.abs(Number(weight))
    const year = Math.floor(num / 10000)
    const month = Math.floor((num % 10000) / 100)
    const day = num % 100
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Convert YYYY-MM-DD string to YYYYMMDD number
  const dateStringToWeight = (dateStr: string): number => {
    const parts = dateStr.split('-')
    if (parts.length !== 3) return 20210101
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const day = parseInt(parts[2])
    return year * 10000 + month * 100 + day
  }

  const updateWeight = (rule: string, val: string) => {
    if (rule === 'loan_start_date') {
      // Date field - store as YYYYMMDD number
      setConfig(prev =>
        prev.map(c => c.rule_name === rule ? { ...c, weight: dateStringToWeight(val) } : c)
      )
    } else {
      setConfig(prev =>
        prev.map(c => c.rule_name === rule ? { ...c, weight: Math.max(0, parseInt(val) || 0) } : c)
      )
    }
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/score/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <PageHeader
          title="Settings"
          subtitle="Configure credit scoring weights"
          action={
            <Button onClick={handleSave} loading={saving}>
              <Save size={14} />
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          }
        />

        {/* How it works */}
        <Card className="mb-4">
          <div className="flex items-start gap-3">
            <Info size={15} className="text-sky-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-400 space-y-1 leading-relaxed">
              <p>
                Base score is <strong className="text-white">1000</strong>. Each rule adjusts the score
                per event, multiplied by a recency factor (≤12 mo: ×1.5, ≤24 mo: ×1.2, older: ×1.0).
                Missed payments are capped at <strong className="text-white">Missed Payment Cap</strong> per loan.
              </p>
              <p>
                Enter weights as positive integers — the system applies the correct sign automatically.
              </p>
            </div>
          </div>
        </Card>

        {/* Guarantor propagation note */}
        <Card className="mb-4">
          <div className="flex items-start gap-3">
            <Users size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-400 leading-relaxed">
              <p className="font-medium text-amber-400 mb-1">Guarantor Score Propagation — 50% rule</p>
              <p>
                Every borrower event on a guaranteed loan <strong className="text-white">also affects each guarantor</strong> at
                {' '}<strong className="text-white">50% of the borrower's impact</strong>, using the same weights below.
                Good borrower behaviour rewards guarantors; missed payments and gold-sold events penalise them.
              </p>
              <p className="mt-1.5 text-xs text-slate-500">
                Example: On-Time weight = 5 pts.  Borrower gets +5 pts per payment.  Each guarantor gets +2.5 pts (rounded) per the borrower's on-time payment.
              </p>
            </div>
          </div>
        </Card>

        {/* Rules */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Settings2 size={15} className="text-sky-400" />
            <h3 className="font-display font-semibold text-white text-sm">Scoring Rules</h3>
          </div>

          {loading ? (
            <div className="space-y-5">
              {RULE_ORDER.map(r => (
                <div key={r} className="flex justify-between items-center border-b border-[var(--border)] pb-5">
                  <div className="h-4 bg-[var(--bg-surface)] rounded w-44 animate-pulse" />
                  <div className="h-9 bg-[var(--bg-surface)] rounded w-20 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {config.map((rule, i) => {
                const meta = RULE_META[rule.rule_name]
                if (!meta) return null
                return (
                  <motion.div
                    key={rule.rule_name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between gap-4 pb-5 border-b border-[var(--border)] last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-base ${
                          meta.sign === '+' ? 'text-emerald-400' :
                          meta.sign === '=' ? 'text-sky-400' :
                          meta.sign === '⌀' ? 'text-orange-400' :
                          meta.sign === '%' ? 'text-violet-400' :
                          meta.sign === '📅' ? 'text-pink-400' :
                          'text-red-400'}`}
                        >
                          {meta.sign}
                        </span>
                        <span className="text-sm font-medium text-slate-200">{meta.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{meta.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rule.rule_name === 'loan_start_date' ? (
                        <>
                          <Input
                            type="date"
                            value={weightToDateString(rule.weight)}
                            onChange={e => updateWeight(rule.rule_name, e.target.value)}
                            className="w-36 text-center font-mono"
                          />
                          <span className="text-xs text-slate-500 w-8"></span>
                        </>
                      ) : (
                        <>
                          <Input
                            type="number"
                            value={Math.abs(rule.weight)}
                            onChange={e => updateWeight(rule.rule_name, e.target.value)}
                            className="w-20 text-center font-mono"
                            min={0}
                            max={
                              rule.rule_name === 'base_score'               ? 9999 :
                              rule.rule_name === 'missed_payment_cap'        ? 9999 :
                              rule.rule_name === 'partial_payment_threshold' ? 100  :
                              500
                            }
                          />
                          <span className="text-xs text-slate-500 w-6">
                            {rule.rule_name === 'partial_payment_threshold' ? '%' : 'pts'}
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Risk level reference */}
        <Card className="mt-4">
          <h3 className="font-display font-semibold text-white text-sm mb-1">Risk Level Reference</h3>
          <p className="text-xs text-slate-500 mb-4">Thresholds are % of max score (Base × 2). Low ≥ 80%, Medium ≥ 40%, High &lt; 40%.</p>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {[
              { range: '≥ 80%', label: 'Low Risk',    color: 'emerald', example: '800+' },
              { range: '40–79%', label: 'Medium Risk', color: 'amber',   example: '400–799' },
              { range: '< 40%',  label: 'High Risk',   color: 'red',     example: '0–399' },
            ].map(r => (
              <div
                key={r.label}
                className={`p-3 rounded-xl bg-${r.color}-400/5 border border-${r.color}-400/20`}
              >
                <div className={`font-mono font-bold text-${r.color}-400 text-base`}>{r.range}</div>
                <div className={`font-mono text-xs text-${r.color}-400/50 mt-0.5`}>{r.example} pts</div>
                <div className={`text-${r.color}-400/70 mt-1`}>{r.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
