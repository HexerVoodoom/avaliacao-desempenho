# Studio — Design System (house brand)

> Consumed by `product-designer` and any visual artifact the squad produces for the **Studio
> product itself** (the meta-tool: `studio-admin`, marketing/pitch material). This is NOT the
> brand of any white-labeled client instance — those come from each `Organization.designTokens`,
> validated live against WCAG AA by `packages/ui/src/lib/contrast.ts`. Source of truth for the
> tokens below: `packages/ui/src/tokens.css`.

## 1. Princípios

- **Tema é dado, nunca fork.** Nenhuma proposta visual deve depender de duplicar componentes por
  cliente — a "skin" troca via CSS custom properties, a estrutura nunca muda.
- **Acessibilidade não é opcional.** Todo par cor/fundo precisa passar no validador de contraste
  (`packages/ui/src/lib/contrast.ts`) antes de virar padrão — isso já é reforçado em código, não
  só documentado.

## 2. Cor (tokens de referência, `packages/ui/src/tokens.css`)

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#6155f5` | Marca, CTAs primários |
| `--color-secondary` | `#0f766e` | Ações secundárias |
| `--color-success` | `#15803d` | Confirmações, notas altas |
| `--color-warning` | `#b45309` | Alertas, notas médias |
| `--color-danger` | `#ef4444` | Erros, exclusões, notas baixas |
| `--color-surface` | `#ffffff` | Fundo principal (claro) |
| `--color-surface-muted` | `#f4f4f6` | Fundo secundário (cards, inputs) |
| `--color-text-primary` | `#111114` | Texto principal |
| `--color-text-muted` | `#6b6b76` | Texto secundário |

Todos os pares acima já passam AA (4.5:1 texto normal, 3:1 texto grande/ícones) — verificado por
`packages/ui/src/lib/contrast.ts`, não só citado aqui.

## 3. Tipografia e forma

- Fonte: `Inter, system-ui, -apple-system, sans-serif`.
- Raio de borda padrão: `10px` (`--radius-base`), com `--radius-sm`/`--radius-lg` para variações.
- Densidade: `comfortable` por padrão, `compact` disponível via `data-density`.

## 4. Componentes canônicos

`packages/ui/src/components/`: `Button`, `Badge`, `Accordion`, `ConfirmDialog`,
`PartialDateInput`. Qualquer proposta de UI nova deve reaproveitar esses antes de introduzir
padrão novo.
