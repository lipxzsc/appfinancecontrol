import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, PiggyBank, Sparkles } from "lucide-react";
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
} from "@/lib/finance-store";

export const Route = createFileRoute("/")({
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
          <MiniStat label="Despesas" value={formatBRL(totals.despesasMes)} color="pastel-pink" />
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
        {monthTxs.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-2xl bg-card/70 border border-border/60 px-4 py-3"
          >
            {t.type === "receita" ? (
              <ArrowUpCircle className="h-6 w-6" style={{ color: "var(--pastel-green)" }} />
            ) : (
              <ArrowDownCircle className="h-6 w-6" style={{ color: "var(--pastel-pink)" }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{t.description || (t.type === "receita" ? "Receita" : "Despesa")}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: t.type === "receita" ? "var(--pastel-green)" : "var(--pastel-pink)" }}
            >
              {t.type === "receita" ? "+" : "-"}{formatBRL(t.amount)}
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
        ))}
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
  };

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>
        <Tabs value={type} onValueChange={(v) => setType(v as TxType)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="receita">Receita</TabsTrigger>
            <TabsTrigger value="despesa">Despesa</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-3 pt-2">
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
    </div>
  );
}
