# Segurança e preparação para publicação

## Resultado da revisão
- Checagens básica e profunda concluídas sem achados automáticos de exposição. Isto não é certificação nem garantia absoluta.
- Dependências de produção atualizadas: o scanner não encontrou vulnerabilidades conhecidas no lockfile Bun após as correções.
- Exportação CSV neutraliza fórmulas em textos informados por usuários.
- Leituras financeiras com erro não inicializam nem sobrescrevem dados remotos; gravação aguarda sincronização inicial.
- Simulação local de Pro é restrita ao desenvolvimento. Cobrança real e acesso Pro verificado ainda não estão implementados.

## GitHub e ambiente
- `.env` já está ignorado e não está versionado. O arquivo `.gitignore` é protegido pela plataforma e não pôde ser ampliado nesta revisão.
- Antes de publicar qualquer repositório externo, acrescente a ele: `.env.*`, `**/.env`, `**/.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials*.json`, `service-account*.json`, `.netlify/` e `*.tsbuildinfo`. Permita apenas exemplos sem valores, como `.env.example`.
- Configure a URL e chave **publicável** da conexão nas variáveis do host. Elas necessariamente chegam ao navegador e não são credenciais administrativas. O isolamento dos dados depende das regras de acesso por usuário.
- Chaves privadas de pagamento e administração são somente do servidor. Nunca use prefixo `VITE_` para elas.
- Ignorar um arquivo não apaga versões antigas do histórico. Se uma chave privada já tiver sido publicada, revogue-a e substitua-a; não há evidência de `.env` versionado no estado atual.
- Instalações npm devem respeitar `overrides` no package.json; confira seu lockfile ao exportar para outro host.

## Antes de vender
- Informar identidade do fornecedor, CPF/CNPJ conforme aplicável, endereço comercial e contato de privacidade/atendimento.
- Revisar juridicamente os termos, bases legais, retenção, operadores e transferências internacionais, exercício de direitos e plano de incidentes (LGPD, CDC e Decreto 7.962/2013).
- Implementar canal funcional de solicitações, exportação e exclusão de conta/dados com autenticação; definir exceções legais de retenção.
- Confirmar provedor de pagamento, preços finais e política de arrependimento, reembolso e cancelamento. Não coletar cartões diretamente.
- Implementar checkout autenticado, preços escolhidos no servidor, verificação de assinatura de webhook e eventos idempotentes. Entitlements devem ter gravação exclusiva do servidor e leitura somente pelo titular.
- Coletar aceite dos termos versionados na contratação. Marketing/analytics só após consentimento específico, livre e revogável; armazenamento estritamente essencial não requer botão fictício de rejeição.

As páginas jurídicas são preliminares e a cobrança está desativada em produção até esta preparação estar concluída.