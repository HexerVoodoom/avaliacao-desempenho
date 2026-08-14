# Studio — Avaliação de Desempenho White Label

"Ferramenta que cria ferramentas": um único app multi-tenant que provisiona
uma instância de avaliação de desempenho por cliente — tema, taxonomia de
cargos e conteúdo vindo do banco (Supabase + RLS), nunca de um fork de
código.

## Estrutura

```
apps/
  client-app/     # app entregue a cada cliente (Membros, Cargos, Competências, Avaliações)
  studio-admin/   # onboarding de clientes: design.md, import de dados, preview de tema
packages/
  ui/             # design system base (Radix + tokens CSS) — a "skin" de cada cliente
  domain/         # tipos e regras de negócio compartilhados
  supabase/       # migrations SQL (schema + RLS) e client tipado
docs/
  design.md.template     # template de identidade visual por cliente
  criterios-secoes.md    # checklist de aceite por seção do produto
  PLANO.md                # plano completo (arquitetura, fases, decisões)
```

## Como rodar

```bash
npm install
cp .env.example .env   # preencher com o projeto Supabase
npm run dev:client      # http://localhost:3000
npm run dev:admin       # http://localhost:3001
```

## Banco de dados

As migrations em `packages/supabase/migrations` são a fonte da verdade do
schema. Aplique na ordem:

1. `0001_init.sql` — schema completo + RLS multi-tenant
2. `0002_seed_competency_library.sql` — biblioteca global de competências (36
   competências, 127 perguntas — a mesma base usada no protótipo original)

## Princípios

- **Multi-tenant, não multi-repo.** Cada cliente é uma `organization`; nunca
  um fork de código.
- **Tema = dado.** `design.md` vira `Organization.designTokens`, aplicado via
  CSS custom properties (`packages/ui/src/theme.ts`). Componentes nunca leem
  identidade de cliente diretamente.
- **Competências são globais**; cargos, membros e avaliações são por
  organização — ver `docs/PLANO.md` §2 para o modelo de dados completo.
- **RLS em toda tabela de negócio.** Nenhuma query confia em filtro
  client-side para isolamento de tenant.
