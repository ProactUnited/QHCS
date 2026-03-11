'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Info, Settings2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, PageHeader, Button, Input } from '@/components/ui'
import type { CreditScoreConfig } from '@/types'

const RULE_LABELS: Record<string, { label: string; desc: string; sign: '+' | '-' }> = {
  on_time_payment:       { label: 'On-Time Payment',         desc: 'Points added per on-time installment',    sign: '+' },
  late_payment:          { label: 'Late Payment',            desc: 'Points deducted per late installment',    sign: '-' },
  missed_payment:        { label: 'Missed Payment',          desc: 'Points deducted per missed installment',  sign: '-' },
  loan_closed_successfully: { label: 'Loan Closed',         desc: 'Points added when loan is fully repaid',  sign: '+' },
  gold_sold:             { label: 'Gold Sold',               desc: 'Points deducted when gold is sold',       sign: '-' },
  guarantor_default:     { label: 'Guarantor Default',       desc: 'Points deducted if guaranteed borrower defaults', sign: '-' },
}

export default function SettingsPage() {
  const [config, setConfig] = useState<CreditScoreConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/score/config')
      .then(r => r.json())
      .then(d => { setConfig(d); setLoading(false) })
  }, [])

  const updateWeight = (rule: string, val: string) => {
    setConfig(prev => prev.map(c =>
      c.rule_name === rule ? { ...c, weight: parseInt(val) || 0 } : c
    ))
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

        <Card className="mb-4">
          <div className="flex items-start gap-3 p-1">
            <Info size={16} className="text-sky-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-400">
              <p>These weights control how the credit score is calculated. The base score is <strong className="text-white">50</strong>.</p>
              <p className="mt-1">Positive values increase the score; set negative rules as positive numbers (the system applies the deduction automatically).</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Settings2 size={16} className="text-sky-400" />
            <h3 className="font-display font-semibold text-white text-sm">Scoring Rules</h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[var(--border)] pb-4">
                  <div className="h-4 bg-[var(--bg-surface)] rounded w-40 skeleton" />
                  <div className="h-8 bg-[var(--bg-surface)] rounded w-20 skeleton" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {config.map((rule, i) => {
                const info = RULE_LABELS[rule.rule_name]
                if (!info) return null
                return (
                  <motion.div
                    key={rule.rule_name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${info.sign === '+' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {info.sign}
                        </span>
                        <span className="text-sm text-slate-200">{info.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{info.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        value={Math.abs(rule.weight)}
                        onChange={e => updateWeight(rule.rule_name, e.target.value)}
                        className="w-20 text-center font-mono"
                        min={0}
                        max={50}
                      />
                      <span className="text-xs text-slate-500 w-8">pts</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Score range reference */}
        <Card className="mt-4">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Risk Level Reference</h3>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/20">
              <div className="font-mono font-bold text-emerald-400 text-lg">70–100</div>
              <div className="text-emerald-400/70 mt-1">Low Risk</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20">
              <div className="font-mono font-bold text-amber-400 text-lg">40–69</div>
              <div className="text-amber-400/70 mt-1">Medium Risk</div>
            </div>
            <div className="p-3 rounded-xl bg-red-400/5 border border-red-400/20">
              <div className="font-mono font-bold text-red-400 text-lg">0–39</div>
              <div className="text-red-400/70 mt-1">High Risk</div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
