import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Wallet, Target, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}
const NAV: NavItem[] = [
  { to: "/", label: "Início", Icon: Wallet },
  { to: "/sonhos", label: "Sonhos", Icon: Target },
  { to: "/investimentos", label: "Investir", Icon: TrendingUp },
];

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-28">
        <header className="mb-6 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-2xl"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Bolso Leve</h1>
            <p className="text-xs text-muted-foreground">Receitas, sonhos e investimentos</p>
          </div>
        </header>
        <Outlet />
      </div>
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-3xl grid grid-cols-3">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}