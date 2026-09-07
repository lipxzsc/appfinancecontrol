import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  year: number;
  month: number; // 0-indexed
  onChange: (year: number, month: number) => void;
}

export function MonthCarousel({ year, month, onChange }: Props) {
  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onChange(d.getFullYear(), d.getMonth());
  };
  return (
    <div className="flex items-center justify-between rounded-xl bg-card/55 backdrop-blur-xl px-2 py-2 shadow-[var(--shadow-soft)] border border-border">
      <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Mês anterior">
        <ChevronLeft />
      </Button>
      <div className="flex flex-col items-center select-none">
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
          {year}
        </span>
        <span className="font-display text-base font-semibold text-foreground">
          {MONTHS[month]}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Próximo mês">
        <ChevronRight />
      </Button>
    </div>
  );
}

export { MONTHS };