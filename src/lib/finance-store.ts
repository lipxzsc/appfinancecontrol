import { useEffect, useState, useCallback } from "react";

export type TxType = "receita" | "despesa";
export interface Transaction {
  id: string;
  type: TxType;
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
}

const KEY = "finance-app-state-v1";
const defaultState: FinanceState = {
  initialBalance: 0,
  transactions: [],
  goals: [],
  investments: [],
  cdiMonthlyPct: 0.9,
};

let memory: FinanceState | null = null;
const listeners = new Set<() => void>();

function load(): FinanceState {
  if (memory) return memory;
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(KEY);
    memory = raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    memory = defaultState;
  }
  return memory!;
}

function save(next: FinanceState) {
  memory = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
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