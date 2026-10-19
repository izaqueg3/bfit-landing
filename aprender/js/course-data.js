/* Conteúdo do minicurso — fiel ao material "Da ciência à prescrição individualizada"
 * (II Conferência Capixaba de Personal Trainer · CREF22/ES · Izaque Braga · BFit · Out/2026).
 * VÍDEOS: preencha videoSrc com o caminho do arquivo quando gerar (ex.: "/aprender/video/modulo-01.mp4").
 * Se o arquivo não existir, o espaço do vídeo fica oculto. O pôster segue o padrão /aprender/img/poster-XX.jpg. */
window.BFIT_COURSE = {
  titulo: "Da ciência à prescrição individualizada",
  subtitulo: "O que trouxemos da conferência para elevar o padrão técnico do time BFit",
  autor: "Izaque Braga · BFit Academias · Outubro de 2026",
  evento: "II Conferência Capixaba de Personal Trainer · CREF22/ES",
  fonteBase: "Anotações de Izaque Braga e material técnico complementar (base prioritária: posicionamento ACSM 2026)",
  disclaimer: "Material complementar independente, construído a partir das anotações da conferência. Não há endosso formal do CREF22/ES ou dos palestrantes. Não substitui avaliação clínica quando indicada.",
  modulos: [
    { n: 1, eixo: "Diferenças sexuais", nome: "Diferenças sexuais e resposta ao treino",
      titulo: "O crescimento percentual é semelhante entre os sexos",
      fontes: "Refalo et al., PeerJ 2025; Roberts et al., JSCR 2020",
      pontos: [
        "Em média, homens têm mais hormônio anabólico, mais massa magra e ganho absoluto um pouco maior.",
        "Revisão com 29 estudos: em percentual, o ganho é parecido entre os sexos.",
        "Quem decide a prescrição é o objetivo da pessoa, seu histórico de treino e fases como gravidez, pós-parto e menopausa.",
        "Mito a evitar: “mulher só deve fazer muitas repetições com pouca carga para não ficar musculosa”."
      ], videoSrc: null },
    { n: 2, eixo: "Intensidade e RIR", nome: "Intensidade, carga, repetições e RIR",
      titulo: "RIR: quantas repetições ainda sobram",
      fontes: "ACSM Position Stand 2026 (Currier et al.) · Robinson et al., Sports Medicine 2024",
      pontos: [
        "RIR indica quantas repetições ainda sobram: RIR 0 é a falha concêntrica e RIR 4, margem confortável.",
        "Iniciante: RIR 3–4 enquanto aprende a técnica. Intermediário: alternar RIR 1–3 nas séries de trabalho.",
        "Força pede carga mais alta e menos repetições (≥80% de 1RM favorece força máxima); resistência, carga mais baixa e mais repetições; hipertrofia, faixas variadas com esforço próximo da falha.",
        "“3×12” não diz a intensidade sozinho: a mesma carga pode estar a 1 ou a 5 repetições da falha."
      ], videoSrc: null },
    { n: 3, eixo: "Volume", nome: "Volume de treinamento e hipertrofia",
      titulo: "Séries efetivas por músculo por semana",
      fontes: "ACSM Position Stand 2026",
      pontos: [
        "Faixas didáticas: iniciante ≈ 4–8 séries por músculo por semana; intermediário ≈ 8–14.",
        "Avançado: individualizar, frequentemente >10 séries por semana.",
        "O ACSM 2026 associa ≥10 séries por semana a mais hipertrofia média.",
        "São faixas didáticas e conservadoras para iniciar a discussão, não metas fixas."
      ], videoSrc: null },
    { n: 4, eixo: "Frequência", nome: "Frequência, recuperação e dor muscular",
      titulo: "Sessões de treino por semana",
      fontes: "Schoenfeld et al. 2019; OMS 2020",
      pontos: [
        "Faixas anotadas na palestra: iniciante 2 a 4 vezes por semana; intermediário 3 a 5; avançado 4 a 7.",
        "A OMS recomenda fortalecimento muscular em pelo menos 2 dias por semana (saúde pública).",
        "Dor muscular tardia não indica crescimento.",
        "Acompanhe desempenho, sono e fadiga."
      ], videoSrc: null },
    { n: 5, eixo: "Treino feminino", nome: "Treino feminino e ciclo menstrual",
      titulo: "Não existe receita universal",
      fontes: "McNulty et al., Sports Med 2020; Colenso-Semple et al., 2023",
      pontos: [
        "Não existe receita universal para o ciclo menstrual.",
        "A pergunta certa: como esta aluna se sente e rende ao longo do próprio ciclo?",
        "Manter o plano-base e ajustar carga ou sessão conforme os sintomas.",
        "Perguntar sobre sintomas com privacidade e consentimento; encaminhar ao médico diante de sintomas intensos."
      ], videoSrc: null },
    { n: 6, eixo: "Ordem dos exercícios", nome: "Seleção e ordem dos exercícios",
      titulo: "A prioridade da aluna vem primeiro",
      fontes: "ACSM Position Stand 2026; ACSM Progression Models 2009",
      pontos: [
        "O que vem no início do treino recebe mais atenção, energia e força.",
        "Coloque no início o exercício ligado ao objetivo principal da aluna.",
        "Multiarticulares primeiro é uma convenção útil para força e aprendizado, não uma lei universal."
      ], videoSrc: null },
    { n: 7, eixo: "Anamnese", nome: "Anamnese e prescrição individualizada",
      titulo: "“Quem não sabe avaliar, não sabe prescrever”",
      fontes: "",
      pontos: [
        "A anamnese cobre seis eixos: objetivo e histórico, saúde, rotina, movimento, acompanhamento e expectativa corporal.",
        "Individualizar é adaptar uma estrutura científica à pessoa real.",
        "Dupla progressão (exemplo no leg press): faixa de 8–12 repetições a RIR 2.",
        "Fechou 12 nas três séries com boa técnica e amplitude? Sobe a carga um pouco e volta para 8."
      ], videoSrc: null },
    { n: 8, eixo: "Biomecânica", nome: "Valgo dinâmico e glúteos",
      titulo: "Joelho para dentro é culpa do glúteo médio? Nem sempre.",
      fontes: "",
      pontos: [
        "O padrão depende de quadril, fêmur, tornozelo, pé, controle motor, velocidade, fadiga e anatomia.",
        "Avaliar antes de corrigir: observar, checar tornozelo e pés, e só então intervir.",
        "“Abdução = glúteo médio, extensão = glúteo máximo” serve para começar, mas simplifica a biomecânica.",
        "Valgo não é diagnóstico automático de lesão nem prova isolada de fraqueza muscular."
      ], videoSrc: null },
    { n: 9, eixo: "Imagem corporal", nome: "Imagem corporal",
      titulo: "Imagem corporal tem duas dimensões",
      fontes: "Body Image 2024; Dennehy et al. 2024 · associação, não causa direta",
      pontos: [
        "Imagem corporal é a representação mental que o cérebro faz do próprio corpo (Kakeshita, 2005).",
        "Atitudinal: gosto ou não gosto, sentimentos, crenças e satisfação com o corpo.",
        "Perceptual: como a pessoa percebe o tamanho e a proporção do corpo no espaço.",
        "A força e a saúde podem melhorar antes da autoimagem; comparações nas redes sociais se associam a mais insatisfação."
      ], videoSrc: null },
    { n: 10, eixo: "Comunicação", nome: "Comunicação profissional",
      titulo: "Acolher, não reforçar a vergonha",
      fontes: "Anderberg et al., Body Image 2025 · muitas pessoas procuram a academia por insatisfação com o corpo",
      pontos: [
        "Acolher, não reforçar a vergonha: evite frases que atacam o corpo ou glorificam a dor.",
        "Prefira “Vamos montar um plano que caiba na sua rotina.”",
        "Fotos e medidas só com motivo e consentimento.",
        "Sofrimento importante com a imagem: encaminhar à Psicologia."
      ], videoSrc: null }
  ],
  referencias: [
    "Currier et al. ACSM Position Stand, MSSE 2026",
    "Refalo et al. Diferenças sexuais no tamanho muscular, PeerJ 2025",
    "Roberts et al. Sex Differences in Resistance Training, JSCR 2020",
    "Robinson et al. Proximidade da falha, Sports Medicine 2024",
    "Schoenfeld et al. Frequência de treino por músculo, 2019",
    "OMS. Diretrizes de atividade física e comportamento sedentário, 2020",
    "McNulty et al. Ciclo menstrual e desempenho, Sports Med 2020",
    "Colenso-Semple et al. Fase menstrual e força, Front Sports 2023",
    "ACSM. Progression Models in Resistance Training, 2009",
    "Revisão sobre comparação social e imagem corporal, Body Image 2024",
    "Dennehy et al. Redes sociais e fitness feminino, IJHCS 2024",
    "Anderberg et al. Apps de dieta e fitness e imagem corporal, Body Image 2025"
  ],
  protocolo30: [
    { sem: 1, nome: "Reunião técnica", txt: "Séries efetivas, RIR, carga relativa e objetivos. Vocabulário único." },
    { sem: 2, nome: "Oficina prática", txt: "Anamnese e prescrição para três perfis fictícios." },
    { sem: 3, nome: "Observação no salão", txt: "Ordem, técnica e registro de evolução, sem julgamento corporal." },
    { sem: 4, nome: "Auditoria educativa", txt: "Revisar 8–10 fichas, com proteção de dados, e propor melhorias." }
  ],
  indicadores: [
    { nome: "Fichas com objetivo documentado", valor: "[__%]", meta: "Meta: [__%]", un: "" },
    { nome: "Fichas com RIR ou esforço registrado", valor: "[__%]", meta: "Meta: [__%]", un: "" },
    { nome: "Cargas revisadas no período", valor: "[__%]", meta: "Meta: [__%]", un: "" },
    { nome: "Assiduidade média dos alunos", valor: "[__]", meta: "", un: "treinos/semana" },
    { nome: "Satisfação com o atendimento", valor: "[__/10]", meta: "", un: "pesquisa mensal" },
    { nome: "Sobrecarga e encaminhamentos", valor: "[__]", meta: "", un: "casos no mês" }
  ],
  debate: [
    "Por que “3×12” não descreve sozinho a intensidade?",
    "O que muda ao dividir 12 séries de quadríceps em 1, 2 ou 3 sessões?",
    "Como diferenciar progressão de fadiga excessiva?",
    "Quando parar a série antes da falha é a melhor decisão?",
    "Quais informações mínimas a anamnese precisa ter?",
    "Como responder à aluna que rende menos na menstruação?",
    "Valgo do joelho sempre indica glúteo médio fraco?",
    "Que frases nossas podem piorar a insatisfação corporal?"
  ]
};
