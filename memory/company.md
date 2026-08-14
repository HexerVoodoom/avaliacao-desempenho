# Company context — Studio (Avaliação de Desempenho White Label)

> The shared operator + domain context every persona reads before acting.

## Operator

- **Product:** "Studio" — a white-label performance-evaluation / HR tool. Not a single product
  for end users: it's a multi-tenant platform (`apps/client-app`) plus an internal onboarding tool
  (`apps/studio-admin`) that provisions a themed, tenant-isolated instance per client (each client
  = an `Organization` row, own design tokens, own cargos/membros/avaliações).
- **Actual commercial chain — B2B2B, corrected 2026-08-14 after direct confirmation from the
  builder (previous version of this doc wrongly treated "Nossa" and the architecture firm as the
  same entity):**
  - **Nossa** = an HR consultancy/agency. Nossa is the builder's direct contracting client — Nossa
    hired the builder to build this tool.
  - **Luís Tortola Arquitetura** = Nossa's own client: an architecture firm specialized mainly in
    running franchise/branch offices (filiais). This is the actual end-user organization Studio is
    being built for right now — the "first tenant."
  - **`HexerVoodoom/NOSSA`** (no longer receiving commits) was Nossa's original hand-built
    prototype *for Luís Tortola Arquitetura* — it supplied the seed content (36 competencies / 127
    questions, 8 default cargos), now the **global competency library**. It's a proven content
    source, not evidence of product-market fit on its own — nobody has observed Studio itself
    (this rebuild) running in production yet.
  - **The real GTM channel is Nossa, not cold outreach.** The builder's stated plan: prove Studio
    with Luís Tortola Arquitetura, then offer Nossa the ability to onboard *other* HR/consultancy
    clients of Nossa's onto Studio themselves — Nossa already sells and maintains services for
    those clients. This reframes distribution entirely: the wedge isn't "sell direct to N
    architecture firms," it's "become the platform Nossa (and firms like Nossa) white-label to
    their own client base." Studio-admin's manual, operator-run onboarding flow (decision, see
    §Decisions below) is exactly the tool an agency like Nossa would use per new client they bring
    on — that's the intended primary user of studio-admin, not the builder alone.
  Client-specific data (cargos, membros) is per-organization from day one.
- **Team / stage:** solo builder (the user) + Claude Code as the engineering agent. Pre-revenue —
  Nossa is a paying contract for the build itself, but no Studio-as-a-platform client has paid yet.
  No funding round in progress — this squad run is a rigor exercise, not a pitch deck for
  external investors.

## Business decisions (checkpoint 2026-08-14, after the ProdSquad review)

1. **Niche/lifestyle business, not venture-scale — confirmed.** ~R$72M/ano bottom-up TAM
   (business-strategist) doesn't support a VC thesis as-is; the builder agrees that's fine.
   Optimize for profitability, not hypergrowth.
2. **Riskiest assumption ("tema + tenant = white-label suficiente") — proceeding as designed for
   the MVP, deliberately not re-litigated yet.** Builder's call: ship the original scope
   (theme-only customization) as the MVP; if a future client surfaces a real need for deeper
   customization, evaluate then. Not validating with a hypothetical prospect first — Nossa +
   Luís Tortola Arquitetura *are* the validation in progress.
3. **All 3 evaluation methods stay enabled by default for every client — confirmed, not reduced.**
   Luís Tortola Arquitetura (the actual first client) wants all 3 (dialógica, tradicional,
   atividades). Growth-engineer's suggestion to default new clients to 1-2 methods is not adopted;
   3-method depth is the actual product now, not scope creep to trim.
4. **Studio-admin's onboarding form is operator-run, not self-serve — confirmed explicitly.**
   Builder's words: it "precisa de uma equipe de psicologia preenchendo" (needs an HR/psychology
   team filling it in) — i.e. Nossa's own team (or the builder) does this per client, a non-technical
   end-client never touches it directly. Do not invest in "leigo-proof" UX here; optimize for
   operator efficiency instead (per the growth-engineer finding already in PLANO.md §9 history).
5. **NOSSA content as a sales asset — deferred, not yet built.** Idea (turning "36 competências
   validadas com um cliente real" into a case-study/one-pager for Nossa to use pitching its own
   other clients) is good and cheap, per growth-engineer, but not commissioned yet — revisit once
   Luís Tortola Arquitetura is actually live and being used, so the case study is true, not
   aspirational.
6. **Persistence stays local-only until product validation + real clients captured — confirmed,
   unchanged.** Supabase (US$10/mo, paused) stays paused. Re-evaluate once Nossa is actively
   onboarding a client (Luís Tortola Arquitetura) through Studio for real use, not just
   development/testing.
- **Repo:** `HexerVoodoom/avaliacao-desempenho` (monorepo: `apps/client-app`, `apps/studio-admin`,
  `packages/domain`, `packages/ui`, `packages/supabase`, `packages/local-store`).
  Full plan and phase-by-phase status: `docs/PLANO.md`.

## Current technical state (read `docs/PLANO.md` for the authoritative, up-to-date version)

- **Persistence: local only, by explicit decision.** A hosted Supabase project was priced
  (US$10/mo) and the user paused creation — cost not yet approved. Everything today runs on
  `@studio/local-store` (browser `localStorage`) behind a `StudioStore` repository interface
  (`packages/domain/src/repository.ts`) designed so a future `@studio/supabase-store` is a
  drop-in swap, with zero UI changes. `packages/supabase/migrations/*.sql` already has the full
  schema + RLS multi-tenant policies, written but **not yet applied anywhere** (no live project).
- **No authentication yet** — a direct consequence of no backend. Single-browser = single-tenant
  boundary today; this is an accepted, documented gap, not an oversight.
- **Design system:** Radix + shadcn-style primitives (`packages/ui`), CSS custom properties as the
  only "skin" surface — a client's `design.md` becomes `Organization.designTokens`, applied at
  runtime via `applyDesignTokens()`. Includes a WCAG AA contrast validator
  (`packages/ui/src/lib/contrast.ts`) that gates publishing a new client's theme.
- **Shipped:** Membros, Cargos (with the competency-accordion assignment UI), Competências
  (create new, global), all 3 evaluation methods (dialógica / tradicional / atividades) end-to-end
  through a result screen, Histórico/comparison over time with "combinados" (commitment) tracking,
  an in-app Manual, and Studio-admin's client-onboarding form (logo, palette with live contrast
  validation, typography, role taxonomy).
- **Test coverage — be precise about what this means.** Every flow above was walked manually
  (mostly via ad-hoc Playwright scripts run once, interactively, and discarded) during
  development — real verification, but not reproducible; nothing was committed as a repeatable
  suite. That gap was itself the ProdSquad review's most-cited finding (investor-skeptic +
  qa-sweeper). What IS committed and reproducible today (`npm run test`, wired into CI): a Vitest
  suite for the pure logic in `packages/domain` (scoring/scale rules) and `packages/local-store`
  (CRUD + the exact write-failure class of bug the review's top data-loss finding belonged to).
  Committing an equivalent Playwright suite for the UI flows is still open — say "verified
  manually" for those until it exists, not "tested".
- **Known, explicitly-deferred gaps** (see `docs/PLANO.md` §7 for the full list): editing an
  existing global competency (ownership model between seed vs. client-created content undecided),
  draft/in-progress evaluations (today it's all-or-nothing), Supabase not provisioned.

## Non-negotiable guardrails (every artifact must respect these)

1. **Multi-tenant isolation is the core promise.** Every future backend decision must preserve:
   one deploy serves every client, tenant data isolated (RLS today only exists on paper in the
   migration files — this is real debt once a backend exists, not yet a live gap).
2. **"White label" = theme is data, never a fork.** No persona should propose per-client
   forks/deploys as the default path — that was explicitly evaluated and rejected in favor of the
   multi-tenant model (see `docs/PLANO.md` §1.1 "Alternativa descartada").
3. **Accessibility is a release gate, not a nice-to-have.** WCAG AA contrast is enforced by code
   for theme publishing; `axe-core` audits (0 violations across 10 flows as of the last QA gate)
   are the bar for any new UI.
4. **This is a Brazilian-market HR tool, pt-BR first.** Domain vocabulary (cargo, competência,
   avaliação dialógica/tradicional/por atividades, base de diálogo, afirmação técnica, combinado)
   is fixed by the existing data model — do not propose renaming these without a strong reason.

## How this shapes each discipline

- **Product / Strategy:** B2B2B — the builder's direct customer is Nossa (an HR consultancy), who
  in turn deploys Studio-branded/configured instances to its own clients (first: Luís Tortola
  Arquitetura). Moat candidates to interrogate, not assume: the competency library's
  quality/breadth, the white-label distribution model *via agencies like Nossa* (not direct sales
  to end-firms), switching cost once a client's historical evaluation data lives in the system.
- **Architecture / Backend:** the `StudioStore` interface is the load-bearing abstraction — any
  critique of the data model should engage with it directly, not propose ignoring it. The RLS
  policies in `packages/supabase/migrations/0001_init.sql` are written but unapplied; that gap
  between "designed" and "verified against a live database" is a legitimate target for scrutiny.
- **Design / Frontend:** identity theming (`packages/ui`) must stay structure-preserving — a
  client's colors/logo/type change, component behavior and accessibility never do.
- **QA / Sweeper:** local-only persistence, no auth, and all-or-nothing evaluations (no draft
  save) are the highest-leverage hardening targets right now.

## Tone

pt-BR, practitioner/technical, matching the existing `docs/PLANO.md` register: precise about
what's built vs. planned vs. deferred, numbers and file paths over adjectives.
