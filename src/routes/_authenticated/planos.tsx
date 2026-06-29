import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Sparkles,
  Check,
  Crown,
  Infinity as InfinityIcon,
  FileText,
  ArrowLeft,
  PartyPopper,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  usePlan,
  activatePro,
  cancelPro,
  PLAN_OPTIONS,
  FREE_LIMITS,
} from "@/lib/plan-store";

/**
 * Página de planos: lúdica, didática.
 * Mostra o status atual e os 3 planos pra "assinar" (mock — ativa local).
 */
export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({
    meta: [
      { title: "Planos — FinControl" },
      {
        name: "description",
        content:
          "Conheça o Pro: movimentações, metas, orçamentos e investimentos ilimitados, mais relatório mensal.",
      },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const plan = usePlan();

  // Para a barra de progresso quando ativo: assumimos plano de 30 dias como referência.
  const totalDaysRef = 30;
  const usedPct = useMemo(() => {
    if (!plan.isPro || !plan.expiresAt) return 0;
    const totalMs = totalDaysRef * 86_400_000;
    const remainingPct = (plan.msLeft / totalMs) * 100;
    return Math.max(0, Math.min(100, 100 - remainingPct));
  }, [plan]);

  const handleSubscribe = (days: number, price: string) => {
    activatePro(days);
    toast.success(`🎉 Pro ativado por ${days} dias!`, {
      description: `Pagamento simulado de ${price}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2 h-8 text-xs">
        <Link to="/"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
      </Button>

      {/* Hero lúdico */}
      <section
        className="overflow-hidden rounded-3xl border border-border/60 p-6 text-center shadow-[var(--shadow-soft)]"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl"
          style={{ background: "var(--gradient-primary)" }}>
          <Crown className="h-7 w-7" style={{ color: "var(--background)" }} />
        </div>
        <h2 className="text-xl font-bold">FinControl Pro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tire o limite. Foque no que importa: sua grana crescendo.
        </p>
      </section>

      {/* Status atual */}
      {plan.isPro ? (
        <ActiveStatus
          daysLeft={plan.daysLeft}
          msLeft={plan.msLeft}
          usedPct={usedPct}
          onCancel={() => {
            cancelPro();
            toast("Plano cancelado", { description: "Você voltou ao Free." });
          }}
        />
      ) : (
        <FreeStatus />
      )}

      {/* Comparativo Free vs Pro */}
      <section className="grid grid-cols-2 gap-3">
        <Compare
          title="Free"
          subtitle="o básico"
          color="var(--muted-foreground)"
          items={[
            `${FREE_LIMITS.transactionsPerMonth} transações/mês`,
            `${FREE_LIMITS.budgets} orçamentos`,
            `${FREE_LIMITS.goals} meta`,
            `${FREE_LIMITS.investments} investimento`,
            "Sem relatório mensal",
          ]}
        />
        <Compare
          title="Pro"
          subtitle="liberado total"
          color="var(--pastel-yellow)"
          highlight
          items={[
            "Transações ilimitadas",
            "Orçamentos ilimitados",
            "Metas ilimitadas",
            "Investimentos ilimitados",
            "Relatório mensal completo",
          ]}
        />
      </section>

      {/* Cards de planos */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">
          {plan.isPro ? "Renovar / estender" : "Escolha seu plano"}
        </h3>
        <div className="grid gap-3">
          {PLAN_OPTIONS.map((p) => (
            <PlanCard
              key={p.days}
              days={p.days}
              price={p.priceLabel}
              subtitle={p.subtitle}
              highlight={"highlight" in p && p.highlight}
              onClick={() => handleSubscribe(p.days, p.priceLabel)}
            />
          ))}
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          Pagamento simulado · ative à vontade pra testar
        </p>
      </section>
    </div>
  );
}

/** Banner do plano ativo com progresso e renovação. */
function ActiveStatus({
  daysLeft,
  msLeft,
  usedPct,
  onCancel,
}: {
  daysLeft: number;
  msLeft: number;
  usedPct: number;
  onCancel: () => void;
}) {
  const hours = Math.floor((msLeft / 3_600_000) % 24);
  const lowTime = daysLeft <= 3;
  return (
    <section
      className="rounded-3xl border border-border/60 p-5 shadow-[var(--shadow-soft)]"
      style={{ background: "var(--gradient-card)" }}
    >
      <div className="flex items-center gap-3">
        <PartyPopper className="h-6 w-6" style={{ color: "var(--pastel-yellow)" }} />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Plano ativo</p>
          <p className="text-lg font-bold">
            {daysLeft} {daysLeft === 1 ? "dia" : "dias"} restantes
          </p>
          <p className="text-[11px] text-muted-foreground">+{hours}h</p>
        </div>
      </div>
      <Progress value={usedPct} className="mt-3 h-2" />
      {lowTime && (
        <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--pastel-yellow)" }}>
          <Clock className="h-3.5 w-3.5" /> Tá acabando! Renove pra não perder os benefícios.
        </p>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="mt-2 h-7 px-2 text-[11px] text-muted-foreground"
      >
        Cancelar plano
      </Button>
    </section>
  );
}

/** Banner para usuário free. */
function FreeStatus() {
  return (
    <section className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-5 text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Você está no</p>
      <p className="text-lg font-bold">Plano Free</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Escolha um plano abaixo pra liberar tudo.
      </p>
    </section>
  );
}

function Compare({
  title,
  subtitle,
  items,
  color,
  highlight,
}: {
  title: string;
  subtitle: string;
  items: string[];
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: highlight ? "var(--pastel-yellow)" : "var(--border)",
        background: highlight
          ? "color-mix(in oklch, var(--pastel-yellow) 8%, var(--card))"
          : "var(--card)",
      }}
    >
      <div className="flex items-center gap-1.5">
        {highlight ? (
          <Crown className="h-4 w-4" style={{ color }} />
        ) : (
          <FileText className="h-4 w-4" style={{ color }} />
        )}
        <p className="text-sm font-bold" style={{ color }}>{title}</p>
      </div>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px]">
            {highlight ? (
              <InfinityIcon className="h-3 w-3 mt-0.5 shrink-0" style={{ color }} />
            ) : (
              <Check className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
            )}
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanCard({
  days,
  price,
  subtitle,
  highlight,
  onClick,
}: {
  days: number;
  price: string;
  subtitle: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  const perDay = (parseFloat(price.replace(/[^\d,]/g, "").replace(",", ".")) / days).toFixed(2).replace(".", ",");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border p-4 text-left transition-all hover:scale-[1.01]"
      style={{
        borderColor: highlight ? "var(--pastel-yellow)" : "var(--border)",
        background: highlight
          ? "color-mix(in oklch, var(--pastel-yellow) 10%, var(--card))"
          : "var(--card)",
      }}
    >
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-bold"
        style={{
          background: highlight ? "var(--gradient-primary)" : "var(--background)",
          color: highlight ? "var(--background)" : "var(--foreground)",
        }}
      >
        {days}d
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold">
            {days} {days === 1 ? "dia" : "dias"} Pro
          </p>
          {highlight && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: "var(--pastel-yellow)", color: "var(--background)" }}
            >
              POPULAR
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{subtitle} · R$ {perDay}/dia</p>
      </div>
      <div className="text-right">
        <p className="text-base font-bold">{price}</p>
        <p className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: "var(--pastel-green)" }}>
          <Sparkles className="h-2.5 w-2.5" /> Assinar
        </p>
      </div>
    </button>
  );
}