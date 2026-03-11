import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

/** Call at the top of every API route. Returns null if authed, or a 401 response. */
export async function requireApiAuth(): Promise<NextResponse | null> {
  try {
    const supabase = createSupabaseServer()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
    return null
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}
