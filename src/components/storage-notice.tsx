import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NOTICE_KEY = "fc:storage-notice-v1";

/** Somente armazenamento essencial é usado; não há rastreamento publicitário. */
export function StorageNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(window.localStorage.getItem(NOTICE_KEY) !== "acknowledged"), []);
  if (!open) return null;
  return (
    <aside className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-xl rounded-lg border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-5" aria-label="Aviso de armazenamento">
      <div className="flex gap-3">
        <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Usamos apenas armazenamento essencial</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Ele mantém seu login, preferências e dados no aparelho. Não usamos cookies de publicidade ou rastreamento.{" "}
            <Link to="/privacidade" className="text-primary underline">Saiba mais</Link>
          </p>
        </div>
      </div>
      <Button size="sm" className="mt-3 w-full" onClick={() => { window.localStorage.setItem(NOTICE_KEY, "acknowledged"); setOpen(false); }}>
        Entendi
      </Button>
    </aside>
  );
}