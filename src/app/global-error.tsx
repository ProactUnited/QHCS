'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Home, Bug } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[QHCS]', error)
  }, [error])

  return (
    <html>
      <head>
        <title>Error — QHCS</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
        <style>{`
          *{box-sizing:border-box;margin:0}
          body{background:#070d1a;font-family:'DM Sans',sans-serif;color:#f1f5f9;-webkit-font-smoothing:antialiased}
          .display{font-family:'Syne',sans-serif}
          .mono{font-family:'JetBrains Mono',monospace}
        `}</style>
      </head>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>

            {/* Icon */}
            <div style={{
              width: 76, height: 76, borderRadius: 22,
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Bug size={34} color="#f87171" />
            </div>

            <div className="mono" style={{ fontSize: 11, color: 'rgba(248,113,113,0.5)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>
              Application Error
            </div>
            <h1 className="display" style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', marginBottom: 10 }}>
              Something went wrong
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: error.digest ? 16 : 28 }}>
              An unexpected error occurred. You can try again or go back to the dashboard.
            </p>

            {error.digest && (
              <div
                className="mono"
                style={{
                  fontSize: 11, color: '#475569',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(99,179,237,0.08)',
                  borderRadius: 10, padding: '8px 14px',
                  marginBottom: 24, display: 'inline-block',
                }}
              >
                Error ID: {error.digest}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  border: 'none', color: '#fff',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(14,165,233,0.22)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <a
                href="/dashboard"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,179,237,0.13)',
                  color: '#94a3b8', fontSize: 14,
                  textDecoration: 'none', fontWeight: 500,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <Home size={14} />
                Dashboard
              </a>
            </div>

            <div style={{
              marginTop: 40,
              height: 1,
              width: 80,
              margin: '40px auto 0',
              background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.25), transparent)',
            }} />
            <p className="mono" style={{ fontSize: 11, color: '#334155', marginTop: 12 }}>
              QHCS Credit Platform · Server Error
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
