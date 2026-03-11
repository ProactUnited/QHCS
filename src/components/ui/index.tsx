'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false }: {
  children: ReactNode; className?: string; hover?: boolean
}) {
  return (
    <div className={cn(
      'glass-card rounded-xl p-5',
      hover && 'stat-card cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start justify-between mb-6"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function RiskBadge({ risk }: { risk: 'Low' | 'Medium' | 'High' | string }) {
  const classes = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
  }[risk] || 'badge-medium'
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono', classes)}>
      {risk} Risk
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const isOpen = status === 'Open'
  return (
    <span className={cn(
      'px-2.5 py-0.5 rounded-full text-xs font-medium',
      isOpen ? 'bg-sky-400/10 text-sky-400 border border-sky-400/20' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
    )}>
      {status}
    </span>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('qhcs-input rounded-lg px-3.5 py-2.5 text-sm w-full', className)}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('qhcs-input rounded-lg px-3.5 py-2.5 text-sm w-full appearance-none', className)}
      {...props}
    >
      {children}
    </select>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', className, loading, ...props }: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20',
    ghost: 'border border-[var(--border-strong)] text-slate-300 hover:bg-white/5 hover:text-white',
    danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
  }
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      className={cn(
        'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...(props as any)}
    >
      {loading && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </motion.button>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, trend, color = 'sky' }: {
  label: string; value: string | number; sub?: string
  icon?: React.ElementType; trend?: string; color?: 'sky' | 'emerald' | 'amber' | 'red'
}) {
  const colorMap = {
    sky: 'text-sky-400 bg-sky-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    red: 'text-red-400 bg-red-400/10',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card stat-card rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="font-display text-3xl font-bold text-white mt-1.5">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 text-xs text-slate-500 border-t border-white/5 pt-3">{trend}</div>
      )}
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, sub }: {
  icon?: React.ElementType; title: string; sub?: string
}) {
  return (
    <div className="text-center py-12 text-slate-500">
      {Icon && <Icon size={32} className="mx-auto mb-3 opacity-30" />}
      <p className="font-medium text-slate-400">{title}</p>
      {sub && <p className="text-sm mt-1">{sub}</p>}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────
export function Tooltip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-md text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {label}
      </div>
    </div>
  )
}
