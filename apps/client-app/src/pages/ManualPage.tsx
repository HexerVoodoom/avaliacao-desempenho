import * as React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Badge } from '@studio/ui';

interface ManualSection {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  tips?: string[];
}

const SECTIONS: ManualSection[] = [
  {
    id: 'membros',
    title: 'Membros',
    summary: 'Cadastro das pessoas que fazem parte do time — quem pode ser avaliado ou avaliar alguém.',
    steps: [
      'Clique em "Novo membro".',
      'Preencha nome (obrigatório) e sobrenome (opcional).',
      'Data de nascimento e início na empresa são opcionais — e você escolhe o quanto sabe: só o ano, mês e ano, ou a data completa.',
      'Escolha o cargo da pessoa na lista — se o cargo que você precisa ainda não existe, crie-o primeiro em "Cargos".',
      'Salve. O membro já aparece disponível para ser avaliado ou para avaliar outra pessoa.',
    ],
    tips: ['Para editar ou remover um membro depois, use os botões "Editar"/"Remover" na lista.'],
  },
  {
    id: 'cargos',
    title: 'Cargos',
    summary: 'Cada função dentro da empresa (ex.: Coordenador de Projetos, Financeiro). Define o que essa função faz e quais competências fazem sentido avaliar nela.',
    steps: [
      'Clique em "Novo cargo".',
      'Dê um nome e escolha o tipo de atuação (ex.: liderança, associado).',
      'Adicione as atividades específicas desse cargo, uma por vez — são usadas na Avaliação por Atividades.',
      'Abra cada bloco de competências (ex.: "Execução e Produtividade") e marque quais afirmações e/ou a base de diálogo fazem sentido para esse cargo. Você não precisa marcar tudo — só o que é relevante.',
      'Salve. O cargo aparece na lista com um resumo: quantas atividades e quantos indicadores foram marcados.',
    ],
    tips: [
      'Use os filtros no topo da lista para achar cargos por tipo ou por nome.',
      'Não é possível excluir um cargo que já tem membros — reatribua-os a outro cargo primeiro.',
    ],
  },
  {
    id: 'competencias',
    title: 'Competências',
    summary: 'A biblioteca de habilidades e comportamentos que podem ser avaliados. É compartilhada por todos os clientes — uma competência nova fica disponível para qualquer cargo.',
    steps: [
      'Clique em "Nova competência".',
      'Dê um nome e escolha o bloco temático a que ela pertence (ex.: "Postura Profissional e Ética").',
      'Escreva a "base de diálogo" — uma pergunta aberta para a Avaliação Dialógica. Siga o modelo sugerido na tela para manter o padrão.',
      'Adicione quantas afirmações técnicas quiser — são usadas na Avaliação Tradicional (escala de concordância).',
      'Salve. A competência já aparece disponível na hora de montar um cargo.',
    ],
  },
  {
    id: 'avaliacoes',
    title: 'Avaliações',
    summary: 'O coração da ferramenta: aplicar uma avaliação de desempenho em alguém e ver o resultado na hora.',
    steps: [
      'Clique em "Nova avaliação".',
      'Escolha quem está aplicando (avaliador) e quem está sendo avaliado — pode filtrar por cargo para achar mais rápido.',
      'Escolha o método: Dialógica (pergunta aberta, você registra palavras-chave e dá uma nota de 1 a 5), Tradicional (afirmações com escala de "nunca" a "sempre") ou Por Atividades (avalia direto as atividades do cargo, de "insuficiente" a "excepcional").',
      'Responda cada item da seção. Ao final de cada seção você pode escrever uma observação e o que pode ser feito para melhorar (ou manter, se a nota já estiver boa).',
      'Ao terminar a última seção, a avaliação é salva automaticamente e você vê o resumo: nota geral, desempenho por categoria (dá pra expandir e ver pergunta por pergunta).',
    ],
    tips: ['A lista de avaliações salvas pode ser filtrada por membro, método e período.'],
  },
  {
    id: 'historico',
    title: 'Histórico',
    summary: 'Acompanha como uma pessoa evoluiu ao longo de várias avaliações, e se os combinados (ações de melhoria) foram cumpridos.',
    steps: [
      'Escolha um membro no topo da página.',
      'Em "Evolução por categoria" você vê a média de cada categoria em cada avaliação, com uma seta indicando se subiu, desceu ou ficou igual em relação à anterior.',
      'Em "Combinados" você vê cada ação de melhoria registrada, comparada com a avaliação seguinte na mesma categoria — se a nota se manteve ou melhorou, aparece como "Cumprido"; se caiu, "Não cumprido"; se ainda não houve avaliação seguinte, "Aguardando".',
    ],
  },
];

export function ManualPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 8 }}>Manual de uso</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Um guia rápido de cada seção da ferramenta. Clique em uma seção para expandir.
      </p>

      <Accordion type="multiple" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-base)', padding: '0 16px' }}>
        {SECTIONS.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger>{section.title}</AccordionTrigger>
            <AccordionContent>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 12 }}>{section.summary}</p>
              <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {section.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {section.tips && section.tips.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {section.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Badge tone="primary">dica</Badge>
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
