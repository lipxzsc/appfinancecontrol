import jsPDF from "jspdf";
import { formatBRL, type Transaction, type FinanceState, computeMonthBalances } from "@/lib/finance-store";
import { RECEITA_CATEGORIES, DESPESA_CATEGORIES, labelForCategory } from "@/components/tx-helpers";

/**
 * Geração do relatório mensal em dois formatos:
 *  - PDF (didático, com seções, tabela por categoria e lista detalhada)
 *  - CSV (UTF-8 com BOM e separador `;` — abre direto no Excel e Planilhas)
 */

export interface MonthReportInput {
  year: number;
  month: number; // 0-11
  totals: ReturnType<typeof computeMonthBalances>;
  txs: Transaction[];
  state: FinanceState;
}

function monthName(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function fileSlug(year: number, month: number) {
  return `fincontrol-${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Agrupa as transações por categoria, separando receitas e despesas. */
function groupByCategory(txs: Transaction[]) {
  const receitas = new Map<string, number>();
  const despesas = new Map<string, number>();
  for (const t of txs) {
    const map = t.type === "receita" ? receitas : despesas;
    const key = t.category ?? (t.type === "receita" ? "outros_receita" : "outros_despesa");
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  const toList = (m: Map<string, number>) =>
    Array.from(m.entries())
      .map(([cat, total]) => ({ cat, label: labelForCategory(cat as never) || cat, total }))
      .sort((a, b) => b.total - a.total);
  return { receitas: toList(receitas), despesas: toList(despesas) };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number) {
  const s = String(v);
  if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV pronto pra abrir no Excel pt-BR (separador `;`, vírgula decimal). */
export function downloadMonthReportCSV({ year, month, totals, txs }: MonthReportInput) {
  const sep = ";";
  const fmt = (n: number) => n.toFixed(2).replace(".", ",");
  const lines: string[] = [];
  lines.push(`FinControl - Relatório de ${monthName(year, month)}`);
  lines.push("");
  lines.push("Resumo do mês");
  lines.push(["Indicador", "Valor (R$)"].join(sep));
  lines.push(["Sobra anterior", fmt(totals.carryOver)].join(sep));
  lines.push(["Receitas", fmt(totals.receitasMes)].join(sep));
  lines.push(["Despesas", fmt(totals.despesasMes)].join(sep));
  lines.push(["Rendimento estimado", fmt(totals.rendimentoEstimado)].join(sep));
  lines.push(["Saldo final", fmt(totals.saldoFinal)].join(sep));
  lines.push("");

  const { receitas, despesas } = groupByCategory(txs);
  lines.push("Receitas por categoria");
  lines.push(["Categoria", "Total (R$)"].join(sep));
  receitas.forEach((r) => lines.push([csvEscape(r.label), fmt(r.total)].join(sep)));
  lines.push("");
  lines.push("Despesas por categoria");
  lines.push(["Categoria", "Total (R$)"].join(sep));
  despesas.forEach((r) => lines.push([csvEscape(r.label), fmt(r.total)].join(sep)));
  lines.push("");

  lines.push("Lançamentos detalhados");
  lines.push(["Data", "Tipo", "Categoria", "Descrição", "Valor (R$)"].join(sep));
  for (const t of txs) {
    lines.push([
      t.date,
      t.type === "receita" ? "Receita" : "Despesa",
      csvEscape(labelForCategory(t.category) || "-"),
      csvEscape(t.description || "-"),
      fmt(t.amount),
    ].join(sep));
  }

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${fileSlug(year, month)}.csv`);
}

/** PDF didático: cabeçalho, cards-resumo, tabelas por categoria e lista. */
export function downloadMonthReportPDF({ year, month, totals, txs }: MonthReportInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  doc.setFillColor(30, 30, 40);
  doc.rect(0, 0, pageW, 80, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FinControl", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Relatorio mensal - ${monthName(year, month)}`, margin, 58);
  y = 110;

  const cards: { label: string; value: string; rgb: [number, number, number] }[] = [
    { label: "Sobra anterior", value: formatBRL(totals.carryOver), rgb: [200, 200, 220] },
    { label: "Receitas", value: formatBRL(totals.receitasMes), rgb: [180, 220, 190] },
    { label: "Despesas", value: formatBRL(totals.despesasMes), rgb: [240, 190, 190] },
    { label: "Rendimento est.", value: formatBRL(totals.rendimentoEstimado), rgb: [200, 210, 240] },
  ];
  const cardW = (pageW - margin * 2 - 12 * 3) / 4;
  const cardH = 60;
  cards.forEach((c, i) => {
    const x = margin + i * (cardW + 12);
    doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
    doc.roundedRect(x, y, cardW, cardH, 8, 8, "F");
    doc.setTextColor(60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(c.label.toUpperCase(), x + 10, y + 18);
    doc.setTextColor(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(c.value, x + 10, y + 42);
  });
  y += cardH + 18;

  doc.setFillColor(245, 240, 220);
  doc.roundedRect(margin, y, pageW - margin * 2, 50, 8, 8, "F");
  doc.setTextColor(80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("SALDO FINAL DO MES", margin + 14, y + 20);
  doc.setTextColor(20);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(formatBRL(totals.saldoFinal), margin + 14, y + 40);
  y += 70;

  const ensureSpace = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(28);
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 4, 4, "F");
    doc.setTextColor(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin + 10, y + 15);
    y += 30;
  };

  const drawCategoryTable = (rows: { label: string; total: number }[], totalAll: number) => {
    if (rows.length === 0) {
      ensureSpace(20);
      doc.setTextColor(120);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("Nenhum lancamento.", margin + 4, y + 4);
      y += 18;
      return;
    }
    doc.setFontSize(10);
    for (const r of rows) {
      ensureSpace(20);
      const pct = totalAll > 0 ? Math.round((r.total / totalAll) * 100) : 0;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40);
      doc.text(r.label, margin + 4, y + 10);
      doc.text(`${pct}%`, pageW - margin - 110, y + 10, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(formatBRL(r.total), pageW - margin - 4, y + 10, { align: "right" });
      y += 14;
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(margin + 4, y, pageW - margin * 2 - 8, 4, 2, 2, "F");
      doc.setFillColor(120, 140, 200);
      doc.roundedRect(margin + 4, y, ((pageW - margin * 2 - 8) * pct) / 100, 4, 2, 2, "F");
      y += 10;
    }
    y += 6;
  };

  const { receitas, despesas } = groupByCategory(txs);
  sectionTitle("Receitas por categoria");
  drawCategoryTable(receitas, totals.receitasMes);
  sectionTitle("Despesas por categoria");
  drawCategoryTable(despesas, totals.despesasMes);

  sectionTitle(`Lancamentos detalhados (${txs.length})`);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Data", margin + 4, y);
  doc.text("Categoria", margin + 70, y);
  doc.text("Descricao", margin + 180, y);
  doc.text("Valor", pageW - margin - 4, y, { align: "right" });
  y += 4;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 12;

  for (const t of txs) {
    ensureSpace(16);
    const sign = t.type === "receita" ? "+" : "-";
    const color: [number, number, number] = t.type === "receita" ? [50, 130, 80] : [180, 60, 60];
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(t.date, margin + 4, y);
    doc.text(labelForCategory(t.category) || "-", margin + 70, y);
    const desc = (t.description || "-").slice(0, 38);
    doc.text(desc, margin + 180, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`${sign}${formatBRL(t.amount)}`, pageW - margin - 4, y, { align: "right" });
    y += 16;
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Gerado pelo FinControl - ${new Date().toLocaleString("pt-BR")}  -  Pagina ${p}/${total}`,
      pageW / 2,
      pageH - 18,
      { align: "center" },
    );
  }

  doc.save(`${fileSlug(year, month)}.pdf`);
}

export const _categoryRefs = [...RECEITA_CATEGORIES, ...DESPESA_CATEGORIES];