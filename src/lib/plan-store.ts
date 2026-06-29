import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Armazena o status do plano Pro localmente (mock/simulado).
 * Guarda o timestamp de expiração no localStorage por usuário.
 */
const KEY = "fin-pro-until";

function storageKey(uid: string | null) {
  return uid ? `${KEY}::${uid}` : KEY;
}

let currentUid: string | null = null;
const listeners = new Set<() => void>();

function readUntil(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey(currentUid));
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  return isFinite(ts) ? ts : null;
}

/** Soma `days` ao plano atual (ou inicia a partir de agora se expirado). */
export function activatePro(days: number) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const current = readUntil();
  const base = current && current > now ? current : now;
  const next = base + days * 86_400_000;
  window.localStorage.setItem(storageKey(currentUid), String(next));
  listeners.forEach((l) => l());
}

/** Cancela imediatamente o plano (uso em testes/UI). */
export function cancelPro() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(currentUid));
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  supabase.auth.getUser().then(({ data }) => {
    currentUid = data.user?.id ?? null;
    listeners.forEach((l) => l());
  });
  supabase.auth.onAuthStateChange((_evt, session) => {
    currentUid = session?.user?.id ?? null;
    listeners.forEach((l) => l());
  });
}

export interface PlanState {
  isPro: boolean;
  expiresAt: number | null;
  msLeft: number;
  daysLeft: number;
}

function compute(): PlanState {
  const until = readUntil();
  const now = Date.now();
  const ms = until ? Math.max(0, until - now) : 0;
  return {
    isPro: ms > 0,
    expiresAt: until,
    msLeft: ms,
    daysLeft: Math.ceil(ms / 86_400_000),
  };
}

/** Hook reativo que retorna o estado do plano e atualiza a cada minuto. */
export function usePlan(): PlanState {
  const [state, setState] = useState<PlanState>(() => compute());
  useEffect(() => {
    const l = () => setState(compute());
    listeners.add(l);
    const t = setInterval(l, 60_000);
    return () => {
      listeners.delete(l);
      clearInterval(t);
    };
  }, []);
  return state;
}

/** Limites do plano gratuito. */
export const FREE_LIMITS = {
  transactionsPerMonth: 20,
  goals: 1,
  investments: 1,
  budgets: 2,
} as const;

/** Planos disponíveis para "assinar". */
export const PLAN_OPTIONS = [
  { days: 7, priceLabel: "R$ 4,90", subtitle: "Pra testar" },
  { days: 15, priceLabel: "R$ 9,90", subtitle: "Curto prazo" },
  { days: 30, priceLabel: "R$ 14,90", subtitle: "Mais popular", highlight: true },
] as const;