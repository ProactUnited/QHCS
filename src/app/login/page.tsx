'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Eye, EyeOff, Mail, Lock,
  AlertCircle, ArrowRight, Loader2,
  TrendingUp, Users, FileCheck, Activity
} from 'lucide-react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

// ─── Animated background ──────────────────────────────────────────────────────
function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Base radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(14,165,233,0.11) 0%, transparent 65%),' +
            'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(16,185,129,0.06) 0%, transparent 50%)',
        }}
      />
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-login" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M44 0L0 0 0 44" fill="none" stroke="rgba(96,165,250,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-login)" />
      </svg>
      {/* Floating glow blobs */}
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.07), transparent 70%)', top: '8%', left: '2%' }}
        animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)', bottom: '5%', right: '5%' }}
        animate={{ x: [0, -18, 0], y: [0, 18, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      {/* Sweep line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.25) 40%, rgba(14,165,233,0.4) 50%, rgba(14,165,233,0.25) 60%, transparent 100%)' }}
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
    </div>
  )
}

// ─── Left-side feature panel ──────────────────────────────────────────────────
const FEATURES = [
  { icon: TrendingUp, label: 'AI Credit Scoring',        sub: 'Weighted multi-factor analysis' },
  { icon: Users,      label: 'Guarantor Risk Detection', sub: 'Full linked-borrower exposure' },
  { icon: FileCheck,  label: 'Missed Installment Alerts', sub: 'Auto-detected via SQL views' },
  { icon: Activity,   label: 'Analyst Decision Audit',   sub: 'Full history with override support' },
]

const TICKER = ['2,000+ Members', '350 Loans/year', '94% Score Accuracy', 'Interest-free Platform']

function TickerBadge() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % TICKER.length), 2800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="h-6 overflow-hidden mt-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 text-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="font-mono text-emerald-400">{TICKER[i]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Login form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') || '/dashboard'
  const urlError = params.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(urlError ? 'Authentication failed. Please try again.' : '')
  const [shakeKey, setShakeKey] = useState(0)

  const supabase = createSupabaseBrowser()

  const shake = () => setShakeKey(k => k + 1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      shake()
      return
    }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (err) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Check your credentials and try again.')
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in.')
      } else {
        setError(err.message || 'Sign in failed. Please try again.')
      }
      shake()
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <motion.div
      key={shakeKey}
      animate={shakeKey ? { x: [-10, 10, -7, 7, -4, 4, 0] } : {}}
      transition={{ duration: 0.45 }}
      className="w-full"
    >
      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: 'rgba(10, 18, 34, 0.85)',
          border: '1px solid rgba(99,179,237,0.13)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Card top shimmer line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.5), transparent)' }}
        />

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', bounce: 0.45 }}
          className="flex justify-center mb-7"
        >
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                boxShadow: '0 8px 32px rgba(14,165,233,0.35)',
              }}
            >
              <Shield size={28} className="text-white" />
            </motion.div>
            {/* Breathing ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border border-sky-400/40"
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.8, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-7"
        >
          <h1 className="font-display font-bold text-[1.6rem] text-white tracking-tight leading-tight">
            Sign in to QHCS
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Community Lending Credit Platform
          </p>
          <TickerBadge />
        </motion.div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div
                className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.22)',
                }}
              >
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-px" />
                <p className="text-sm text-red-400 leading-snug">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">
              Email
            </label>
            <div className="relative group">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors pointer-events-none"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="analyst@qhcs.org"
                autoComplete="email"
                autoFocus
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all duration-150 placeholder-slate-600 bg-white/4"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,179,237,0.13)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(14,165,233,0.45)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.09)'
                  e.currentTarget.style.background = 'rgba(14,165,233,0.04)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,179,237,0.13)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">
              Password
            </label>
            <div className="relative group">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors pointer-events-none"
              />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white outline-none transition-all duration-150 placeholder-slate-600"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,179,237,0.13)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(14,165,233,0.45)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.09)'
                  e.currentTarget.style.background = 'rgba(14,165,233,0.04)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,179,237,0.13)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015 }}
            whileTap={{ scale: loading ? 1 : 0.985 }}
            className="relative w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-1 overflow-hidden disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(14,165,233,0.28)',
              opacity: loading ? 0.75 : 1,
              transition: 'opacity 0.2s, box-shadow 0.2s',
            }}
          >
            {/* shimmer on hover */}
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)',
              }}
            />
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Authenticating…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={15} />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center text-xs text-slate-600 mt-6 leading-relaxed"
        >
          Access restricted to authorised personnel only.
          <br />
          Contact your administrator to request access.
        </motion.p>
      </div>

      {/* Below-card badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="flex items-center justify-center gap-3 mt-5"
      >
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <Shield size={10} />
          Secured by Supabase Auth
        </div>
        <span className="text-slate-700">·</span>
        <span className="text-[11px] text-slate-600 font-mono">QHCS v1.0</span>
      </motion.div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 relative"
      style={{ background: 'var(--bg-base)' }}
    >
      <Background />

      {/* Left panel — desktop only */}
      <motion.div
        initial={{ opacity: 0, x: -36 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-80 mr-16 py-2"
        style={{ minHeight: 520 }}
      >
        {/* Top label */}
        <div>
          <div className="font-mono text-[11px] text-sky-400/50 uppercase tracking-[0.2em] mb-5">
            QHCS · Est. 2024
          </div>
          <h2 className="font-display font-extrabold text-[2.6rem] leading-[1.1] text-white">
            Community
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Credit
            </span>
            <br />
            Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-[260px]">
            Evaluate borrower creditworthiness and make data-driven, audit-ready lending decisions.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4 my-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.09, duration: 0.4 }}
              className="flex items-start gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.15)' }}
              >
                <f.icon size={15} className="text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{f.label}</p>
                <p className="text-xs text-slate-500 mt-px">{f.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Gradient rule */}
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="h-px origin-left"
          style={{ background: 'linear-gradient(90deg, rgba(14,165,233,0.5), transparent)' }}
        />
      </motion.div>

      {/* Form panel */}
      <motion.div
        initial={{ opacity: 0, x: 36, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
