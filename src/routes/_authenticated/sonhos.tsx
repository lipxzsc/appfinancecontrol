import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Trash2, Target, PiggyBank, BarChart3, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { useFinance, formatBRL, uid, type Goal } from "@/lib/finance-store";

export const Route = createFileRoute("/_authenticated/sonhos")({
  head: () => ({
    meta: [
      { title: "Sonhos e metas — Bolso Leve" },
      { name: "description", content: "Planeje suas metas com aportes mensais e veja em quanto tempo conquistá-las." },
    ],
  }),
  component: SonhosPage,
});

const PRESETS = [
  { name: "Carro", icon: "🚗" },
  { name: "Celular", icon: "📱" },
  { name: "Moto", icon: "🏍️" },
  { name: "Viagem", icon: "✈️" },
  { name: "Casa", icon: "🏠" },
  { name: "Reserva", icon: "🛟" },
];

function SonhosPage() {
  const { state, update } = useFinance();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sonhos & metas</h2>
          <p className="text-sm text-muted-foreground">
            Separe um valor por mês e veja quando alcançará cada objetivo.
          </p>
        </div>
        <AddGoalDialog onAdd={(g) => update((s) => ({ ...s, goals: [...s.goals, g] }))} />
      </div>

      {state.goals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum sonho ainda. Que tal começar com um?
        </div>
      )}

      <div className="space-y-4">
        {state.goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onChange={(next) =>
              update((s) => ({
                ...s,
                goals: s.goals.map((x) => (x.id === g.id ? next : x)),
              }))
            }
            onDelete={() =>
              update((s) => ({ ...s, goals: s.goals.filter((x) => x.id !== g.id) }))
            }
          />
        ))}
      </div>
    </div>
  );
}

function GoalCard({
  goal, onChange, onDelete,
}: {
  goal: Goal;
  onChange: (g: Goal) => void;
  onDelete: () => void;
}) {
  const [showChart, setShowChart] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const deposits = goal.deposits ?? [];
  const saved = deposits.length
    ? deposits.reduce((s, d) => s + d.amount, 0)
    : goal.saved;
  const remaining = Math.max(goal.targetAmount - saved, 0);
  const pct = goal.targetAmount > 0
    ? Math.min(100, (saved / goal.targetAmount) * 100)
    : 0;

  // Média mensal real baseada nos depósitos do usuário
  const avgMonthly = useMemo(() => {
    if (!deposits.length) return 0;
    const byMonth = new Map<string, number>();
    for (const d of deposits) {
      const k = d.date.slice(0, 7);
      byMonth.set(k, (byMonth.get(k) ?? 0) + d.amount);
    }
    const total = [...byMonth.values()].reduce((s, v) => s + v, 0);
    return total / byMonth.size;
  }, [deposits]);

  const monthsLeft = avgMonthly > 0 ? Math.ceil(remaining / avgMonthly) : Infinity;

  // Dados do gráfico: barras por mês de depósito (estilo cofrinho)
  const chart = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const d of deposits) {
      const k = d.date.slice(0, 7);
      byMonth.set(k, (byMonth.get(k) ?? 0) + d.amount);
    }
    const sorted = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([k, v]) => {
      const [y, m] = k.split("-");
      const labels = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      return { mes: `${labels[+m - 1]}/${y.slice(2)}`, valor: Math.round(v) };
    });
  }, [deposits]);

  const pastels = [
    "var(--pastel-purple)",
    "var(--pastel-pink)",
    "var(--pastel-blue)",
    "var(--pastel-green)",
    "var(--pastel-yellow)",
  ];

  const addDeposit = (amount: number, date: string) => {
    const next: Goal = {
      ...goal,
      deposits: [...deposits, { id: uid(), amount, date }],
    };
    onChange(next);
  };
  const removeLastDeposit = () => {
    if (!deposits.length) return;
    onChange({ ...goal, deposits: deposits.slice(0, -1) });
  };

  return (
    <article
      className="rounded-3xl p-5 border border-border/60 shadow-[var(--shadow-soft)] space-y-4"
      style={{ background: "var(--gradient-card)" }}
    >
      <header className="flex items-start gap-3">
        <div
          className="h-12 w-12 rounded-2xl grid place-items-center text-2xl"
          style={{ background: "color-mix(in oklab, var(--pastel-purple) 35%, transparent)" }}
        >
          {goal.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            {deposits.length
              ? `${deposits.length} ${deposits.length === 1 ? "depósito" : "depósitos"} · média ${formatBRL(avgMonthly)}/mês`
              : "Sem depósitos ainda"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Excluir meta">
          <Trash2 className="h-4 w-4" />
        </Button>
      </header>

      <div>
        <div className="flex items-end justify-between text-sm">
          <span className="text-muted-foreground">{formatBRL(saved)} guardado</span>
          <span className="font-medium">{formatBRL(goal.targetAmount)}</span>
        </div>
        <Progress value={pct} className="mt-2 h-2" />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isFinite(monthsLeft)
              ? remaining === 0
                ? "Objetivo alcançado 🎉"
                : `~${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"} no ritmo atual`
              : "Registre um depósito pra estimar o tempo"}
          </span>
          <DepositDialog
            open={depositOpen}
            onOpenChange={setDepositOpen}
            onAdd={addDeposit}
            goalName={goal.name}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={removeLastDeposit}
          disabled={!deposits.length}
        >
          Desfazer último
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => setShowChart((s) => !s)}
          aria-pressed={showChart}
        >
          {showChart ? <EyeOff className="h-3 w-3" /> : <BarChart3 className="h-3 w-3" />}
          {showChart ? "Ocultar cofrinho" : "Ver cofrinho"}
        </Button>
      </div>

      {showChart && (
      <div className="rounded-2xl bg-card/40 border border-border/60 p-3">
        {chart.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-xs text-muted-foreground">
            <PiggyBank className="h-8 w-8 opacity-60" />
            Cofrinho vazio. Guarde um valor pra ver crescer!
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>Seus depósitos</span>
              <span>Meta {formatBRL(goal.targetAmount)}</span>
            </div>
            <div className="h-44 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 14, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
                  <XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklab, var(--pastel-purple) 12%, transparent)" }}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--foreground)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatBRL(v), "Guardado"]}
                  />
                  <ReferenceLine
                    y={goal.targetAmount}
                    stroke="var(--pastel-green)"
                    strokeDasharray="4 4"
                    label={{ value: "🎯", position: "right", fill: "var(--pastel-green)", fontSize: 14 }}
                  />
                  <Bar dataKey="valor" radius={[14, 14, 6, 6]} label={{ position: "top", fill: "var(--foreground)", fontSize: 10, formatter: (v: number) => formatBRL(v) }}>
                    {chart.map((_, i) => (
                      <Cell key={i} fill={pastels[i % pastels.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      )}
    </article>
  );
}

function DepositDialog({
  open, onOpenChange, onAdd, goalName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (amount: number, date: string) => void;
  goalName: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) { setAmount(""); setDate(today); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 gap-1 rounded-full text-xs">
          <PiggyBank className="h-3.5 w-3.5" /> Guardei
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" /> Guardar para {goalName}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Quanto você guardou?</Label>
            <Input
              type="number"
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Quando?</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const a = parseFloat(amount);
              if (!a || a <= 0) return;
              onAdd(a, date);
              onOpenChange(false);
            }}
          >
            Adicionar ao cofrinho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddGoalDialog({ onAdd }: { onAdd: (g: Goal) => void }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 rounded-full">
          <Plus className="h-4 w-4" /> Sonho
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Novo sonho</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setPreset(p);
                    if (!name) setName(p.name);
                  }}
                  className={`rounded-xl border px-2 py-2 text-sm flex items-center gap-2 transition ${
                    preset.name === p.name
                      ? "border-primary bg-primary/15"
                      : "border-border hover:bg-card"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span> {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={preset.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Valor total</Label>
              <Input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0,00" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-muted-foreground">Ícone</Label>
              <div className="h-9 rounded-md border border-border/60 grid place-items-center text-xl">
                {preset.icon}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const t = parseFloat(target);
              if (!t || t <= 0) return;
              onAdd({
                id: uid(),
                name: name || preset.name,
                icon: preset.icon,
                targetAmount: t,
                monthlyContribution: 0,
                saved: 0,
                deposits: [],
                createdAt: new Date().toISOString(),
              });
              setOpen(false);
              setName("");
              setTarget("");
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}