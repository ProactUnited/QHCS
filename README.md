# QHCS — Community Loan Credit Rating Platform

A production-ready credit evaluation and analytics platform built for community lending organizations.

## Tech Stack
- **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion, Recharts
- **Backend**: Next.js API Routes (server-side)
- **Database**: Supabase (PostgreSQL)
- **Fonts**: Syne (display), DM Sans (body), JetBrains Mono

## Features
- 📊 Dashboard with live portfolio metrics
- 🔍 Member search by ID, name, or mobile
- 📈 AI-powered credit score (0–100) with full breakdown
- 📋 Credit report with loan timeline, repayment chart, guarantor exposure
- 📁 CSV import for members, loans, and repayments
- ⚙️ Configurable scoring weights via admin panel
- 📱 Fully mobile responsive
- ✨ Smooth Framer Motion animations throughout

---

## Setup

### 1. Clone and install
```bash
cd qhcs
npm install
```

### 2. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run the full contents of `schema.sql`
3. Copy your project URL and API keys

### 3. Environment Variables
```bash
cp .env.example .env.local
```
Fill in your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run locally
```bash
npm run dev
# → http://localhost:3000
```

---

## CSV Import Format

### Members CSV
```csv
member_id,member_name,mobile,mohalla
1001,Ahmed Khan,03001234567,Karachi
```

### Loans CSV
```csv
member_id,purpose,start_date,amount,installments,installment_amount,repayment_start_date,gold_value,status,gold_status,guarantor_1_id,guarantor_2_id,guarantor_3_id,guarantor_4_id
1001,Business,2023-01-01,50000,12,4200,2023-02-01,60000,Open,Open,1002,1003,,
```

### Repayments CSV
```csv
loan_id,member_id,paid_date,paid_amount
1,1001,2023-02-05,4200
```

**Import order:** Members → Loans → Repayments

---

## Credit Score Algorithm

- Base score: **50**
- Per on-time installment: **+5** (configurable)
- Per late installment: **−3** (configurable)
- Per missed installment: **−10** (configurable)
- Per closed loan: **+10** (configurable)
- Gold sold event: **−15** (configurable)
- Guarantor with defaulted borrower: **−8** (configurable)
- **Recency multiplier**: Last 12mo = 1.5×, 12–24mo = 1.2×, older = 1.0×

### Risk Levels
| Score | Level |
|-------|-------|
| 70–100 | Low Risk |
| 40–69 | Medium Risk |
| 0–39 | High Risk |

---

## Deploy on Vercel

```bash
npm install -g vercel
vercel

# Set env vars in Vercel dashboard or CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── dashboard/route.ts       ← Portfolio stats
│   │   ├── members/route.ts         ← Member search
│   │   ├── members/[id]/report/     ← Credit report
│   │   ├── import/route.ts          ← CSV import
│   │   ├── score/config/route.ts    ← Scoring config
│   │   └── decisions/route.ts       ← Loan decisions
│   ├── dashboard/page.tsx
│   ├── members/page.tsx
│   ├── report/[id]/page.tsx
│   ├── import/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── layout/   (Sidebar, AppLayout)
│   ├── ui/       (Card, Button, Badge, Input…)
│   └── charts/   (ScoreGauge, RepaymentChart, ScoreBreakdown…)
└── lib/
    ├── scoring.ts      ← Credit score engine
    ├── csv.ts          ← CSV parsing
    ├── supabase.ts     ← DB client
    └── utils.ts        ← Helpers
```
