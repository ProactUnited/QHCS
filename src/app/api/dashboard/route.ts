import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireApiAuth } from "@/lib/api-auth";
import { expectedMonths, getLoanStartDate } from "@/lib/scoring";

export async function GET() {
  const unauth = await requireApiAuth();
  if (unauth) return unauth;

  try {
    const supabase = createServiceClient();

    const [membersRes, openLoansRes, closedLoansRes, scoresRes] =
      await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase
          .from("loans")
          .select("*", { count: "exact", head: true })
          .eq("status", "Open"),
        supabase
          .from("loans")
          .select("*", { count: "exact", head: true })
          .eq("status", "Close"),
        supabase.from("member_credit_scores").select("score"),
      ]);

    const scores = scoresRes.data ?? [];

    // ── Config ──────────────────────────────────────────────────────────────
    const { data: configData } = await supabase
      .from("credit_score_config")
      .select("rule_name, weight");
    const config = configData ?? [];
    const threshold = Math.abs(
      Number(
        config.find((c) => c.rule_name === "partial_payment_threshold")
          ?.weight ?? 90,
      ),
    );
    const loanStartDateStr = getLoanStartDate(config);

    // ── 6-month window ───────────────────────────────────────────────────────
    const windowMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      windowMonths.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      );
    }
    const windowSet = new Set(windowMonths);
    const windowStart = windowMonths[0]; // e.g. '2025-11'
    const windowEnd = windowMonths[windowMonths.length - 1]; // e.g. '2026-04'

    // ── Fetch all loans (paginated) ──────────────────────────────────────────
    let allLoans: any[] = [];
    let loanOffset = 0;
    while (true) {
      const { data: page } = await supabase
        .from("loans")
        .select(
          "loan_id, member_id, repayment_start_date, installments, installment_amount, status, close_date, start_date, gold_status",
        )
        .range(loanOffset, loanOffset + 999);
      if (!page || page.length === 0) break;
      allLoans.push(...page.map((l) => ({ ...l, loan_id: Number(l.loan_id) })));
      if (page.length < 1000) break;
      loanOffset += 1000;
    }

    // Filter by configured start date
    allLoans = allLoans.filter((l) => l.start_date >= loanStartDateStr);

    // ── Key fix: only keep loans whose schedule overlaps the 6-month window ──
    // A loan is relevant if it has at least one expected month in the window.
    // This means:
    //   - repayment_start_date <= windowEnd (loan started before window ends)
    //   - AND (status=Open OR close_date >= windowStart-01)
    const chartLoans = allLoans.filter((loan) => {
      if (!loan.repayment_start_date) return false;
      const loanStart = loan.repayment_start_date.slice(0, 7); // YYYY-MM
      if (loanStart > windowEnd) return false; // loan starts after window
      if (loan.status === "Close") {
        const closeMonth = loan.close_date?.slice(0, 7) ?? "0000-00";
        if (closeMonth < windowStart) return false; // closed before window started
      }
      return true;
    });

    // ── Fetch repayments for chart loans only (paginated, 1000/page) ─────────
    const chartLoanIds = chartLoans.map((l) => l.loan_id);
    let allRepayments: {
      loan_id: number;
      paid_date: string;
      paid_amount: number;
    }[] = [];

    // Fetch in batches of 100 loan IDs (Supabase .in() limit)
    for (let i = 0; i < chartLoanIds.length; i += 100) {
      const batchIds = chartLoanIds.slice(i, i + 100);
      let offset = 0;
      while (true) {
        const { data: page, error } = await supabase
          .from("repayments")
          .select("loan_id, paid_date, paid_amount")
          .in("loan_id", batchIds)
          .range(offset, offset + 999);
        if (error || !page || page.length === 0) break;
        allRepayments.push(
          ...page.map((r) => ({ ...r, loan_id: Number(r.loan_id) })),
        );
        if (page.length < 1000) break;
        offset += 1000;
      }
    }

    // ── Build monthly chart data ─────────────────────────────────────────────
    // const monthlyMap: Record<string, { repayments: number; missed: number }> = {}
    // for (const m of windowMonths) monthlyMap[m] = { repayments: 0, missed: 0 }

    // for (const loan of chartLoans) {
    //   const installAmt = Number(loan.installment_amount)
    //   const schedule = expectedMonths(loan as any)

    //   for (const { month, overdue } of schedule) {
    //     if (!windowSet.has(month)) continue

    //     // For chart purposes: check actual repayments even for overdue months
    //     const paid = allRepayments
    //       .filter(r => r.loan_id === loan.loan_id && r.paid_date.slice(0, 7) === month)
    //       .reduce((sum, r) => sum + Number(r.paid_amount), 0)

    //     const isFull = paid > 0 && (paid / installAmt) * 100 >= threshold

    //     if (isFull) {
    //       monthlyMap[month].repayments++
    //     } else {
    //       monthlyMap[month].missed++
    //     }
    //   }
    // }

    const monthlyMap: Record<
      string,
      { repayments: number; partial: number; missed: number }
    > = {};
    for (const m of windowMonths)
      monthlyMap[m] = { repayments: 0, partial: 0, missed: 0 };

    for (const loan of chartLoans) {
      const installAmt = Number(loan.installment_amount);
      const schedule = expectedMonths(loan as any);

      for (const { month, overdue } of schedule) {
        if (!windowSet.has(month)) continue;

        const paid = allRepayments
          .filter(
            (r) =>
              r.loan_id === loan.loan_id && r.paid_date.slice(0, 7) === month,
          )
          .reduce((sum, r) => sum + Number(r.paid_amount), 0);

        if (paid === 0) {
          monthlyMap[month].missed++;
        } else if ((paid / installAmt) * 100 >= threshold) {
          monthlyMap[month].repayments++;
        } else {
          monthlyMap[month].partial++; // ← paid something but below threshold
        }
      }
    }

    // ── All-time missed installments (stat card) ─────────────────────────────
    let missedInstallmentsCount = 0;
    for (const loan of allLoans) {
      const installAmt = Number(loan.installment_amount);
      const schedule = expectedMonths(loan as any);
      for (const { month, overdue } of schedule) {
        const paid = allRepayments
          .filter(
            (r) =>
              r.loan_id === loan.loan_id && r.paid_date.slice(0, 7) === month,
          )
          .reduce((sum, r) => sum + Number(r.paid_amount), 0);
        const isFull = paid > 0 && (paid / installAmt) * 100 >= threshold;
        if (!isFull) missedInstallmentsCount++;
      }
    }

    // ── Format output ────────────────────────────────────────────────────────
    // const monthlyActivity = windowMonths.map((month) => ({
    //   month: new Date(month + "-01").toLocaleDateString("en-US", {
    //     month: "short",
    //   }),
    //   repayments: monthlyMap[month].repayments,
    //   missed: monthlyMap[month].missed,
    // }));

    const monthlyActivity = windowMonths.map((month) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", {
        month: "short",
      }),
      repayments: monthlyMap[month].repayments,
      partial: monthlyMap[month].partial,
      missed: monthlyMap[month].missed,
    }));

    const highRisk = scores.filter((s) => s.score < 400).length;

    return NextResponse.json({
      totalMembers: membersRes.count ?? 0,
      activeLoans: openLoansRes.count ?? 0,
      closedLoans: closedLoansRes.count ?? 0,
      missedInstallmentsCount,
      highRiskMembers: highRisk,
      avgCreditScore: scores.length
        ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
        : 0,
      monthlyActivity,
      riskDistribution: [
        {
          name: "Low Risk",
          value: scores.filter((s) => s.score >= 700).length,
          color: "#10b981",
        },
        {
          name: "Medium Risk",
          value: scores.filter((s) => s.score >= 400 && s.score < 700).length,
          color: "#fbbf24",
        },
        { name: "High Risk", value: highRisk, color: "#f87171" },
      ],
    });
  } catch (error: any) {
    console.error("[dashboard]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import { createServiceClient } from "@/lib/supabase/service";
// import { requireApiAuth } from "@/lib/api-auth";
// import { expectedMonths, classifyMonth, getLoanStartDate } from "@/lib/scoring";

// export async function GET() {
//   const unauth = await requireApiAuth();
//   if (unauth) return unauth;

//   try {
//     const supabase = createServiceClient();

//     // ── Counts for members and loans ─────────────────────────────────────────────
//     const [membersRes, openLoansRes, closedLoansRes, scoresRes] =
//       await Promise.all([
//         supabase.from("members").select("*", { count: "exact", head: true }),
//         supabase
//           .from("loans")
//           .select("*", { count: "exact", head: true })
//           .eq("status", "Open"),
//         supabase
//           .from("loans")
//           .select("*", { count: "exact", head: true })
//           .eq("status", "Close"),
//         supabase.from("member_credit_scores").select("score"),
//       ]);

//     const scores = scoresRes.data ?? [];

//     // ── Fetch config ────────────────────────────────────────────────────────
//     const { data: configData } = await supabase
//       .from("credit_score_config")
//       .select("rule_name, weight");
//     const config = configData ?? [];
//     const threshold = config.find(
//       (c) => c.rule_name === "partial_payment_threshold",
//     )
//       ? Math.abs(
//           Number(
//             config.find((c) => c.rule_name === "partial_payment_threshold")!
//               .weight,
//           ),
//         )
//       : 90;
//     const loanStartDateStr = getLoanStartDate(config);

//     // ── Fetch all loans ──────────────────────────────────────────────────────
//     let allLoans: any[] = [];
//     const LOAN_PAGE = 10000;
//     let loanOffset = 0;
//     while (true) {
//       const { data: loanPage } = await supabase
//         .from("loans")
//         .select(
//           "loan_id, member_id, repayment_start_date, installments, installment_amount, status, close_date, start_date, gold_status",
//         )
//         .range(loanOffset, loanOffset + LOAN_PAGE - 1);
//       if (!loanPage || loanPage.length === 0) break;
//       allLoans.push(
//         ...loanPage.map((l) => ({ ...l, loan_id: Number(l.loan_id) })),
//       );
//       if (loanPage.length < LOAN_PAGE) break;
//       loanOffset += LOAN_PAGE;
//     }

//     // Filter loans by start date (only loans from configured date onwards)
//     allLoans = allLoans.filter((loan) => loan.start_date >= loanStartDateStr);

//     const loanIds = allLoans.map((l) => l.loan_id);

//     // ── 6-month window (YYYY-MM strings, oldest first) ─────────────────────
//     const windowMonths: string[] = [];
//     for (let i = 5; i >= 0; i--) {
//       const d = new Date();
//       d.setMonth(d.getMonth() - i);
//       const y = d.getFullYear();
//       const m = String(d.getMonth() + 1).padStart(2, "0");
//       windowMonths.push(`${y}-${m}`);
//     }
//     const windowSet = new Set(windowMonths);
//     const sixMonthsAgo = windowMonths[0] + "-01";

//     // ── Fetch all repayments (no loan filter) ───────────────────────────────
//     let allRepayments: {
//       loan_id: number;
//       paid_date: string;
//       paid_amount: number;
//     }[] = [];
//     const PAGE_SIZE = 10000;
//     let offset = 0;
//     while (true) {
//       const { data: page, error } = await supabase
//         .from("repayments")
//         .select("loan_id, paid_date, paid_amount")
//         .range(offset, offset + PAGE_SIZE - 1);

//       if (error) {
//         console.error("Error fetching repayments:", error);
//         break;
//       }

//       if (!page || page.length === 0) break;

//       allRepayments.push(
//         ...page.map((r) => ({ ...r, loan_id: Number(r.loan_id) })),
//       );
//       if (page.length < PAGE_SIZE) break;
//       offset += PAGE_SIZE;
//     }

//     // ── Build monthly chart data ────────────────────────────────────────────
//     const monthlyMap: Record<string, { repayments: number; missed: number }> =
//       {};
//     for (const m of windowMonths) {
//       monthlyMap[m] = { repayments: 0, missed: 0 };
//     }

//     for (const loan of allLoans) {
//       const installAmt = Number(loan.installment_amount);
//       const schedule = expectedMonths(loan as any);

//       for (const { month, overdue } of schedule) {
//         if (!windowSet.has(month)) continue;

//         const status = classifyMonth(
//           loan.loan_id,
//           month,
//           installAmt,
//           allRepayments as any,
//           threshold,
//           overdue,
//         );

//         if (status === "full") {
//           monthlyMap[month].repayments++;
//         } else {
//           monthlyMap[month].missed++;
//         }
//       }
//     }

//     // ── Missed installments stat card (all-time) ───────────────────────────
//     let missedInstallmentsCount = 0;
//     for (const loan of allLoans) {
//       const installAmt = Number(loan.installment_amount);
//       const schedule = expectedMonths(loan as any);

//       for (const { month, overdue } of schedule) {
//         const status = classifyMonth(
//           loan.loan_id,
//           month,
//           installAmt,
//           allRepayments as any,
//           threshold,
//           overdue,
//         );
//         if (status !== "full") missedInstallmentsCount++;
//       }
//     }

//     // ── Format chart output ─────────────────────────────────────────────────
//     const monthlyActivity = windowMonths.map((month) => ({
//       month: new Date(month + "-01").toLocaleDateString("en-US", {
//         month: "short",
//       }),
//       repayments: monthlyMap[month].repayments,
//       missed: monthlyMap[month].missed,
//     }));
//     // ── Build monthly chart data ────────────────────────────────────────────
//     console.log("[chart] total loans after filter:", allLoans.length);
//     console.log("[chart] window months:", windowMonths);
//     console.log("[chart] total repayments fetched:", allRepayments.length);
//     console.log("[chart] sample repayment:", allRepayments[0]);

//     // Add this INSIDE the loan loop, just for the first loan:
//     let debugged = false;
//     for (const loan of allLoans) {
//       const installAmt = Number(loan.installment_amount);
//       const schedule = expectedMonths(loan as any);

//       if (!debugged) {
//         console.log("[chart] sample loan:", loan);
//         console.log("[chart] sample schedule (first 6):", schedule.slice(0, 6));
//         debugged = true;
//       }

//       for (const { month, overdue } of schedule) {
//         if (!windowSet.has(month)) continue;
//         // ... rest of your existing code
//       }
//     }

//     const highRisk = scores.filter((s) => s.score < 400).length;

//     return NextResponse.json({
//       totalMembers: membersRes.count ?? 0,
//       activeLoans: openLoansRes.count ?? 0,
//       closedLoans: closedLoansRes.count ?? 0,
//       missedInstallmentsCount,
//       highRiskMembers: highRisk,
//       avgCreditScore: scores.length
//         ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
//         : 0,
//       monthlyActivity,
//       riskDistribution: [
//         {
//           name: "Low Risk",
//           value: scores.filter((s) => s.score >= 700).length,
//           color: "#10b981",
//         },
//         {
//           name: "Medium Risk",
//           value: scores.filter((s) => s.score >= 400 && s.score < 700).length,
//           color: "#fbbf24",
//         },
//         { name: "High Risk", value: highRisk, color: "#f87171" },
//       ],
//     });
//   } catch (error: any) {
//     console.error("[dashboard]", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
