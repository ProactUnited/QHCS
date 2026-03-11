import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/api-auth'

export async function GET(req: Request) {
  const unauth = await requireApiAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  try {
    const supabase = createServiceClient()
    let query = supabase
      .from('members')
      .select('*, member_credit_scores(score, last_updated)')
      .limit(50)

    if (q) {
      const numericId = parseInt(q)
      if (!isNaN(numericId)) {
        query = query.eq('member_id', numericId)
      } else {
        query = query.or(`member_name.ilike.%${q}%,mobile.ilike.%${q}%,mohalla.ilike.%${q}%`)
      }
    } else {
      query = query.order('member_id', { ascending: true })
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
