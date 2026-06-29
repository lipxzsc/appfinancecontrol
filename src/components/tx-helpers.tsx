import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Plus,
  PiggyBank,
  Trash2,
  Briefcase,
  Wallet,
  HandCoins,
  CircleHelp,
  Receipt,
  UtensilsCrossed,
  Landmark,
  Gamepad2,
  HeartPulse,
  Bus,
  Tv,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  formatBRL,
  uid,
  type Transaction,
  type TxType,
  type TxCategory,
} from "@/lib/finance-store";

/** Categorias de receita exibidas como chips com ícone. */
export const RECEITA_CATEGORIES: { value: TxCategory; label: string; icon: React.ElementType }[] = [
  { value: "salario", label: "Salário", icon: Briefcase },
  { value: "renda_extra", label: "Renda extra", icon: HandCoins },
  { value: "recebiveis", label: "Recebíveis", icon: Wallet },
  { value: "outros_receita", label: "Outros", icon: CircleHelp },
];

/** Categorias de despesa exibidas como chips com ícone. */
export const DESPESA_CATEGORIES: { value: TxCategory; label: string; icon: React.ElementType }[] = [
  { value: "contas", label: "Contas", icon: Receipt },
  { value: "taxas", label: "Taxas", icon: Landmark },
  { value: "transporte", label: "Transporte", icon: Bus },
  { value: "alimentacao", label: "Alimentação", icon: UtensilsCrossed },
  { value: "saude", label: "Saúde", icon: HeartPulse },
  { value: "lazer", label: "Lazer", icon: Gamepad2 },
  { value: "streamings", label: "Streamings", icon: Tv },
  { value: "outros_despesa", label: "Outros", icon: CircleHelp },
];

function categoryFor(type: TxType) {
  return type === "receita" ? RECEITA_CATEGORIES : DESPESA_CATEGORIES;
}

function defaultCategory(type: TxType): TxCategory {
  return type === "receita" ? "salario" : "contas";
}

export function labelForCategory(category?: TxCategory) {
  if (!category) return "";
  return [...RECEITA_CATEGORIES, ...DESPESA_CATEGORIES].find((c) => c.value === category)?.label ?? "";
}

export function iconForCategory(category?: TxCategory) {
  if (!category) return CircleHelp;
  return [...RECEITA_CATEGORIES, ...DESPESA_CATEGORIES].find((c) => c.value === category)?.icon ?? CircleHelp;
}

/** Card editável que guarda o saldo inicial das operações do usuário. */
export function InitialBalanceCard({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
      <PiggyBank className="h-5 w-5" style={{ color: "var(--pastel-yellow)" }} />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">Saldo inicial das operações</p>
        {editing ? (
          <Input
            autoFocus
            type="number"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => {
              onChange(parseFloat(input) || 0);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onChange(parseFloat(input) || 0);
                setEditing(false);
              }
            }}
            className="h-8"
          />
        ) : (
          <button
            onClick={() => {
              setInput(String(value));
              setEditing(true);
            }}
            className="text-left text-base font-semibold"
          >
            {formatBRL(value)}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Dialog minimalista para inserir receita ou despesa.
 * Quando `lockedReason` é passado, o botão vira CTA para /planos.
 */
export function AddTxDialog({
  year,
  month,
  onAdd,
  lockedReason,
}: {
  year: number;
  month: number;
  onAdd: (t: Transaction) => void;
  lockedReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("receita");
  const [category, setCategory] = useState<TxCategory>(defaultCategory("receita"));
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const today = new Date();
  const defaultDay =
    year === today.getFullYear() && month === today.getMonth() ? today.getDate() : 1;
  const [date, setDate] = useState(
    `${year}-${String(month + 1).padStart(2, "0")}-${String(defaultDay).padStart(2, "0")}`,
  );

  // Modo bloqueado (limite Free atingido): vira CTA para /planos.
  if (lockedReason) {
    return (
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-8 gap-1 rounded-full border-dashed text-xs"
      >
        <Link to="/planos">
          <Lock className="h-3.5 w-3.5" style={{ color: "var(--pastel-yellow)" }} />
          {lockedReason}
        </Link>
      </Button>
    );
  }

  const reset = () => {
    setDesc("");
    setAmount("");
    setType("receita");
    setCategory(defaultCategory("receita"));
  };

  const handleTypeChange = (next: TxType) => {
    setType(next);
    setCategory(defaultCategory(next));
  };

  const categories = categoryFor(type);
  const accent = type === "receita" ? "pastel-green" : "pastel-red";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
        if (o) {
          setDate(
            `${year}-${String(month + 1).padStart(2, "0")}-${String(defaultDay).padStart(2, "0")}`,
          );
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 rounded-full">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <TypeButton
            active={type === "receita"}
            color="pastel-green"
            icon={ArrowUpCircle}
            label="Receita"
            onClick={() => handleTypeChange("receita")}
          />
          <TypeButton
            active={type === "despesa"}
            color="pastel-red"
            icon={ArrowDownCircle}
            label="Despesa"
            onClick={() => handleTypeChange("despesa")}
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Valor
          </Label>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-medium" style={{ color: `var(--${accent})` }}>
              R$
            </span>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="h-10 border-0 bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
              style={{ color: `var(--${accent})` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => {
            const Icon = c.icon;
            const selected = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className="flex flex-col items-center gap-1 rounded-xl border bg-card/60 px-1 py-2 text-[10px] font-medium transition-all"
                style={{
                  borderColor: selected ? `var(--${accent})` : "var(--border)",
                  background: selected
                    ? `color-mix(in oklch, var(--${accent}) 18%, transparent)`
                    : undefined,
                  color: selected ? `var(--${accent})` : undefined,
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-center leading-tight">{c.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="h-9"
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-[9.5rem]"
          />
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            style={{
              background: `var(--${accent})`,
              color: "var(--background)",
            }}
            onClick={() => {
              const v = parseFloat(amount);
              if (!v || v <= 0) return;
              onAdd({
                id: uid(),
                type,
                category,
                amount: v,
                description: desc.trim(),
                date,
              });
              setOpen(false);
              reset();
            }}
          >
            Adicionar {type === "receita" ? "receita" : "despesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TypeButton({
  active,
  color,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all"
      style={{
        borderColor: active ? `var(--${color})` : "var(--border)",
        background: active
          ? `color-mix(in oklch, var(--${color}) 18%, transparent)`
          : "transparent",
        color: active ? `var(--${color})` : "var(--muted-foreground)",
      }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/** Item de lista de transação (reusado em Início e Transações). */
export function TxListItem({
  tx,
  onDelete,
}: {
  tx: Transaction;
  onDelete: () => void;
}) {
  const isReceita = tx.type === "receita";
  const color = isReceita ? "var(--pastel-green)" : "var(--pastel-red)";
  const Icon = iconForCategory(tx.category);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/60"
        style={{ color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {tx.description || (isReceita ? "Receita" : "Despesa")}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(tx.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
          {tx.category && (
            <>
              <span className="text-border">•</span>
              <span style={{ color }}>{labelForCategory(tx.category)}</span>
            </>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>
        {isReceita ? "+" : "-"}
        {formatBRL(tx.amount)}
      </span>
      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}