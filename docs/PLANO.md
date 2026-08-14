# Plano — "Studio" de Avaliação de Desempenho White Label

## 0. O que estamos construindo (resumo)

Não uma ferramenta de avaliação — uma **fábrica de ferramentas de avaliação**. Um produto (`Studio`) onde, para cada cliente, alguém:

1. sobe um `design.md` (identidade visual do cliente) + listas de membros/cargos/competências específicas (ou usa a biblioteca genérica que já existe),
2. e o Studio provisiona uma instância white-label completa: Membros, Cargos, Competências, 3 fluxos de Avaliação, Relatórios/Comparação histórica, Manual de uso — já com a skin do cliente aplicada, dados isolados (multi-tenant) e autenticação própria.

O NOSSA (repo atual) deixa de receber commits — ele foi só o protótipo/fonte de conteúdo do primeiro cliente. Novo repositório para o Studio.

---

## 1. Arquitetura proposta

### 1.1 Modelo de solução: monorepo com dois produtos + pacote compartilhado

```
studio/
├── apps/
│   ├── studio-admin/        # a "ferramenta que cria ferramentas" (interna, nossa equipe)
│   └── client-app/          # o app white-label entregue a cada cliente (multi-tenant, 1 deploy serve N clientes por subdomínio/tenant_id)
├── packages/
│   ├── ui/                  # design system base (tokens + componentes), tema por tenant via CSS vars
│   ├── domain/               # tipos, regras de negócio, validação (compartilhado front/edge functions)
│   └── supabase/             # schema, migrations, client tipado, RLS policies
├── docs/
│   ├── design.md.template    # template que o cliente/时 preenche
│   ├── criterios-secoes.md   # critérios de aceite por seção (ver §4)
│   └── manual-uso.md         # manual do usuário final, versionável por cliente
```

**Por que multi-tenant num único app** (em vez de gerar um repo por cliente): mais barato de manter, atualizar e dar suporte de segurança; troca de tema é dado, não código. "White label" = tema + conteúdo vindo do banco, não fork de código. Isso também resolve "escalabilidade e gestão" citados no pedido. Cada cliente é uma `organization` no banco; o domínio/subdomínio resolve qual tema carregar.

*(Alternativa descartada: gerar um repositório novo por cliente a partir de um template. Mais fiel à ideia literal de "ferramenta que gera ferramentas", mas multiplica manutenção, patches de segurança e custo de hospedagem por N. Trago isso como pergunta aberta abaixo — é uma decisão de produto, não técnica.)*

### 1.2 Stack

- **Frontend:** React + Vite + TypeScript (mesma base do NOSSA) + Tailwind + Radix primitives (via shadcn/ui) — permite tokens de tema em runtime.
- **Backend/dados:** Supabase (Postgres + Auth + Row Level Security + Storage para logos/assets do cliente).
- **Multi-tenancy:** coluna `organization_id` em toda tabela de negócio + RLS por `organization_id` vinculado ao usuário autenticado (Supabase Auth + tabela `memberships`).
- **Deploy:** Cloudflare Pages (já usado no NOSSA) para o `client-app`; `studio-admin` pode viver no mesmo projeto ou separado.

### 1.3 Autenticação e segurança

- Supabase Auth (e-mail/senha + convite por e-mail). Papéis: `owner`, `admin_rh`, `avaliador`, por organização.
- RLS: toda query filtrada por `organization_id` da sessão; nenhuma tabela de negócio sem policy.
- Segredos de tema/branding em Storage privado por organização; URLs assinadas.
- Auditoria: `created_by`/`updated_by` + tabela de log em ações sensíveis (exclusão de avaliação, edição de cargo).

---

## 2. Modelo de dados (visão alta)

```
organizations (id, name, slug, design_tokens jsonb, logo_url, ...)
memberships (user_id, organization_id, role)

competencies        -- GLOBAL, sem organization_id (biblioteca compartilhada entre todos os clientes)
  ├─ category (bloco temático)
  └─ competency_questions (statement | dialogic, order)

roles (organization_id, name, type[liderança|associado|terceirizado|...], ...)
  └─ role_competencies (role_id, competency_id, selected_question_ids[])   -- é aqui que "marca quais afirmações fazem sentido pra esse cargo"
  └─ role_activities (role_id, text, order)

members (organization_id, first_name, last_name, birth_date, start_date [ano OU data completa — ver §3.1], role_id)

evaluations (organization_id, type[dialogica|tradicional|atividades], evaluator_id, member_id, role_id, status, created_at)
  └─ evaluation_responses (evaluation_id, question_id | activity_id, score, keywords[], notes)
  └─ evaluation_section_notes (evaluation_id, category_id, observation, improvement_action)
```

Ponto de design importante: **competências são globais** (como você já levantou — "essas bibliotecas são mais gerais, vai usar para todo mundo"), mas **cargos, membros, atividades e avaliações são por organização**. `role_competencies` é a tabela de junção que resolve "atribuir uma coisa à outra", como você descreveu.

`start_date`: usar um tipo "data parcial" — coluna `start_date_precision` (`year` | `month` | `day`) + `start_date` normalizado (ex.: dia 1 se só ano). A UI mostra só o que foi informado.

---

## 3. Sessões do produto (client-app) — requisitos que você descreveu, organizados

### 3.1 Membros
- CRUD. Campos: nome, sobrenome, data de nascimento, início na empresa (**precisão configurável: ano / ano-mês / data completa**), cargo (dropdown vindo de Cargos, com busca).
- Ao criar, mostra prévia do cargo selecionado (tag liderança/associado, nº de competências).

### 3.2 Cargos
- Lista com **filtros combináveis**: por tipo (liderança / associado / terceirizado / outros — tipos configuráveis por organização, não hardcoded) e busca por nome.
- Criar/editar cargo:
  - nome, tipo (dropdown configurável),
  - atividades específicas (lista ordenável, adicionar item por item),
  - biblioteca de competências em **accordion por bloco temático** (Execução e Produtividade, Qualidade Técnica e Cognitiva, ...) → dentro de cada competência, checkbox da competência + checkboxes individuais das afirmações técnicas a incluir + a base de diálogo (pré-selecionada, pode desmarcar).
  - Salvar → volta pra lista mostrando card com: nome, tag, nº atividades, nº indicadores/afirmações selecionadas.

### 3.3 Competências (biblioteca global)
- Criar: nome + bloco temático (dropdown).
- Base de diálogo: 1 pergunta, com **template/placeholder guiando o padrão de redação** (ex.: "Considerando os últimos projetos/situações recentes, como você [ação]... e como avalia/qual efeito isso teve...?").
- Afirmações técnicas: N itens, adicionar quantas quiser.
- Tudo interligado: ao editar um Membro, o dropdown de Cargos já reflete cargos novos; ao editar um Cargo, a lista de Competências reflete as recém-criadas — sem reload, via cache invalidation (React Query).

### 3.4 Avaliações
- Lista com filtros por período, avaliador, membro/avaliado, cargo, tipo de avaliação, status.
- Fluxo "Nova avaliação": escolhe avaliador (líder) e avaliado (filtra por cargo ou busca direta pela pessoa) → cargo do avaliado é auto-preenchido → escolhe o método:

  **a) Dialógica** — por bloco temático (com descrição do bloco no topo), pergunta aberta única por competência, campo de até 3 palavras-chave, escala 1–5 (quase não funcionou → funcionou muito bem), observação de sessão ao final de cada bloco.

  **b) Tradicional (Likert)** — mesma estrutura de blocos, uma afirmação por vez, escala 1–5 (nunca → sempre).

  **c) Por atividades** — sem blocos, lista direta das atividades do cargo, escala 1–5 (insuficiente → excepcional).

- **Tela de resultado (comum aos 3 métodos)**: dados do membro/cargo/data/avaliador/nº de perguntas, card de nota geral (0–5) com a legenda da escala, desempenho por categoria (nota, nº perguntas, expandir para ver pergunta a pergunta), e por categoria um campo **"o que posso fazer para melhorar"** (ou **"para manter"**, se a nota for boa — threshold configurável, ex. ≥4). Avaliação salva → aparece na lista.

### 3.5 Comparação ao longo do tempo
- Por membro: histórico de avaliações, evolução da nota por competência/categoria ao longo do tempo (gráfico de linha), e acompanhamento dos "combinados" (as ações de melhoria registradas) — cumpriu/não cumpriu na avaliação seguinte.

### 3.6 Manual de uso
- Seção in-app, linguagem simples, por sessão (Membros, Cargos, Competências, Avaliações), acessível a qualquer momento.

### 3.7 Studio-admin (a ferramenta que cria as ferramentas)
- Onboarding de novo cliente: nome/slug, upload de `design.md` (ou preenchimento guiado, ver §4) + logo, import de listas (membros/cargos em CSV ou JSON no formato que você já usa — o export que você mandou é literalmente esse formato), toggle de quais dos 3 métodos de avaliação esse cliente usa, tipos de cargo customizados.
- Preview ao vivo do tema aplicado antes de publicar.

---

## 4. `design.md` — template de identidade + critérios de aceite por seção

Isso é o "skin" sobre um design system de referência. Abordagem: adotamos como **base** um sistema já maduro e testado (Radix/shadcn, que segue princípios de Material 3 + Apple HIG + GitHub Primer para acessibilidade e espaçamento) e o `design.md` de cada cliente só substitui **tokens**, nunca a estrutura de componentes. Isso garante que, seja qual for a identidade aplicada, contraste, hit-area, hierarquia tipográfica e espaçamento continuam corretos — não dependemos do cliente saber design.

`docs/design.md.template` conteria, no mínimo:
- Paleta (primária, secundária, semânticas — sucesso/alerta/erro —, superfícies, geradas com validador de contraste WCAG AA embutido)
- Tipografia (fonte, escala, pesos)
- Logo (variações claro/escuro, favicon)
- Raio de borda, elevação/sombra, densidade (compacto/confortável)
- Tom de voz / microcopy (ex.: como chamar "avaliado" — colaborador? associado?)
- Ícone/emblema por tipo de cargo (opcional)

`docs/criterios-secoes.md` define, por sessão do produto, o que precisa estar respondido/validado antes de dar como "pronta" (ex.: Membros → todos os campos obrigatórios definidos + validação de data parcial funcionando + dropdown de cargos populado; Avaliações → as 3 telas de resultado renderizam com dados reais, cálculo de média bate com fórmula documentada, etc.). Serve de checklist para o QA (§6).

---

## 5. Fases de execução

| Fase | Entregável | Paralelizável? |
|---|---|---|
| **0. Fundação** | Repo novo, monorepo, CI, Supabase project, schema+RLS inicial, auth básica | — |
| **1. Design system base** | `packages/ui` com tokens + componentes (Radix/shadcn), `design.md.template`, `criterios-secoes.md` | Paralelo com Fase 0 (parte final) |
| **2. Studio-admin — núcleo** | CRUD de organizations, upload design.md, import de dados | Depois de 0+1 |
| **3. Client-app — Cadastros** | Membros, Cargos (com accordion de competências), Competências (biblioteca global) | Sessões paralelizáveis entre si (3 sub-agentes) depois do schema fechado |
| **4. Client-app — Avaliações** | Os 3 fluxos + tela de resultado unificada | Depois da Fase 3 (depende de cargos/competências existirem) |
| **5. Histórico/Comparação** | Gráfico de evolução, combinados | Depois da Fase 4 |
| **6. Manual + Studio-admin polish** | Manual in-app, preview de tema, onboarding fim-a-fim | Paralelo com Fase 5 |
| **7. QA/Design/Segurança transversal** | Revisão de heurísticas de Nielsen, contraste/acessibilidade, revisão de código, pentest básico de RLS | Roda ao final de cada fase (gate), não só no fim |

Cada fase termina com um **gate de qualidade** (não é uma etapa separada no fim): agente de design revisando heurísticas de Nielsen + contraste/espaçamento com o tema de teste aplicado, e agente de QA técnico revisando a implementação e rodando testes antes de a fase ser considerada concluída.

---

## 6. Decisões tomadas

- **Modelo white-label:** app multi-tenant único (não repo por cliente).
- **Repositório:** `HexerVoodoom/avaliacao-desempenho`.
- **Base de design:** Radix + shadcn/ui — tokens CSS custom properties, componentes nunca leem identidade de cliente diretamente.

## 7. Status de execução

- [x] **Fase 0 — Fundação:** monorepo (`npm workspaces`), `packages/domain` (tipos + regras de escala), `packages/supabase` (schema SQL completo com RLS multi-tenant + seed da biblioteca global de competências), scaffolds de `apps/client-app` e `apps/studio-admin`.
- [x] **Fase 1 — Design system base:** `packages/ui` (tokens.css, theme.ts, Button/Badge de referência), `docs/design.md.template`, `docs/criterios-secoes.md`.
- [~] **Fase 2/6 — Studio-admin:** formulário de novo cliente implementando `design.md.template` (marca com upload de logo, paleta com validador de contraste WCAG AA ao vivo — `packages/ui/src/lib/contrast.ts` —, tipografia/raio de borda, taxonomia de cargos, métodos de avaliação habilitados) persistindo via `@studio/local-store`, agora com **painel de prévia ao vivo** (aplica os tokens escolhidos em tempo real sobre Button/Badge/logo antes de publicar). **Pendente:** favicon, tom de voz/microcopy do template, import de dados (CSV/JSON), preview cobrindo mais telas do produto (hoje é só um cartão de exemplo, não as telas reais).
- [x] **Fase 3 — Client-app: Cadastros.** Membros (nome/sobrenome, nascimento e início com precisão configurável ano/mês/dia — `PartialDateInput`, **editar** membro existente), Cargos (filtro por tipo/busca, accordion de competências por bloco temático com seleção de afirmações/base de diálogo, atividades, prévia com contagem, bloqueio de exclusão com membros vinculados — agora com `ConfirmDialog` do design system em vez de `window.confirm`/`alert`, **editar** cargo existente) e Competências (criar competência nova na biblioteca global — nome, bloco temático, base de diálogo com template de redação, N afirmações técnicas). Testado ponta a ponta com Playwright, incluindo edição e exclusão bloqueada. **Pendente, adiado por decisão de escopo:** editar/duplicar uma competência existente — a biblioteca global mistura conteúdo semeado (compartilhado por todos os clientes, imutável neste modo local) com o que cada cliente cria (`packages/local-store` mantém isso numa coleção separada); editar exige decidir a regra de propriedade (quem pode editar o quê) antes, não só a tela.
- [x] **Fase 4 — Client-app: Avaliações.** Os 3 fluxos (dialógica, tradicional, atividades) rodam sobre um runner único (`evaluation/EvaluationRunner.tsx` + `buildSections.ts`, que filtra as perguntas selecionadas do cargo por tipo — dialógica só pergunta dialógica, tradicional só afirmações, atividades usa a lista de atividades sem seções). Captura nota 1–5 (rótulos corretos por método — `packages/domain/src/scales.ts`), até 3 palavras-chave nas perguntas dialógicas, observação de seção + "o que posso fazer para melhorar/manter" (threshold configurável). Wizard de seleção (avaliador, avaliado por busca ou filtro de cargo, método) e tela de resultado (nota geral com legenda, desempenho por categoria expansível a nível de pergunta). Lista de avaliações com filtros por membro/método/período. Os 3 métodos testados individualmente ponta a ponta (dialógica com fluxo completo até o histórico; tradicional e atividades confirmados rodando do início ao fim). **Pendente:** avaliação em andamento/rascunho (hoje é tudo-ou-nada — cancelar no meio não salva nada).
- [x] **Fase 5 — Histórico/Comparação.** `apps/client-app/src/pages/HistoryPage.tsx`: por membro, evolução da média por categoria ao longo das avaliações concluídas (com indicador ↑/↓/→ contra a avaliação anterior) e lista de "combinados" (as ações de melhoria registradas em `EvaluationSectionNote.improvementAction`), cada um comparado contra a média da mesma categoria na avaliação seguinte para decidir `cumprido` / `não cumprido` / `aguardando próxima avaliação`. `evaluation/categorize.ts` re-deriva a categoria de cada resposta salva (a avaliação só grava `targetId`+nota, não a categoria) contra o estado atual da biblioteca — funciona mesmo se a competência mudou de bloco depois. Testado ponta a ponta: 2 avaliações dialógicas seguidas para o mesmo membro, com combinado registrado na primeira, e o histórico mostra o status correto.
- [x] **Fase 6 — Manual + polish do Studio-admin.** `apps/client-app/src/pages/ManualPage.tsx`: guia em linguagem simples de cada seção real do produto (Membros, Cargos, Competências, Avaliações, Histórico), um accordion por seção, com passo a passo e dicas — 1:1 com o que existe hoje, não um roteiro aspiracional. Studio-admin: ver Fase 2 acima (upload de logo, tipografia, raio de borda, prévia ao vivo).
- [x] **Fase 7 — QA/Design/Segurança transversal.** Ver §9 abaixo para o relatório desta rodada — achado real e corrigido: a paleta padrão do onboarding não passava no próprio validador de contraste (bloqueava "Publicar cliente" sempre, para todo cliente novo, até alguém trocar as cores manualmente).

**Decisão de persistência (temporária):** por pedido do usuário, "por enquanto
deixa salvando local" — implementado `packages/domain/src/repository.ts`
(interfaces `StudioStore`/`OrganizationRepository`/`RoleRepository`/
`MemberRepository`/`EvaluationRepository`, todo o app fala só com essas
interfaces) e `@studio/local-store`, que as implementa sobre `localStorage`
do navegador. A biblioteca global de competências vive como dado estático em
`packages/local-store/src/competency-library.data.ts` (mesmo conteúdo do seed
SQL). Quando o backend for decidido, um `@studio/supabase-store` que
implemente `StudioStore` substitui `createLocalStore()` sem mudar nenhuma
tela — ver nota de bloqueio original em versões anteriores deste documento
(projeto Supabase cotado em US$10/mês, pausado a pedido do usuário).

**Limitação conhecida do modo local:** `client-app` e `studio-admin` rodam em
portas/origens diferentes em dev, então `localStorage` não é compartilhado
entre eles — cada um cria sua própria organização "default". Isso é aceitável
enquanto o modo de persistência é local; deixa de ser um problema assim que
houver um backend compartilhado.

## 8. Uso dos plugins engineering/design (a partir da Fase 2)

O usuário habilitou os plugins `engineering`, `design`, `figma` e
`product-management`. A partir da Fase 2, os gates de qualidade por seção
(§7 / `docs/criterios-secoes.md`) usam esses plugins em vez de agentes
genéricos ad-hoc: revisão de código/decisões de arquitetura via
`engineering`, crítica de design/acessibilidade via `design`. `figma` fica
reservado para o caso de um cliente já ter a marca documentada em um arquivo
Figma (extração de tokens); não se aplica ao design system base, que é
código direto, sem mockup prévio.

## 9. Relatório do gate de QA/Design/Segurança (Fase 7)

Feito sobre o estado acumulado das Fases 0–6, antes de commitar. Onde a
skill `security-review` não conseguiu rodar (dependia de `origin/HEAD`, que
o clone raso deste sandbox não tinha configurado — corrigido com
`git remote set-head origin main` + refspec completo, registrado aqui para
não se repetir), a revisão de segurança foi feita manualmente, com o mesmo
escopo que se pediria à skill.

**QA técnico (`code-review`, nível alto):** nenhum achado. Conferiu a
integração ponta a ponta dos campos novos do Studio-admin (logo/fonte/raio)
até `packages/ui/src/theme.ts`, e que as três cópias da paleta padrão
(`apps/client-app/src/store.ts`, `apps/studio-admin/.../NewOrganizationForm.tsx`,
`packages/ui/src/tokens.css`) não haviam divergido.

**Segurança (manual, mesmo escopo pedido à skill):**
- Nenhum `dangerouslySetInnerHTML`/`innerHTML`/`eval` no código — sem
  superfície de XSS via renderização de conteúdo do usuário (JSX escapa por
  padrão).
- Upload de logo: `data:` URL usada só como `src` de `<img>`, nunca
  executada; `accept="image/*"` é só uma dica de UI, não uma validação, mas
  isso não é um risco (um arquivo não-imagem só falha em renderizar).
- **Achado real, corrigido:** upload de logo sem limite de tamanho e
  `localStorage.setItem` sem tratamento de erro — uma imagem grande podia
  estourar a cota do navegador (tipicamente 5-10MB, compartilhada por toda
  chave que o app grava) e perder a escrita silenciosamente, não só a do
  logo. Corrigido com um limite de 500KB no upload
  (`apps/studio-admin/src/NewOrganizationForm.tsx`) e
  `packages/local-store/src/collection.ts` agora lança um erro claro em vez
  de falhar em silêncio.
- Isolamento entre organizações hoje depende só de UUIDs
  (`crypto.randomUUID()`) e do filtro por `organizationId` nas queries — não
  há de fato múltiplos usuários/tenants no modo local (um navegador = um
  usuário), então isso não é uma vulnerabilidade explorável agora. Mas não
  é RLS: quando o backend Supabase for decidido, a policy de RLS já escrita
  em `packages/supabase/migrations/0001_init.sql` é o que efetivamente vai
  isolar organizações — sem ela, o "filtro por organizationId" do
  `local-store` não seria suficiente sozinho num backend real.

**Acessibilidade/design (`axe-core`, regras WCAG 2A/2AA, automatizado sobre
o app rodando de verdade — não uma auditoria estática):**
- **Achado real, corrigido:** 3 componentes com `<select>`/`<input>` sem
  nome acessível (regra `label`/`select-name`, impacto "critical" no axe) —
  filtros de `RolesPage` e `EvaluationsPage` (selects/inputs sem `<label>`
  nem `aria-label`), e o seletor de precisão dentro de `PartialDateInput`
  (o `<label>` visível nomeia o campo inteiro mas não envolve nenhum dos
  dois controles reais). Corrigido com `aria-label` em todos — 10
  telas/estados diferentes auditadas depois da correção (listas, formulários
  de criação/edição, wizard de avaliação, runner, resultado, histórico,
  manual, onboarding do Studio-admin): **zero violações WCAG 2A/2AA em
  todas**.
- Contraste: coberto pelo validador de `packages/ui/src/lib/contrast.ts`
  (ver achado da Fase 6 acima) — a própria paleta padrão do onboarding não
  passava, foi corrigida.
- Foco de teclado: inputs nativos mantêm o anel de foco padrão do navegador
  (não suprimido); `Button` tem `--focus-ring` customizado. Não testado:
  ordem de tab em telas com muitos campos dinâmicos (accordion de
  competências) — fica como item para uma futura rodada de teste manual com
  leitor de tela.

## 10. Revisão da squad de produto (ProdSquad, run `studio-review-01`)

O usuário instalou um kit de 11 personas (`.claude/agents/`, `.claude/skills/prod-squad`,
`memory/`, `brand/`) e pediu para acionar a squad inteira para analisar e refinar o projeto.
Relatório completo: `product/studio-review-01/findings.md`. Resumo do que foi corrigido nesta
rodada (achados corroborados por múltiplas personas independentemente, tratados como prioridade):

- **[Bug de perda silenciosa de dado, achado por 4 personas]** `NewEvaluationWizard` mostrava a
  tela de resultado antes de a avaliação estar de fato salva. Corrigido: agora só avança para
  "result" depois que `create`+`update` resolvem; falha mostra uma tela de erro com "tentar salvar
  de novo" (as respostas continuam em memória, nada se perde).
- **[Suite de teste automatizado, achado mais grave do investor-skeptic]** Instalado Vitest em
  `packages/domain` e `packages/local-store`, com testes reais — incluindo um teste de regressão
  que reproduz a exata classe de bug acima (gravação falha → erro claro, não silêncio). Rodando no
  CI (`npm run test`). Linguagem do `memory/company.md`/deste documento corrigida para não chamar
  de "e2e-tested" o que era verificação manual descartada.
- **["Cancelar avaliação" sem confirmação + palavras-chave sem `aria-label`, achados por
  design-critic + product-designer]** Corrigidos em `EvaluationRunner.tsx`. Botões de nota 1-5
  agora usam a semântica de cor do `brand/design-system.md` (sucesso/alerta/perigo) e têm alvo de
  toque ≥44px — a tela é usada ao vivo, em tablet.
- **[Exclusão de Membro sem checagem de integridade + exclusão de Cargo não considerava
  Avaliações, achados por qa-sweeper + staff-backend]** `MembersPage` agora avisa (sem bloquear)
  quantas avaliações ficam inacessíveis no Histórico; `RolesPage` agora bloqueia excluir um cargo
  referenciado só por avaliações antigas, não só por membros atuais.
- **[Falta de tratamento de erro em `create`/`update`/`remove` no client-app, achado por
  staff-backend + qa-sweeper]** `RoleForm`, `MemberForm` e as duas exclusões agora capturam erro e
  mostram mensagem — antes viravam unhandled promise rejection muda.
- **[RLS de `evaluations` permissiva demais, achado do security-architect, severidade Alta]**
  `0001_init.sql`: antes, qualquer avaliador da organização podia editar/apagar avaliações de
  colegas. Agora só admins da org podem alterar/excluir depois de criada (criar continua liberado
  para qualquer membro, igual ao fluxo do app hoje). Restrição completa por autoria exigiria ligar
  `members` a `auth.users` — gap real, documentado no SQL, não resolvido nesta rodada.
- **["Cliente de referência" (NOSSA) reposicionado, achado do investor-skeptic]**
  `memory/company.md` não chama mais NOSSA de cliente validado — é fonte de conteúdo herdada, uso
  real em produção nunca foi observado.

**Deliberadamente não tratado nesta rodada (é decisão de negócio, não bug técnico — squad
recomendou tratar separadamente):** validar a riskiest assumption com um comprador real, definir
preço/ACV, canal de distribuição, instrumentação/analytics, decisão de propriedade da biblioteca
de competências (seed vs. custom entre organizações — ADR-001 recomendado pelo principal-architect,
ainda em aberto), draft de avaliação em andamento.

## 11. Decisões de negócio (checkpoint pós-squad, 2026-08-14)

Discutidas diretamente com o usuário após o relatório da squad (`product/studio-review-01/findings.md`).
Detalhe completo em `memory/company.md` §"Business decisions" — resumo:

1. **Negócio de nicho, não venture-scale.** Confirmado — TAM de ~R$72M/ano não sustenta tese de
   captação externa, e está tudo bem com isso.
2. **Riskiest assumption (tema=white-label suficiente) não será pré-validada com prospect
   hipotético.** Seguimos com o MVP como desenhado; a validação real em andamento é a própria
   Nossa implantando isso na Luís Tortola Arquitetura.
3. **Os 3 métodos de avaliação continuam habilitados por padrão para todo cliente.** O primeiro
   cliente real quer os 3 — não é escopo a cortar, é o produto.
4. **Studio-admin é operado por humano (a própria Nossa), nunca self-serve.** Não investir em UX
   "à prova de leigo" ali.
5. **Ativo de venda com o conteúdo do NOSSA:** boa ideia, adiada até a Luís Tortola Arquitetura
   estar de fato em uso.
6. **Persistência local continua até produto validado + clientes captados.** Supabase segue
   pausado.

**Correção de modelo de negócio (importante):** `memory/company.md` tratava incorretamente "Nossa"
e a arquitetura como a mesma entidade. Corrigido: **Nossa é uma consultoria de RH** (cliente direto
do usuário, quem contratou este projeto); **Luís Tortola Arquitetura é cliente da Nossa** (escritório
de arquitetura focado em filiais — o primeiro tenant real do Studio); o repositório
`HexerVoodoom/NOSSA` era o protótipo bespoke que a Nossa tinha construído *para* a Luís Tortola
Arquitetura, fonte do conteúdo semeado (biblioteca de competências). O canal de distribuição real é
**a própria Nossa oferecendo Studio para os outros clientes dela**, não venda direta a escritórios
de arquitetura avulsos — isso muda a leitura do achado de GTM do growth-engineer (§9): o
`studio-admin` é a ferramenta que a Nossa (não o usuário sozinho) vai operar por cliente novo.
