'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShieldOff, ArrowLeft, LogIn, AlertTriangle } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 55% 40% at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 60%)' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g401" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0L0 0 0 44" fill="none" stroke="#f87171" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g401)" />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-md w-full px-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.65, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.38, duration: 0.7 }}
          className="flex justify-center mb-7"
        >
          <div className="relative">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.18)',
              }}
            >
              <ShieldOff size={36} className="text-red-400" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-3xl border border-red-400/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          {/* Error code */}
          <div className="font-mono text-[11px] text-red-400/55 uppercase tracking-widest mb-3">
            Error 401 — Unauthorised
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-3">Access Denied</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            You don't have permission to view this page.
            <br />
            Please sign in with an authorised account or contact your administrator for access.
          </p>
        </motion.div>

        {/* Warning box */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-7 rounded-xl px-4 py-3 flex items-start gap-3 text-left"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
          }}
        >
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-px" />
          <p className="text-xs text-amber-400/80 leading-relaxed">
            If you believe this is a mistake, ensure your account has been added to the QHCS platform by an administrator.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.42 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <Link href="/login">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                boxShadow: '0 4px 18px rgba(14,165,233,0.22)',
              }}
            >
              <LogIn size={14} />
              Sign In
            </motion.span>
          </Link>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(99,179,237,0.14)', background: 'rgba(255,255,255,0.03)' }}
          >
            <ArrowLeft size={14} />
            Go Back
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <div
            className="h-px w-24 mx-auto mb-3"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.25), transparent)' }}
          />
          <p className="text-[11px] text-slate-600 font-mono">QHCS Credit Platform · Restricted</p>
        </motion.div>
      </div>
    </div>
  )
}
