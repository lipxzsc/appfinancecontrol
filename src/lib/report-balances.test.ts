import { test } from "node:test";
import assert from "node:assert/strict";
import { computeReportBalances } from "./report-balances";

const investments = [
  { id: "1", name: "Reserva", type: "CDB" as const, amount: 1000, monthlyYieldPct: 1 },
  { id: "2", name: "Tesouro", type: "Tesouro Direto" as const, amount: 2500, monthlyYieldPct: 1 },
];

test("saldo dos investimentos soma os valores registrados", () => {
  assert.equal(computeReportBalances({ investments }, { saldoFinal: 535 }).saldoInvestimentos, 3500);
});

test("saldo total inclui investimentos sem duplicar o rendimento já incluído no saldo", () => {
  assert.equal(computeReportBalances({ investments }, { saldoFinal: 535 }).saldoTotalComInvestimentos, 4035);
});

test("sem investimentos o saldo total preserva o saldo negativo das operações", () => {
  assert.deepEqual(computeReportBalances({ investments: [] }, { saldoFinal: -200 }), {
    saldoInvestimentos: 0,
    saldoTotalComInvestimentos: -200,
  });
});