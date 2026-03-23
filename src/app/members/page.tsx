// 'use client'
// import { useState, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import { motion, AnimatePresence } from 'framer-motion'
// import { Search, User, Phone, MapPin, TrendingUp, Loader2, ChevronRight } from 'lucide-react'
// import AppLayout from '@/components/layout/AppLayout'
// import { Card, PageHeader, Input, Button, RiskBadge, Empty, Skeleton } from '@/components/ui'
// import { getRiskLevel } from '@/lib/scoring'
// import { getScoreColor, formatDate } from '@/lib/utils'

// interface MemberResult {
//   member_id: number
//   member_name: string
//   mobile: string | null
//   mohalla: string | null
//   created_at: string
//   member_credit_scores: { score: number; last_updated: string }[]
// }

// export default function MembersPage() {
//   const router = useRouter()
//   const [query, setQuery] = useState('')
//   const [results, setResults] = useState<MemberResult[]>([])
//   const [loading, setLoading] = useState(false)
//   const [searched, setSearched] = useState(false)

//   const handleSearch = useCallback(async (e?: React.FormEvent) => {
//     e?.preventDefault()
//     setLoading(true)
//     setSearched(true)
//     try {
//       const res = await fetch(`/api/members?q=${encodeURIComponent(query)}`)
//       const data = await res.json()
//       setResults(Array.isArray(data) ? data : [])
//     } finally {
//       setLoading(false)
//     }
//   }, [query])

//   // Auto-search on empty query (show all)
//   const handleKeyUp = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') handleSearch()
//   }

//   return (
//     <AppLayout>
//       <div className="p-6 lg:p-8 max-w-5xl mx-auto">
//         <PageHeader
//           title="Member Search"
//           subtitle="Search by ID, name, or mobile number"
//         />

//         {/* Search bar */}
//         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <Card className="mb-6">
//             <form onSubmit={handleSearch} className="flex gap-3">
//               <div className="relative flex-1">
//                 <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
//                 <Input
//                   placeholder="Member ID, name, or mobile number…"
//                   value={query}
//                   onChange={e => setQuery(e.target.value)}
//                   onKeyUp={handleKeyUp}
//                   className="pl-10"
//                   autoFocus
//                 />
//               </div>
//               <Button type="submit" loading={loading}>
//                 <Search size={14} />
//                 Search
//               </Button>
//               <Button variant="ghost" type="button" onClick={() => { setQuery(''); handleSearch() }}>
//                 All
//               </Button>
//             </form>
//           </Card>
//         </motion.div>

//         {/* Results */}
//         <AnimatePresence mode="wait">
//           {loading ? (
//             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//               <div className="space-y-3">
//                 {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
//               </div>
//             </motion.div>
//           ) : searched && results.length === 0 ? (
//             <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//               <Card>
//                 <Empty icon={User} title="No members found" sub="Try a different search term" />
//               </Card>
//             </motion.div>
//           ) : (
//             <motion.div
//               key="results"
//               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               className="space-y-2"
//             >
//               {results.map((member, i) => {
//                 const scoreData = member.member_credit_scores?.[0]
//                 const score = scoreData?.score ?? null
//                 const risk = score !== null ? getRiskLevel(score) : null
//                 const scoreColor = score !== null ? getScoreColor(score) : '#64748b'

//                 return (
//                   <motion.div
//                     key={member.member_id}
//                     initial={{ opacity: 0, x: -12 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: i * 0.04 }}
//                     onClick={() => router.push(`/report/${member.member_id}`)}
//                     className="glass-card rounded-xl p-4 cursor-pointer hover:border-sky-400/20 transition-all group"
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-4">
//                         {/* Avatar */}
//                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center shrink-0">
//                           <span className="font-display font-bold text-sm text-slate-300">
//                             {member.member_name.charAt(0).toUpperCase()}
//                           </span>
//                         </div>
//                         <div className="min-w-0">
//                           <div className="flex items-center gap-2 flex-wrap">
//                             <span className="font-semibold text-white text-sm">{member.member_name}</span>
//                             <span className="font-mono text-xs text-slate-500">#{member.member_id}</span>
//                             {risk && <RiskBadge risk={risk} />}
//                           </div>
//                           <div className="flex items-center gap-3 mt-1 flex-wrap">
//                             {member.mobile && (
//                               <span className="flex items-center gap-1 text-xs text-slate-500">
//                                 <Phone size={10} /> {member.mobile}
//                               </span>
//                             )}
//                             {member.mohalla && (
//                               <span className="flex items-center gap-1 text-xs text-slate-500">
//                                 <MapPin size={10} /> {member.mohalla}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex items-center gap-4 shrink-0">
//                         {score !== null && (
//                           <div className="text-right hidden sm:block">
//                             <div className="font-mono font-bold text-xl" style={{ color: scoreColor }}>{score}</div>
//                             <div className="text-xs text-slate-600">credit score</div>
//                           </div>
//                         )}
//                         <ChevronRight size={16} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
//                       </div>
//                     </div>
//                   </motion.div>
//                 )
//               })}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </AppLayout>
//   )
// }

'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, Phone, MapPin, TrendingUp, Loader2, ChevronRight } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { Card, PageHeader, Input, Button, RiskBadge, Empty, Skeleton } from '@/components/ui'
import { getRiskLevel } from '@/lib/scoring'
import { getScoreColor } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface MemberResult {
  member_id: number
  member_name: string
  mobile: string | null
  mohalla: string | null
  created_at: string
  member_credit_scores: { score: number; last_updated: string }[]
}

export default function MembersPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/members?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [query])

  // Auto-search on empty query (show all)
  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <PageHeader
          title="Member Search"
          subtitle="Search by ID, name, or mobile number"
        />

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Member ID, name, or mobile number…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyUp={handleKeyUp}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button type="submit" loading={loading}>
                <Search size={14} />
                Search
              </Button>
              <Button variant="ghost" type="button" onClick={() => { setQuery(''); handleSearch() }}>
                All
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            </motion.div>
          ) : searched && results.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <Empty icon={User} title="No members found" sub="Try a different search term" />
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {results.map((member, i) => {
                const scoreData = member.member_credit_scores?.[0]
                const score = scoreData?.score ?? null
                const risk = score !== null ? getRiskLevel(score) : null
                const scoreColor = score !== null ? getScoreColor(score, 500) : '#64748b'

                return (
                  <motion.div
                    key={member.member_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => router.push(`/report/${member.member_id}`)}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-sky-400/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center shrink-0">
                          <span className="font-display font-bold text-sm text-slate-300">
                            {member.member_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm">{member.member_name}</span>
                            <span className="font-mono text-xs text-slate-500">#{member.member_id}</span>
                            {risk && <RiskBadge risk={risk} />}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {member.mobile && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone size={10} /> {member.mobile}
                              </span>
                            )}
                            {member.mohalla && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={10} /> {member.mohalla}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {score !== null && (
                          <div className="text-right hidden sm:block">
                            <div className="font-mono font-bold text-xl" style={{ color: scoreColor }}>{score}</div>
                            <div className="text-xs text-slate-600">credit score</div>
                          </div>
                        )}
                        <ChevronRight size={16} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}

