'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, TrendingUp, Upload,
  Settings, ChevronRight, Menu, X, Shield,
  LogOut, User, Crown, BadgeCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

const nav = [
  { href: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/members',   label: 'Members',        icon: Users },
  { href: '/report',    label: 'Credit Report',  icon: TrendingUp },
  { href: '/import',    label: 'CSV Import',     icon: Upload },
  { href: '/settings',  label: 'Settings',       icon: Settings },
]

function NavItem({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: React.ElementType; active: boolean
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative group',
          active
            ? 'nav-item-active'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        )}
      >
        <Icon
          size={16}
          className={active ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}
        />
        <span>{label}</span>
        {active && (
          <motion.div
            layoutId="active-indicator"
            className="absolute right-3"
            transition={{ type: 'spring', bounce: 0.2 }}
          >
            <ChevronRight size={12} className="text-sky-400" />
          </motion.div>
        )}
      </motion.div>
    </Link>
  )
}

function UserPanel({ onSignOut }: { onSignOut: () => void }) {
  const { user, role } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const email = user?.email ?? 'user@qhcs.org'
  const initial = email.charAt(0).toUpperCase()
  const isAdmin = role === 'Admin'

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500/30 to-sky-700/30 border border-sky-500/20 flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-sm text-sky-300">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">{email}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {isAdmin
              ? <Crown size={10} className="text-amber-400" />
              : <BadgeCheck size={10} className="text-sky-400" />
            }
            <span className="text-[10px] text-slate-500 font-mono">
              {role ?? 'Analyst'}
            </span>
          </div>
        </div>
        <ChevronRight
          size={12}
          className={cn('text-slate-600 transition-transform', showMenu && 'rotate-90')}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="px-3 py-2.5 border-b border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Signed in as</p>
              <p className="text-xs text-slate-300 mt-0.5 truncate">{email}</p>
            </div>
            <button
              onClick={() => { setShowMenu(false); onSignOut() }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-shadow group-hover:shadow-sky-500/30"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', boxShadow: '0 4px 16px rgba(14,165,233,0.2)' }}
          >
            <Shield size={17} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-base leading-tight tracking-wide">QHCS</div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Credit Platform</div>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <NavItem
            key={item.href}
            {...item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* Bottom user panel */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3 space-y-1">
        <div className="px-1 pb-1">
          <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Account</span>
        </div>
        <UserPanel onSignOut={handleSignOut} />
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col h-screen sticky top-0 bg-[var(--bg-surface)] border-r border-[var(--border)]">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
        >
          <Menu size={18} />
        </motion.button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-surface)] border-r border-[var(--border)] z-50 lg:hidden"
              style={{ boxShadow: '8px 0 32px rgba(0,0,0,0.5)' }}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={15} />
              </motion.button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
