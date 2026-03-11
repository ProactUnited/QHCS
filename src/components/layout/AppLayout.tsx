'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import Sidebar from '@/components/layout/Sidebar'
import { motion } from 'framer-motion'

// Full-screen loading state shown while checking auth
function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo mark */}
        <div className="relative">
          <motion.div
            className="w-12 h-12 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
              boxShadow: '0 0 0 0 rgba(14,165,233,0.4)',
            }}
            animate={{ boxShadow: ['0 0 0 0 rgba(14,165,233,0.4)', '0 0 0 16px rgba(14,165,233,0)', '0 0 0 0 rgba(14,165,233,0)'] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/80" />
          </div>
        </div>
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Verifying session…</p>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Client-side guard: if session check done and no user, redirect to login
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  // Show loading spinner while Supabase resolves session
  if (loading) return <AuthLoading />

  // Don't render protected content until we confirm auth
  if (!user) return <AuthLoading />

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
