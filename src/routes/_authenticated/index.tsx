import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Landmark,
  Lock,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthCarousel } from "@/components/month-carousel";
import { Button } from "@/components/ui/button";
import {
  computeMonthBalances,
  formatBRL,
  monthKey,
  txMonthKey,
  useFinance,
  type Investment,
} from "@/lib/finance-store";
import { AddTxDialog, InitialBalanceCard } from "@/components/tx-helpers";
import { FREE_LIMITS, usePlan } from "@/lib/plan-store";
import { downloadMonthReportCSV, downloadMonthReportPDF } from "@/lib/month-report";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Rendimentos e patrimônio — FinControl" },
      { name: "description", content: "Acompanhe patrimônio, rendimentos, carteira e fluxo mensal no FinControl." },
      { property: "og:title", content: "Rendimentos e patrimônio — FinControl" },
      { property: "og:description", content: "Painel completo de patrimônio, rendimentos e finanças mensais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

const TYPE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Overview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [hideValues, setHideValues] = useState(false);
  const { state, update } = useFinance();
  const plan = usePlan();

  useEffect(() => {
    setHideValues(localStorage.getItem("fc:hideValues") === "1");
  }, []);

  const totals = useMemo(() => computeMonthBalances(state, year, month), [state, year, month]);
  const totalInvested = useMemo(() => state.investments.reduce((sum, item) => sum + item.amount, 0), [state.investments]);
  const projectedYear = totals.rendimentoEstimado * 12;
  const averageMonthlyYield = totalInvested > 0 ? (totals.rendimentoEstimado / totalInvested) * 100 : 0;
  const netWorth = totals.saldoFinal + totalInvested;
  const currentKey = monthKey(year, month);
  const monthTxs = useMemo(
    () => state.transactions.filter((item) => txMonthKey(item) === currentKey).sort((a, b) => b.date.localeCompare(a.date)),
    [state.transactions, currentKey],
  );
  const txLocked = !plan.isPro && monthTxs.length >= FREE_LIMITS.transactionsPerMonth;
  const mask = (value: string) => (hideValues ? "R$ ••••" : value);

  const history = useMemo(() => {
    return Array.from({ length: 8 }, (_, index) => {
      const date = new Date(year, month - 7 + index, 1);
      const balance = computeMonthBalances(state, date.getFullYear(), date.getMonth());
      return {
        label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
        patrimonio: Math.max(0, balance.saldoFinal + totalInvested),
        rendimento: balance.rendimentoEstimado,
      };
    });
  }, [state, year, month, totalInvested]);

  const allocation = useMemo(() => {
    const grouped = new Map<Investment["type"], number>();
    state.investments.forEach((item) => grouped.set(item.type, (grouped.get(item.type) ?? 0) + item.amount));
    return [...grouped.entries()]
      .map(([name, value]) => ({ name, value, percent: totalInvested > 0 ? (value / totalInvested) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [state.investments, totalInvested]);

  function togglePrivacy() {
    setHideValues((current) => {
      const next = !current;
      localStorage.setItem("fc:hideValues", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Visão patrimonial</p>
          <h2 className="truncate font-display text-xl font-semibold sm:text-2xl">Rendimentos e evolução</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={togglePrivacy} aria-label={hideValues ? "Mostrar valores" : "Ocultar valores"}>
          {hideValues ? <EyeOff /> : <Eye />}
        </Button>
      </div>

      <MonthCarousel year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />

      <section className="flex flex-wrap items-center gap-3 border-y border-primary/20 py-4">
        <AddTxDialog
          year={year}
          month={month}
          onAdd={(transaction) => update((current) => ({ ...current, transactions: [...current.transactions, transaction] }))}
          lockedReason={txLocked ? `Limite ${FREE_LIMITS.transactionsPerMonth}/mês` : undefined}
        />
        <Button asChild variant="ghost" size="sm"><Link to="/transacoes">Ver transações <ArrowUpRight className="h-4 w-4" /></Link></Button>
        {!plan.isPro && <p className="text-xs text-muted-foreground sm:ml-auto">{monthTxs.length}/{FREE_LIMITS.transactionsPerMonth} lançamentos no mês</p>}
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 border-b border-border pb-5 lg:col-span-8 lg:border-b-0 lg:pb-0">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
            <Wallet className="h-4 w-4 text-primary" /> Patrimônio total
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-3">
            <p className="max-w-full truncate font-display text-3xl font-bold tabular-nums sm:text-5xl lg:text-6xl">{mask(formatBRL(netWorth))}</p>
            {totals.rendimentoEstimado > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                <ArrowUpRight className="h-3.5 w-3.5" /> {averageMonthlyYield.toFixed(2)}% a.m.
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Saldo disponível + carteira de investimentos</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:items-end">
          <HeadlineMetric label="Rendimento no mês" value={mask(formatBRL(totals.rendimentoEstimado))} tone="primary" />
          <HeadlineMetric label="Projeção anual" value={mask(formatBRL(projectedYear))} tone="foreground" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="min-h-[340px] rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5 lg:col-span-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-semibold">Evolução patrimonial</h3>
              <p className="mt-1 text-xs text-muted-foreground">Últimos 8 meses, incluindo saldo e investimentos</p>
            </div>
            <span className="rounded-md bg-secondary px-2.5 py-1 text-[10px] font-bold text-primary">8 MESES</span>
          </div>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={compactValue} />
                <Tooltip content={<WealthTooltip hidden={hideValues} />} />
                <Area type="monotone" dataKey="patrimonio" stroke="var(--primary)" strokeWidth={2.5} fill="url(#wealthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="space-y-4 lg:col-span-4">
          <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-semibold">Composição da carteira</h3>
              <Link to="/investimentos" className="text-[10px] font-bold text-primary hover:underline">GERENCIAR</Link>
            </div>
            {allocation.length ? (
              <div className="mt-4 grid grid-cols-[108px_minmax(0,1fr)] items-center gap-4">
                <div className="h-28 w-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocation} dataKey="value" innerRadius={34} outerRadius={52} stroke="var(--card)">
                        {allocation.map((item, index) => <Cell key={item.name} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 space-y-3">
                  {allocation.slice(0, 4).map((item, index) => (
                    <div key={item.name} className="flex min-w-0 items-center gap-2 text-xs">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: TYPE_COLORS[index % TYPE_COLORS.length] }} />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                      <span className="shrink-0 font-bold tabular-nums">{item.percent.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-border p-5 text-center">
                <Landmark className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Adicione investimentos para ver a composição.</p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-primary/20 bg-primary/10 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase">Renda passiva projetada</p>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tabular-nums sm:text-3xl">{mask(formatBRL(totals.rendimentoEstimado))}<span className="text-sm font-medium text-muted-foreground"> /mês</span></p>
            <div className="mt-4 flex items-center justify-between rounded-md border border-primary/15 bg-background/30 p-3 text-xs">
              <span className="text-muted-foreground">Rentabilidade média</span>
              <span className="font-bold text-primary">{averageMonthlyYield.toFixed(2)}% a.m.</span>
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniMetric label="Total investido" value={mask(formatBRL(totalInvested))} Icon={TrendingUp} tone="primary" />
        <MiniMetric label="Receitas recebidas" value={mask(formatBRL(totals.receitasRecebidas))} Icon={ArrowUpRight} tone="primary" />
        <MiniMetric label="Despesas pagas" value={mask(formatBRL(totals.despesasPagas))} Icon={ArrowDownRight} tone="accent" />
        <MiniMetric label="Saldo disponível" value={mask(formatBRL(totals.saldoFinal))} Icon={Wallet} tone="foreground" />
      </div>

      <InitialBalanceCard value={state.initialBalance} onChange={(value) => update((current) => ({ ...current, initialBalance: value }))} />
      <MonthReport canUse={plan.isPro} year={year} month={month} totals={totals} txs={monthTxs} state={state} />
    </div>
  );
}

function HeadlineMetric({ label, value, tone }: { label: string; value: string; tone: "primary" | "foreground" }) {
  return <div className="min-w-0 lg:text-right"><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p><p className={`mt-1 truncate font-display text-lg font-bold tabular-nums sm:text-xl ${tone === "primary" ? "text-primary" : "text-foreground"}`}>{value}</p></div>;
}

function MiniMetric({ label, value, Icon, tone }: { label: string; value: string; Icon: React.ElementType; tone: "primary" | "accent" | "foreground" }) {
  const color = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-foreground";
  return (
    <article className="min-w-0 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50">
      <div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${color}`} /><p className="truncate text-[9px] font-bold uppercase text-muted-foreground">{label}</p></div>
      <p className={`mt-3 truncate font-display text-base font-bold tabular-nums sm:text-lg ${color}`}>{value}</p>
    </article>
  );
}

function WealthTooltip({ active, payload, label, hidden }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string; hidden: boolean }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-md border border-border bg-popover p-3 shadow-xl"><p className="text-[10px] font-bold text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold text-primary">{hidden ? "R$ ••••" : formatBRL(payload[0]?.value ?? 0)}</p></div>;
}

function compactValue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mi`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} mil`;
  return String(value);
}

function MonthReport({ canUse, year, month, totals, txs, state }: {
  canUse: boolean;
  year: number;
  month: number;
  totals: ReturnType<typeof computeMonthBalances>;
  txs: ReturnType<typeof useFinance>["state"]["transactions"];
  state: ReturnType<typeof useFinance>["state"];
}) {
  if (!canUse) return <Button asChild variant="outline" className="w-full border-dashed"><Link to="/planos"><Lock /> Relatório mensal (Pro)</Link></Button>;
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0"><h3 className="font-display text-sm font-semibold">Relatório mensal</h3><p className="mt-1 text-xs text-muted-foreground">Rendimentos, fluxo, categorias e lançamentos do período.</p></div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => { downloadMonthReportPDF({ year, month, totals, txs, state }); toast.success("PDF baixado!"); }}><FileText /> PDF</Button>
          <Button size="sm" variant="outline" onClick={() => { downloadMonthReportCSV({ year, month, totals, txs, state }); toast.success("CSV baixado!"); }}><FileSpreadsheet /> CSV</Button>
        </div>
      </div>
    </section>
  );
}