'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import { Card, PageHeader, Input, Button } from '@/components/ui'
import { Search } from 'lucide-react'

export default function ReportIndexPage() {
  const [id, setId] = useState('')
  const router = useRouter()

  const go = (e: React.FormEvent) => {
    e.preventDefault()
    if (id.trim()) router.push(`/report/${id.trim()}`)
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-lg mx-auto">
        <PageHeader title="Credit Report" subtitle="Enter a member ID to generate their report" />
        <Card>
          <form onSubmit={go} className="flex gap-3">
            <Input
              placeholder="Member ID…"
              value={id}
              onChange={e => setId(e.target.value)}
              type="number"
              autoFocus
            />
            <Button type="submit" disabled={!id.trim()}>
              <Search size={14} /> View Report
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  )
}
