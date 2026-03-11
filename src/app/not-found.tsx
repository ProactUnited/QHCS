'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(14,165,233,0.06) 0%, transparent 65%)' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g404" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0L0 0 0 44" fill="none" stroke="#60a5fa" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g404)" />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-lg w-full px-4">
        {/* Floating icon + big number */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.35, duration: 0.75 }}
          className="relative inline-flex items-center justify-center mb-8"
        >
          {/* Huge 404 */}
          <span
            className="font-display font-black select-none"
            style={{
              fontSize: 'clamp(96px, 22vw, 148px)',
              lineHeight: 1,
              background: 'linear-gradient(180deg, rgba(14,165,233,0.12) 0%, rgba(14,165,233,0.03) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.04em',
            }}
          >
            404
          </span>

          {/* Centred floating icon */}
          <motion.div
            className="absolute"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'rgba(14,165,233,0.07)',
                border: '1px solid rgba(14,165,233,0.14)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <FileQuestion size={38} className="text-sky-400/60" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="font-display font-bold text-2xl text-white mb-3">Page not found</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            The page you're looking for doesn't exist or has been moved.
            <br className="hidden sm:block" />
            Double-check the URL or go back to a known page.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.38 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <Link href="/dashboard">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                boxShadow: '0 4px 18px rgba(14,165,233,0.22)',
              }}
            >
              <Home size={14} />
              Dashboard
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

          <Link href="/members">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
              style={{ border: '1px solid rgba(99,179,237,0.14)', background: 'rgba(255,255,255,0.03)' }}
            >
              <Search size={14} />
              Members
            </motion.span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <div
            className="h-px w-24 mx-auto mb-3"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.3), transparent)' }}
          />
          <p className="text-[11px] text-slate-600 font-mono">QHCS Credit Platform · Error 404</p>
        </motion.div>
      </div>
    </div>
  )
}
