import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, ArrowLeftRight, PieChart, Target, TrendingUp, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/lib/plan-store";
import { ProBadge, ProUpsellChip } from "@/components/pro-lock";

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}
const NAV: NavItem[] = [
  { to: "/", label: "Início", Icon: Home },
  { to: "/transacoes", label: "Transações", Icon: ArrowLeftRight },
  { to: "/orcamento", label: "Orçamento", Icon: PieChart },
  { to: "/sonhos", label: "Sonhos", Icon: Target },
  { to: "/investimentos", label: "Investir", Icon: TrendingUp },
];

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const plan = usePlan();

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setSignedIn(false);
        setDisplayName(null);
        return;
      }
      setSignedIn(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      setDisplayName(prof?.display_name ?? data.user.email?.split("@")[0] ?? null);
    }
    loadProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadProfile());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAuth = pathname === "/auth";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (isAuth) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-28">
        <header className="mb-6 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-2xl"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold leading-tight">FinControl</h1>
            <p className="text-xs text-muted-foreground truncate">
              {displayName ? `Olá, ${displayName}` : "Receitas, sonhos e investimentos"}
            </p>
          </div>
          {signedIn && (
            plan.isPro ? <ProBadge daysLeft={plan.daysLeft} /> : <ProUpsellChip />
          )}
          {signedIn ? (
            <Button variant="ghost" size="icon" aria-label="Sair" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="gap-1 rounded-full">
              <Link to="/auth"><UserIcon className="h-4 w-4" /> Entrar</Link>
            </Button>
          )}
        </header>
        <Outlet />
      </div>
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-3xl grid grid-cols-5">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-3 text-[10px] transition-colors ${
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