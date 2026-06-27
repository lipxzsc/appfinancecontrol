import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TxType = "receita" | "despesa";
export type TxCategory =
  | "salario"
  | "freelancer"
  | "extra"
  | "outros_receita"
  | "contas"
  | "moradia"
  | "alimentacao"
  | "combustivel"
  | "taxas"
  | "lazer"
  | "saude"
  | "transporte"
  | "educacao"
  | "outros_despesa";

export interface Transaction {
  id: string;
  type: TxType;
  category?: TxCategory;
  description: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
}
export interface Goal {
  id: string;
  name: string;
  icon: string; // emoji
  targetAmount: number;
  monthlyContribution: number;
  saved: number;
  deposits?: { id: string; amount: number; date: string }[];
  createdAt: string;
}
export interface Investment {
  id: string;
  name: string;
  type: "CDB" | "FII" | "Ações" | "Tesouro Direto" | "Poupança" | "Outro";
  amount: number;
  monthlyYieldPct: number; // % ao mês
}
export interface FinanceState {
  initialBalance: number;
  transactions: Transaction[];
  goals: Goal[];
  investments: Investment[];
  cdiMonthlyPct: number;
  /** Limite de orçamento mensal por categoria de despesa (em R$). */
  budgets?: Partial<Record<TxCategory, number>>;
}

const KEY = "finance-app-state-v1";
const defaultState: FinanceState = {
  initialBalance: 0,
  transactions: [],
  goals: [],
  investments: [],
  cdiMonthlyPct: 0.9,
  budgets: {},
};

let memory: FinanceState | null = null;
let currentUserId: string | null = null;
let cloudLoaded = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function storageKey() {
  return currentUserId ? `finance-app-state::${currentUserId}` : KEY;
}

function load(): FinanceState {
  if (memory) return memory;
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(storageKey());
    memory = raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    memory = defaultState;
  }
  return memory!;
}

function persistCloudDebounced(next: FinanceState) {
  if (!currentUserId) return;
  if (saveTimer) clearTimeout(saveTimer);
  const uid = currentUserId;
  saveTimer = setTimeout(() => {
    supabase
      .from("finance_data")
      .upsert({ user_id: uid, data: next as never })
      .then(({ error }) => {
        if (error) console.error("[finance] cloud save failed", error.message);
      });
  }, 600);
}

function save(next: FinanceState) {
  memory = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(), JSON.stringify(next));
  }
  persistCloudDebounced(next);
  listeners.forEach((l) => l());
}

async function hydrateFromCloud(userId: string) {
  currentUserId = userId;
  cloudLoaded = false;
  memory = null; // force per-user reload
  const { data, error } = await supabase
    .from("finance_data")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[finance] cloud load failed", error.message);
  }
  if (data?.data) {
    memory = { ...defaultState, ...(data.data as Partial<FinanceState>) };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(), JSON.stringify(memory));
    }
  } else {
    // first-time user: seed cloud with whatever exists locally (or empty)
    const initial = load();
    await supabase.from("finance_data").upsert({
      user_id: userId,
      data: initial as never,
    });
  }
  cloudLoaded = true;
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) hydrateFromCloud(data.user.id);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      hydrateFromCloud(session.user.id);
    }
    if (event === "SIGNED_OUT") {
      currentUserId = null;
      cloudLoaded = false;
      memory = null;
      listeners.forEach((l) => l());
    }
  });
}

export function isCloudReady() {
  return !currentUserId || cloudLoaded;
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(() => load());
  useEffect(() => {
    const l = () => setState({ ...load() });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  const update = useCallback((mut: (s: FinanceState) => FinanceState) => {
    save(mut(load()));
  }, []);
  return { state, update };
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function txMonthKey(t: Transaction) {
  return t.date.slice(0, 7);
}

/** Compute cumulative balance up to end of (year, month), carrying over leftovers. */
export function computeMonthBalances(
  state: FinanceState,
  year: number,
  month: number,
) {
  const targetKey = monthKey(year, month);
  // sum prior months
  let carryOver = state.initialBalance;
  let receitasMes = 0;
  let despesasMes = 0;
  for (const t of state.transactions) {
    const k = txMonthKey(t);
    if (k < targetKey) {
      carryOver += t.type === "receita" ? t.amount : -t.amount;
    } else if (k === targetKey) {
      if (t.type === "receita") receitasMes += t.amount;
      else despesasMes += t.amount;
    }
  }
  const rendimentoEstimado = state.investments.reduce(
    (s, i) => s + i.amount * (i.monthlyYieldPct / 100),
    0,
  );
  const saldoFinal = carryOver + receitasMes + rendimentoEstimado - despesasMes;
  return { carryOver, receitasMes, despesasMes, rendimentoEstimado, saldoFinal };
}

export function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}