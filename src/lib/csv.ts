import Papa from 'papaparse'

export interface ParseResult<T> {
  data: T[]
  errors: string[]
}

export function parseCSV<T>(file: File): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const errors: string[] = []
        if (results.errors.length > 0) {
          results.errors.forEach(e => errors.push(`Row ${e.row}: ${e.message}`))
        }
        resolve({ data: results.data as T[], errors })
      },
      error: (err) => {
        resolve({ data: [], errors: [err.message] })
      },
    })
  })
}

export function validateMemberRow(row: Record<string, string>): string | null {
  if (!row.member_id) return 'Missing member_id'
  if (!row.member_name) return 'Missing member_name'
  if (isNaN(Number(row.member_id))) return 'member_id must be a number'
  return null
}

export function validateLoanRow(row: Record<string, string>): string | null {
  if (!row.member_id) return 'Missing member_id'
  if (!row.start_date) return 'Missing start_date'
  if (!row.amount) return 'Missing amount'
  if (!row.installments) return 'Missing installments'
  if (!row.installment_amount) return 'Missing installment_amount'
  if (!row.repayment_start_date) return 'Missing repayment_start_date'
  return null
}

export function validateRepaymentRow(row: Record<string, string>): string | null {
  if (!row.loan_id) return 'Missing loan_id'
  if (!row.member_id) return 'Missing member_id'
  if (!row.paid_date) return 'Missing paid_date'
  if (!row.paid_amount) return 'Missing paid_amount'
  return null
}
