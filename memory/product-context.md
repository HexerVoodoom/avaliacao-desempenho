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
  enough of a "white label" for buyers who were promised a bespoke tool — i.e., that clients won't
  churn the moment they want customization the current `Organization` model doesn't support
  (custom fields, custom evaluation flows beyond the 3 built-in methods, deeper branding than
  colors/logo/type).
- **Why now:** The first client's original bespoke build (`HexerVoodoom/NOSSA`) proved the content
  (competency library, evaluation methodology) works in practice, but wasn't reusable — this
  rebuild exists specifically to turn that one-off into a sellable platform.
- **Non-goals (explicitly out of scope today):** per-client code forks; a marketplace of
  third-party evaluation templates; payroll/compensation integration; anything beyond
  performance-review workflows (this is not a full HRIS).
