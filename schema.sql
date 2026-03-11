-- =====================================================================
-- QHCS — Community Loan Credit Rating Platform
-- Complete Supabase PostgreSQL Schema
-- Run this entire file in your Supabase SQL Editor
-- =====================================================================

-- ─── Members ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    member_id   INTEGER PRIMARY KEY,
    member_name TEXT    NOT NULL,
    mobile      TEXT,
    mohalla     TEXT,
    created_at  TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_mobile ON members(mobile);

-- ─── Loans ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
    loan_id              BIGSERIAL PRIMARY KEY,
    member_id            INTEGER       NOT NULL,
    purpose              TEXT,
    start_date           DATE          NOT NULL,
    amount               NUMERIC(12,2) NOT NULL,
    installments         INTEGER       NOT NULL,
    installment_amount   NUMERIC(12,2) NOT NULL,
    repayment_start_date DATE          NOT NULL,
    gold_value           NUMERIC(12,2),
    status               TEXT CHECK (status IN ('Open','Close')) DEFAULT 'Open',
    close_date           DATE,
    gold_status          TEXT CHECK (gold_status IN ('Open','Returned','Sold')) DEFAULT 'Open',
    guarantor_1_id       INTEGER,
    guarantor_2_id       INTEGER,
    guarantor_3_id       INTEGER,
    guarantor_4_id       INTEGER,
    created_at           TIMESTAMP DEFAULT now(),

    FOREIGN KEY (member_id)      REFERENCES members(member_id),
    FOREIGN KEY (guarantor_1_id) REFERENCES members(member_id),
    FOREIGN KEY (guarantor_2_id) REFERENCES members(member_id),
    FOREIGN KEY (guarantor_3_id) REFERENCES members(member_id),
    FOREIGN KEY (guarantor_4_id) REFERENCES members(member_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_open_loan_per_member ON loans(member_id)      WHERE status = 'Open';
CREATE UNIQUE INDEX IF NOT EXISTS unique_open_guarantor1      ON loans(guarantor_1_id) WHERE status = 'Open';
CREATE UNIQUE INDEX IF NOT EXISTS unique_open_guarantor2      ON loans(guarantor_2_id) WHERE status = 'Open';
CREATE UNIQUE INDEX IF NOT EXISTS unique_open_guarantor3      ON loans(guarantor_3_id) WHERE status = 'Open';
CREATE UNIQUE INDEX IF NOT EXISTS unique_open_guarantor4      ON loans(guarantor_4_id) WHERE status = 'Open';
CREATE INDEX IF NOT EXISTS idx_loans_member     ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_status     ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_start_date ON loans(start_date);

-- ─── Repayments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repayments (
    repayment_id BIGSERIAL     PRIMARY KEY,
    loan_id      BIGINT        NOT NULL,
    member_id    INTEGER       NOT NULL,
    paid_date    DATE          NOT NULL,
    paid_amount  NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMP DEFAULT now(),

    FOREIGN KEY (loan_id)   REFERENCES loans(loan_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);
CREATE INDEX IF NOT EXISTS idx_repayments_loan   ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayments_member ON repayments(member_id);

-- ─── Installment schedule VIEW ────────────────────────────────────────────────
CREATE OR REPLACE VIEW loan_installment_schedule AS
SELECT
    l.loan_id,
    l.member_id,
    generate_series(
        l.repayment_start_date,
        l.repayment_start_date + (l.installments - 1) * interval '1 month',
        interval '1 month'
    ) AS installment_due_date,
    l.installment_amount
FROM loans l;

-- ─── Missed installments VIEW ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW missed_installments AS
SELECT
    s.loan_id,
    s.member_id,
    s.installment_due_date
FROM loan_installment_schedule s
LEFT JOIN repayments r
    ON  s.loan_id = r.loan_id
    AND date_trunc('month', r.paid_date) = date_trunc('month', s.installment_due_date)
WHERE r.repayment_id IS NULL
  AND s.installment_due_date < CURRENT_DATE;

-- ─── Credit score config ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_score_config (
    rule_name TEXT PRIMARY KEY,
    weight    INTEGER
);

INSERT INTO credit_score_config VALUES
    ('on_time_payment',          5),
    ('late_payment',            -3),
    ('missed_payment',         -10),
    ('loan_closed_successfully', 10),
    ('gold_sold',              -15),
    ('guarantor_default',       -8)
ON CONFLICT (rule_name) DO NOTHING;

-- ─── Member credit scores ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_credit_scores (
    member_id    INTEGER PRIMARY KEY,
    score        INTEGER   DEFAULT 0,
    last_updated TIMESTAMP DEFAULT now(),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);

-- ─── App users (linked to Supabase Auth) ──────────────────────────────────────
-- NOTE: user_id must match auth.users.id (UUID)
CREATE TABLE IF NOT EXISTS app_users (
    user_id    UUID PRIMARY KEY,
    role       TEXT CHECK (role IN ('Admin', 'CreditAnalyst')) NOT NULL DEFAULT 'CreditAnalyst',
    email      TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- ─── Auto-create app_user on Supabase Auth sign-up ───────────────────────────
-- Run this to create a trigger that auto-inserts into app_users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.app_users (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'CreditAnalyst')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- ─── Loan import staging ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_import_stage (
    member_id            INTEGER,
    member_name          TEXT,
    mobile               TEXT,
    mohalla              TEXT,
    purpose              TEXT,
    start_date           DATE,
    amount               NUMERIC,
    installments         INTEGER,
    installment_amount   NUMERIC,
    repayment_start_date DATE,
    gold_value           NUMERIC,
    guarantor_1_id       INTEGER,
    guarantor_2_id       INTEGER,
    guarantor_3_id       INTEGER,
    guarantor_4_id       INTEGER
);

-- ─── Loan decisions (audit trail) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_decisions (
    decision_id      BIGSERIAL PRIMARY KEY,
    loan_id          BIGINT    NOT NULL,
    member_id        INTEGER   NOT NULL,
    ai_score         INTEGER,
    risk_level       TEXT CHECK (risk_level IN ('Low', 'Medium', 'High')),
    ai_recommendation TEXT CHECK (ai_recommendation IN ('Approve', 'Reject', 'Needs Review')),
    ai_reason        TEXT,
    analyst_decision TEXT CHECK (analyst_decision IN ('Approve', 'Reject', 'Override')),
    analyst_notes    TEXT,
    decision_date    TIMESTAMP DEFAULT now(),

    FOREIGN KEY (loan_id)   REFERENCES loans(loan_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);
CREATE INDEX IF NOT EXISTS idx_decisions_member ON loan_decisions(member_id);
CREATE INDEX IF NOT EXISTS idx_decisions_loan   ON loan_decisions(loan_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

ALTER TABLE members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_score_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_decisions      ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data
CREATE POLICY "auth_read_members"        ON members             FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_loans"          ON loans               FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_repayments"     ON repayments          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_scores"         ON member_credit_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_config"         ON credit_score_config  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_decisions"      ON loan_decisions       FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_app_users"      ON app_users            FOR SELECT TO authenticated USING (true);

-- Service role has full unrestricted access (used by API routes)
CREATE POLICY "service_all_members"      ON members              FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_loans"        ON loans                FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_repayments"   ON repayments           FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_scores"       ON member_credit_scores  FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_config"       ON credit_score_config   FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_decisions"    ON loan_decisions        FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_app_users"    ON app_users             FOR ALL TO service_role USING (true);

-- =====================================================================
-- HOW TO ADD YOUR FIRST ADMIN USER
-- =====================================================================
-- 1. Create a user in Supabase Dashboard → Authentication → Users → Add User
-- 2. Then run:
--    UPDATE app_users SET role = 'Admin' WHERE email = 'your@email.com';
-- =====================================================================
