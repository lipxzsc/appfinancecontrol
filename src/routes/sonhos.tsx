import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Trash2, Target, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useFinance, formatBRL, uid, type Goal } from "@/lib/finance-store";

export const Route = createFileRoute("/sonhos")({
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
  const remaining = Math.max(goal.targetAmount - goal.saved, 0);
  const monthsLeft =
    goal.monthlyContribution > 0
      ? Math.ceil(remaining / goal.monthlyContribution)
      : Infinity;
  const pct = goal.targetAmount > 0
    ? Math.min(100, (goal.saved / goal.targetAmount) * 100)
    : 0;

  const chart = useMemo(() => {
    const data: { mes: string; valor: number }[] = [];
    if (!isFinite(monthsLeft) || monthsLeft <= 0) {
      data.push({ mes: "Agora", valor: goal.saved });
      return data;
    }
    const total = Math.min(monthsLeft, 60);
    for (let i = 0; i <= total; i++) {
      const v = Math.min(goal.targetAmount, goal.saved + goal.monthlyContribution * i);
      data.push({ mes: i === 0 ? "Hoje" : `+${i}m`, valor: Math.round(v) });
    }
    return data;
  }, [goal, monthsLeft]);

  const adjustSaved = (delta: number) =>
    onChange({ ...goal, saved: Math.max(0, goal.saved + delta) });

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
            Aporte mensal {formatBRL(goal.monthlyContribution)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Excluir meta">
          <Trash2 className="h-4 w-4" />
        </Button>
      </header>

      <div>
        <div className="flex items-end justify-between text-sm">
          <span className="text-muted-foreground">{formatBRL(goal.saved)} guardado</span>
          <span className="font-medium">{formatBRL(goal.targetAmount)}</span>
        </div>
        <Progress value={pct} className="mt-2 h-2" />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isFinite(monthsLeft)
              ? monthsLeft === 0
                ? "Objetivo alcançado 🎉"
                : `Faltam ${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"}`
              : "Defina um aporte mensal"}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustSaved(-goal.monthlyContribution)}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustSaved(goal.monthlyContribution)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div className="h-40 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--pastel-purple)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--pastel-purple)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
                fontSize: 12,
              }}
              formatter={(v: number) => formatBRL(v)}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="var(--pastel-purple)"
              strokeWidth={2}
              fill={`url(#g-${goal.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function AddGoalDialog({ onAdd }: { onAdd: (g: Goal) => void }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");

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
              <Label>Aporte/mês</Label>
              <Input type="number" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="0,00" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const t = parseFloat(target);
              const m = parseFloat(monthly);
              if (!t || t <= 0) return;
              onAdd({
                id: uid(),
                name: name || preset.name,
                icon: preset.icon,
                targetAmount: t,
                monthlyContribution: m || 0,
                saved: 0,
                createdAt: new Date().toISOString(),
              });
              setOpen(false);
              setName("");
              setTarget("");
              setMonthly("");
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}