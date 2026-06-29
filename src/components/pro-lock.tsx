import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Overlay com cadeado que cobre conteúdo restrito a Pro.
 * Use posicionando como filho de um wrapper `relative`.
 */
export function ProLockOverlay({
  message = "Disponível no Pro",
  blur = true,
}: {
  message?: string;
  blur?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-background/55 ${
        blur ? "backdrop-blur-md" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-2 px-4 text-center">
        <div className="rounded-full border border-border/60 bg-card p-3">
          <Lock className="h-5 w-5" style={{ color: "var(--pastel-yellow)" }} />
        </div>
        <p className="text-xs font-medium">{message}</p>
        <Button
          asChild
          size="sm"
          className="h-7 gap-1 rounded-full text-xs"
          style={{ background: "var(--gradient-primary)", color: "var(--background)" }}
        >
          <Link to="/planos">
            <Sparkles className="h-3 w-3" /> Desbloquear Pro
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Pequeno botão de lock que substitui um botão de ação restrita. */
export function ProLockButton({ label = "Pro" }: { label?: string }) {
  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className="h-8 gap-1 rounded-full border-dashed text-xs"
    >
      <Link to="/planos">
        <Lock className="h-3.5 w-3.5" style={{ color: "var(--pastel-yellow)" }} /> {label}
      </Link>
    </Button>
  );
}

/** Selo PRO compacto com dias restantes. */
export function ProBadge({ daysLeft }: { daysLeft: number }) {
  return (
    <Link
      to="/planos"
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
      style={{ background: "var(--gradient-primary)", color: "var(--background)" }}
    >
      <Sparkles className="h-3 w-3" /> PRO · {daysLeft}d
    </Link>
  );
}

/** CTA "Vire Pro" para usuários free no header. */
export function ProUpsellChip() {
  return (
    <Link
      to="/planos"
      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/70 px-2.5 py-1 text-[10px] font-semibold text-foreground hover:bg-card"
    >
      <Sparkles className="h-3 w-3" style={{ color: "var(--pastel-yellow)" }} /> Vire Pro
    </Link>
  );
}