import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, ArrowLeftRight, PieChart, Target, TrendingUp, LogOut, User as UserIcon, Settings as SettingsIcon, WalletCards } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/lib/plan-store";
import { ProBadge, ProUpsellChip } from "@/components/pro-lock";
import { parseAvatar } from "@/lib/avatars";

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
  const [avatar, setAvatar] = useState<string | null>(null);
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
        .select("display_name, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      setDisplayName(prof?.display_name ?? data.user.email?.split("@")[0] ?? null);
      setAvatar(parseAvatar(prof?.avatar_url));
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
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6">
        <header className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card/50 px-3 py-3 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:px-4">
          {signedIn ? (
            <Link
              to="/configuracoes"
              aria-label="Configurações"
              className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl text-xl transition-transform hover:scale-105"
              style={{ background: "var(--gradient-primary)" }}
            >
              {avatar && avatar.startsWith("http") ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{avatar ?? "✨"}</span>
              )}
            </Link>
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><WalletCards className="h-5 w-5" /></div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-semibold leading-tight">FinControl</h1>
            <p className="text-xs text-muted-foreground truncate">
              {displayName ? `Olá, ${displayName}` : "Receitas, sonhos e investimentos"}
            </p>
          </div>
          {signedIn && (
            plan.isPro ? <ProBadge daysLeft={plan.daysLeft} /> : <ProUpsellChip />
          )}
          {signedIn ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Configurações">
                <Link to="/configuracoes"><SettingsIcon className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" variant="outline" className="gap-1 rounded-full">
              <Link to="/auth"><UserIcon className="h-4 w-4" /> Entrar</Link>
            </Button>
          )}
        </header>
        <Outlet />
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-2xl rounded-2xl border border-border bg-card/90 shadow-2xl backdrop-blur-xl sm:bottom-5">
        <div className="grid grid-cols-5 p-1">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] transition-all ${
                   active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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