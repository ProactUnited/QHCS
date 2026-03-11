'use client'
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, PageHeader, Button } from '@/components/ui'
import { parseCSV } from '@/lib/csv'
import { cn } from '@/lib/utils'

type ImportType = 'members' | 'loans' | 'repayments'

interface ImportResult {
  imported: number
  errors: string[]
}

const TYPE_INFO = {
  members: {
    label: 'Members CSV',
    description: 'member_id, member_name, mobile, mohalla',
    color: 'sky',
    sample: `member_id,member_name,mobile,mohalla\n1001,Ahmed Khan,03001234567,Karachi\n1002,Sara Malik,03009876543,Lahore`,
  },
  loans: {
    label: 'Loans CSV',
    description: 'member_id, purpose, start_date, amount, installments, installment_amount, repayment_start_date, gold_value, status, gold_status, guarantor_1_id…',
    color: 'emerald',
    sample: `member_id,purpose,start_date,amount,installments,installment_amount,repayment_start_date,gold_value,status,gold_status\n1001,Business,2023-01-01,50000,12,4200,2023-02-01,60000,Open,Open`,
  },
  repayments: {
    label: 'Repayments CSV',
    description: 'loan_id, member_id, paid_date, paid_amount',
    color: 'amber',
    sample: `loan_id,member_id,paid_date,paid_amount\n1,1001,2023-02-05,4200\n1,1001,2023-03-03,4200`,
  },
}

function UploadZone({ type, onFile }: { type: ImportType; onFile: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const info = TYPE_INFO[type]

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div
      className={cn('upload-zone rounded-xl p-8 text-center cursor-pointer transition-all', dragging && 'drag-over')}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />
      <Upload size={28} className="mx-auto mb-3 text-slate-500" />
      <p className="text-slate-300 font-medium text-sm">Drop {info.label} here</p>
      <p className="text-slate-600 text-xs mt-1">or click to browse</p>
      <p className="text-slate-600 text-xs mt-3 font-mono">{info.description}</p>
    </div>
  )
}

function ImportCard({ type }: { type: ImportType }) {
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSample, setShowSample] = useState(false)
  const info = TYPE_INFO[type]

  const handleFile = async (f: File) => {
    setFile(f)
    setResult(null)
    const { data, errors } = await parseCSV<any>(f)
    setRows(data)
    setParseErrors(errors)
  }

  const handleImport = async () => {
    if (!rows.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, rows }),
      })
      const data: ImportResult = await res.json()
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  const colorMap = { sky: 'text-sky-400', emerald: 'text-emerald-400', amber: 'text-amber-400' }[info.color]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('font-display font-semibold text-sm', colorMap)}>{info.label}</h3>
        <button
          onClick={() => setShowSample(s => !s)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Sample <ChevronDown size={12} className={cn('transition-transform', showSample && 'rotate-180')} />
        </button>
      </div>

      <AnimatePresence>
        {showSample && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="text-xs font-mono text-slate-400 bg-[var(--bg-surface)] rounded-lg p-3 mb-3 overflow-x-auto">
              {info.sample}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {!file ? (
        <UploadZone type={type} onFile={handleFile} />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-[var(--bg-surface)] rounded-lg p-3">
            <FileText size={16} className="text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{rows.length} rows parsed</p>
            </div>
            <button onClick={() => { setFile(null); setRows([]); setResult(null) }} className="text-slate-500 hover:text-red-400 transition-colors text-xs">
              Remove
            </button>
          </div>

          {parseErrors.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              {parseErrors.slice(0, 3).map((e, i) => (
                <p key={i} className="text-xs text-red-400">{e}</p>
              ))}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !result && (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {Object.keys(rows[0]).slice(0, 6).map(k => (
                      <th key={k} className="px-3 py-2 text-left text-slate-500 font-medium">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 4).map((r, i) => (
                    <tr key={i} className="border-b border-[var(--border)] table-row-hover">
                      {Object.values(r).slice(0, 6).map((v: any, j) => (
                        <td key={j} className="px-3 py-2 text-slate-400 font-mono truncate max-w-24">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 4 && <p className="text-xs text-slate-600 text-center py-2">+{rows.length - 4} more rows</p>}
            </div>
          )}

          {!result && (
            <Button onClick={handleImport} loading={loading} disabled={rows.length === 0}>
              <Upload size={14} />
              Import {rows.length} records
            </Button>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <div className={cn(
                'rounded-xl p-4',
                result.errors.length === 0 ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-amber-500/5 border border-amber-500/20'
              )}>
                <div className="flex items-center gap-2">
                  {result.errors.length === 0
                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                    : <AlertTriangle size={16} className="text-amber-400" />}
                  <p className="text-sm font-medium text-white">
                    {result.imported} records imported
                    {result.errors.length > 0 && `, ${result.errors.length} errors`}
                  </p>
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <p key={i} className="text-xs text-amber-400/80 font-mono">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function ImportPage() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <PageHeader
          title="CSV Import"
          subtitle="Upload data files to sync into the platform"
        />

        <div className="mb-4 p-4 bg-sky-500/5 border border-sky-500/20 rounded-xl text-sm text-sky-300">
          <strong>Import Order:</strong> Always import Members first, then Loans, then Repayments.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ImportCard type="members" />
          <ImportCard type="loans" />
          <ImportCard type="repayments" />
        </div>
      </div>
    </AppLayout>
  )
}
