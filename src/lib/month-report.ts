import jsPDF from "jspdf";
import { computeReportBalances } from "@/lib/report-balances";
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
      .map(([cat, total]) => ({ cat, label: catName(cat), total }))
      .sort((a, b) => b.total - a.total);
  return { receitas: toList(receitas), despesas: toList(despesas) };
}

/** Nome legível da categoria, com fallback para categorias antigas. */
function catName(cat?: string) {
  if (!cat) return "-";
  const l = labelForCategory(cat as never);
  if (l) return l;
  const s = cat.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
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
export function downloadMonthReportCSV({ year, month, totals, txs, state }: MonthReportInput) {
  const sep = ";";
  const { saldoInvestimentos, saldoTotalComInvestimentos } = computeReportBalances(state, totals);
  const fmt = (n: number) => n.toFixed(2).replace(".", ",");
  const lines: string[] = [];
  lines.push(`FinControl - Relatório de ${monthName(year, month)}`);
  lines.push("");
  lines.push("Resumo do mês");
  lines.push(["Indicador", "Valor (R$)"].join(sep));
  lines.push(["Sobra anterior", fmt(totals.carryOver)].join(sep));
  lines.push(["Receitas recebidas", fmt(totals.receitasRecebidas)].join(sep));
  lines.push(["Receitas a receber", fmt(totals.receitasPendentes)].join(sep));
  lines.push(["Despesas pagas", fmt(totals.despesasPagas)].join(sep));
  lines.push(["Despesas a pagar", fmt(totals.despesasPendentes)].join(sep));
  lines.push(["Rendimento estimado", fmt(totals.rendimentoEstimado)].join(sep));
  lines.push(["Saldo atual (realizado)", fmt(totals.saldoFinal)].join(sep));
  lines.push(["Saldo dos investimentos", fmt(saldoInvestimentos)].join(sep));
  lines.push(["Saldo total contando com os investimentos", fmt(saldoTotalComInvestimentos)].join(sep));
  lines.push(["Saldo previsto", fmt(totals.saldoFinal + totals.receitasPendentes - totals.despesasPendentes)].join(sep));
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
  lines.push(["Data", "Tipo", "Categoria", "Descrição", "Status", "Valor (R$)"].join(sep));
  for (const t of txs) {
    lines.push([
      t.date,
      t.type === "receita" ? "Receita" : "Despesa",
      csvEscape(catName(t.category)),
      csvEscape(t.description || "-"),
      t.settled === false ? (t.type === "receita" ? "A receber" : "A pagar") : t.type === "receita" ? "Recebido" : "Pago",
      fmt(t.amount),
    ].join(sep));
  }

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${fileSlug(year, month)}.csv`);
}

/** PDF didático: saldos realizados x previstos, status de cada lançamento. */
export function downloadMonthReportPDF(input: MonthReportInput) {
  const doc = buildMonthReportPDF(input);
  doc.save(`${fileSlug(input.year, input.month)}.pdf`);
}

type RGB = [number, number, number];
const C = {
  ink: [24, 32, 30] as RGB,
  muted: [110, 120, 118] as RGB,
  line: [228, 232, 230] as RGB,
  soft: [246, 248, 247] as RGB,
  dark: [12, 28, 24] as RGB,
  mint: [92, 196, 150] as RGB,
  mintSoft: [226, 245, 236] as RGB,
  coral: [226, 112, 96] as RGB,
  coralSoft: [252, 233, 229] as RGB,
  amber: [214, 150, 50] as RGB,
  amberSoft: [252, 243, 224] as RGB,
  blueSoft: [230, 238, 250] as RGB,
  blue: [90, 120, 190] as RGB,
};

/** Monta o documento (separado do download para facilitar testes). */
export function buildMonthReportPDF({ year, month, totals, txs, state }: MonthReportInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const inner = W - M * 2;
  let y = 0;
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: "normal" | "bold", size: number) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };
  const ensure = (need: number) => {
    if (y + need > H - 50) {
      doc.addPage();
      y = M;
    }
  };

  // Saldos derivados: realizado (só liquidados) x previsto (se tudo for quitado).
  const saldoPrevisto = totals.saldoFinal + totals.receitasPendentes - totals.despesasPendentes;
  const resultadoMes = totals.receitasRecebidas - totals.despesasPagas;
  const { saldoInvestimentos, saldoTotalComInvestimentos } = computeReportBalances(state, totals);

  // ---- Cabeçalho
  fill(C.dark);
  doc.rect(0, 0, W, 96, "F");
  fill(C.mint);
  doc.rect(0, 96, W, 4, "F");
  color([255, 255, 255]);
  font("bold", 22);
  doc.text("FinControl", M, 44);
  font("normal", 11);
  color([190, 220, 205]);
  const title = monthName(year, month);
  doc.text(`Relatório mensal · ${title.charAt(0).toUpperCase() + title.slice(1)}`, M, 66);
  font("normal", 9);
  doc.text(`${txs.length} lançamentos`, W - M, 44, { align: "right" });
  y = 124;

  // ---- Saldo final em destaque
  fill(C.mintSoft);
  doc.roundedRect(M, y, inner, 78, 10, 10, "F");
  color(C.muted);
  font("bold", 8);
  doc.text("SALDO ATUAL (JÁ DESCONTADO O QUE FOI PAGO)", M + 16, y + 22);
  color(totals.saldoFinal >= 0 ? C.ink : C.coral);
  font("bold", 24);
  doc.text(formatBRL(totals.saldoFinal), M + 16, y + 54);
  color(C.muted);
  font("bold", 8);
  doc.text("SALDO PREVISTO NO FIM DO MÊS", W - M - 16, y + 22, { align: "right" });
  color(C.ink);
  font("bold", 14);
  doc.text(formatBRL(saldoPrevisto), W - M - 16, y + 46, { align: "right" });
  font("normal", 8);
  color(C.muted);
  doc.text("se todas as pendências forem quitadas", W - M - 16, y + 60, { align: "right" });
  y += 94;

  // ---- Patrimônio: saldo das operações + principal investido, sem duplicar rendimentos.
  fill(C.blueSoft);
  doc.roundedRect(M, y, inner, 100, 8, 8, "F");
  color(C.muted);
  font("normal", 10);
  doc.text("Saldo dos investimentos", M + 16, y + 22);
  color(C.blue);
  font("bold", 12);
  doc.text(formatBRL(saldoInvestimentos), W - M - 16, y + 22, { align: "right" });
  color(C.ink);
  font("bold", 10);
  doc.text("Saldo total contando com os investimentos", M + 16, y + 45);
  font("bold", 22);
  color(saldoTotalComInvestimentos >= 0 ? C.ink : C.coral);
  doc.text(formatBRL(saldoTotalComInvestimentos), M + 16, y + 71);
  font("normal", 8);
  color(C.muted);
  doc.text("Saldo atual + valores investidos registrados. Pendências não incluídas.", M + 16, y + 88);
  y += 116;

  // ---- Cards: receitas e despesas (realizado + pendente)
  const cardW = (inner - 12) / 2;
  const flowCard = (x: number, label: string, done: number, pending: number, doneLbl: string, pendLbl: string, bg: RGB, accent: RGB) => {
    fill(bg);
    doc.roundedRect(x, y, cardW, 88, 10, 10, "F");
    fill(accent);
    doc.roundedRect(x, y, 5, 88, 2, 2, "F");
    color(C.muted);
    font("bold", 8);
    doc.text(label, x + 16, y + 20);
    color(C.ink);
    font("bold", 16);
    doc.text(formatBRL(done + pending), x + 16, y + 42);
    font("normal", 9);
    color(accent);
    doc.text(`${doneLbl}: ${formatBRL(done)}`, x + 16, y + 62);
    color(C.amber);
    doc.text(`${pendLbl}: ${formatBRL(pending)}`, x + 16, y + 77);
  };
  flowCard(M, "RECEITAS DO MÊS", totals.receitasRecebidas, totals.receitasPendentes, "Recebido", "A receber", C.mintSoft, C.mint);
  flowCard(M + cardW + 12, "DESPESAS DO MÊS", totals.despesasPagas, totals.despesasPendentes, "Pago", "A pagar", C.coralSoft, C.coral);
  y += 116;

  // ---- Como o saldo foi calculado (passo a passo)
  ensure(210);
  font("bold", 12);
  color(C.ink);
  doc.text("Como chegamos ao saldo", M, y);
  y += 12;
  const steps: { label: string; value: number; sign: string; c: RGB }[] = [
    { label: "Sobra do mês anterior", value: totals.carryOver, sign: "", c: C.ink },
    { label: "Receitas já recebidas", value: totals.receitasRecebidas, sign: "+", c: C.mint },
    { label: "Rendimento estimado dos investimentos", value: totals.rendimentoEstimado, sign: "+", c: C.blue },
    { label: "Despesas já pagas", value: totals.despesasPagas, sign: "-", c: C.coral },
  ];
  fill(C.soft);
  doc.roundedRect(M, y, inner, steps.length * 22 + 34, 8, 8, "F");
  y += 18;
  for (const s of steps) {
    font("normal", 10);
    color(C.ink);
    doc.text(s.label, M + 16, y);
    font("bold", 10);
    color(s.c);
    doc.text(`${s.sign} ${formatBRL(s.value)}`.trim(), W - M - 16, y, { align: "right" });
    y += 22;
  }
  doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
  doc.line(M + 16, y - 12, W - M - 16, y - 12);
  font("bold", 11);
  color(C.ink);
  doc.text("= Saldo atual", M + 16, y + 4);
  doc.text(formatBRL(totals.saldoFinal), W - M - 16, y + 4, { align: "right" });
  y += 26;
  font("normal", 9);
  color(C.muted);
  doc.text(
    `Resultado do mês (recebido - pago): ${formatBRL(resultadoMes)}. Pendências não afetam o saldo até serem marcadas como pagas/recebidas.`,
    M,
    y,
    { maxWidth: inner },
  );
  y += 30;

  // ---- Tabelas por categoria
  const sectionTitle = (t: string) => {
    ensure(40);
    font("bold", 12);
    color(C.ink);
    doc.text(t, M, y);
    y += 14;
  };
  const categoryBars = (rows: { label: string; total: number }[], totalAll: number, accent: RGB) => {
    if (!rows.length) {
      font("normal", 10);
      color(C.muted);
      doc.text("Nenhum lançamento.", M, y + 6);
      y += 24;
      return;
    }
    for (const r of rows) {
      ensure(26);
      const pct = totalAll > 0 ? (r.total / totalAll) * 100 : 0;
      font("normal", 10);
      color(C.ink);
      doc.text(r.label, M, y + 8);
      color(C.muted);
      doc.text(`${Math.round(pct)}%`, W - M - 100, y + 8, { align: "right" });
      font("bold", 10);
      color(C.ink);
      doc.text(formatBRL(r.total), W - M, y + 8, { align: "right" });
      y += 13;
      fill(C.line);
      doc.roundedRect(M, y, inner, 5, 2.5, 2.5, "F");
      fill(accent);
      if (pct > 0) doc.roundedRect(M, y, Math.max(5, (inner * pct) / 100), 5, 2.5, 2.5, "F");
      y += 14;
    }
    y += 8;
  };
  const { receitas, despesas } = groupByCategory(txs);
  sectionTitle("Receitas por categoria");
  categoryBars(receitas, totals.receitasMes, C.mint);
  sectionTitle("Despesas por categoria");
  categoryBars(despesas, totals.despesasMes, C.coral);

  // ---- Lançamentos detalhados com status
  sectionTitle("Lançamentos detalhados");
  const cols = { date: M + 8, cat: M + 70, desc: M + 170, status: M + 340, value: W - M - 8 };
  const header = () => {
    fill(C.dark);
    doc.roundedRect(M, y, inner, 20, 4, 4, "F");
    font("bold", 8);
    color([255, 255, 255]);
    doc.text("DATA", cols.date, y + 13);
    doc.text("CATEGORIA", cols.cat, y + 13);
    doc.text("DESCRIÇÃO", cols.desc, y + 13);
    doc.text("STATUS", cols.status, y + 13);
    doc.text("VALOR", cols.value, y + 13, { align: "right" });
    y += 24;
  };
  ensure(50);
  header();
  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach((t, i) => {
    if (y + 20 > H - 50) {
      doc.addPage();
      y = M;
      header();
    }
    if (i % 2 === 0) {
      fill(C.soft);
      doc.rect(M, y - 2, inner, 20, "F");
    }
    const isRec = t.type === "receita";
    const settled = t.settled !== false;
    const [yy, mm, dd] = t.date.split("-");
    font("normal", 9);
    color(C.ink);
    doc.text(`${dd}/${mm}/${yy}`, cols.date, y + 11);
    doc.text(catName(t.category).slice(0, 18), cols.cat, y + 11);
    color(C.muted);
    doc.text((t.description || "-").slice(0, 30), cols.desc, y + 11);
    // Selo de status
    const label = settled ? (isRec ? "Recebido" : "Pago") : isRec ? "A receber" : "A pagar";
    fill(settled ? (isRec ? C.mintSoft : C.coralSoft) : C.amberSoft);
    doc.roundedRect(cols.status - 4, y + 1, 58, 14, 7, 7, "F");
    font("bold", 7.5);
    color(settled ? (isRec ? C.mint : C.coral) : C.amber);
    doc.text(label, cols.status + 25, y + 11, { align: "center" });
    font("bold", 9);
    color(isRec ? C.mint : C.coral);
    doc.text(`${isRec ? "+" : "-"} ${formatBRL(t.amount)}`, cols.value, y + 11, { align: "right" });
    y += 20;
  });
  if (!sorted.length) {
    font("normal", 10);
    color(C.muted);
    doc.text("Nenhum lançamento neste mês.", M + 8, y + 8);
  }

  // ---- Rodapé
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
    doc.line(M, H - 34, W - M, H - 34);
    font("normal", 8);
    color(C.muted);
    doc.text(`Gerado pelo FinControl em ${new Date().toLocaleString("pt-BR")}`, M, H - 20);
    doc.text(`Página ${p} de ${total}`, W - M, H - 20, { align: "right" });
  }
  return doc;
}

export const _categoryRefs = [...RECEITA_CATEGORIES, ...DESPESA_CATEGORIES];