import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useFinance, formatBRL, uid, type Investment } from "@/lib/finance-store";
import { usePlan, FREE_LIMITS } from "@/lib/plan-store";
import { ProLockButton } from "@/components/pro-lock";

export const Route = createFileRoute("/_authenticated/investimentos")({
  head: () => ({
    meta: [
      { title: "Investimentos — FinControl" },
      { name: "description", content: "Simule investimentos em CDB, FIIs, Ações, Tesouro Direto com juros compostos." },
    ],
  }),
  component: InvestPage,
});

const TIPOS: Investment["type"][] = ["CDB", "FII", "Ações", "Tesouro Direto", "Poupança", "Outro"];

function InvestPage() {
  const { state, update } = useFinance();
  const plan = usePlan();
  const invLocked =
    !plan.isPro && state.investments.length >= FREE_LIMITS.investments;

  const totalInvest = state.investments.reduce((s, i) => s + i.amount, 0);
  const rendimentoMes = state.investments.reduce(
    (s, i) => s + i.amount * (i.monthlyYieldPct / 100),
    0,
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold">Investimentos</h2>
        <p className="text-sm text-muted-foreground">
          Acompanhe o que está investido e simule o crescimento.
        </p>
      </header>

      <section
        className="rounded-3xl p-5 border border-border/60 shadow-[var(--shadow-soft)] grid grid-cols-2 gap-3"
        style={{ background: "var(--gradient-card)" }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total investido</p>
          <p className="text-2xl font-semibold">{formatBRL(totalInvest)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Rendimento/mês</p>
          <p className="text-2xl font-semibold" style={{ color: "var(--pastel-green)" }}>
            {formatBRL(rendimentoMes)}
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Carteira</h3>
        {invLocked ? (
          <ProLockButton label={`Limite ${FREE_LIMITS.investments}`} />
        ) : (
          <AddInvestmentDialog
            cdi={state.cdiMonthlyPct}
            onAdd={(i) => update((s) => ({ ...s, investments: [...s.investments, i] }))}
          />
        )}
      </div>

      <ul className="space-y-2">
        {state.investments.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum investimento cadastrado.
          </li>
        )}
        {state.investments.map((i) => (
          <li
            key={i.id}
            className="flex items-center gap-3 rounded-2xl bg-card/70 border border-border/60 px-4 py-3"
          >
            <div
              className="h-10 w-10 rounded-xl grid place-items-center"
              style={{ background: "color-mix(in oklab, var(--pastel-blue) 35%, transparent)" }}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{i.name}</p>
              <p className="text-xs text-muted-foreground">
                {i.type} · {i.monthlyYieldPct.toFixed(2)}% a.m.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatBRL(i.amount)}</p>
              <p className="text-xs" style={{ color: "var(--pastel-green)" }}>
                +{formatBRL(i.amount * (i.monthlyYieldPct / 100))}/mês
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                update((s) => ({ ...s, investments: s.investments.filter((x) => x.id !== i.id) }))
              }
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <Simulator cdi={state.cdiMonthlyPct} />
    </div>
  );
}

function AddInvestmentDialog({
  cdi, onAdd,
}: {
  cdi: number;
  onAdd: (i: Investment) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Investment["type"]>("CDB");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [pctCdi, setPctCdi] = useState("100"); // % do CDI para CDB
  const [customYield, setCustomYield] = useState("");
  const [useCdiFormula, setUseCdiFormula] = useState(true);

  // Apenas títulos atrelados ao CDI fazem sentido com %CDI por padrão
  const cdiByDefault = type === "CDB" || type === "Tesouro Direto";
  const usaCDI = useCdiFormula;

  const yieldPct = usaCDI
    ? (cdi * (parseFloat(pctCdi) || 0)) / 100
    : parseFloat(customYield) || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 rounded-full">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo investimento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as Investment["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Ex.: ${type} Banco X`} />
          </div>
          <div className="grid gap-1.5">
            <Label>Valor aplicado</Label>
            <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-card/60 border border-border/60 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Usar fórmula do CDI</p>
              <p className="text-[11px] text-muted-foreground">Ex.: 100% do CDI, 120% do CDI</p>
            </div>
            <Switch checked={useCdiFormula} onCheckedChange={setUseCdiFormula} />
          </div>
          {usaCDI ? (
            <div className="grid gap-1.5">
              <Label>% do CDI</Label>
              <Input
                type="number"
                value={pctCdi}
                onChange={(e) => setPctCdi(e.target.value)}
                placeholder={cdiByDefault ? "100" : "120"}
              />
              <p className="text-xs text-muted-foreground">
                CDI atual {cdi.toFixed(2)}% a.m. · Rendimento estimado: {yieldPct.toFixed(3)}% a.m.
              </p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label>Rendimento mensal (%)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={customYield}
                onChange={(e) => setCustomYield(e.target.value)}
                placeholder="0,80"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const a = parseFloat(amount);
              if (!a || a <= 0) return;
              onAdd({
                id: uid(),
                type,
                name: name || type,
                amount: a,
                monthlyYieldPct: yieldPct,
              });
              setOpen(false);
              setName(""); setAmount(""); setPctCdi("100"); setCustomYield("");
            }}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Simulator({ cdi }: { cdi: number }) {
  const [initial, setInitial] = useState("1000");
  const [monthly, setMonthly] = useState("300");
  const [months, setMonths] = useState(60);
  const [yieldPct, setYieldPct] = useState(cdi.toFixed(2));

  const data = useMemo(() => {
    const ini = parseFloat(initial) || 0;
    const ap = parseFloat(monthly) || 0;
    const r = (parseFloat(yieldPct) || 0) / 100;
    const out: { mes: number; total: number; aportado: number }[] = [];
    let saldo = ini;
    let aportado = ini;
    out.push({ mes: 0, total: Math.round(saldo), aportado: Math.round(aportado) });
    for (let m = 1; m <= months; m++) {
      saldo = saldo * (1 + r) + ap;
      aportado += ap;
      out.push({ mes: m, total: Math.round(saldo), aportado: Math.round(aportado) });
    }
    return out;
  }, [initial, monthly, months, yieldPct]);

  const last = data[data.length - 1];
  const lucro = last.total - last.aportado;

  return (
    <section
      className="rounded-3xl p-5 border border-border/60 shadow-[var(--shadow-soft)] space-y-4"
      style={{ background: "var(--gradient-card)" }}
    >
      <div>
        <h3 className="text-base font-semibold">Simulador de juros compostos</h3>
        <p className="text-xs text-muted-foreground">Veja o crescimento ao longo do tempo</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Inicial (R$)</Label>
          <Input type="number" value={initial} onChange={(e) => setInitial(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Aporte/mês (R$)</Label>
          <Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Rendimento mensal (%)</Label>
          <Input type="number" value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>Período: {months} meses</Label>
          <Slider value={[months]} min={6} max={360} step={6} onValueChange={(v) => setMonths(v[0])} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Total" value={formatBRL(last.total)} />
        <Stat label="Aportado" value={formatBRL(last.aportado)} />
        <Stat label="Lucro" value={formatBRL(lucro)} color="var(--pastel-green)" />
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={50}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--foreground)",
                fontSize: 12,
              }}
              formatter={(v: number, name) => [formatBRL(v), name === "total" ? "Total" : "Aportado"]}
              labelFormatter={(l) => `Mês ${l}`}
            />
            <Line type="monotone" dataKey="aportado" stroke="var(--muted-foreground)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="total" stroke="var(--pastel-blue)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl bg-card/60 border border-border/60 px-2 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold" style={{ color }}>{value}</p>
    </div>
  );
}