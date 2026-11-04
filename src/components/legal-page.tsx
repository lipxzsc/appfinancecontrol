import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl space-y-5 pb-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      <header className="rounded-lg border border-border bg-card p-5">
        <ShieldCheck className="mb-3 h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Atualizado em {updated}</p>
      </header>
      <div className="space-y-4 rounded-lg border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground [&_h2]:font-semibold [&_h2]:text-foreground">
        {children}
      </div>
    </main>
  );
}