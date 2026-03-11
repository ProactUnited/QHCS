import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/api-auth'

export async function GET() {
  const unauth = await requireApiAuth()
  if (unauth) return unauth
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('credit_score_config').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PUT(req: Request) {
  const unauth = await requireApiAuth()
  if (unauth) return unauth
  try {
    const rows = await req.json() as { rule_name: string; weight: number }[]
    const supabase = createServiceClient()
    const { error } = await supabase.from('credit_score_config').upsert(rows)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
