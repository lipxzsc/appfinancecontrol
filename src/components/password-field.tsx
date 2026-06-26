import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeCharacter } from "./eye-character";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  id?: string;
  autoComplete?: string;
  placeholder?: string;
  showCharacter?: boolean;
}

export function PasswordField({
  value, onChange, label = "Senha", id = "password",
  autoComplete = "current-password", placeholder = "••••••••",
  showCharacter = false,
}: Props) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div className="grid gap-2">
      {showCharacter && (
        <div className="flex justify-center pb-1">
          <EyeCharacter open={show} typing={focused && value.length > 0} />
        </div>
      )}
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}