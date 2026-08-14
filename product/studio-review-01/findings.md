# ProdSquad — Revisão completa do Studio (run: studio-review-01)

> Squad inteira (11 personas) acionada para analisar e refinar o projeto já construído
> (Fases 0-7). Não foi discovery de produto novo — cada persona leu `memory/company.md`,
> `memory/product-context.md`, `docs/PLANO.md` e o código real antes de opinar.
> Relatórios completos de cada persona ficam no histórico da conversa; este arquivo é a
> síntese cross-cutting usada no checkpoint humano.

## Achados corroborados por 2+ personas independentemente (maior confiança)

1. **[BUG DE DADOS, confirmado por staff-backend + product-designer + design-critic + qa-sweeper]**
   `NewEvaluationWizard.handleFinishRun` chama `setStep('result')` **antes** de `store.evaluations.create/update` resolverem. Se a gravação falhar (ex.: `localStorage` cheio — já sabemos que isso lança erro desde a Fase 7), o avaliador vê a tela de resultado normalmente, clica "Concluir", e a avaliação nunca existiu. Silencioso, sem try/catch, sem aviso. É o achado de maior consenso entre as 11 personas.
2. **["Cancelar avaliação" sem confirmação, confirmado por product-designer + design-critic]** É a única ação potencialmente destrutiva do app que não usa `ConfirmDialog` — descarta uma sessão de avaliação presencial inteira num clique.
3. **[Gap de acessibilidade que o axe-core não pegou, confirmado por product-designer + design-critic]** Os 3 inputs de "palavra-chave" em `EvaluationRunner.tsx` (fluxo dialógico) só têm `placeholder`, sem `aria-label`. O gate da Fase 7 rodou axe-core nesse exato estado e reportou 0 violações — ou seja, **é um limite real da cobertura automatizada**, não um erro do gate anterior: `placeholder`-only não é uma violação de regra WCAG 2A/2AA automatizável, só má prática. Duas personas humanas (bem, duas personas — mas via leitura de código, não heurística vaga) pegaram o que a ferramenta não pega.
4. **[Exclusão de Membro sem checagem de integridade, confirmado por qa-sweeper + staff-backend]** `RolesPage` bloqueia excluir um Cargo com Membros vinculados; `MembersPage` **não tem o equivalente** — excluir um Membro que já é `evaluatorMemberId`/`evaluateeMemberId` em Avaliações existentes não é bloqueado nem avisado, e o Histórico dessa pessoa fica inacessível (a avaliação continua no storage, mas o seletor de membro no Histórico não a encontra mais).
5. **[Nenhum `try/catch` em torno de `store.*` no client-app, confirmado por staff-backend + qa-sweeper]** Só o formulário de onboarding do studio-admin trata erro de gravação (achado da Fase 7). Em `RolesPage`/`MembersPage`/`NewEvaluationWizard` uma falha de escrita vira unhandled promise rejection muda.
6. **[Race condition entre abas, confirmado por staff-frontend + staff-backend]** Sem listener do evento `storage`, duas abas do mesmo navegador editando o mesmo registro fazem last-write-wins silencioso — perda de dado real, não hipotética.
7. **[Nenhuma suite de teste automatizado comitada, achado mais contundente do investor-skeptic, corroborado por qa-sweeper]** Toda alegação de "testado ponta a ponta com Playwright" no `docs/PLANO.md` descreve execução manual/descartada, não uma suite reproduzível. `npm test` não existe em nenhum workspace.
8. **[Modelo de propriedade da biblioteca de competências, confirmado por principal-architect como o de maior raio de explosão + product-manager concordando em adiar]** Competência criada por um cliente é imediatamente visível/editável por todos os outros (sem `organizationId`). Correto adiar até haver 2º cliente real (RICE baixo agora), mas é a decisão de dado mais cara de desfazer depois.
9. **[A aposta central do produto nunca foi testada com um comprador real, confirmado por investor-skeptic + business-strategist + growth-engineer]** "Tema + isolamento de tenant = white-label suficiente" é a riskiest assumption nomeada no próprio `product-context.md` — zero validação de mercado até agora.

## Achados de uma persona só, mas concretos e acionáveis

- **[security-architect]** Política de RLS de `evaluations`/`evaluation_responses`/`evaluation_section_notes` permite que **qualquer avaliador da organização** edite/apague avaliações de colegas, não só as próprias — gap de autorização intra-tenant (a isolação *entre* tenants está correta).
- **[security-architect]** Falta política de retenção/expurgo (LGPD) para dados de avaliação — nenhuma camada tem TTL.
- **[growth-engineer]** O handoff `studio-admin` → `client-app` é estruturalmente quebrado (origens diferentes não compartilham localStorage em dev) — organização criada no onboarding não aparece automaticamente onde o cliente de fato trabalha. Zero instrumentação/analytics em todo o código.
- **[product-designer / design-critic]** Botões de nota 1-5 não usam a semântica de cor que o próprio `design-system.md` define (sucesso/alerta/perigo por faixa de nota) e ficam abaixo de 44px de alvo de toque — relevante porque o uso real é em tablet, ao vivo.
- **[staff-frontend]** `packages/ui` não tem `Input`/`Label`/`Select`/`Textarea` — 7 arquivos duplicam o mesmo objeto de estilo inline. Já passou do "segundo uso" que justificaria extrair.
- **[business-strategist]** TAM bottom-up estimado em ~R$72M/ano (Brasil, serviços profissionais 20+ funcionários) — não sustenta tese de venture, é compatível com negócio de nicho lucrativo. Moat hoje = zero; só nasce depois de 2+ ciclos anuais com cliente pagante real.
- **[product-manager]** Sequência de construção inverteu prioridade: profundidade de produto (3 métodos de avaliação, histórico) foi construída antes do que de fato bloqueia venda (auth multiusuário).

## O que a squad concorda que está genuinamente certo (crédito onde é devido)

- Validador de contraste WCAG AA (`packages/ui/src/lib/contrast.ts`) — matemática correta, gate real, não só documentado.
- Isolamento *entre* organizações no design de RLS — correto onde foi auditado linha a linha (o gap é intra-tenant, não cross-tenant).
- `ConfirmDialog`, `PartialDateInput`, `Accordion` — bem construídos, tokens de tema aplicados de ponta a ponta, sem hex/px hardcoded.
- A honestidade do `docs/PLANO.md` sobre lacunas conhecidas (§7) foi citada por várias personas como o melhor artefato do projeto.
- Abstração `StudioStore`/`repository.ts` é real desacoplamento, não cosmético — com ressalvas específicas para o agregado `Role` (ver relatório do principal-architect).

## Autoavaliação (investor bar)

🟡 **Técnico**: arquitetura e abstrações são sólidas; a lacuna real é ausência de suite de teste reproduzível e alguns bugs de tratamento de erro/integridade concretos e corrigíveis rápido (itens 1-6 acima).
🔴 **Comercial**: zero validação da riskiest assumption com comprador real; TAM não sustenta tese de investimento externo no formato atual; nenhuma métrica de negócio definida.
🟢 **Segurança (isolamento entre tenants)**: RLS corretamente desenhado onde testável hoje.
🟡 **Segurança (autorização intra-tenant)**: gap real e concreto na política de evaluations.
🟡 **Design/acessibilidade**: rigor real existe (contraste, aria-labels na maior parte do app) mas com blind spots específicos já mapeados.

## Objeções que sobrevivem (investor-skeptic, resumidas)

1. Toda alegação de "e2e-tested" no PLANO.md precisa ser corrigida (suite real comitada, ou linguagem rebaixada para "verificado manualmente, não reproduzível").
2. "Cliente de referência" (NOSSA) deveria ser descrito como "fonte de conteúdo herdada", não como validação de mercado — uso real nunca foi observado.
3. A aposta de white-label precisa de uma conversa de venda real antes de mais engenharia em cima da mesma suposição.
