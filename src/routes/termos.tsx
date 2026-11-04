import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [
    { title: "Termos de Uso — FinControl" },
    { name: "description", content: "Condições de uso, planos e limitações do FinControl." },
    { property: "og:title", content: "Termos de Uso — FinControl" },
    { property: "og:description", content: "Regras do serviço, planos Pro, pagamentos e responsabilidades." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: TermsPage,
});

function TermsPage() {
  return <LegalPage title="Termos de Uso" updated="04/11/2026">
    <p className="rounded-md border border-border p-3">Versão preliminar: dados do fornecedor, atendimento e condições finais de pagamento serão incluídos e revisados antes do início das vendas.</p>
    <section><h2>Serviço</h2><p>O FinControl ajuda a organizar receitas, despesas, metas e investimentos. Não guarda dinheiro, não executa transferências, não negocia investimentos e não presta recomendação financeira individual.</p></section>
    <section><h2>Estimativas</h2><p>Rendimentos, lucros e previsões são simulações baseadas nos dados informados e não são garantias.</p></section>
    <section><h2>Planos</h2><p>Plano Free: 20 transações por mês, 2 orçamentos, 1 meta e 1 investimento. Pro: recursos ilimitados e relatório mensal por 7 dias (R$ 4,90), 15 dias (R$ 9,90) ou 30 dias (R$ 14,90).</p></section>
    <section><h2>Pagamento, arrependimento e cancelamento</h2><p>As condições serão apresentadas claramente antes da contratação. Compras pela internet observam o direito de arrependimento de 7 dias previsto no Código de Defesa do Consumidor, quando aplicável.</p></section>
    <section><h2>Uso responsável</h2><p>Você é responsável pela veracidade dos dados inseridos e pela confidencialidade do seu acesso.</p></section>
  </LegalPage>;
}