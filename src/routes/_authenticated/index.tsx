import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileText,
  FileSpreadsheet,
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
} from "@/components/tx-helpers";
import { usePlan, FREE_LIMITS } from "@/lib/plan-store";
import { toast } from "sonner";
import { downloadMonthReportCSV, downloadMonthReportPDF } from "@/lib/month-report";

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

  // Lançamentos do mês — usados aqui só pra contar a cota Free e gerar o relatório.
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

      {/* Novo lançamento — a lista detalhada vive na página Transações. */}
      <section className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Adicionar lançamento</h2>
          <p className="text-[11px] text-muted-foreground">
            {!plan.isPro
              ? `${monthTxs.length}/${FREE_LIMITS.transactionsPerMonth} usados no Free`
              : "Receita ou despesa do mês"}
          </p>
        </div>
        <AddTxDialog
          year={year}
          month={month}
          onAdd={(t) =>
            update((s) => ({ ...s, transactions: [...s.transactions, t] }))
          }
          lockedReason={txLocked ? `Limite ${FREE_LIMITS.transactionsPerMonth}/mês` : undefined}
        />
      </section>
      {monthTxs.length > 0 && (
        <Link
          to="/transacoes"
          className="block rounded-2xl border border-dashed border-border/60 px-4 py-2 text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Ver {monthTxs.length} {monthTxs.length === 1 ? "lançamento" : "lançamentos"} em Transações →
        </Link>
      )}

      {/* Relatório mensal (Pro) */}
      <MonthReportButton
        canUse={plan.isPro}
        year={year}
        month={month}
        totals={totals}
        txs={monthTxs}
        state={state}
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

/**
 * Botão de relatório mensal — gera um TXT resumido.
 * Para Free: vira CTA de upgrade.
 */
function MonthReportButton({
  canUse,
  year,
  month,
  totals,
  txs,
  state,
}: {
  canUse: boolean;
  year: number;
  month: number;
  totals: ReturnType<typeof computeMonthBalances>;
  txs: ReturnType<typeof useFinance>["state"]["transactions"];
  state: ReturnType<typeof useFinance>["state"];
}) {
  if (!canUse) {
    return (
      <Button
        asChild
        variant="outline"
        className="w-full justify-center gap-2 border-dashed"
      >
        <Link to="/planos">
          <Lock className="h-4 w-4" style={{ color: "var(--pastel-yellow)" }} />
          Relatório mensal (Pro)
        </Link>
      </Button>
    );
  }

  return (
    <section
      className="rounded-2xl border border-border/60 p-4 shadow-[var(--shadow-soft)]"
      style={{ background: "var(--gradient-card)" }}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" style={{ color: "var(--pastel-yellow)" }} />
        <h2 className="text-sm font-semibold">Relatório mensal</h2>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Resumo do mês com receitas e despesas por categoria, total investido e lista de lançamentos.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          onClick={() => {
            downloadMonthReportPDF({ year, month, totals, txs, state });
            toast.success("PDF baixado!");
          }}
          className="justify-center gap-2"
          style={{ background: "var(--gradient-primary)", color: "var(--background)" }}
        >
          <FileText className="h-4 w-4" /> PDF
        </Button>
        <Button
          onClick={() => {
            downloadMonthReportCSV({ year, month, totals, txs, state });
            toast.success("CSV baixado! Abra no Excel ou Planilhas.");
          }}
          variant="outline"
          className="justify-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" /> CSV / Excel
        </Button>
      </div>
    </section>
  );
}
