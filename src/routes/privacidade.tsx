import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [
    { title: "Privacidade e LGPD — FinControl" },
    { name: "description", content: "Como o FinControl trata dados pessoais e armazenamento essencial." },
    { property: "og:title", content: "Privacidade e LGPD — FinControl" },
    { property: "og:description", content: "Dados tratados, finalidades, armazenamento e direitos do titular." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage title="Política de Privacidade" updated="04/11/2026">
    <p className="rounded-md border border-border p-3">Versão preliminar: identificação do responsável e canal oficial de privacidade serão incluídos antes do início das vendas.</p>
    <section><h2>Dados tratados</h2><p>Nome, e-mail, avatar, informações de acesso e dados financeiros informados por você, como lançamentos, orçamentos, metas e investimentos.</p></section>
    <section><h2>Finalidades e bases legais</h2><p>Usamos os dados para criar sua conta, autenticar o acesso, sincronizar e exibir seu controle financeiro, gerar relatórios solicitados, garantir segurança e atender obrigações legais.</p></section>
    <section><h2>Armazenamento essencial</h2><p>Usamos armazenamento local e recursos necessários para manter a sessão, preferências e funcionamento do app. Não usamos cookies de publicidade ou rastreamento.</p></section>
    <section><h2>Compartilhamento</h2><p>Dados podem ser tratados por fornecedores de hospedagem, banco de dados, autenticação e, quando habilitado, pagamento, apenas para prestar o serviço. Não vendemos dados pessoais.</p></section>
    <section><h2>Seus direitos</h2><p>Você pode solicitar confirmação, acesso, correção, portabilidade, informação sobre compartilhamento, revisão de consentimento quando aplicável e eliminação, respeitadas as obrigações legais.</p></section>
    <section><h2>Segurança e retenção</h2><p>Aplicamos controle de acesso por conta e mantemos dados enquanto a conta estiver ativa ou quando houver obrigação legal. Nenhum sistema é totalmente isento de riscos.</p></section>
  </LegalPage>;
}