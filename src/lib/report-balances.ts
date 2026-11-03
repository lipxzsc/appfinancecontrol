import type { FinanceState, computeMonthBalances } from "@/lib/finance-store";

/** Principal registrado: o rendimento já integra saldoFinal e não deve ser somado novamente. */
export function computeReportBalances(
  state: Pick<FinanceState, "investments">,
  totals: Pick<ReturnType<typeof computeMonthBalances>, "saldoFinal" | "rendimentoEstimado" | "receitasPendentes" | "despesasPendentes">,
) {
  const saldoInvestimentos = state.investments.reduce((sum, investment) => sum + investment.amount, 0);
  return {
    saldoOperacoes: totals.saldoFinal - totals.rendimentoEstimado,
    saldoInvestimentos,
    saldoTotalComInvestimentos: totals.saldoFinal + saldoInvestimentos,
    saldoPrevisto: totals.saldoFinal + totals.receitasPendentes - totals.despesasPendentes,
    saldoPrevistoTotal: totals.saldoFinal + saldoInvestimentos + totals.receitasPendentes - totals.despesasPendentes,
  };
}