import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MonthCarousel } from "@/components/month-carousel";
import {
  useFinance,
  txMonthKey,
  monthKey,
} from "@/lib/finance-store";
import { AddTxDialog, TxListItem } from "@/components/tx-helpers";
import { usePlan, FREE_LIMITS } from "@/lib/plan-store";

/**
 * Página de Transações.
 *
 * Foco único: listar e adicionar lançamentos do mês selecionado.
 * Saldo inicial e cards de resumo ficam na página Início.
 */
export const Route = createFileRoute("/_authenticated/transacoes")({
  head: () => ({
    meta: [
      { title: "Transações — FinControl" },
      {
        name: "description",
        content: "Receitas e despesas do mês — as sobras vão pro próximo automaticamente.",
      },
    ],
  }),
  component: TransacoesPage,
});

function TransacoesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { state, update } = useFinance();
  const plan = usePlan();

  const currentKey = monthKey(year, month);
  const monthTxs = useMemo(
    () =>
      state.transactions
        .filter((t) => txMonthKey(t) === currentKey)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.transactions, currentKey],
  );

  // Limite mensal de transações no plano Free.
  const txLocked =
    !plan.isPro && monthTxs.length >= FREE_LIMITS.transactionsPerMonth;

  return (
    <div className="space-y-5">
      <MonthCarousel
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Transações</h2>
          {!plan.isPro && (
            <p className="text-[10px] text-muted-foreground">
              {monthTxs.length}/{FREE_LIMITS.transactionsPerMonth} no Free
            </p>
          )}
        </div>
        <AddTxDialog
          year={year}
          month={month}
          onAdd={(t) =>
            update((s) => ({ ...s, transactions: [...s.transactions, t] }))
          }
          lockedReason={txLocked ? `Limite ${FREE_LIMITS.transactionsPerMonth}/mês` : undefined}
        />
      </div>

      <ul className="space-y-2">
        {monthTxs.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum lançamento neste mês ainda.
          </li>
        )}
        {monthTxs.map((t) => (
          <TxListItem
            key={t.id}
            tx={t}
            onDelete={() =>
              update((s) => ({
                ...s,
                transactions: s.transactions.filter((x) => x.id !== t.id),
              }))
            }
          />
        ))}
      </ul>
    </div>
  );
}