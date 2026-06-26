import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordField } from "@/components/password-field";
import { EyeCharacter } from "@/components/eye-character";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Bolso Leve" },
      { name: "description", content: "Entre ou cadastre-se no Bolso Leve para sincronizar suas finanças." },
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
        toast.success("Bem-vindo de volta!");
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
        toast.success("Conta criada! 🎉");
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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Falha ao entrar com Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div
        className="w-full max-w-sm rounded-3xl border border-border/60 p-6 shadow-[var(--shadow-soft)] space-y-5"
        style={{ background: "var(--gradient-card)" }}
      >
        <header className="text-center space-y-1">
          <div className="mx-auto h-10 w-10 rounded-2xl grid place-items-center" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Bolso Leve</h1>
          <p className="text-xs text-muted-foreground">
            {mode === "login" ? "Entre para acessar suas finanças" : "Crie sua conta em segundos"}
          </p>
        </header>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid gap-2">
              <Label htmlFor="name">Como te chamamos?</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </div>
          <PasswordField
            value={password}
            onChange={setPassword}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            showCharacter
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Entrar" : "Criar minha conta"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon /> Continuar com Google
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          Sem conta? Tudo bem — você também pode{" "}
          <Link to="/" className="underline">testar offline</Link>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 11v3.3h7.6c-.3 2-2.3 5.9-7.6 5.9-4.6 0-8.3-3.8-8.3-8.5S7.4 3.2 12 3.2c2.6 0 4.4 1.1 5.4 2l3.7-3.6C18.7.5 15.7-.7 12-.7 5.4-.7.1 4.6.1 11.2S5.4 23.1 12 23.1c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.4-.2-2H12z" />
    </svg>
  );
}

function translate(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos";
  if (/user already registered/i.test(msg)) return "Esse e-mail já está cadastrado";
  if (/password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres";
  return msg;
}