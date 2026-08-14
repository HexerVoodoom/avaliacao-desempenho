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
- [ ] **Fase 2 — Studio-admin núcleo:** CRUD de organizations, upload de design.md, import de dados.
- [ ] **Fase 3 — Client-app: Cadastros** (Membros, Cargos, Competências).
- [ ] **Fase 4 — Client-app: Avaliações** (3 fluxos + resultado).
- [ ] **Fase 5 — Histórico/Comparação.**
- [ ] **Fase 6 — Manual + polish do Studio-admin.**
- [ ] **Fase 7 — QA/Design/Segurança transversal** (roda a cada fase, não só ao final).

Ainda faltam: projeto Supabase real provisionado (URL/anon key), autenticação
ponta a ponta, e as telas funcionais de cada seção — isso é o conteúdo das
Fases 2–6.
