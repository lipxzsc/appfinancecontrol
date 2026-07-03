import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Mail, User as UserIcon, KeyRound, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/password-field";
import { AVATAR_PRESETS, parseAvatar, serializeEmojiAvatar } from "@/lib/avatars";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — FinControl" },
      { name: "description", content: "Altere seu avatar, nome, e-mail e senha." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string>("🦊");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      setCurrentEmail(data.user.email ?? "");
      setEmail(data.user.email ?? "");
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      if (prof?.display_name) setName(prof.display_name);
      const parsed = parseAvatar(prof?.avatar_url);
      if (parsed && parsed.length <= 4) setAvatar(parsed);
    })();
  }, []);

  async function saveProfile() {
    if (!userId) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        avatar_url: serializeEmojiAvatar(avatar),
      })
      .eq("id", userId);
    setSavingProfile(false);
    if (error) return toast.error("Não deu pra salvar: " + error.message);
    toast.success("Perfil atualizado ✨");
  }

  async function saveEmail() {
    if (email.trim() === currentEmail) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setSavingEmail(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de confirmação pro novo e-mail 📩");
  }

  async function savePassword() {
    if (newPassword.length < 6) {
      return toast.error("A senha precisa ter ao menos 6 caracteres");
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPass(false);
    if (error) return toast.error(error.message);
    setNewPassword("");
    toast.success("Senha alterada com sucesso 🔐");
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })} aria-label="Voltar">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Configurações</h2>
          <p className="text-xs text-muted-foreground">Personalize seu perfil</p>
        </div>
      </header>

      {/* Perfil */}
      <section
        className="rounded-3xl border border-border/60 p-5 space-y-4"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-16 w-16 rounded-2xl grid place-items-center text-3xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            {avatar}
          </div>
          <div>
            <p className="text-sm font-medium">Seu avatar</p>
            <p className="text-xs text-muted-foreground">Escolha um dos bichinhos abaixo</p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {AVATAR_PRESETS.map((emoji) => {
            const active = emoji === avatar;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`relative h-11 w-11 rounded-xl text-2xl grid place-items-center border transition-all ${
                  active
                    ? "border-primary scale-110 shadow-md"
                    : "border-border/60 hover:border-primary/60 hover:scale-105"
                }`}
                aria-label={`Escolher ${emoji}`}
              >
                {emoji}
                {active && (
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground grid place-items-center">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name" className="flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" /> Nome
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como te chamamos?"
            maxLength={80}
          />
        </div>

        <Button onClick={saveProfile} disabled={savingProfile} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {savingProfile ? "Salvando..." : "Salvar perfil"}
        </Button>
      </section>

      {/* E-mail */}
      <section
        className="rounded-3xl border border-border/60 p-5 space-y-4"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">E-mail</h3>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Endereço atual</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Vamos mandar um link de confirmação pro e-mail novo.
          </p>
        </div>
        <Button
          onClick={saveEmail}
          disabled={savingEmail || email.trim() === currentEmail || !email.trim()}
          variant="outline"
          className="w-full"
        >
          {savingEmail ? "Enviando..." : "Atualizar e-mail"}
        </Button>
      </section>

      {/* Senha */}
      <section
        className="rounded-3xl border border-border/60 p-5 space-y-4"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Senha</h3>
        </div>
        <PasswordField
          value={newPassword}
          onChange={setNewPassword}
          label="Nova senha"
          id="new-password"
          autoComplete="new-password"
          placeholder="Ao menos 6 caracteres"
        />
        <Button
          onClick={savePassword}
          disabled={savingPass || newPassword.length < 6}
          variant="outline"
          className="w-full"
        >
          {savingPass ? "Alterando..." : "Alterar senha"}
        </Button>
      </section>
    </div>
  );
}