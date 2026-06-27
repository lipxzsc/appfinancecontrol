import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  PiggyBank,
  Sparkles,
  Briefcase,
  Laptop,
  Gift,
  CircleHelp,
  Receipt,
  Home,
  UtensilsCrossed,
  Fuel,
  Landmark,
  Gamepad2,
  HeartPulse,
  Bus,
  GraduationCap,
  Check,
} from "lucide-react";
import { MonthCarousel } from "@/components/month-carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFinance,
  formatBRL,
  computeMonthBalances,
  txMonthKey,
  monthKey,
  uid,
  type TxType,
  type TxCategory,
} from "@/lib/finance-store";

const RECEITA_CATEGORIES: { value: TxCategory; label: string; icon: React.ElementType }[] = [
  { value: "salario", label: "Salário", icon: Briefcase },
  { value: "freelancer", label: "Freelancer", icon: Laptop },
  { value: "extra", label: "Extra", icon: Gift },
  { value: "outros_receita", label: "Outros", icon: CircleHelp },
];

const DESPESA_CATEGORIES: { value: TxCategory; label: string; icon: React.ElementType }[] = [
  { value: "contas", label: "Contas", icon: Receipt },
  { value: "moradia", label: "Moradia", icon: Home },
  { value: "alimentacao", label: "Alimentação", icon: UtensilsCrossed },
  { value: "combustivel", label: "Combustível", icon: Fuel },
  { value: "taxas", label: "Taxas", icon: Landmark },
  { value: "lazer", label: "Lazer", icon: Gamepad2 },
  { value: "saude", label: "Saúde", icon: HeartPulse },
  { value: "transporte", label: "Transporte", icon: Bus },
  { value: "educacao", label: "Educação", icon: GraduationCap },
  { value: "outros_despesa", label: "Outros", icon: CircleHelp },
];

function categoryFor(type: TxType) {
  return type === "receita" ? RECEITA_CATEGORIES : DESPESA_CATEGORIES;
}

function defaultCategory(type: TxType): TxCategory {
  return type === "receita" ? "salario" : "contas";
}

function labelForCategory(category?: TxCategory) {
  if (!category) return "";
  const all = [...RECEITA_CATEGORIES, ...DESPESA_CATEGORIES];
  return all.find((c) => c.value === category)?.label ?? "";
}

function iconForCategory(category?: TxCategory) {
  if (!category) return CircleHelp;
  const all = [...RECEITA_CATEGORIES, ...DESPESA_CATEGORIES];
  return all.find((c) => c.value === category)?.icon ?? CircleHelp;
}

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Início — Bolso Leve" },
      { name: "description", content: "Receitas, despesas e saldo do mês com sobras automáticas." },
    ],
  }),
  component: Index,
});

function Index() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { state, update } = useFinance();

  const totals = useMemo(
    () => computeMonthBalances(state, year, month),
    [state, year, month],
  );

  const currentKey = monthKey(year, month);
  const monthTxs = state.transactions
    .filter((t) => txMonthKey(t) === currentKey)
    .sort((a, b) => b.date.localeCompare(a.date));

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

      <InitialBalanceCard
        value={state.initialBalance}
        onChange={(v) =>
          update((s) => ({ ...s, initialBalance: v }))
        }
      />

      <section
        className="rounded-3xl p-5 shadow-[var(--shadow-soft)] border border-border/60"
        style={{ background: "var(--gradient-card)" }}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Saldo final do mês
        </p>
        <p className="mt-1 text-3xl font-semibold">{formatBRL(totals.saldoFinal)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <MiniStat label="Sobra anterior" value={formatBRL(totals.carryOver)} color="pastel-blue" />
          <MiniStat label="Rendimentos" value={formatBRL(totals.rendimentoEstimado)} color="pastel-purple" />
          <MiniStat label="Receitas" value={formatBRL(totals.receitasMes)} color="pastel-green" />
          <MiniStat label="Despesas" value={formatBRL(totals.despesasMes)} color="pastel-red" />
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Lançamentos</h2>
        <AddTxDialog
          year={year}
          month={month}
          onAdd={(t) => update((s) => ({ ...s, transactions: [...s.transactions, t] }))}
        />
      </div>

      <ul className="space-y-2">
        {monthTxs.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum lançamento neste mês ainda.
          </li>
        )}
        {monthTxs.map((t) => {
          const isReceita = t.type === "receita";
          const color = isReceita ? "var(--pastel-green)" : "var(--pastel-red)";
          const Icon = iconForCategory(t.category);
          return (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-2xl bg-card/70 border border-border/60 px-4 py-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/60"
                style={{ color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {t.description || (isReceita ? "Receita" : "Despesa")}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                  {t.category && (
                    <>
                      <span className="text-border">•</span>
                      <span style={{ color }}>{labelForCategory(t.category)}</span>
                    </>
                  )}
                </div>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color }}
              >
                {isReceita ? "+" : "-"}{formatBRL(t.amount)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir"
                onClick={() =>
                  update((s) => ({
                    ...s,
                    transactions: s.transactions.filter((x) => x.id !== t.id),
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-card/60 border border-border/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold" style={{ color: `var(--${color})` }}>
        {value}
      </p>
    </div>
  );
}

function InitialBalanceCard({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  return (
    <div className="rounded-2xl bg-card/70 border border-border/60 px-4 py-3 flex items-center gap-3">
      <PiggyBank className="h-5 w-5" style={{ color: "var(--pastel-yellow)" }} />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">Saldo inicial</p>
        {editing ? (
          <Input
            autoFocus
            type="number"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => {
              onChange(parseFloat(input) || 0);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onChange(parseFloat(input) || 0);
                setEditing(false);
              }
            }}
            className="h-8"
          />
        ) : (
          <button
            onClick={() => {
              setInput(String(value));
              setEditing(true);
            }}
            className="text-base font-semibold text-left"
          >
            {formatBRL(value)}
          </button>
        )}
      </div>
      <Sparkles className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function AddTxDialog({
  year,
  month,
  onAdd,
}: {
  year: number;
  month: number;
  onAdd: (t: import("@/lib/finance-store").Transaction) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("receita");
  const [category, setCategory] = useState<TxCategory>(defaultCategory("receita"));
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const today = new Date();
  const defaultDay =
    year === today.getFullYear() && month === today.getMonth()
      ? today.getDate()
      : 1;
  const [date, setDate] = useState(
    `${year}-${String(month + 1).padStart(2, "0")}-${String(defaultDay).padStart(2, "0")}`,
  );

  const reset = () => {
    setDesc("");
    setAmount("");
    setType("receita");
    setCategory(defaultCategory("receita"));
  };

  const handleTypeChange = (next: TxType) => {
    setType(next);
    setCategory(defaultCategory(next));
  };

  const categories = categoryFor(type);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
        if (o) {
          setDate(
            `${year}-${String(month + 1).padStart(2, "0")}-${String(defaultDay).padStart(2, "0")}`,
          );
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 rounded-full">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>
        <Tabs value={type} onValueChange={(v) => handleTypeChange(v as TxType)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger
              value="receita"
              className="data-[state=active]:bg-pastel-green/20 data-[state=active]:text-pastel-green"
            >
              Receita
            </TabsTrigger>
            <TabsTrigger
              value="despesa"
              className="data-[state=active]:bg-pastel-red/20 data-[state=active]:text-pastel-red"
            >
              Despesa
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-3 pt-2">
          <div className="grid gap-1.5">
            <Label>Categoria</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => {
                const Icon = c.icon;
                const selected = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-2 py-2 text-xs font-medium transition-colors"
                    style={{
                      borderColor: selected ? `var(--${type === "receita" ? "pastel-green" : "pastel-red"})` : undefined,
                      color: selected ? `var(--${type === "receita" ? "pastel-green" : "pastel-red"})` : undefined,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {c.label}
                    {selected && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Descrição</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Salário, Mercado" />
          </div>
          <div className="grid gap-1.5">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const v = parseFloat(amount);
              if (!v || v <= 0) return;
              onAdd({
                id: uid(),
                type,
                category,
                amount: v,
                description: desc,
                date,
              });
              setOpen(false);
              reset();
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
