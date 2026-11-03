import { test } from "node:test";
import assert from "node:assert/strict";
import { computeReportBalances } from "./report-balances";

const investments = [
  { id: "1", name: "Reserva", type: "CDB" as const, amount: 1000, monthlyYieldPct: 1 },
  { id: "2", name: "Tesouro", type: "Tesouro Direto" as const, amount: 2500, monthlyYieldPct: 1 },
];
const totals = { saldoFinal: 535, rendimentoEstimado: 35, receitasPendentes: 800, despesasPendentes: 300 };

test("saldo dos investimentos soma os valores registrados", () => {
  assert.equal(computeReportBalances({ investments }, totals).saldoInvestimentos, 3500);
});

test("saldo total inclui investimentos sem duplicar o rendimento já incluído no saldo", () => {
  assert.equal(computeReportBalances({ investments }, totals).saldoTotalComInvestimentos, 4035);
});

test("sem investimentos o saldo total preserva o saldo negativo das operações", () => {
  assert.equal(computeReportBalances({ investments: [] }, { ...totals, saldoFinal: -200 }).saldoTotalComInvestimentos, -200);
});

test("previsão total soma investimentos, lucros e receitas pendentes e desconta gastos pendentes", () => {
  assert.equal(computeReportBalances({ investments }, totals).saldoPrevistoTotal, 4535);
});

test("saldo das operações exclui o lucro estimado para separar realizado de projeção", () => {
  assert.equal(computeReportBalances({ investments }, totals).saldoOperacoes, 500);
});

test("previsão total pode ser negativa quando as contas pendentes superam o patrimônio", () => {
  assert.equal(computeReportBalances({ investments }, { ...totals, despesasPendentes: 6000 }).saldoPrevistoTotal, -1165);
});