import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400','500','600','700','800'],
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300','400','500','600'],
  display: 'swap',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400','500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'QHCS — Credit Rating Platform',
  description: 'Community Lending Credit Evaluation Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
