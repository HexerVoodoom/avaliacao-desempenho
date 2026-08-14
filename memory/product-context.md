# Product context

> Normally filled during `discovery` for a brand-new idea. This run starts from an
> **already-built product** (Fases 0–7 of `docs/PLANO.md` shipped and e2e-tested), so this is
> filled from the existing plan/codebase instead of a discovery session — treat it as the brief,
> but flag anywhere the existing build contradicts or under-delivers on it.

- **Product (one line):** A white-label performance-evaluation platform — one multi-tenant app
  that any client company can run under its own brand, with a shared library of competencies and
  three evaluation methods (dialogic, traditional/Likert, activity-based).
- **Problem / who hurts:** Companies doing performance reviews today either use generic HR SaaS
  (not tailored to their competency framework or brand) or ad-hoc spreadsheets/interviews with no
  structure, no history, and no way to track whether agreed improvement actions ("combinados") were
  followed through. HR/leadership doing the reviews need a tool that matches their own cargo/
  competency taxonomy without commissioning custom software per client.
- **Riskiest assumption:** That "theme + tenant isolation" (multi-tenant, not per-client fork) is
  enough of a "white label" for buyers who were promised a bespoke tool. **Decision (2026-08-14):
  proceeding with the MVP as designed regardless** — not pre-validating with a hypothetical
  prospect. The live test is the real one already in motion: Nossa deploying this to its actual
  client, Luís Tortola Arquitetura. Revisit the assumption if/when a real need for deeper
  customization surfaces, not before.
- **Why now:** Nossa (an HR consultancy) commissioned this rebuild to turn its one-off bespoke
  build for Luís Tortola Arquitetura (`HexerVoodoom/NOSSA`, proved the content/methodology works
  but wasn't reusable) into a platform Nossa can deploy to Luís Tortola Arquitetura *and* — the
  actual long-term goal — offer to Nossa's other clients too, with Nossa itself handling
  onboarding/maintenance per client going forward.
- **Non-goals (explicitly out of scope today):** per-client code forks; a marketplace of
  third-party evaluation templates; payroll/compensation integration; anything beyond
  performance-review workflows (this is not a full HRIS).
