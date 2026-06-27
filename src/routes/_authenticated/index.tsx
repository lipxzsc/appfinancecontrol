import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import { MonthCarousel } from "@/components/month-carousel";
import {
  useFinance,
  formatBRL,
  computeMonthBalances,
} from "@/lib/finance-store";

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
  const { state } = useFinance();

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

      <p className="text-center text-xs text-muted-foreground">
        Use as abas inferiores para registrar lançamentos, definir orçamentos, sonhos e investimentos.
      </p>
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
