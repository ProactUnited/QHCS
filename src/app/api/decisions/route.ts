import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/api-auth'

export async function POST(req: Request) {
  const unauth = await requireApiAuth()
  if (unauth) return unauth
  try {
    const body = await req.json()
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('loan_decisions').insert(body).select().single()
    console.log(data)
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const unauth = await requireApiAuth()
  if (unauth) return unauth
  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('member_id')
  const supabase = createServiceClient()
  let query = supabase.from('loan_decisions').select('*').order('decision_date', { ascending: false })
  if (memberId) query = query.eq('member_id', parseInt(memberId))
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
