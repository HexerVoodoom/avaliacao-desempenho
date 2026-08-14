# Critérios de Aceite por Seção

Checklist que o QA técnico e o QA de design usam para dar uma seção como
"pronta" — em qualquer cliente, com qualquer tema aplicado. Ver
`docs/design.md.template` para os critérios específicos de identidade visual.

## Transversais (valem para toda seção)

- [ ] Todo texto tem contraste ≥ 4.5:1 (corpo) / ≥ 3:1 (texto grande/ícones) contra o fundo, com o tema do cliente aplicado — não só com o tema padrão
- [ ] Navegação por teclado completa (tab order lógico, foco visível — `--focus-ring`)
- [ ] Todo campo obrigatório é validado antes de salvar, com mensagem de erro específica (não genérica)
- [ ] Estado vazio (0 itens) e estado de erro de carregamento têm UI dedicada, não tela em branco
- [ ] Ação destrutiva (excluir membro/cargo/avaliação) pede confirmação
- [ ] Responsivo: usável em tablet (o cenário real de uso da avaliação presencial)
- [ ] RLS: usuário de uma organização não consegue ler/gravar dados de outra (testado com 2 contas)

## Membros

- [ ] Criar membro exige nome e cargo; sobrenome, nascimento e início são opcionais
- [ ] Campo "início na empresa" aceita precisão de ano, ano-mês ou data completa, e exibe de volta só o que foi informado
- [ ] Dropdown de cargo reflete cargos criados na mesma sessão sem reload
- [ ] Editar membro não perde histórico de avaliações associadas

## Cargos

- [ ] Filtro por tipo (tag) e por busca textual funcionam combinados
- [ ] Accordion de competências agrupado por bloco temático, com contagem de itens selecionados visível no cabeçalho do bloco
- [ ] Selecionar uma competência não seleciona automaticamente todas as afirmações — cada afirmação e a base de diálogo têm checkbox próprio
- [ ] Atividades são reordenáveis e cada uma é editável/removível individualmente
- [ ] Card na listagem mostra: nome, tag, nº atividades, nº indicadores selecionados — corretos após edição
- [ ] Excluir um cargo com membros vinculados é bloqueado ou pede reatribuição

## Competências (biblioteca global)

- [ ] Nome e bloco temático obrigatórios
- [ ] Campo de base de diálogo mostra o template/placeholder de redação antes de digitar
- [ ] É possível adicionar N afirmações técnicas (sem limite artificial) e remover individualmente
- [ ] Competência criada aparece imediatamente no accordion de Cargos, em qualquer organização

## Avaliações

- [ ] Seleção de avaliador/avaliado funciona tanto por busca direta da pessoa quanto por filtro de cargo
- [ ] Cargo do avaliado é auto-preenchido e não editável manualmente após seleção
- [ ] Cada um dos 3 fluxos (dialógica, tradicional, atividades) usa a escala e os rótulos corretos (ver `packages/domain/src/scales.ts`) — não uma escala genérica
- [ ] Fluxo dialógica: campo de até 3 palavras-chave funciona e não obriga preenchimento das 3
- [ ] Blocos temáticos exibem a descrição da categoria no topo (dialógica e tradicional)
- [ ] Observação de sessão é salva por categoria, independente da nota
- [ ] Tela de resultado mostra: dados do membro/cargo/data/avaliador/nº perguntas, nota geral com legenda 1–5, desempenho por categoria expansível a nível de pergunta
- [ ] Campo "o que posso fazer para melhorar/manter" muda de pergunta conforme o threshold definido em `IMPROVEMENT_VS_MAINTAIN_THRESHOLD`
- [ ] Avaliação concluída aparece na lista com filtros por período, avaliador, avaliado e tipo funcionando

## Histórico / Comparação

- [ ] Gráfico de evolução por competência/categoria usa apenas avaliações `completed`
- [ ] Combinados (ações de melhoria) de uma avaliação aparecem como "pendente" até a avaliação seguinte confirmar ou não o cumprimento

## Manual de uso

- [ ] Cada seção do manual corresponde 1:1 a uma seção real do produto
- [ ] Linguagem sem jargão técnico, validada por alguém fora do time de dev

## Studio-admin (onboarding de cliente)

- [ ] Import de membros/cargos aceita o formato de export já em uso (JSON `{version, members, roles, competencies, evaluations}`)
- [ ] Preview do tema aplicado antes de publicar mostra pelo menos: tela de Membros, tela de Cargos e tela de resultado de avaliação
- [ ] Validador de contraste do `design.md` bloqueia publicação se algum par reprovar
