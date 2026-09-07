import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, LoaderCircle, ShieldCheck, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordField } from "@/components/password-field";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar no FinControl" },
      { name: "description", content: "Entre ou crie sua conta para organizar sua vida financeira no FinControl." },
      { property: "og:title", content: "Entrar no FinControl" },
      { property: "og:description", content: "Acesse seu controle de receitas, despesas, metas e investimentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Que bom ter você de volta!");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Sua conta está pronta!");
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível continuar";
      toast.error(translate(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      toast.error("Não foi possível entrar com o Google agora.");
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 text-foreground sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute left-[8%] top-[18%] h-40 w-px rotate-12 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        <div className="absolute bottom-[12%] right-[9%] h-36 w-px -rotate-12 bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_40px_-18px_var(--primary)]">
            <WalletCards className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold">FinControl</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Seu dinheiro, seus planos, tudo em ordem.
          </p>
        </header>

        <section className="rounded-3xl border border-border bg-card/65 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
          <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-border bg-background/40 p-1">
              <TabsTrigger value="login" className="rounded-lg">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">Criar conta</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-5 text-center">
            <h2 className="font-display text-lg font-semibold">
              {isLogin ? "Bem-vindo de volta" : "Comece do seu jeito"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isLogin ? "Entre para continuar de onde parou." : "Leva menos de um minuto."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!isLogin && (
              <div className="grid gap-1.5 animate-fade-in">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Como podemos chamar você?"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                required
              />
            </div>

            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete={isLogin ? "current-password" : "new-password"}
              showCharacter
              characterSize={80}
            />

            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <><LoaderCircle className="animate-spin" /> Aguarde</>
              ) : (
                <>{isLogin ? "Entrar" : "Criar minha conta"}<ArrowRight /></>
              )}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" size="lg" className="w-full gap-2" onClick={handleGoogle} disabled={loading}>
            <GoogleIcon /> Entrar com Google
          </Button>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Seus dados ficam protegidos
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Prefere explorar primeiro? <Link to="/" className="font-semibold text-primary hover:underline">Testar offline</Link>
        </p>

        <div className="mt-4 flex justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Simples</span>
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Seguro</span>
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Organizado</span>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden className="text-foreground">
      <path fill="currentColor" d="M21.8 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z" />
      <path fill="currentColor" opacity=".8" d="M12 22c2.7 0 5-.9 6.8-2.3l-3.3-2.6c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" />
      <path fill="currentColor" opacity=".6" d="M6.4 14a6 6 0 0 1 0-4V7.3H3a10 10 0 0 0 0 9.4L6.4 14Z" />
      <path fill="currentColor" opacity=".4" d="M12 5.9c1.6 0 3 .5 4 1.6l3-3A10 10 0 0 0 3 7.3L6.4 10A6 6 0 0 1 12 5.9Z" />
    </svg>
  );
}

function translate(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos. Se você entrou com Google antes, use o botão do Google.";
  if (/user already registered/i.test(msg)) return "Esse e-mail já está cadastrado. Tente entrar.";
  if (/password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres.";
  return msg;
}