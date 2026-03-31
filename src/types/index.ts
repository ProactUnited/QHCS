export interface Member {
  member_id: number
  member_name: string
  mobile: string | null
  mohalla: string | null
  created_at: string
}

export interface Loan {
  loan_id: number
  member_id: number
  purpose: string | null
  start_date: string
  amount: number
  installments: number
  installment_amount: number
  repayment_start_date: string
  gold_value: number | null
  status: 'Open' | 'Close'
  close_date: string | null
  gold_status: 'Open' | 'Returned' | 'Sold'
  guarantor_1_id: number | null
  guarantor_2_id: number | null
  guarantor_3_id: number | null
  guarantor_4_id: number | null
  created_at: string
}

export interface Repayment {
  repayment_id: number
  loan_id: number
  member_id: number
  paid_date: string
  paid_amount: number
  created_at: string
}

export interface MemberCreditScore {
  member_id: number
  score: number
  last_updated: string
}

export interface CreditScoreConfig {
  rule_name: string
  weight: number
}

export interface LoanDecision {
  decision_id: number
  loan_id: number
  member_id: number
  ai_score: number | null
  risk_level: 'Low' | 'Medium' | 'High' | null
  ai_recommendation: 'Approve' | 'Reject' | 'Needs Review' | null
  ai_reason: string | null
  analyst_decision: 'Approve' | 'Reject' | 'Override' | null
  analyst_notes: string | null
  decision_date: string
}

export interface MissedInstallment {
  loan_id: number
  member_id: number
  installment_due_date: string
}

export interface LoanWithRepayments extends Loan {
  repayments: Repayment[]
  paidCount: number
  missedCount: number
  totalPaid: number
  totalPending: number
}

export interface GuarantorLoanBreakdown {
  loanId: number
  borrowerName: string
  onTimeBonus: number
  lateDeduction: number
  missedDeduction: number
  closedBonus: number
  goldSoldDeduction: number
  netImpact: number
}

export interface ScoreBreakdown {
  base: number
  onTimeBonus: number
  lateDeduction: number
  missedDeduction: number
  closedBonus: number
  goldSoldDeduction: number
  guarantorOnTimeBonus: number
  guarantorLateDeduction: number
  guarantorMissedDeduction: number
  guarantorClosedBonus: number
  guarantorGoldSoldDeduction: number
  guarantorNetImpact: number
  final: number
  guarantorBreakdowns: GuarantorLoanBreakdown[]
}

export interface GuaranteedLoanDisplay {
  loan: Loan
  borrower: Member
  borrowerScore: number
  borrowerOnTime: number
  borrowerLate: number
  borrowerMissed: number
  borrowerClosed: boolean
  goldSold: boolean
  guaranteedPending: number
  borrowerTotalPaid: number
  borrowerRepayments: Repayment[]
}

export interface DashboardStats {
  totalMembers: number
  activeLoans: number
  closedLoans: number
  missedInstallmentsCount: number
  highRiskMembers: number
  avgCreditScore: number
}