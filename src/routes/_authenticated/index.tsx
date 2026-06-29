import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileText,
  Lock,
} from "lucide-react";
import { MonthCarousel } from "@/components/month-carousel";
import { Button } from "@/components/ui/button";
import {
  useFinance,
  formatBRL,
  computeMonthBalances,
  txMonthKey,
  monthKey,
} from "@/lib/finance-store";
import {
  AddTxDialog,
  InitialBalanceCard,
  TxListItem,
} from "@/components/tx-helpers";
import { usePlan, FREE_LIMITS } from "@/lib/plan-store";
import { toast } from "sonner";

/**
 * Página inicial (Visão Geral).
 *
 * Mostra de forma resumida: saldo do mês selecionado, total investido,
 * próximo rendimento mensal estimado e receitas/despesas do mês.
 * A página de transações tem o detalhamento e o CRUD dos lançamentos.
 */
export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Início — FinControl" },
      { name: "description", content: "Visão geral: saldo, investimentos, rendimento, receitas e despesas do mês." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { state, update } = useFinance();
  const plan = usePlan();
  const currentKey = monthKey(year, month);

  // Totais do mês (sobra do mês anterior, receitas, despesas, rendimento e saldo final).
  const totals = useMemo(
    () => computeMonthBalances(state, year, month),
    [state, year, month],
  );

  // Soma do que está alocado em todos os investimentos cadastrados.
  const totalInvestido = useMemo(
    () => state.investments.reduce((s, i) => s + i.amount, 0),
    [state.investments],
  );

  // Lançamentos do mês selecionado, mais recentes primeiro.
  const monthTxs = useMemo(
    () =>
      state.transactions
        .filter((t) => txMonthKey(t) === currentKey)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.transactions, currentKey],
  );

  // Trava de transações para o plano Free (X por mês).
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

      {/* Cartão principal: saldo atual do mês */}
      <section
        className="rounded-3xl p-5 shadow-[var(--shadow-soft)] border border-border/60"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Wallet className="h-3.5 w-3.5" />
          Saldo atual
        </div>
        <p className="mt-1 text-3xl font-semibold">{formatBRL(totals.saldoFinal)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Inclui sobra anterior de {formatBRL(totals.carryOver)}
        </p>
      </section>

      {/* Grid com cartões de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Investimentos"
          value={formatBRL(totalInvestido)}
          color="pastel-purple"
          Icon={TrendingUp}
          to="/investimentos"
        />
        <SummaryCard
          label="Rendimento /mês"
          value={formatBRL(totals.rendimentoEstimado)}
          color="pastel-blue"
          Icon={Sparkles}
          to="/investimentos"
          hint="próximo aprox."
        />
        <SummaryCard
          label="Receitas do mês"
          value={formatBRL(totals.receitasMes)}
          color="pastel-green"
          Icon={ArrowUpRight}
          to="/transacoes"
        />
        <SummaryCard
          label="Despesas do mês"
          value={formatBRL(totals.despesasMes)}
          color="pastel-red"
          Icon={ArrowDownRight}
          to="/transacoes"
        />
      </div>

      {/* Saldo inicial editável */}
      <InitialBalanceCard
        value={state.initialBalance}
        onChange={(v) => update((s) => ({ ...s, initialBalance: v }))}
      />

      {/* Lançamentos do mês: header + add + lista */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Lançamentos</h2>
            {!plan.isPro && (
              <p className="text-[10px] text-muted-foreground">
                {monthTxs.length}/{FREE_LIMITS.transactionsPerMonth} usados no Free
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
          {monthTxs.slice(0, 6).map((t) => (
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
          {monthTxs.length > 6 && (
            <li className="text-center">
              <Link to="/transacoes" className="text-xs text-primary">
                Ver todas ({monthTxs.length}) →
              </Link>
            </li>
          )}
        </ul>
      </section>

      {/* Relatório mensal (Pro) */}
      <MonthReportButton
        canUse={plan.isPro}
        year={year}
        month={month}
        totals={totals}
        txs={monthTxs}
      />
    </div>
  );
}

/** Cartão de resumo clicável que leva o usuário para a página relacionada. */
function SummaryCard({
  label,
  value,
  color,
  Icon,
  to,
  hint,
}: {
  label: string;
  value: string;
  color: string;
  Icon: React.ElementType;
  to: string;
  hint?: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border/60 bg-card/70 p-4 transition-colors hover:bg-card"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-background/60"
        style={{ color: `var(--${color})` }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold" style={{ color: `var(--${color})` }}>
        {value}
      </p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </Link>
  );
}
