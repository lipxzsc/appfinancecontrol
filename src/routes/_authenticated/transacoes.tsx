import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MonthCarousel } from "@/components/month-carousel";
import {
  useFinance,
  formatBRL,
  txMonthKey,
  monthKey,
  type TxCategory,
} from "@/lib/finance-store";
import {
  TxListItem,
  iconForCategory,
  labelForCategory,
  RECEITA_CATEGORIES,
  DESPESA_CATEGORIES,
} from "@/components/tx-helpers";
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
      { property: "og:title", content: "Transações — FinControl" },
      { property: "og:description", content: "Consulte receitas e despesas mensais por categoria no FinControl." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

  /**
   * Agrupa as transações do mês por categoria, preservando a ordem
   * canônica das categorias (a mesma usada em Orçamento e no diálogo de
   * lançamento) e separando receitas e despesas.
   */
  const groups = useMemo(() => {
    const buckets = new Map<TxCategory, typeof monthTxs>();
    for (const t of monthTxs) {
      const k = (t.category ?? (t.type === "receita" ? "outros_receita" : "outros_despesa")) as TxCategory;
      const arr = buckets.get(k) ?? [];
      arr.push(t);
      buckets.set(k, arr);
    }
    const order = [...RECEITA_CATEGORIES, ...DESPESA_CATEGORIES].map((c) => c.value);
    return order
      .map((cat) => {
        const items = buckets.get(cat) ?? [];
        if (items.length === 0) return null;
        const total = items.reduce((s, t) => s + t.amount, 0);
        const isReceita = RECEITA_CATEGORIES.some((c) => c.value === cat);
        return { cat, items, total, isReceita };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [monthTxs]);

  return (
    <div className="space-y-4 animate-fade-in">
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
      </div>

      {monthTxs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/35 p-8 text-center text-sm text-muted-foreground backdrop-blur-xl">
          Nenhum lançamento neste mês ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <CategoryGroup
              key={g.cat}
              category={g.cat}
              items={g.items}
              total={g.total}
              isReceita={g.isReceita}
              onDelete={(id) =>
                update((s) => ({
                  ...s,
                  transactions: s.transactions.filter((x) => x.id !== id),
                }))
              }
              onToggleSettled={(id) =>
                update((s) => ({
                  ...s,
                  transactions: s.transactions.map((x) =>
                    x.id === id
                      ? { ...x, settled: x.settled === false ? true : false }
                      : x,
                  ),
                }))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Bloco colapsável agrupando todas as transações de uma categoria. */
function CategoryGroup({
  category,
  items,
  total,
  isReceita,
  onDelete,
  onToggleSettled,
}: {
  category: TxCategory;
  items: { id: string; type: "receita" | "despesa"; amount: number; date: string; description: string; category?: TxCategory; settled?: boolean }[];
  total: number;
  isReceita: boolean;
  onDelete: (id: string) => void;
  onToggleSettled: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = iconForCategory(category);
  const color = isReceita ? "var(--pastel-green)" : "var(--pastel-red)";
  return (
    <section className="rounded-2xl border border-border bg-card/55 shadow-[var(--shadow-soft)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-secondary/60"
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-background/60"
          style={{ color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium">{labelForCategory(category)}</p>
          <p className="text-[11px] text-muted-foreground">
            {items.length} {items.length === 1 ? "lançamento" : "lançamentos"}
          </p>
        </div>
        <span className="text-sm font-semibold" style={{ color }}>
          {isReceita ? "+" : "-"}
          {formatBRL(total)}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <ul className="space-y-2 px-2 pb-3">
          {items.map((t) => (
            <TxListItem
              key={t.id}
              tx={t}
              onDelete={() => onDelete(t.id)}
              onToggleSettled={() => onToggleSettled(t.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}