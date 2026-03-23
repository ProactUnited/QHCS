# QHCS — Community Loan Credit Rating Platform
### Full Technical Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [Scoring Engine](#6-scoring-engine)
7. [API Routes](#7-api-routes)
8. [Pages & Features](#8-pages--features)
9. [File Deployment Reference](#9-file-deployment-reference)
10. [SQL Scripts to Run](#10-sql-scripts-to-run)
11. [Environment Variables](#11-environment-variables)
12. [Setup Instructions](#12-setup-instructions)
13. [Completed Work](#13-completed-work)
14. [Remaining / Pending Work](#14-remaining--pending-work)

---

## 1. Project Overview

QHCS is a full-stack web platform for a community lending programme. It replaces manual Excel-based credit evaluation with an automated, auditable, config-driven credit scoring engine.

**What it does:**
- Maintains a registry of community members, their loans, and repayment history
- Computes a credit score for each member based on their repayment behaviour and guarantor obligations
- Generates a credit report with a recommendation (Approve / Needs Review / Reject)
- Allows credit analysts and admins to record loan decisions with notes
- Provides a dashboard with repayment activity, risk distribution, and key stats

**Currency:** KWD (Kuwaiti Dinar)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Animations | Framer Motion |
| Charts | Recharts + custom SVG gauge |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + SSR middleware |
| Icons | Lucide React |
| Date handling | date-fns |

---

## 3. Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── dashboard/route.ts          — Dashboard stats + repayment activity chart
│   │   ├── decisions/route.ts          — Save analyst decisions
│   │   ├── import/route.ts             — CSV bulk import
│   │   ├── members/route.ts            — Member list with scores
│   │   ├── members/[id]/report/route.ts — Full credit report + scoring
│   │   └── score/config/route.ts       — Read/write scoring weights
│   ├── auth/callback/route.ts          — Supabase OAuth callback
│   ├── dashboard/page.tsx
│   ├── import/page.tsx
│   ├── login/page.tsx
│   ├── members/page.tsx
│   ├── report/[id]/page.tsx            — Full credit report UI
│   ├── settings/page.tsx               — Scoring weight editor
│   ├── unauthorized/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                        — Redirects to /dashboard
│   └── globals.css
├── components/
│   ├── charts/
│   │   ├── DashboardCharts.tsx         — Area chart + pie chart
│   │   ├── RepaymentChart.tsx          — Bar chart (paid vs missed)
│   │   ├── ScoreBreakdownChart.tsx     — Radar chart
│   │   └── ScoreGauge.tsx              — Animated arc gauge (0 to base×2)
│   ├── layout/
│   │   ├── AppLayout.tsx               — Auth guard wrapper
│   │   └── Sidebar.tsx
│   ├── providers/
│   │   └── AuthProvider.tsx            — Session context
│   └── ui/index.tsx                    — Shared UI components
├── lib/
│   ├── api-auth.ts                     — requireApiAuth() for API routes
│   ├── csv.ts                          — CSV parsing for import
│   ├── scoring.ts                      — Credit scoring engine (all logic here)
│   ├── supabase.ts                     — Supabase client factory functions
│   └── utils.ts                        — formatCurrency, formatDate, getScoreColor
├── middleware.ts                       — Edge auth guard
└── types/index.ts                      — All TypeScript interfaces
```

---

## 4. Database Schema

### Tables

#### `members`
| Column | Type | Notes |
|---|---|---|
| member_id | INTEGER | Primary key, set manually |
| member_name | TEXT | Required |
| mobile | TEXT | |
| mohalla | TEXT | Neighbourhood/area |
| created_at | TIMESTAMP | |

#### `loans`
| Column | Type | Notes |
|---|---|---|
| loan_id | BIGSERIAL | Auto-increment PK |
| member_id | INTEGER | FK → members |
| purpose | TEXT | |
| start_date | DATE | Loan disbursement date |
| amount | NUMERIC(12,2) | Principal |
| installments | INTEGER | Number of monthly installments |
| installment_amount | NUMERIC(12,2) | Expected monthly payment |
| repayment_start_date | DATE | First installment due |
| gold_value | NUMERIC(12,2) | Collateral gold value |
| status | TEXT | `'Open'` or `'Close'` |
| close_date | DATE | When loan was closed |
| gold_status | TEXT | `'Open'`, `'Returned'`, or `'Sold'` |
| guarantor_1_id .. guarantor_4_id | INTEGER | FK → members (up to 4 guarantors) |

#### `repayments`
| Column | Type | Notes |
|---|---|---|
| repayment_id | BIGSERIAL | Auto-increment PK |
| loan_id | BIGINT | FK → loans |
| member_id | INTEGER | FK → members |
| paid_date | DATE | Actual date of payment |
| paid_amount | NUMERIC(12,2) | Amount paid |

#### `credit_score_config`
| Column | Type | Notes |
|---|---|---|
| rule_name | TEXT | Primary key |
| weight | INTEGER | Value (positive or negative) |

#### `member_credit_scores`
| Column | Type | Notes |
|---|---|---|
| member_id | INTEGER | PK, FK → members |
| score | INTEGER | Cached score, upserted on every report view |
| last_updated | TIMESTAMP | |

#### `app_users`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID | PK, matches Supabase Auth user ID |
| role | TEXT | `'Admin'` or `'CreditAnalyst'` |
| email | TEXT | |

#### `loan_decisions`
| Column | Type | Notes |
|---|---|---|
| decision_id | BIGSERIAL | |
| loan_id | BIGINT | FK → loans |
| member_id | INTEGER | FK → members |
| ai_score | INTEGER | Score at time of decision |
| risk_level | TEXT | Low / Medium / High |
| ai_recommendation | TEXT | Approve / Reject / Needs Review |
| ai_reason | TEXT | |
| analyst_decision | TEXT | Approve / Reject / Override |
| analyst_notes | TEXT | |
| decision_date | TIMESTAMP | |

### Views

#### `loan_installment_schedule`
Generates one row per expected installment month per loan using `generate_series()`.

#### `missed_installments`
LEFT JOINs the schedule against repayments by month. Rows with no matching repayment before today = missed. **Note: this view is still in the schema but the scoring engine no longer uses it — missed months are computed in TypeScript from repayments directly.**

---

## 5. Authentication System

Four-layer architecture:

| Layer | File | What it does |
|---|---|---|
| Edge Middleware | `middleware.ts` | Checks Supabase session cookie on every request. Redirects unauthenticated users to `/login?redirectTo=<path>` |
| Client Guard | `AppLayout.tsx` | Shows "Verifying session…" while Supabase resolves. Hard-redirects if no session |
| Auth Context | `AuthProvider.tsx` | Provides `{ user, session, loading, role, signOut }` via React context |
| API Guard | `lib/api-auth.ts` | `requireApiAuth()` — called at the top of every API route. Returns 401 if no session |

**Supabase clients** (`lib/supabase.ts`):
- `createSupabaseBrowser()` — for client components
- `createSupabaseServer()` — for server components and route handlers
- `createSupabaseMiddleware()` — for middleware.ts
- `createServiceClient()` — bypasses RLS, used in all API routes

---

## 6. Scoring Engine

**File:** `src/lib/scoring.ts`

### Formula

```
final = BASE + own_loan_deltas + guarantor_deltas
final is clamped to [0, BASE × 2]
```

### Schedule Generation — `expectedMonths(loan)`

Builds the full expected payment schedule for a loan in two phases:

**Phase 1 — Original installment period**
Months 1 to `installments`, from `repayment_start_date`. Stops at today (or `close_date` for closed loans). These months have `overdue: false`.

**Phase 2 — Overdue period (open loans only)**
Months from `installments+1` to today, for loans that outlived their original schedule. These months have `overdue: true`. A loan started Aug 2018 with 10 installments has Phase 1 until May 2019, then Phase 2 from Jun 2019 → today.

### Month Classification — `classifyMonth()`

For each expected month, actual repayments are summed and compared to `installment_amount`:

| Payment received | Status | Scoring treatment |
|---|---|---|
| ≥ `partial_payment_threshold`% of installment | `full` | On-time or Late bonus/penalty |
| > 0 but < threshold% | `partial` | Partial penalty (counts toward cap) |
| 0, within original schedule | `missed` | Full missed penalty (counts toward cap) |
| 0, beyond original schedule | `overdue` | Full missed penalty (counts toward cap) |

**Important:** Even `overdue` months check actual repayments first. If the borrower paid in an overdue month, the payment is recognised. Only if nothing was paid does `overdue` apply.

### On-Time vs Late

A `full` payment is on-time if `paid_date` day-of-month ≤ 10, otherwise late.

### Recency Multiplier

Applied **per event** using the event's own date, not the loan start date:

| Event age | Multiplier |
|---|---|
| ≤ 12 months ago | 1.5× |
| ≤ 24 months ago | 1.2× |
| > 24 months ago | 1.0× |

This means a missed payment last month on a 5-year-old loan is penalised at 1.5×, not 1.0×.

### Missed Payment Cap

The combined partial + missed deduction per loan is capped at `missed_payment_cap` (default 200) **before** the guarantor scale is applied. This prevents one problematic loan from destroying a score entirely.

### Guarantor Propagation

Every borrower event on a guaranteed loan flows to each guarantor at **50%** (GUARANTOR_SCALE) of the borrower's own impact, using the same weights:

- Borrower on-time → guarantor gets +`on_time_weight × recency × 0.5`
- Borrower missed → guarantor gets −`missed_weight × recency × 0.5` (still capped at `missed_payment_cap × 0.5`)
- Borrower closes loan → guarantor gets +`loan_closed_weight × recency × 0.5`

### Risk Level Thresholds (percentage-based)

| Risk | Threshold | At base=500 |
|---|---|---|
| Low | ≥ 70% of max | ≥ 700 |
| Medium | ≥ 40% of max | ≥ 400 |
| High | < 40% of max | < 400 |

### Score Grades

| Grade | % of max | At base=500 |
|---|---|---|
| Excellent | ≥ 85% | ≥ 850 |
| Good | ≥ 70% | ≥ 700 |
| Fair | ≥ 55% | ≥ 550 |
| Poor | ≥ 40% | ≥ 400 |
| Critical | < 40% | < 400 |

### Configurable Rules (`credit_score_config` table)

| rule_name | Default | Description |
|---|---|---|
| `base_score` | 500 | Starting score for every member |
| `on_time_payment` | 50 | Bonus per on-time month |
| `late_payment` | 30 | Penalty per late month |
| `missed_payment` | 100 | Penalty per missed/overdue month |
| `partial_payment_threshold` | 90 | Below this % of installment = partial |
| `partial_payment_penalty` | 50 | Penalty per partial month |
| `missed_payment_cap` | 200 | Max combined missed+partial deduction per loan |
| `loan_closed_successfully` | 100 | Bonus when loan fully repaid |
| `gold_sold` | 150 | Penalty when collateral gold is sold |

All rules are editable from the **Settings** page. Changes take effect immediately on the next report view.

### Pending Amount Calculation

Added to the report route (available in response, display pending in UI):

- **Own loan pending:** `loan.amount - sum(repayments.paid_amount)` where `loan.status = 'Open'`
- **Guaranteed loan pending:** same formula applied to the borrower's repayments on that loan
- **Summary totals:** `ownTotalPending` and `guarantorTotalPending` are returned at the top level of the report API response

> **Note:** The pending amount display in `report-page.tsx` was reverted due to rendering errors. The data is available from the API — the UI implementation is in the **Remaining Work** section.

---

## 7. API Routes

### `GET /api/dashboard`
Returns platform-wide stats and the 6-month repayment activity chart.

**Response:**
```ts
{
  totalMembers: number
  activeLoans: number
  closedLoans: number
  missedInstallmentsCount: number   // computed from loan schedules, open loans only
  highRiskMembers: number
  avgCreditScore: number
  monthlyActivity: { month, repayments, missed }[]
  riskDistribution: { name, value, color }[]
}
```

**How `monthlyActivity` is built:**
Fetches all open loans + their repayments. For each loan, classifies every month in the 6-month window using `classifyMonth()`. `full` → repayments count, anything else → missed count.

---

### `GET /api/members?q=`
Returns member list with cached scores. Limit 50, searchable by name/mobile/mohalla or exact member_id.

---

### `GET /api/members/[id]/report`
The main scoring endpoint. Called every time a credit report is opened.

**Execution order:**
1. Fetch member + own loans + config in parallel
2. Fetch own repayments (all time, no date filter)
3. Fetch guaranteed loans (loans where member appears as guarantor_1..4)
4. For each guaranteed loan: fetch borrower's repayments in parallel
5. Run `extractBorrowerBehaviour()` for each guaranteed loan
6. Run `calculateCreditScore()` — consolidates own loans + guarantor exposure
7. Compute pending amounts for own and guaranteed loans
8. Upsert result to `member_credit_scores`
9. Return full payload

**Response includes:**
```ts
{
  member, score, riskLevel, recommendation, reason,
  loans,              // own loans with paidCount, partialCount, missedCount, totalPaid, pending
  guaranteedLoans,    // guaranteed loans with borrowerScore, counts, borrowerTotalPaid, guaranteedPending
  missedInstallments, // array of { loan_id, installment_due_date, overdue }
  breakdown,          // full ScoreBreakdown with guarantorBreakdowns[]
  repaymentChartData, // last 12 months paid/partial/missed
  roles,              // { isBorrower, isGuarantor, isBoth }
  ownTotalPending,
  guarantorTotalPending,
}
```

---

### `GET /api/score/config`
Returns all rows from `credit_score_config`.

### `PUT /api/score/config`
Bulk-updates scoring weights. Body: `CreditScoreConfig[]`.

---

### `POST /api/decisions`
Saves analyst decision to `loan_decisions`.

---

### `POST /api/import`
Processes uploaded CSV, inserts members and loans.

---

## 8. Pages & Features

### `/login`
Split-panel design. Feature ticker on the left. Login form on the right with show/hide password. Shake animation on error. Redirects to `?redirectTo` path after login.

---

### `/dashboard`
- 6 stat cards: Total Members, Active Loans, Loans Closed, Missed Installments, High Risk Members, Avg Credit Score
- **Repayment Activity** area chart — last 6 months, shows paid (blue) and missed (red) per month. Computed from loan schedules — not just repayment row counts.
- **Risk Distribution** pie chart — Low / Medium / High counts by score

---

### `/members`
Searchable member table. Each row shows name, ID, mobile, mohalla, cached credit score with colour badge. Click any row → credit report.

---

### `/report/[id]`
Full credit report for one member.

Sections (in order):
1. **Member header** — name, ID, mobile, mohalla, risk badge, dual-role badge
2. **Score gauge** — animated arc from 0 to BASE×2, shows score/max and grade label
3. **Score breakdown** — radar chart + table showing every contributing factor
4. **Repayment chart** — last 12 months, paid/partial/missed per month
5. **Missed installments alert** — lists affected dates, distinguishes overdue from regular missed
6. **Own loan history** — expandable rows per loan with repayment timeline
7. **Guarantor exposure** — per-guaranteed-loan card with borrower stats and score impact (expandable)
8. **Analyst decision** — Approve / Reject / Override buttons with notes

---

### `/settings`
Editable scoring weights for all 9 configurable rules. Changes saved to DB via PUT `/api/score/config`. Includes:
- Info card explaining base score and recency multiplier
- Guarantor propagation explanation card
- Risk level reference card showing % thresholds and example point ranges

---

### `/import`
Upload CSV → preview rows → confirm → inserts members and loans.

---

## 9. File Deployment Reference

These are all the files changed from the original build. Replace your project files with these versions:

| Output file | Project path |
|---|---|
| `scoring.ts` | `src/lib/scoring.ts` |
| `utils.ts` | `src/lib/utils.ts` |
| `ScoreGauge.tsx` | `src/components/charts/ScoreGauge.tsx` |
| `report-page.tsx` | `src/app/report/[id]/page.tsx` |
| `report-route.ts` | `src/app/api/members/[id]/report/route.ts` |
| `members-page.tsx` | `src/app/members/page.tsx` |
| `dashboard-route.ts` | `src/app/api/dashboard/route.ts` |
| `settings-page.tsx` | `src/app/settings/page.tsx` |
| `schema.sql` | Root — run in Supabase SQL Editor |

---

## 10. SQL Scripts to Run

### Full schema (new installation)
Run `schema.sql` in Supabase SQL Editor. This creates all tables, views, RLS policies, and the auth trigger.

### Existing database — add new scoring rules
If you already have the database set up and just need to add the new rules from recent sessions, run:

```sql
-- Add partial payment rules
INSERT INTO credit_score_config (rule_name, weight)
VALUES
  ('partial_payment_threshold', 90),
  ('partial_payment_penalty',   50),
  ('missed_payment_cap',       200)
ON CONFLICT (rule_name) DO NOTHING;

-- Update base_score if it's still at old value
INSERT INTO credit_score_config (rule_name, weight)
VALUES ('base_score', 500)
ON CONFLICT (rule_name) DO UPDATE SET weight = 500;
```

### Remove RLS (optional — recommended for performance)
If you're experiencing slow queries and want to remove Row Level Security (safe because all DB access goes through service_role API routes anyway):

```sql
ALTER TABLE members              DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans                DISABLE ROW LEVEL SECURITY;
ALTER TABLE repayments           DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_credit_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_score_config  DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE loan_decisions       DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_members"        ON members;
DROP POLICY IF EXISTS "auth_read_loans"          ON loans;
DROP POLICY IF EXISTS "auth_read_repayments"     ON repayments;
DROP POLICY IF EXISTS "auth_read_scores"         ON member_credit_scores;
DROP POLICY IF EXISTS "auth_read_config"         ON credit_score_config;
DROP POLICY IF EXISTS "auth_read_decisions"      ON loan_decisions;
DROP POLICY IF EXISTS "auth_read_app_users"      ON app_users;
DROP POLICY IF EXISTS "service_all_members"      ON members;
DROP POLICY IF EXISTS "service_all_loans"        ON loans;
DROP POLICY IF EXISTS "service_all_repayments"   ON repayments;
DROP POLICY IF EXISTS "service_all_scores"       ON member_credit_scores;
DROP POLICY IF EXISTS "service_all_config"       ON credit_score_config;
DROP POLICY IF EXISTS "service_all_decisions"    ON loan_decisions;
DROP POLICY IF EXISTS "service_all_app_users"    ON app_users;
```

---

## 11. Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

All three values are found in: **Supabase Dashboard → Project Settings → API**

---

## 12. Setup Instructions

1. **Run schema** — open `schema.sql` in Supabase Dashboard → SQL Editor → Run
2. **Environment** — copy `.env.example` to `.env.local`, fill in your Supabase credentials
3. **Install & run** — `npm install && npm run dev` → open `http://localhost:3000`
4. **Create first user** — Supabase Dashboard → Authentication → Users → Add User
5. **Promote to Admin** — in Supabase SQL Editor:
   ```sql
   UPDATE app_users SET role = 'Admin' WHERE email = 'your@email.com';
   ```
6. **Add new scoring config rows** — run the SQL from section 10 above if upgrading an existing DB

---

## 13. Completed Work

### Platform foundation
- [x] Full Next.js 14 app with TypeScript, TailwindCSS, Framer Motion
- [x] Supabase PostgreSQL schema — members, loans, repayments, scores, config, decisions
- [x] 4-layer authentication system (middleware, AppLayout, AuthProvider, API guard)
- [x] Role-based access: Admin and CreditAnalyst
- [x] CSV import for bulk member/loan data
- [x] KWD currency formatting throughout

### Scoring engine
- [x] 500-point base score (configurable), max 1000
- [x] Per-event recency multiplier using actual event dates (not loan start date)
- [x] Three-tier month classification: full / partial / missed
- [x] Partial payment threshold (90% of installment, configurable)
- [x] Partial payment penalty (configurable, separate from full missed penalty)
- [x] Overdue period extension — open loans tracked beyond original installment count all the way to today
- [x] Missed payment cap per loan (200 pts default, configurable)
- [x] Guarantor score propagation at 50% of borrower events
- [x] Dual-role support — member can be both borrower and guarantor, consolidated in one score
- [x] Risk levels based on % of max (scale-independent)
- [x] Score grades: Excellent / Good / Fair / Poor / Critical
- [x] All weights configurable from Settings UI

### Dashboard
- [x] 6 stat cards with correct counts (using `count: exact` queries to avoid 1000-row Supabase truncation)
- [x] Repayment Activity chart showing real paid vs missed from loan schedules (not just repayment row counts)
- [x] Risk Distribution pie chart
- [x] Missed installments count from scoring engine (not broken DB view)

### Credit report page
- [x] Animated score gauge (0 to base×2, dynamic max label)
- [x] Full score breakdown table (own loans + guarantor contributions)
- [x] Radar chart visualisation
- [x] Repayment history chart (last 12 months, paid/partial/missed)
- [x] Missed/overdue installments alert with date list
- [x] Own loan history with expandable repayment rows
- [x] Guarantor exposure section with per-loan score impact breakdown
- [x] Analyst decision panel (Approve / Reject / Override)
- [x] Dual-role badges (Borrower + Guarantor / Guarantor Only)
- [x] Pending amount fields computed and returned from API (`ownTotalPending`, `guarantorTotalPending`, per-loan `pending`, per-guaranteed-loan `guaranteedPending`)

### Settings page
- [x] All 9 scoring rules displayed with correct sign indicators and descriptions
- [x] Partial payment threshold shown with `%` unit
- [x] Missed payment cap with extended max input
- [x] Risk level reference card

---

## 14. Remaining / Pending Work

### High priority

**Pending amounts display on credit report** *(reverted due to rendering error)*
The API already returns `ownTotalPending`, `guarantorTotalPending`, and per-loan `pending`/`guaranteedPending`. A new `PendingCard` component needs to be added to `report-page.tsx` to display:
- Own loans: total pending + breakdown by loan
- Guaranteed loans: total pending + breakdown by borrower name and amount
- Combined exposure note when both sides have outstanding balances
- Per-loan pending figure shown inline in `LoanRow` and `GuarantorLoanCard`

**Investigate and fix report page rendering error**
The error was introduced in the last session when `report-page.tsx` was rewritten with the `PendingCard` component. The cause was not diagnosed — likely a type mismatch between the new `ReportData` interface fields and existing component props. Needs debugging.

---

### Medium priority

**Partial payment count in the report UI**
`extractBorrowerBehaviour()` now returns `partialCount` and the API returns it per loan. The report page currently shows `paidCount ✓` and `missedCount ✗` in the loan row header. A `partialCount ~` indicator should be added alongside these.

**Repayment chart — partial bar**
The `repaymentChartData` already includes a `partial` field per month alongside `paid` and `missed`. The `RepaymentChart` component currently only renders the `paid` and `missed` bars. A third amber bar for `partial` months should be added.

**Settings page info card text**
The info card still says example weights from an old scale. Should be updated to reflect the current 500-scale defaults and explain the partial payment system.

**Guarantor exposure — show pending in list view**
In `GuarantorLoanCard`, the expanded view has the amount/paid/pending grid. The collapsed header row should also show the pending figure for quick scanning (similar to how LoanRow shows it).

---

### Lower priority

**Import page validation**
CSV import does basic parsing but has no validation for duplicate member IDs, overlapping guarantor constraints, or invalid date formats. Should show per-row error messages before confirming import.

**Loan decisions history**
`loan_decisions` table is populated when analysts make decisions, but there is no UI to view past decisions for a member. A decision history section could be added to the credit report.

**Score history over time**
`member_credit_scores` only stores the current score. A separate `member_score_history` table could track score over time and show a trend line on the report.

**Bulk score recalculation**
Currently scores are only updated when a specific member's report page is opened. An admin function to recalculate scores for all members in one operation would be useful after changing scoring weights in Settings.

**Members page pagination**
The members list is limited to 50 results with search. For large datasets, proper pagination (or infinite scroll) is needed.

**Mobile responsiveness review**
The report page has several `hidden md:block` elements. A full mobile review pass would ensure all data is accessible on small screens.

---

*Documentation generated: March 2026 — QHCS v3.0*
