import type { Category, Competency } from '@studio/domain';

// ============================================================================
// Biblioteca global de competências — dados estáticos, mesma fonte usada em
// packages/supabase/migrations/0002_seed_competency_library.sql. Enquanto o
// backend hospedado não é decidido, @studio/local-store lê daqui; quando um
// projeto Supabase existir, essa mesma migration popula a tabela e o adapter
// Supabase troca a fonte sem mudar a interface CompetencyLibrary.
// ============================================================================

export const CATEGORIES: Category[] = [
  {
    "id": "bloco1",
    "name": "Execução e Produtividade",
    "description": "Avalia a capacidade de transformar planos em entregas concretas, com organização, foco e eficiência. Observa como a pessoa gerencia tempo, prioridades, prazos e volume de trabalho, garantindo constância e qualidade na execução das atividades.",
    "order": 1,
    "color": "#6155f5"
  },
  {
    "id": "bloco2",
    "name": "Qualidade Técnica e Cognitiva",
    "description": "Avalia o domínio técnico, a capacidade de raciocínio, análise e resolução de problemas. Considera a atenção aos detalhes, o pensamento lógico e crítico, a clareza intelectual e a aplicação adequada do conhecimento no trabalho.",
    "order": 2,
    "color": "#34d399"
  },
  {
    "id": "bloco3",
    "name": "Relação com Clientes e Stakeholders",
    "description": "Avalia como a pessoa se comunica e se relaciona com clientes, parceiros e demais partes envolvidas. Observa empatia, clareza, confiabilidade, postura profissional e a capacidade de compreender necessidades e alinhar expectativas.",
    "order": 3,
    "color": "#ff8d28"
  },
  {
    "id": "bloco4",
    "name": "Relações Internas e Colaboração",
    "description": "Avalia a qualidade das relações interpessoais no ambiente interno. Considera trabalho em equipe, comunicação, empatia, disponibilidade para ajudar, respeito às diferenças e contribuição para um clima organizacional saudável.",
    "order": 4,
    "color": "#f472b6"
  },
  {
    "id": "bloco5",
    "name": "Postura Profissional e Ética",
    "description": "Avalia atitudes, valores e comportamentos no exercício profissional. Observa responsabilidade, comprometimento, ética, transparência, confiabilidade e coerência entre discurso e prática no dia a dia de trabalho.",
    "order": 5,
    "color": "#60a5fa"
  },
  {
    "id": "bloco6",
    "name": "Desenvolvimento, Adaptação e Futuro",
    "description": "Avalia a capacidade de aprender, adaptar-se e evoluir continuamente. Considera abertura a feedbacks, busca por desenvolvimento, flexibilidade diante de mudanças, visão de futuro e disposição para crescer junto com a organização.",
    "order": 6,
    "color": "#a78bfa"
  }
];

export const COMPETENCIES: Competency[] = [
  {
    "id": "comp-b1-agilidade",
    "categoryId": "bloco1",
    "name": "Agilidade",
    "order": 1,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-agilidade-1",
        "competencyId": "comp-b1-agilidade",
        "type": "statement",
        "text": "Realiza suas tarefas de forma rápida sem prejudicar a qualidade do trabalho.",
        "order": 0
      },
      {
        "id": "q-b1-agilidade-2",
        "competencyId": "comp-b1-agilidade",
        "type": "statement",
        "text": "Identifica problemas com rapidez.",
        "order": 1
      },
      {
        "id": "q-b1-agilidade-3",
        "competencyId": "comp-b1-agilidade",
        "type": "statement",
        "text": "Encontra soluções de forma eficaz e ágil.",
        "order": 2
      },
      {
        "id": "q-b1-agilidade-4",
        "competencyId": "comp-b1-agilidade",
        "type": "statement",
        "text": "Utiliza o tempo necessário para executar suas atividades, sem excessos.",
        "order": 3
      },
      {
        "id": "q-b1-agilidade-dial",
        "competencyId": "comp-b1-agilidade",
        "type": "dialogic",
        "text": "Pensando nos projetos mais recentes, de que forma você conduziu as entregas para cumprir os prazos e como avalia o resultado disso?",
        "order": 4
      }
    ]
  },
  {
    "id": "comp-b1-capacidade-execucao",
    "categoryId": "bloco1",
    "name": "Capacidade de Execução",
    "order": 2,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-exec-1",
        "competencyId": "comp-b1-capacidade-execucao",
        "type": "statement",
        "text": "Consegue transformar planos em ações concretas.",
        "order": 0
      },
      {
        "id": "q-b1-exec-2",
        "competencyId": "comp-b1-capacidade-execucao",
        "type": "statement",
        "text": "Utiliza adequadamente os recursos disponíveis para atingir seus objetivos.",
        "order": 1
      },
      {
        "id": "q-b1-exec-3",
        "competencyId": "comp-b1-capacidade-execucao",
        "type": "statement",
        "text": "Atua de forma sistemática para concluir o que foi planejado.",
        "order": 2
      },
      {
        "id": "q-b1-exec-dial",
        "competencyId": "comp-b1-capacidade-execucao",
        "type": "dialogic",
        "text": "Considerando os últimos projetos, como aconteceu a passagem do planejamento para a execução e que efeito isso teve no trabalho realizado?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b1-organizacao",
    "categoryId": "bloco1",
    "name": "Organização",
    "order": 3,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-org-1",
        "competencyId": "comp-b1-organizacao",
        "type": "statement",
        "text": "Organiza previamente seu material e suas atividades de trabalho.",
        "order": 0
      },
      {
        "id": "q-b1-org-2",
        "competencyId": "comp-b1-organizacao",
        "type": "statement",
        "text": "Administra bem o tempo para realizar suas tarefas.",
        "order": 1
      },
      {
        "id": "q-b1-org-3",
        "competencyId": "comp-b1-organizacao",
        "type": "statement",
        "text": "Planeja as atividades antes de executá-las.",
        "order": 2
      },
      {
        "id": "q-b1-org-4",
        "competencyId": "comp-b1-organizacao",
        "type": "statement",
        "text": "Define metas claras alinhadas aos objetivos estabelecidos.",
        "order": 3
      },
      {
        "id": "q-b1-org-dial",
        "competencyId": "comp-b1-organizacao",
        "type": "dialogic",
        "text": "Nos projetos recentes, como você estruturou e organizou seu trabalho para dar andamento às atividades e como isso impactou o processo?",
        "order": 4
      }
    ]
  },
  {
    "id": "comp-b1-planejamento",
    "categoryId": "bloco1",
    "name": "Planejamento",
    "order": 4,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-plan-1",
        "competencyId": "comp-b1-planejamento",
        "type": "statement",
        "text": "Estabelece objetivos e metas antes de iniciar suas atividades.",
        "order": 0
      },
      {
        "id": "q-b1-plan-2",
        "competencyId": "comp-b1-planejamento",
        "type": "statement",
        "text": "Planeja considerando prioridades e recursos disponíveis.",
        "order": 1
      },
      {
        "id": "q-b1-plan-3",
        "competencyId": "comp-b1-planejamento",
        "type": "statement",
        "text": "Ajusta o planejamento quando surgem mudanças.",
        "order": 2
      },
      {
        "id": "q-b1-plan-4",
        "competencyId": "comp-b1-planejamento",
        "type": "statement",
        "text": "Antecipa recursos necessários para executar suas demandas.",
        "order": 3
      },
      {
        "id": "q-b1-plan-dial",
        "competencyId": "comp-b1-planejamento",
        "type": "dialogic",
        "text": "Ao lembrar dos últimos projetos, como você se organizou antes de iniciar as atividades e em que medida isso contribuiu para o desenvolvimento do trabalho?",
        "order": 4
      }
    ]
  },
  {
    "id": "comp-b1-priorizacao",
    "categoryId": "bloco1",
    "name": "Priorização",
    "order": 5,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-prior-1",
        "competencyId": "comp-b1-priorizacao",
        "type": "statement",
        "text": "Prioriza tarefas de forma eficiente.",
        "order": 0
      },
      {
        "id": "q-b1-prior-2",
        "competencyId": "comp-b1-priorizacao",
        "type": "statement",
        "text": "Identifica corretamente o que é mais importante e urgente.",
        "order": 1
      },
      {
        "id": "q-b1-prior-dial",
        "competencyId": "comp-b1-priorizacao",
        "type": "dialogic",
        "text": "Nos projetos mais recentes, como você definiu o que precisava ser feito primeiro e como avalia os resultados dessa escolha?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b1-orientacao-resultado",
    "categoryId": "bloco1",
    "name": "Orientação para Resultado",
    "order": 6,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-result-1",
        "competencyId": "comp-b1-orientacao-resultado",
        "type": "statement",
        "text": "Estabelece metas claras e mensuráveis.",
        "order": 0
      },
      {
        "id": "q-b1-result-2",
        "competencyId": "comp-b1-orientacao-resultado",
        "type": "statement",
        "text": "Busca maximizar produtividade e eficiência.",
        "order": 1
      },
      {
        "id": "q-b1-result-3",
        "competencyId": "comp-b1-orientacao-resultado",
        "type": "statement",
        "text": "Monitora o progresso das atividades.",
        "order": 2
      },
      {
        "id": "q-b1-result-4",
        "competencyId": "comp-b1-orientacao-resultado",
        "type": "statement",
        "text": "Corrige desvios que possam comprometer os resultados.",
        "order": 3
      },
      {
        "id": "q-b1-result-5",
        "competencyId": "comp-b1-orientacao-resultado",
        "type": "statement",
        "text": "Mantém foco nas atividades prioritárias e nos prazos.",
        "order": 4
      },
      {
        "id": "q-b1-result-dial",
        "competencyId": "comp-b1-orientacao-resultado",
        "type": "dialogic",
        "text": "Pensando nos projetos recentes, de que forma você acompanhou se o trabalho estava caminhando para os resultados esperados e como isso funcionou na prática?",
        "order": 5
      }
    ]
  },
  {
    "id": "comp-b1-atencao-concentrada",
    "categoryId": "bloco1",
    "name": "Atenção Concentrada",
    "order": 7,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-atenc-1",
        "competencyId": "comp-b1-atencao-concentrada",
        "type": "statement",
        "text": "Mantém atenção em uma tarefa mesmo em ambientes com interferências.",
        "order": 0
      },
      {
        "id": "q-b1-atenc-2",
        "competencyId": "comp-b1-atencao-concentrada",
        "type": "statement",
        "text": "Demonstra preocupação constante em executar o trabalho sem erros.",
        "order": 1
      },
      {
        "id": "q-b1-atenc-3",
        "competencyId": "comp-b1-atencao-concentrada",
        "type": "statement",
        "text": "Identifica erros ou inconsistências no fluxo de atividades.",
        "order": 2
      },
      {
        "id": "q-b1-atenc-dial",
        "competencyId": "comp-b1-atencao-concentrada",
        "type": "dialogic",
        "text": "Ao longo dos últimos projetos, como foi sua experiência em manter o foco durante a execução das atividades e quais efeitos isso teve no trabalho?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b1-detalhista",
    "categoryId": "bloco1",
    "name": "Detalhista",
    "order": 8,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b1-detal-1",
        "competencyId": "comp-b1-detalhista",
        "type": "statement",
        "text": "Garante precisão e qualidade em cada etapa do trabalho.",
        "order": 0
      },
      {
        "id": "q-b1-detal-2",
        "competencyId": "comp-b1-detalhista",
        "type": "statement",
        "text": "Dedica tempo necessário para revisar e corrigir detalhes.",
        "order": 1
      },
      {
        "id": "q-b1-detal-dial",
        "competencyId": "comp-b1-detalhista",
        "type": "dialogic",
        "text": "Considerando as entregas dos últimos projetos, como você lidou com os detalhes e revisões e como isso se refletiu no resultado final?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b2-raciocinio-logico",
    "categoryId": "bloco2",
    "name": "Raciocínio Lógico",
    "order": 9,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b2-rl-1",
        "competencyId": "comp-b2-raciocinio-logico",
        "type": "statement",
        "text": "Analisa informações de forma objetiva e lógica.",
        "order": 0
      },
      {
        "id": "q-b2-rl-2",
        "competencyId": "comp-b2-raciocinio-logico",
        "type": "statement",
        "text": "Resolve problemas de maneira sistemática.",
        "order": 1
      },
      {
        "id": "q-b2-rl-3",
        "competencyId": "comp-b2-raciocinio-logico",
        "type": "statement",
        "text": "Baseia decisões em evidências.",
        "order": 2
      },
      {
        "id": "q-b2-rl-dial",
        "competencyId": "comp-b2-raciocinio-logico",
        "type": "dialogic",
        "text": "Pensando nos últimos projetos, como você analisou as informações e chegou às decisões necessárias, e como avalia os resultados disso?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b2-raciocinio-abstrato",
    "categoryId": "bloco2",
    "name": "Raciocínio Abstrato",
    "order": 10,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b2-ra-1",
        "competencyId": "comp-b2-raciocinio-abstrato",
        "type": "statement",
        "text": "Conecta ideias complexas e identifica padrões não evidentes.",
        "order": 0
      },
      {
        "id": "q-b2-ra-2",
        "competencyId": "comp-b2-raciocinio-abstrato",
        "type": "statement",
        "text": "Visualiza conceitos futuros e relações sistêmicas.",
        "order": 1
      },
      {
        "id": "q-b2-ra-dial",
        "competencyId": "comp-b2-raciocinio-abstrato",
        "type": "dialogic",
        "text": "Ao olhar para os projetos mais recentes, como você conectou ideias e pensou em cenários possíveis para o trabalho, e quanto isso ajudou no resultado final?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b2-capacidade-investigativa",
    "categoryId": "bloco2",
    "name": "Capacidade Investigativa",
    "order": 11,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b2-ci-1",
        "competencyId": "comp-b2-capacidade-investigativa",
        "type": "statement",
        "text": "Busca ativamente informações para compreender problemas.",
        "order": 0
      },
      {
        "id": "q-b2-ci-2",
        "competencyId": "comp-b2-capacidade-investigativa",
        "type": "statement",
        "text": "Utiliza fontes variadas para aprofundar o entendimento.",
        "order": 1
      },
      {
        "id": "q-b2-ci-3",
        "competencyId": "comp-b2-capacidade-investigativa",
        "type": "statement",
        "text": "Não se contenta com respostas superficiais.",
        "order": 2
      },
      {
        "id": "q-b2-ci-dial",
        "competencyId": "comp-b2-capacidade-investigativa",
        "type": "dialogic",
        "text": "Nos últimos projetos, quando surgiram dúvidas ou problemas, como você buscou informações para entender melhor a situação e como isso funcionou na prática?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b2-senso-critico",
    "categoryId": "bloco2",
    "name": "Senso Crítico",
    "order": 12,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b2-sc-1",
        "competencyId": "comp-b2-senso-critico",
        "type": "statement",
        "text": "Questiona suposições e processos estabelecidos.",
        "order": 0
      },
      {
        "id": "q-b2-sc-2",
        "competencyId": "comp-b2-senso-critico",
        "type": "statement",
        "text": "Analisa informações antes de aceitar conclusões.",
        "order": 1
      },
      {
        "id": "q-b2-sc-dial",
        "competencyId": "comp-b2-senso-critico",
        "type": "dialogic",
        "text": "Pensando nos projetos recentes, como você questionou práticas, informações ou conclusões prontas ao longo do trabalho, e como isso impactou os resultados?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b2-resolucao-problemas",
    "categoryId": "bloco2",
    "name": "Resolução de Problemas",
    "order": 13,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b2-rp-1",
        "competencyId": "comp-b2-resolucao-problemas",
        "type": "statement",
        "text": "Identifica as causas reais dos problemas.",
        "order": 0
      },
      {
        "id": "q-b2-rp-2",
        "competencyId": "comp-b2-resolucao-problemas",
        "type": "statement",
        "text": "Propõe soluções práticas e eficazes.",
        "order": 1
      },
      {
        "id": "q-b2-rp-3",
        "competencyId": "comp-b2-resolucao-problemas",
        "type": "statement",
        "text": "Direciona esforços para resolver problemas de forma objetiva.",
        "order": 2
      },
      {
        "id": "q-b2-rp-dial",
        "competencyId": "comp-b2-resolucao-problemas",
        "type": "dialogic",
        "text": "Nos últimos projetos, quando surgiram problemas, como você lidou com eles desde a identificação até a solução e como avalia o efeito disso no trabalho?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b2-tomada-decisao",
    "categoryId": "bloco2",
    "name": "Tomada de Decisão",
    "order": 14,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b2-td-1",
        "competencyId": "comp-b2-tomada-decisao",
        "type": "statement",
        "text": "Analisa riscos e benefícios antes de agir.",
        "order": 0
      },
      {
        "id": "q-b2-td-2",
        "competencyId": "comp-b2-tomada-decisao",
        "type": "statement",
        "text": "Decide com base no alinhamento estratégico da empresa.",
        "order": 1
      },
      {
        "id": "q-b2-td-dial",
        "competencyId": "comp-b2-tomada-decisao",
        "type": "dialogic",
        "text": "Nos projetos recentes, como você tomou as decisões mais importantes e de que forma elas contribuíram para o avanço das demandas?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b3-foco-cliente",
    "categoryId": "bloco3",
    "name": "Foco no Cliente",
    "order": 15,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b3-fc-1",
        "competencyId": "comp-b3-foco-cliente",
        "type": "statement",
        "text": "Prioriza as necessidades e a satisfação do cliente em suas ações.",
        "order": 0
      },
      {
        "id": "q-b3-fc-2",
        "competencyId": "comp-b3-foco-cliente",
        "type": "statement",
        "text": "Antecipa-se aos problemas que podem afetar a experiência do cliente.",
        "order": 1
      },
      {
        "id": "q-b3-fc-dial",
        "competencyId": "comp-b3-foco-cliente",
        "type": "dialogic",
        "text": "Considerando os projetos recentes, como você buscou entender e atender às expectativas do cliente e qual foi o impacto disso no resultado?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b3-atencao-cliente",
    "categoryId": "bloco3",
    "name": "Atenção ao Cliente",
    "order": 16,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b3-ac-1",
        "competencyId": "comp-b3-atencao-cliente",
        "type": "statement",
        "text": "Demonstra cuidado e dedicação no atendimento às demandas dos clientes.",
        "order": 0
      },
      {
        "id": "q-b3-ac-2",
        "competencyId": "comp-b3-atencao-cliente",
        "type": "statement",
        "text": "Responde com clareza e agilidade às solicitações dos clientes.",
        "order": 1
      },
      {
        "id": "q-b3-ac-dial",
        "competencyId": "comp-b3-atencao-cliente",
        "type": "dialogic",
        "text": "Pensando nas interações recentes, como você conduziu a comunicação e o suporte ao cliente e como avalia a percepção dele sobre o seu trabalho?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b3-negociacao",
    "categoryId": "bloco3",
    "name": "Negociação / Persuasão",
    "order": 17,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b3-np-1",
        "competencyId": "comp-b3-negociacao",
        "type": "statement",
        "text": "Apresenta argumentos convincentes para defender ideias e soluções.",
        "order": 0
      },
      {
        "id": "q-b3-np-2",
        "competencyId": "comp-b3-negociacao",
        "type": "statement",
        "text": "Busca o equilíbrio entre os interesses da empresa e do cliente.",
        "order": 1
      },
      {
        "id": "q-b3-np-dial",
        "competencyId": "comp-b3-negociacao",
        "type": "dialogic",
        "text": "Nos projetos recentes, em quais situações você precisou negociar prazos ou soluções e como você conduziu esse processo para chegar a um acordo?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b4-comunicacao",
    "categoryId": "bloco4",
    "name": "Comunicação",
    "order": 18,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b4-com-1",
        "competencyId": "comp-b4-comunicacao",
        "type": "statement",
        "text": "Expressa suas ideias de forma clara, objetiva e estruturada.",
        "order": 0
      },
      {
        "id": "q-b4-com-2",
        "competencyId": "comp-b4-comunicacao",
        "type": "statement",
        "text": "Ouve ativamente e demonstra compreensão sobre o que foi comunicado.",
        "order": 1
      },
      {
        "id": "q-b4-com-3",
        "competencyId": "comp-b4-comunicacao",
        "type": "statement",
        "text": "Utiliza canais adequados para cada tipo de mensagem.",
        "order": 2
      },
      {
        "id": "q-b4-com-dial",
        "competencyId": "comp-b4-comunicacao",
        "type": "dialogic",
        "text": "Considerando as interações recentes, como você avalia sua clareza ao passar informações e como garante que o que foi dito foi realmente compreendido?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b4-trabalho-equipe",
    "categoryId": "bloco4",
    "name": "Trabalho em Equipe",
    "order": 19,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b4-te-1",
        "competencyId": "comp-b4-trabalho-equipe",
        "type": "statement",
        "text": "Colabora ativamente com os membros da equipe para atingir objetivos comuns.",
        "order": 0
      },
      {
        "id": "q-b4-te-2",
        "competencyId": "comp-b4-trabalho-equipe",
        "type": "statement",
        "text": "Adapta-se às diferentes necessidades e estilos de trabalho dos membros da equipe.",
        "order": 1
      },
      {
        "id": "q-b4-te-3",
        "competencyId": "comp-b4-trabalho-equipe",
        "type": "statement",
        "text": "Oferece ajuda aos colegas quando percebe a oportunidade.",
        "order": 2
      },
      {
        "id": "q-b4-te-4",
        "competencyId": "comp-b4-trabalho-equipe",
        "type": "statement",
        "text": "Recebe feedbacks com abertura e positividade.",
        "order": 3
      },
      {
        "id": "q-b4-te-dial",
        "competencyId": "comp-b4-trabalho-equipe",
        "type": "dialogic",
        "text": "Pensando nos projetos mais recentes, como foi sua atuação em conjunto com o time e como isso funcionou no andamento do trabalho?",
        "order": 4
      }
    ]
  },
  {
    "id": "comp-b4-relacionamento-interpessoal",
    "categoryId": "bloco4",
    "name": "Relacionamento Interpessoal",
    "order": 20,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b4-ri-1",
        "competencyId": "comp-b4-relacionamento-interpessoal",
        "type": "statement",
        "text": "Estabelece e mantém relações cordiais com colegas, líderes e clientes.",
        "order": 0
      },
      {
        "id": "q-b4-ri-2",
        "competencyId": "comp-b4-relacionamento-interpessoal",
        "type": "statement",
        "text": "Demonstra aceitação e respeito pelas diferenças.",
        "order": 1
      },
      {
        "id": "q-b4-ri-3",
        "competencyId": "comp-b4-relacionamento-interpessoal",
        "type": "statement",
        "text": "Contribui para a construção de um clima organizacional favorável.",
        "order": 2
      },
      {
        "id": "q-b4-ri-dial",
        "competencyId": "comp-b4-relacionamento-interpessoal",
        "type": "dialogic",
        "text": "Considerando as interações mais recentes no trabalho, como você se relacionou com colegas, líderes e clientes de diferentes perfis e como avalia o impacto disso no ambiente?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b4-cordialidade",
    "categoryId": "bloco4",
    "name": "Cordialidade",
    "order": 21,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b4-cor-1",
        "competencyId": "comp-b4-cordialidade",
        "type": "statement",
        "text": "Estabelece relacionamento gentil e cuidadoso com todas as pessoas.",
        "order": 0
      },
      {
        "id": "q-b4-cor-2",
        "competencyId": "comp-b4-cordialidade",
        "type": "statement",
        "text": "Pratica tolerância ao lidar com diferenças de opinião.",
        "order": 1
      },
      {
        "id": "q-b4-cor-dial",
        "competencyId": "comp-b4-cordialidade",
        "type": "dialogic",
        "text": "Pensando nas situações recentes do trabalho, como foi sua postura no trato diário com as pessoas e como isso funcionou na prática?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b4-empatia",
    "categoryId": "bloco4",
    "name": "Empatia",
    "order": 22,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b4-emp-1",
        "competencyId": "comp-b4-empatia",
        "type": "statement",
        "text": "Ajusta sua comunicação ao contexto emocional da outra pessoa.",
        "order": 0
      },
      {
        "id": "q-b4-emp-2",
        "competencyId": "comp-b4-empatia",
        "type": "statement",
        "text": "Demonstra sensibilidade diante das necessidades e dificuldades dos colegas.",
        "order": 1
      },
      {
        "id": "q-b4-emp-3",
        "competencyId": "comp-b4-empatia",
        "type": "statement",
        "text": "Ouve o outro com atenção genuína.",
        "order": 2
      },
      {
        "id": "q-b4-emp-dial",
        "competencyId": "comp-b4-empatia",
        "type": "dialogic",
        "text": "Nos projetos e interações mais recentes, como você lidou com as necessidades dos colegas e como isso influenciou as relações?",
        "order": 3
      }
    ]
  },
  {
    "id": "comp-b4-resolucao-conflitos",
    "categoryId": "bloco4",
    "name": "Resolução de Conflitos",
    "order": 23,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b4-rc-1",
        "competencyId": "comp-b4-resolucao-conflitos",
        "type": "statement",
        "text": "Escuta ativamente as perspectivas das pessoas envolvidas em conflitos.",
        "order": 0
      },
      {
        "id": "q-b4-rc-2",
        "competencyId": "comp-b4-resolucao-conflitos",
        "type": "statement",
        "text": "Busca soluções práticas e eficazes para resolver conflitos.",
        "order": 1
      },
      {
        "id": "q-b4-rc-dial",
        "competencyId": "comp-b4-resolucao-conflitos",
        "type": "dialogic",
        "text": "Pensando em conflitos recentes, como você atuou para lidar com essas situações e como avalia os resultados?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b4-disponibilidade-interna",
    "categoryId": "bloco4",
    "name": "Disponibilidade (Interna)",
    "order": 24,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b4-di-1",
        "competencyId": "comp-b4-disponibilidade-interna",
        "type": "statement",
        "text": "Demonstra prontidão para ajudar e oferecer suporte quando necessário.",
        "order": 0
      },
      {
        "id": "q-b4-di-2",
        "competencyId": "comp-b4-disponibilidade-interna",
        "type": "statement",
        "text": "Responde prontamente às solicitações e pedidos de apoio da equipe.",
        "order": 1
      },
      {
        "id": "q-b4-di-dial",
        "competencyId": "comp-b4-disponibilidade-interna",
        "type": "dialogic",
        "text": "Considerando as demandas internas mais recentes, como você se mostrou disponível para apoiar a equipe?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b5-comprometimento",
    "categoryId": "bloco5",
    "name": "Comprometimento",
    "order": 25,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b5-comp-1",
        "competencyId": "comp-b5-comprometimento",
        "type": "statement",
        "text": "Cumpre as atividades, responsabilidades e objetivos do trabalho de forma empenhada.",
        "order": 0
      },
      {
        "id": "q-b5-comp-2",
        "competencyId": "comp-b5-comprometimento",
        "type": "statement",
        "text": "Entrega tarefas e combinados no prazo respeitando as regras e princípios da organização.",
        "order": 1
      },
      {
        "id": "q-b5-comp-dial",
        "competencyId": "comp-b5-comprometimento",
        "type": "dialogic",
        "text": "Pensando nas atividades e projetos mais recentes, como você administrou suas responsabilidades, prazos e possíveis imprevistos? Quando ocorreram dificuldades ou erros, como você os comunicou e conduziu a solução?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b5-responsabilidade",
    "categoryId": "bloco5",
    "name": "Responsabilidade",
    "order": 26,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b5-resp-1",
        "competencyId": "comp-b5-responsabilidade",
        "type": "statement",
        "text": "Demonstra segurança ao exercer suas funções.",
        "order": 0
      },
      {
        "id": "q-b5-resp-2",
        "competencyId": "comp-b5-responsabilidade",
        "type": "statement",
        "text": "Assume erros e falhas com transparência.",
        "order": 1
      },
      {
        "id": "q-b5-resp-dial",
        "competencyId": "comp-b5-responsabilidade",
        "type": "dialogic",
        "text": "Considerando situações recentes de trabalho, como você lidou com erros, imprevistos ou falhas quando eles aconteceram, e como isso funcionou na prática?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b5-comportamento-etico",
    "categoryId": "bloco5",
    "name": "Comportamento Ético",
    "order": 27,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b5-ce-1",
        "competencyId": "comp-b5-comportamento-etico",
        "type": "statement",
        "text": "Age de acordo com princípios éticos e valores morais.",
        "order": 0
      },
      {
        "id": "q-b5-ce-2",
        "competencyId": "comp-b5-comportamento-etico",
        "type": "statement",
        "text": "Adota postura de discrição em relação aos assuntos da empresa.",
        "order": 1
      },
      {
        "id": "q-b5-ce-dial",
        "competencyId": "comp-b5-comportamento-etico",
        "type": "dialogic",
        "text": "Pensando nas decisões e situações recentes do trabalho, como você considerou aspectos éticos no dia a dia e como avalia os efeitos dessas escolhas?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b5-confiabilidade",
    "categoryId": "bloco5",
    "name": "Confiabilidade",
    "order": 28,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b5-conf-1",
        "competencyId": "comp-b5-confiabilidade",
        "type": "statement",
        "text": "Cumpre o que promete.",
        "order": 0
      },
      {
        "id": "q-b5-conf-2",
        "competencyId": "comp-b5-confiabilidade",
        "type": "statement",
        "text": "Demonstra coerência entre discurso e prática.",
        "order": 1
      },
      {
        "id": "q-b5-conf-dial",
        "competencyId": "comp-b5-confiabilidade",
        "type": "dialogic",
        "text": "Nos projetos mais recentes, como foi a relação entre o que você combinou ou prometeu e o que de fato entregou, e como isso funcionou para o trabalho?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b5-transparencia",
    "categoryId": "bloco5",
    "name": "Transparência",
    "order": 29,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b5-trans-1",
        "competencyId": "comp-b5-transparencia",
        "type": "statement",
        "text": "Compartilha informações relevantes de forma clara e no tempo adequado.",
        "order": 0
      },
      {
        "id": "q-b5-trans-2",
        "competencyId": "comp-b5-transparencia",
        "type": "statement",
        "text": "Expõe suas intenções, limites e dificuldades com honestidade.",
        "order": 1
      },
      {
        "id": "q-b5-trans-dial",
        "competencyId": "comp-b5-transparencia",
        "type": "dialogic",
        "text": "Pensando nas situações recentes do trabalho, como você compartilhou informações, limites ou dificuldades com as pessoas envolvidas, e como isso impactou o andamento das atividades?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b5-sigilo",
    "categoryId": "bloco5",
    "name": "Sigilo",
    "order": 30,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b5-sig-1",
        "competencyId": "comp-b5-sigilo",
        "type": "statement",
        "text": "Mantém informações confidenciais em absoluto sigilo.",
        "order": 0
      },
      {
        "id": "q-b5-sig-2",
        "competencyId": "comp-b5-sigilo",
        "type": "statement",
        "text": "Age com discrição em assuntos sensíveis.",
        "order": 1
      },
      {
        "id": "q-b5-sig-dial",
        "competencyId": "comp-b5-sigilo",
        "type": "dialogic",
        "text": "Considerando situações recentes que envolveram informações sensíveis ou assuntos delicados, como você lidou com essas informações e como avalia os resultados dessa postura?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b6-aprendizado-continuo",
    "categoryId": "bloco6",
    "name": "Aprendizado Contínuo",
    "order": 31,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b6-ac-1",
        "competencyId": "comp-b6-aprendizado-continuo",
        "type": "statement",
        "text": "Busca aprendizado contínuo para aprimorar sua atuação.",
        "order": 0
      },
      {
        "id": "q-b6-ac-2",
        "competencyId": "comp-b6-aprendizado-continuo",
        "type": "statement",
        "text": "Demonstra interesse em desenvolver novas habilidades.",
        "order": 1
      },
      {
        "id": "q-b6-ac-dial",
        "competencyId": "comp-b6-aprendizado-continuo",
        "type": "dialogic",
        "text": "Pensando nas experiências de trabalho mais recentes, como você buscou aprender coisas novas e como avalia os efeitos disso?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b6-adaptacao-mudancas",
    "categoryId": "bloco6",
    "name": "Adaptação às Mudanças",
    "order": 32,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b6-am-1",
        "competencyId": "comp-b6-adaptacao-mudancas",
        "type": "statement",
        "text": "Adapta-se a mudanças com flexibilidade.",
        "order": 0
      },
      {
        "id": "q-b6-am-2",
        "competencyId": "comp-b6-adaptacao-mudancas",
        "type": "statement",
        "text": "Mantém desempenho mesmo diante de cenários novos ou incertos.",
        "order": 1
      },
      {
        "id": "q-b6-am-dial",
        "competencyId": "comp-b6-adaptacao-mudancas",
        "type": "dialogic",
        "text": "Considerando mudanças recentes no trabalho, como você lidou com essas situações e como isso funcionou para dar continuidade às atividades?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b6-abertura-feedback",
    "categoryId": "bloco6",
    "name": "Abertura ao Feedback",
    "order": 33,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b6-af-1",
        "competencyId": "comp-b6-abertura-feedback",
        "type": "statement",
        "text": "Utiliza feedbacks como oportunidade de desenvolvimento.",
        "order": 0
      },
      {
        "id": "q-b6-af-2",
        "competencyId": "comp-b6-abertura-feedback",
        "type": "statement",
        "text": "Solicita feedbacks para aprimorar sua atuação.",
        "order": 1
      },
      {
        "id": "q-b6-af-dial",
        "competencyId": "comp-b6-abertura-feedback",
        "type": "dialogic",
        "text": "Pensando em situações recentes, como você lidou com feedbacks recebidos e como isso contribuiu para seu desenvolvimento?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b6-autodesenvolvimento",
    "categoryId": "bloco6",
    "name": "Autodesenvolvimento",
    "order": 34,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b6-ad-1",
        "competencyId": "comp-b6-autodesenvolvimento",
        "type": "statement",
        "text": "Reflete sobre sua própria atuação.",
        "order": 0
      },
      {
        "id": "q-b6-ad-2",
        "competencyId": "comp-b6-autodesenvolvimento",
        "type": "statement",
        "text": "Busca evolução pessoal e profissional.",
        "order": 1
      },
      {
        "id": "q-b6-ad-dial",
        "competencyId": "comp-b6-autodesenvolvimento",
        "type": "dialogic",
        "text": "Considerando seu trabalho recente, como você refletiu sobre seu próprio desempenho e como isso ajudou a orientar melhorias?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b6-visao-futuro",
    "categoryId": "bloco6",
    "name": "Visão de Futuro",
    "order": 35,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b6-vf-1",
        "competencyId": "comp-b6-visao-futuro",
        "type": "statement",
        "text": "Planeja seu desenvolvimento profissional a médio e longo prazo.",
        "order": 0
      },
      {
        "id": "q-b6-vf-2",
        "competencyId": "comp-b6-visao-futuro",
        "type": "statement",
        "text": "Alinha expectativas pessoais aos objetivos da organização.",
        "order": 1
      },
      {
        "id": "q-b6-vf-dial",
        "competencyId": "comp-b6-visao-futuro",
        "type": "dialogic",
        "text": "Pensando no momento atual da sua carreira, como você tem refletido sobre seus próximos passos profissionais?",
        "order": 2
      }
    ]
  },
  {
    "id": "comp-b6-proatividade-desenvolvimento",
    "categoryId": "bloco6",
    "name": "Proatividade no Desenvolvimento",
    "order": 36,
    "createdAt": "2025-01-24T00:00:00.000Z",
    "questions": [
      {
        "id": "q-b6-pd-1",
        "competencyId": "comp-b6-proatividade-desenvolvimento",
        "type": "statement",
        "text": "Busca oportunidades de crescimento dentro da organização.",
        "order": 0
      },
      {
        "id": "q-b6-pd-2",
        "competencyId": "comp-b6-proatividade-desenvolvimento",
        "type": "statement",
        "text": "Age de forma ativa para evoluir profissionalmente.",
        "order": 1
      },
      {
        "id": "q-b6-pd-dial",
        "competencyId": "comp-b6-proatividade-desenvolvimento",
        "type": "dialogic",
        "text": "Considerando as oportunidades recentes no trabalho, como você tomou iniciativas para se desenvolver profissionalmente?",
        "order": 2
      }
    ]
  }
];
