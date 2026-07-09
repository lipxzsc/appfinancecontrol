import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
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
      { title: "Entrar — FinControl" },
      { name: "description", content: "Entre ou cadastre-se no FinControl para sincronizar suas finanças." },
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      toast.error("Falha ao entrar com Google. Verifique se o provedor Google está habilitado no Supabase.");
      setLoading(false);
    }
    // browser redireciona para o Google
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden bg-[#07070d] text-foreground">
      {/* Fundo animado */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
        <div className="auth-grid" />
      </div>
      <style>{authKeyframes}</style>

      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)] space-y-5">
        <header className="text-center space-y-1.5">
          <div
            className="mx-auto h-11 w-11 rounded-2xl grid place-items-center shadow-lg shadow-primary/30"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Sparkles className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">FinControl</h1>
          <p className="text-xs text-muted-foreground">
            {mode === "login" ? "Bem-vindo de volta ✨" : "Vamos criar sua conta"}
          </p>
        </header>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
          <TabsList className="grid grid-cols-2 w-full bg-white/5 border border-white/10">
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
  if (/invalid login credentials/i.test(msg))
    return "E-mail ou senha incorretos. Se você criou a conta com Google, use \"Continuar com Google\".";
  if (/user already registered/i.test(msg))
    return "Esse e-mail já está cadastrado. Tente entrar — se você usou Google antes, clique em \"Continuar com Google\".";
  if (/password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 6 caracteres";
  return msg;
}

const authKeyframes = `
.auth-blob { position:absolute; border-radius:9999px; filter: blur(60px); opacity:.55; mix-blend-mode:screen; }
.auth-blob-1 { width:340px; height:340px; background:radial-gradient(circle,#3b82f6,transparent 70%); top:-80px; left:-80px; animation: auth-float1 14s ease-in-out infinite; }
.auth-blob-2 { width:380px; height:380px; background:radial-gradient(circle,#ec4899,transparent 70%); bottom:-120px; right:-100px; animation: auth-float2 16s ease-in-out infinite; }
.auth-blob-3 { width:280px; height:280px; background:radial-gradient(circle,#8b5cf6,transparent 70%); top:40%; left:40%; animation: auth-float3 18s ease-in-out infinite; }
.auth-grid { position:absolute; inset:0; background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px); background-size: 32px 32px; mask-image: radial-gradient(ellipse at center, black 40%, transparent 75%); }
@keyframes auth-float1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(40px,60px) scale(1.15);} }
@keyframes auth-float2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-50px,-40px) scale(1.1);} }
@keyframes auth-float3 { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(-60px,30px) scale(1.2);} 66%{transform:translate(50px,-40px) scale(.9);} }
`;