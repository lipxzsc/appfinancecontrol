import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Receipt,
  Home as HomeIcon,
  UtensilsCrossed,
  Fuel,
  Landmark,
  Gamepad2,
  HeartPulse,
  Bus,
  GraduationCap,
  CircleHelp,
  Pencil,
  Check,
  Lock,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MonthCarousel } from "@/components/month-carousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useFinance,
  formatBRL,
  monthKey,
  txMonthKey,
  type TxCategory,
} from "@/lib/finance-store";
import { usePlan, FREE_LIMITS } from "@/lib/plan-store";
import { ProLockOverlay } from "@/components/pro-lock";
import { Link } from "@tanstack/react-router";

/**
 * Página de Orçamento.
 *
 * O usuário define um limite mensal por categoria de despesa.
 * A página mostra quanto foi gasto vs o limite e um gráfico de pizza
 * com a distribuição das despesas do mês selecionado.
 */
export const Route = createFileRoute("/_authenticated/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento — FinControl" },
      { name: "description", content: "Defina limites mensais por categoria e veja onde está gastando." },
    ],
  }),
  component: OrcamentoPage,
});

// Categorias de despesa (mesmas usadas em Transações) com ícone e cor pastel.
const EXPENSE_CATEGORIES: {
  value: TxCategory;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "moradia",        label: "Moradia",      icon: HomeIcon,         color: "var(--pastel-green)" },
  { value: "alimentacao",    label: "Alimentação",  icon: UtensilsCrossed,  color: "var(--pastel-pink)" },
  { value: "transporte",     label: "Transporte",   icon: Bus,              color: "var(--pastel-purple)" },
  { value: "combustivel",    label: "Combustível",  icon: Fuel,             color: "var(--pastel-yellow)" },
  { value: "contas",         label: "Contas",       icon: Receipt,          color: "var(--pastel-blue)" },
  { value: "taxas",          label: "Taxas",        icon: Landmark,         color: "var(--pastel-red)" },
  { value: "lazer",          label: "Lazer",        icon: Gamepad2,         color: "var(--pastel-yellow)" },
  { value: "saude",          label: "Saúde",        icon: HeartPulse,       color: "var(--pastel-red)" },
  { value: "educacao",       label: "Educação",     icon: GraduationCap,    color: "var(--pastel-blue)" },
  { value: "outros_despesa", label: "Outros",       icon: CircleHelp,       color: "var(--pastel-purple)" },
];

function OrcamentoPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { state, update } = useFinance();
  const plan = usePlan();

  const currentKey = monthKey(year, month);

  // Calcula o total gasto por categoria no mês selecionado.
  const spentByCategory = useMemo(() => {
    const acc: Partial<Record<TxCategory, number>> = {};
    for (const t of state.transactions) {
      if (t.type !== "despesa") continue;
      if (txMonthKey(t) !== currentKey) continue;
      const k = (t.category ?? "outros_despesa") as TxCategory;
      acc[k] = (acc[k] ?? 0) + t.amount;
    }
    return acc;
  }, [state.transactions, currentKey]);

  const totalGasto = useMemo(
    () => Object.values(spentByCategory).reduce<number>((s, v) => s + (v ?? 0), 0),
    [spentByCategory],
  );

  // Dados do gráfico de pizza: só categorias com gasto > 0.
  const pieData = EXPENSE_CATEGORIES
    .map((c) => ({ name: c.label, value: spentByCategory[c.value] ?? 0, color: c.color }))
    .filter((d) => d.value > 0);

  // Atualiza limite (em R$) de uma categoria no estado global.
  function setBudget(cat: TxCategory, value: number) {
    update((s) => ({
      ...s,
      budgets: { ...(s.budgets ?? {}), [cat]: value },
    }));
  }

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

      {/* Gráfico de distribuição das despesas (estilo doughnut) */}
      <section
        className="relative rounded-3xl border border-border/60 p-5 shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-card)" }}
      >
        <h2 className="text-base font-semibold">Distribuição de Despesas</h2>
        {pieData.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Sem despesas neste mês ainda.
          </p>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatBRL(v)}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Total no centro do donut */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Total
                </span>
                <span className="text-sm font-semibold">{formatBRL(totalGasto)}</span>
              </div>
            </div>
            {/* Legenda com % de cada categoria */}
            <ul className="flex-1 space-y-1.5 text-sm">
              {pieData.map((d) => {
                const pct = totalGasto ? Math.round((d.value / totalGasto) * 100) : 0;
                return (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {/* Para Free: cobre o gráfico com overlay de cadeado. */}
        {!plan.isPro && pieData.length > 0 && (
          <ProLockOverlay message="Gráfico completo no Pro" />
        )}
      </section>

      {/* Lista de categorias com limite editável e barra de progresso */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Progresso dos Orçamentos</h2>
          {!plan.isPro && (
            <Link to="/planos" className="text-[10px] text-muted-foreground hover:text-foreground">
              {FREE_LIMITS.budgets} editáveis no Free
            </Link>
          )}
        </div>
        <ul className="space-y-2">
          {EXPENSE_CATEGORIES.map((c, idx) => {
            const spent = spentByCategory[c.value] ?? 0;
            const limit = state.budgets?.[c.value] ?? 0;
            const locked = !plan.isPro && idx >= FREE_LIMITS.budgets;
            return (
              <BudgetRow
                key={c.value}
                label={c.label}
                Icon={c.icon}
                color={c.color}
                spent={spent}
                limit={limit}
                locked={locked}
                onSave={(v) => setBudget(c.value, v)}
              />
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** Linha de orçamento: ícone + barra de progresso + edição inline do limite. */
function BudgetRow({
  label,
  Icon,
  color,
  spent,
  limit,
  onSave,
}: {
  label: string;
  Icon: React.ElementType;
  color: string;
  spent: number;
  limit: number;
  onSave: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(limit || ""));

  // % consumido (limitado a 100% para a barra; mas mostramos o número real).
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const overflow = limit > 0 && spent > limit;

  return (
    <li className="rounded-2xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-background/60"
          style={{ color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {formatBRL(spent)} {limit > 0 && <>/ {formatBRL(limit)}</>}
          </p>
        </div>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Limite"
              className="h-8 w-24"
            />
            <Button
              size="icon"
              variant="ghost"
              aria-label="Salvar"
              onClick={() => {
                onSave(parseFloat(draft) || 0);
                setEditing(false);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Editar limite"
            onClick={() => {
              setDraft(limit ? String(limit) : "");
              setEditing(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Barra de progresso (cinza quando sem limite definido) */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: overflow ? "var(--pastel-red)" : color,
          }}
        />
      </div>
    </li>
  );
}
