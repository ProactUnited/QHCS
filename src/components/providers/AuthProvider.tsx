'use client'
import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: 'Admin' | 'CreditAnalyst' | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole]       = useState<'Admin' | 'CreditAnalyst' | null>(null)
  const router  = useRouter()
  const supabase = createSupabaseBrowser()

  // Use a ref so fetchRole doesn't cause stale-closure issues
  const fetchRole = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('role')
        .eq('user_id', userId)
        .single()
      setRole((data?.role as 'Admin' | 'CreditAnalyst') ?? null)
    } catch {
      setRole(null)
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    // Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      setLoading(false)
    })

    // Live auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchRole(session.user.id)
        } else {
          setRole(null)
        }
        setLoading(false)
        router.refresh()
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = useCallback(async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setRole(null)
    setLoading(false)
    router.push('/login')
  }, [supabase, router])

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
