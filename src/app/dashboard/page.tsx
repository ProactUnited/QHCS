'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CreditCard, CheckCircle, AlertTriangle,
  TrendingDown, Activity, BarChart2
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { StatCard, Card, PageHeader, RiskBadge, Skeleton } from '@/components/ui'
import { ActivityChart, RiskPieChart } from '@/components/charts/DashboardCharts'

interface Stats {
  totalMembers: number
  activeLoans: number
  closedLoans: number
  missedInstallmentsCount: number
  highRiskMembers: number
  avgCreditScore: number
  monthlyActivity: { month: string; repayments: number; missed: number }[]
  riskDistribution: { name: string; value: number; color: string }[]
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Dashboard"
          subtitle="Community lending credit overview"
          action={
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          }
        />

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
          >
            <motion.div variants={item}>
              <StatCard label="Total Members" value={stats?.totalMembers ?? 0} icon={Users}
                sub="Registered members" color="sky" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="Active Loans" value={stats?.activeLoans ?? 0} icon={CreditCard}
                sub="Open loan accounts" color="sky" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="Loans Closed" value={stats?.closedLoans ?? 0} icon={CheckCircle}
                sub="Successfully completed" color="emerald" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="Missed Installments" value={stats?.missedInstallmentsCount ?? 0}
                icon={TrendingDown} sub="Overdue this month" color="red" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="High Risk Members" value={stats?.highRiskMembers ?? 0}
                icon={AlertTriangle} sub="Score below 40" color="amber" />
            </motion.div>
            <motion.div variants={item}>
              <StatCard label="Avg Credit Score" value={stats?.avgCreditScore ?? 0}
                icon={Activity} sub="Platform average" color="sky" />
            </motion.div>
          </motion.div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-white text-sm">Repayment Activity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
                </div>
                <BarChart2 size={16} className="text-slate-600" />
              </div>
              {loading ? (
                <Skeleton className="h-48" />
              ) : (
                <ActivityChart data={stats?.monthlyActivity ?? []} />
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <div className="mb-4">
                <h3 className="font-display font-semibold text-white text-sm">Risk Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">By credit score</p>
              </div>
              {loading ? (
                <Skeleton className="h-48" />
              ) : (
                <RiskPieChart data={stats?.riskDistribution ?? []} />
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}
