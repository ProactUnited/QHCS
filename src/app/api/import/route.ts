import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/api-auth'

export async function POST(req: Request) {
  const unauth = await requireApiAuth()
  if (unauth) return unauth

  try {
    const body = await req.json()
    const { type, rows } = body as { type: 'members' | 'loans' | 'repayments'; rows: Record<string, any>[] }
    const supabase = createServiceClient()
    const errors: string[] = []
    let imported = 0

    if (type === 'members') {
      for (const row of rows) {
        const record = {
          member_id: parseInt(row.member_id),
          member_name: row.member_name?.trim(),
          mobile: row.mobile?.trim() || null,
          mohalla: row.mohalla?.trim() || null,
        }
        if (isNaN(record.member_id) || !record.member_name) {
          errors.push(`Invalid member row: ${JSON.stringify(row)}`); continue
        }
        const { error } = await supabase.from('members').upsert(record)
        if (error) errors.push(`Member ${record.member_id}: ${error.message}`)
        else imported++
      }
    } else if (type === 'loans') {
      for (const row of rows) {
        const record: any = {
          member_id: parseInt(row.member_id),
          purpose: row.purpose?.trim() || null,
          start_date: row.start_date,
          amount: parseFloat(row.amount),
          installments: parseInt(row.installments),
          installment_amount: parseFloat(row.installment_amount),
          repayment_start_date: row.repayment_start_date,
          gold_value: row.gold_value ? parseFloat(row.gold_value) : null,
          status: row.status === 'Close' ? 'Close' : 'Open',
          close_date: row.close_date || null,
          gold_status: ['Open','Returned','Sold'].includes(row.gold_status) ? row.gold_status : 'Open',
          guarantor_1_id: row.guarantor_1_id ? parseInt(row.guarantor_1_id) : null,
          guarantor_2_id: row.guarantor_2_id ? parseInt(row.guarantor_2_id) : null,
          guarantor_3_id: row.guarantor_3_id ? parseInt(row.guarantor_3_id) : null,
          guarantor_4_id: row.guarantor_4_id ? parseInt(row.guarantor_4_id) : null,
        }
        if (row.loan_id) record.loan_id = parseInt(row.loan_id)
        const { error } = await supabase.from('loans').upsert(record)
        if (error) errors.push(`Loan (member ${record.member_id}): ${error.message}`)
        else imported++
      }
    } else if (type === 'repayments') {
      for (const row of rows) {
        const record: any = {
          loan_id: parseInt(row.loan_id),
          member_id: parseInt(row.member_id),
          paid_date: row.paid_date,
          paid_amount: parseFloat(row.paid_amount),
        }
        if (row.repayment_id) record.repayment_id = parseInt(row.repayment_id)
        const { error } = await supabase.from('repayments').insert(record)
        if (error) errors.push(`Repayment loan ${record.loan_id}: ${error.message}`)
        else imported++
      }
    }

    return NextResponse.json({ imported, errors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
