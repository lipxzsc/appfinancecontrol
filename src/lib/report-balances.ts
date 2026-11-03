import type { FinanceState, computeMonthBalances } from "@/lib/finance-store";

/** Principal registrado: o rendimento já integra saldoFinal e não deve ser somado novamente. */
export function computeReportBalances(
  state: Pick<FinanceState, "investments">,
  totals: Pick<ReturnType<typeof computeMonthBalances>, "saldoFinal">,
) {
  const saldoInvestimentos = state.investments.reduce((sum, investment) => sum + investment.amount, 0);
  return {
    saldoInvestimentos,
    saldoTotalComInvestimentos: totals.saldoFinal + saldoInvestimentos,
  };
}