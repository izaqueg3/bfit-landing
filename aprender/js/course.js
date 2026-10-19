(function () {
  "use strict";
  var $ = BF.$, $$ = BF.$$, esc = BF.esc, C = window.BFIT_COURSE, api = window.BFitAPI;
  var TOTAL = BF.cfg.TOTAL_MODULOS || 10, MAX = BF.cfg.MAX_TENTATIVAS || 3, MIN = BF.cfg.NOTA_MINIMA || 7;
  var state = { done: [], attempts: [], cur: null, session: null };
  var KEYS = ["inicio"].concat(C.modulos.map(function (m) { return "m" + m.n; }), ["aplicacao", "referencias"]);
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };

  /* ---------- ícones ---------- */
  var I = {
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DFA624" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
    x: '<svg class="ph-card__i" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6b5e" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
    ok: '<svg class="ph-card__i" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b9d1ae" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M7.8 12.4l3 3 5.4-6"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    target: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/></svg>',
    pulse: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5-6 4 12 2.5-6H21"/></svg>',
    clock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/></svg>',
    move: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 8v6l-3.5 6M12 14l3.5 6M6.5 11l5.5-1.5 5.5 1.5"/></svg>',
    clip: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4.5" width="14" height="16.5" rx="2.2"/><path d="M9 4.5V3h6v1.5M8.8 11.5h6.4M8.8 15.5h4"/></svg>',
    user: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6"/></svg>'
  };
  var callout = function (html, cls) { return '<div class="callout rv ' + (cls || "") + '">' + I.info + "<div>" + html + "</div></div>"; };
  var card = function (inner, cls) { return '<div class="card rv ' + (cls || "") + '">' + inner + "</div>"; };

  /* ---------- gráfico de faixas (M3/M4) ---------- */
  function rangeChart(o) {
    var rows = o.rows.map(function (r, i) {
      return '<div class="rrow"><div class="rrow__t"><b>' + r.nome + "</b><em>" + r.txt + '</em></div><div class="rtrack"><div class="rbar' + (r.open ? " rbar--open" : "") + (r.olive ? " rbar--olive" : "") + '" style="--lo:' + r.lo + ";--hi:" + r.hi + ";--i:" + i + '"></div></div></div>';
    }).join("");
    var ticks = o.ticks.map(function (t) { return '<span style="--t:' + t + '">' + t + "</span>"; }).join("");
    return '<div class="rchart draw has-mark" style="--max:' + o.max + ";--at:" + o.mark.at + ";--ticks:" + (o.ticks.length - 1) + '">' +
      '<div class="rtop"><span class="rpill">' + o.mark.label + "</span></div>" +
      '<div class="rchart__plot"><div class="rgrid"></div>' + rows + "</div>" +
      '<div class="raxis" aria-hidden="true">' + ticks + '</div><div class="raxis__u">' + o.unit + "</div></div>";
  }
  var rng = function (a, b) { return "≈ " + '<span data-count="' + a + '">0</span>–<span data-count="' + b + '">0</span>'; };

  /* ---------- visuais por módulo ---------- */
  var VIZ = {};
  VIZ[1] = function () {
    return '<div class="viz viz--2">' +
      card('<div class="ph"><h3>Média da população</h3><span class="badge badge--gold"><span><span data-count="29">0</span> estudos</span></span></div>' +
        '<div class="draw"><div class="twin"><div class="twin__c"><div class="twin__grp"><div class="twin__bar twin__bar--m" style="--h:100"></div><div class="twin__bar twin__bar--f" style="--h:82"></div></div><div class="twin__ttl">Ganho absoluto</div><small style="text-align:center">homens, em média, um pouco maior</small></div>' +
        '<div class="twin__c"><div class="twin__grp"><div class="twin__bar twin__bar--m" style="--h:100"></div><div class="twin__bar twin__bar--f" style="--h:100"></div></div><div class="twin__ttl">Ganho percentual</div><small style="text-align:center">parecido entre os sexos</small></div></div>' +
        '<div class="twin__lg"><span><i style="background:#6b6b6b"></i>Homens</span><span><i style="background:#b88cc4"></i>Mulheres</span></div></div>' +
        '<p style="margin-top:.8rem">Homens têm, em média, mais hormônio anabólico, mais massa magra e ganho absoluto um pouco maior. Revisão com 29 estudos: em percentual, o ganho é parecido.</p>' +
        '<p class="cap">Ilustração qualitativa das ideias do material, sem valores numéricos.</p>') +
      card('<div class="ph"><h3>O que decide a prescrição</h3><span class="badge">Não é o sexo</span></div>' +
        '<ul class="steps draw" style="gap:.6rem"><li class="step" style="--i:0;padding:.8rem 1rem"><span class="step__n" style="width:34px;height:34px;font-size:.8rem">1</span><div><h4>O objetivo da pessoa</h4></div></li><li class="step" style="--i:1;padding:.8rem 1rem"><span class="step__n" style="width:34px;height:34px;font-size:.8rem">2</span><div><h4>Seu histórico de treino</h4></div></li><li class="step" style="--i:2;padding:.8rem 1rem"><span class="step__n" style="width:34px;height:34px;font-size:.8rem">3</span><div><h4>Fases como gravidez, pós-parto e menopausa</h4></div></li></ul>' +
        '<p style="margin-top:.9rem">Progressão de carga e volume com o mesmo rigor para todos.</p>', "card--olive") +
      "</div>" +
      '<div class="viz viz--2"><div class="rv"><div class="eyebrow" style="margin-bottom:.7rem">Mito ou fato? Toque no cartão</div>' +
      '<button class="flip" id="flip1" type="button" aria-pressed="false"><span class="flip__in"><span class="flip__f"><span class="badge badge--bad" style="align-self:flex-start">Mito a evitar</span><q>Mulher só deve fazer muitas repetições com pouca carga para não ficar musculosa.</q><span class="flip__hint">Toque para ver o que a ciência mostra ↻</span></span>' +
      '<span class="flip__b"><span class="badge badge--ok" style="align-self:flex-start">O que mostra a revisão</span><p>Em percentual, o ganho muscular é parecido entre os sexos (revisão com 29 estudos).</p><p>A prescrição segue o objetivo, o histórico e a fase de vida, com progressão de carga e volume com o mesmo rigor para todos.</p><span class="flip__hint">Toque para voltar ↻</span></span></span></button></div>' +
      '<div class="rv">' + callout("<b>Lembre-se:</b> as diferenças são de média da população. Na prescrição individual, quem manda é o objetivo e o histórico de cada pessoa.") + "</div></div>";
  };
  var repsHTML = function (done, ghost, sm) {
    var h = ""; for (var i = 0; i < done; i++) h += "<i></i>"; for (var j = 0; j < ghost; j++) h += '<i class="ghost"></i>';
    return '<div class="reps' + (sm ? " reps--sm" : "") + '" aria-hidden="true">' + h + "</div>";
  };
  VIZ[2] = function () {
    return '<div class="viz"><div class="card rv"><div class="ph"><h3>Simulador de RIR</h3><span class="badge badge--gold">Arraste o controle</span></div>' +
      '<div class="rir"><div class="rir__read"><b id="rirN">2</b><span id="rirL">Exigente</span></div>' +
      '<div><div id="rirReps"></div><p class="reps__lbl" id="rirTxt" aria-live="polite"></p></div>' +
      '<div><input class="rir__slider" id="rirS" type="range" min="0" max="4" step="1" value="2" aria-label="RIR, repetições em reserva, de 0 a 4" /><div class="rir__ticks" aria-hidden="true"><span>RIR 0</span><span>RIR 1</span><span>RIR 2</span><span>RIR 3</span><span>RIR 4</span></div><div class="rir__ends"><span>← mais perto da falha</span><span>mais longe da falha →</span></div></div>' +
      '<div class="lvls"><div class="lvl" data-r="3,4"><b>Iniciante</b><p>RIR 3–4 enquanto aprende a técnica.</p></div><div class="lvl" data-r="1,2,3"><b>Intermediário</b><p>Alternar RIR 1–3 nas séries de trabalho.</p></div><div class="lvl" data-r=""><b>Livres complexos</b><p>Técnica primeiro; parar se ela se degradar.</p></div></div>' +
      '<p class="cap" style="margin-top:0">Anotação da palestra: “ajustar a carga diária pelo RIR” · Robinson et al., Sports Medicine 2024. A série de blocos é só uma ilustração.</p></div></div></div>' +
      '<div class="viz viz--2">' +
      card('<div class="ph"><h3>“3×12” não diz a intensidade</h3></div><div class="meter"><div class="meter__t"><b>Aluno A · 3×12</b><span class="muted">a 1 repetição da falha</span></div>' + repsHTML(12, 1, true) + '</div><div class="meter"><div class="meter__t"><b>Aluno B · 3×12</b><span class="muted">a 5 repetições da falha</span></div>' + repsHTML(12, 5, true) + '</div><p class="cap">Ilustração da frase do material: a mesma carga pode estar a 1 ou a 5 repetições da falha.</p>') +
      '<div class="rv">' + callout("<b>“3×12” não diz a intensidade sozinho:</b> a mesma carga pode estar a 1 ou a 5 repetições da falha. Sempre registre também o RIR ou o esforço.") + "</div></div>" +
      '<div class="viz"><div class="card rv draw"><div class="ph"><h3>Cada objetivo pede uma combinação</h3><span class="badge">Objetivo × Carga × Repetições</span></div>' +
      '<table class="tbl"><thead><tr><th>Objetivo</th><th>Carga</th><th>Repetições</th><th>Ponto-chave</th></tr></thead><tbody>' +
      [["Força", "Mais alta", "Menos", "≥80% de 1RM favorece força máxima"], ["Resistência", "Mais baixa", "Mais", "Maior tolerância ao volume"], ["Hipertrofia", "Faixas variadas", "Faixas variadas", "Volume adequado e esforço próximo da falha"]].map(function (r, i) {
        return '<tr class="rr" style="--i:' + i + '"><td data-l="Objetivo">' + r[0] + '</td><td data-l="Carga">' + r[1] + '</td><td data-l="Repetições">' + r[2] + '</td><td data-l="Ponto-chave">' + r[3] + "</td></tr>";
      }).join("") + "</tbody></table></div></div>";
  };
  VIZ[3] = function () {
    return '<div class="viz"><div class="card rv"><div class="ph"><h3>Séries efetivas por músculo por semana</h3><span class="badge badge--gold">Faixas didáticas</span></div>' +
      rangeChart({ max: 20, ticks: [0, 5, 10, 15, 20], unit: "séries/semana", mark: { at: 10, label: "ACSM 2026: ≥10 séries/semana" },
        rows: [{ nome: "Iniciante", lo: 4, hi: 8, txt: rng(4, 8) + " séries" }, { nome: "Intermediário", lo: 8, hi: 14, txt: rng(8, 14) + " séries" }, { nome: "Avançado", lo: 10, hi: 20, open: true, txt: "Individualizar · frequentemente &gt;10" }] }) +
      '<p class="cap">Linha branca: o ACSM 2026 associa ≥10 séries por semana a mais hipertrofia média. Faixas didáticas e conservadoras para iniciar a discussão, não metas fixas.</p></div></div>' +
      '<div class="viz">' + callout("<b>Atenção:</b> estas faixas servem para começar a conversa com o aluno. Quem define o volume final é a individualização (objetivo, histórico, recuperação).", "callout--olive") + "</div>";
  };
  VIZ[4] = function () {
    return '<div class="viz"><div class="card rv"><div class="ph"><h3>Sessões de treino por semana</h3><span class="badge badge--gold">Faixas da palestra</span></div>' +
      rangeChart({ max: 8, ticks: [0, 2, 4, 6, 8], unit: "vezes/semana", mark: { at: 2, label: "OMS: pelo menos 2 dias/semana" },
        rows: [{ nome: "Iniciante", lo: 2, hi: 4, olive: true, txt: '<span data-count="2">0</span> a <span data-count="4">0</span> vezes' }, { nome: "Intermediário", lo: 3, hi: 5, olive: true, txt: '<span data-count="3">0</span> a <span data-count="5">0</span> vezes' }, { nome: "Avançado", lo: 4, hi: 7, olive: true, txt: '<span data-count="4">0</span> a <span data-count="7">0</span> vezes' }] }) +
      '<p class="cap">Linha branca: a OMS recomenda fortalecimento em pelo menos 2 dias por semana (saúde pública).</p></div></div>' +
      '<div class="viz">' + callout("<b>Dor muscular tardia não indica crescimento.</b> Acompanhe desempenho, sono e fadiga.") + "</div>";
  };
  VIZ[5] = function () {
    var s = [["Perguntar sobre sintomas", "com privacidade e consentimento"], ["Manter o plano-base", "e ajustar carga ou sessão conforme os sintomas"], ["Registrar 2–3 ciclos", "quando fizer sentido, sem impor"], ["Encaminhar ao médico", "diante de sintomas intensos"]];
    return '<div class="viz"><div class="card rv draw"><div class="ph"><h3>Fluxo de atendimento</h3><span class="badge badge--gold">4 passos</span></div><div class="steps steps--line steps--row" style="--cols:4">' +
      s.map(function (x, i) { return '<div class="step" style="--i:' + i + '"><span class="step__n">' + (i + 1) + "</span><div><h4>" + x[0] + "</h4><p>" + x[1] + "</p></div></div>"; }).join("") + "</div></div></div>" +
      '<div class="viz">' + callout("<b>A pergunta certa:</b> como esta aluna se sente e rende ao longo do próprio ciclo? Não existe receita universal.") + "</div>";
  };
  VIZ[6] = function () {
    var s = [["Etapa 1", "Aquecimento específico"], ["Etapa 2 · Prioridade", "Agachamento"], ["Etapa 3", "Exercícios que fadigam quadríceps e glúteos"]];
    return '<div class="viz"><div class="card rv draw"><div class="ph"><h3>Ordem do treino</h3><span class="badge badge--gold">3 etapas</span></div><div class="steps steps--line steps--row" style="--cols:3">' +
      s.map(function (x, i) { return '<div class="step' + (i === 1 ? " step--prio" : "") + '" style="--i:' + i + '"><span class="step__n">' + (i + 1) + "</span><div><p style=\"font:800 .66rem var(--display);letter-spacing:.14em;text-transform:uppercase;color:var(--gold)\">" + x[0] + "</p><h4 style=\"margin-top:.2rem\">" + x[1] + "</h4></div></div>"; }).join("") + "</div>" +
      '<div class="energy" aria-hidden="true"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i></div><p class="cap">Ilustração: o que vem no início recebe mais atenção, energia e força.</p></div></div>' +
      '<div class="viz viz--2"><div class="rv">' + callout("<b>O que vem no início</b> recebe mais atenção, energia e força. Coloque ali o exercício ligado ao objetivo principal da aluna.") + '</div><div class="rv">' + callout("Multiarticulares primeiro é uma convenção útil para força e aprendizado, <b>não uma lei universal</b>.", "callout--olive") + "</div></div>";
  };
  VIZ[7] = function () {
    var it = [["target", "Objetivo e histórico", "Meta, prazo realista e experiências anteriores"], ["pulse", "Saúde", "Condições clínicas, lesões, cirurgias e liberação"], ["clock", "Rotina", "Disponibilidade, sono, trabalho, estresse e preferências"], ["move", "Movimento", "Técnica, mobilidade útil e tolerância ao esforço"], ["clip", "Acompanhamento", "Presença, adesão, cargas e bem-estar"], ["user", "Expectativa corporal", "Relação com o peso e linguagem preferida"]];
    var g = [[8, "3×8", "Carga A"], [10, "3×10", "Carga A"], [12, "3×12", "Carga A"], [8, "3×8", "Carga A <span class=\"dp__up\">+ ↑</span>"]];
    return '<div class="viz"><div class="card rv"><div class="ph"><h3>Checklist de primeira avaliação</h3><span class="badge badge--gold"><span><span id="ckN">0</span>/6 conferidos</span></span></div>' +
      '<div class="ck">' + it.map(function (x, i) { return '<button type="button" class="ckc rv" style="--d:' + i + '" aria-pressed="false"><span class="ckc__t">' + I.check + '</span><span class="ckc__i">' + I[x[0]] + "</span><b>" + x[1] + "</b><span>" + x[2] + "</span></button>"; }).join("") + '</div><p class="cap">Toque nos itens para simular uma primeira avaliação. Individualizar é adaptar uma estrutura científica à pessoa real.</p></div></div>' +
      '<div class="viz"><div class="card rv draw" id="dpCard"><div class="ph"><h3>Dupla progressão no leg press</h3><button class="btn btn--ghost btn--sm" id="dpReplay" type="button">↻ Repetir animação</button></div>' +
      '<div class="dp">' + g.map(function (x, gi) {
        return '<div class="dp__g"><div class="dp__bars">' + [0, 1, 2].map(function (b) { return '<i style="height:' + (x[0] / 12 * 100) + "%;--g:" + gi + ";--b:" + b + '"><b>' + x[0] + "</b></i>"; }).join("") + "</div><strong>" + x[1] + "</strong><small>" + x[2] + "</small></div>";
      }).join("") + '</div><p style="margin-top:1rem;font-size:.92rem;color:#ddd">Faixa de 8–12 repetições a RIR 2. Fechou 12 nas três séries com boa técnica e amplitude? Sobe a carga um pouco e volta para 8.</p>' +
      '<p class="cap">Exemplo ilustrativo · altura das barras = repetições por série · adaptar faixas e incrementos a cada aluno.</p></div></div>';
  };
  VIZ[8] = function () {
    var rows = [["Quadril", "Fêmur", "Tornozelo", "Pé"], ["Controle motor", "Velocidade", "Fadiga"], ["Anatomia"]], k = 0;
    var st = ["Observar agachamento, apoio unilateral e step-down", "Checar mobilidade do tornozelo e posição dos pés", "Intervir com unilaterais, glúteos e ajuste de técnica"];
    return '<div class="viz viz--2"><div class="card rv draw"><div class="ph"><h3>O padrão depende de…</h3></div><div class="hub"><div class="hub__c">Valgo dinâmico</div>' +
      rows.map(function (r) { return '<div class="hub__row">' + r.map(function (c) { return '<span class="chip" style="--i:' + k++ + '">' + c + "</span>"; }).join("") + "</div>"; }).join("") + "</div></div>" +
      '<div class="card rv card--olive draw"><div class="ph"><h3>Avaliar antes de corrigir</h3></div><div class="steps steps--line">' +
      st.map(function (t, i) { return '<div class="step" style="--i:' + i + '"><span class="step__n">' + (i + 1) + "</span><div><p style=\"color:#eee;font-size:.92rem\">" + t + "</p></div></div>"; }).join("") + "</div></div></div>" +
      '<div class="viz viz--2"><div class="rv"><p class="quote">“Abdução = glúteo médio, extensão = glúteo máximo” serve para começar, mas simplifica a biomecânica.</p></div><div class="rv">' + callout("<b>Valgo não é diagnóstico automático de lesão</b> nem prova isolada de fraqueza muscular.") + "</div></div>";
  };
  VIZ[9] = function () {
    var body = '<svg viewBox="0 0 220 150" aria-hidden="true"><g fill="none" stroke="#DFA624" stroke-width="3" stroke-linecap="round"><circle cx="110" cy="26" r="14"/><path d="M110 42v50M110 54l-26 24M110 54l26 24M110 92l-18 44M110 92l18 44"/></g><g class="brk" stroke="#8BA480" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="4 5"><path d="M56 40v100M164 40v100"/><path d="M56 140h108"/></g><rect class="scan" x="40" y="22" width="140" height="3" rx="2" fill="#8BA480" opacity=".8"/></svg>';
    var heart = '<svg viewBox="0 0 220 150" aria-hidden="true"><path class="heart" fill="#DFA624" d="M110 128S54 92 54 56c0-17 13-29 29-29 11 0 21 6 27 15 6-9 16-15 27-15 16 0 29 12 29 29 0 36-56 72-56 72z" opacity=".92"/></svg>';
    return '<div class="viz"><div class="rv"><p class="quote">Imagem corporal é a representação mental que o cérebro faz do próprio corpo <span class="muted" style="font-weight:400">(Kakeshita, 2005)</span>.</p></div></div>' +
      '<div class="dim2 rv"><div class="dim">' + heart + "<h4>Atitudinal</h4><p>Gosto ou não gosto: sentimentos, crenças e satisfação com o corpo.</p></div><div class=\"dim\">" + body + "<h4>Perceptual</h4><p>Como a pessoa percebe o tamanho e a proporção do corpo no espaço.</p></div></div>" +
      '<div class="viz viz--2"><div class="card rv draw lines"><div class="ph"><h3>Força e saúde × autoimagem</h3><span class="badge">Ilustração conceitual</span></div>' +
      '<svg viewBox="0 0 320 150" role="img" aria-label="Linha de força e saúde sobe antes da linha de autoimagem"><g stroke="rgba(255,255,255,.08)"><path d="M10 140H310M10 100H310M10 60H310M10 20H310"/></g><path class="l" d="M10 130 C70 126 100 60 150 38 S260 22 310 20" stroke="#DFA624"/><path class="l l2" d="M10 134 C100 132 150 128 200 100 S270 50 310 40" stroke="#8BA480"/></svg>' +
      '<div class="legend"><span><i style="background:#DFA624"></i>Força e saúde</span><span><i style="background:#8BA480"></i>Autoimagem</span></div><p class="cap">A força e a saúde podem melhorar antes da autoimagem. Esquema conceitual, sem dados.</p></div>' +
      '<div class="rv">' + callout("<b>Atenção:</b> a força e a saúde podem melhorar antes da autoimagem. Comparações nas redes sociais se associam a mais insatisfação <span class=\"muted\">(associação, não causa direta)</span>.") + "</div></div>";
  };
  VIZ[10] = function () {
    var p = [["Vamos acabar com essa barriga.", "Vamos montar um plano que caiba na sua rotina."], ["Você precisa ter o corpo certo.", "Que mudança você quer sentir no seu dia a dia?"], ["Sem dor não há resultado.", "Vamos acompanhar sua força e sua disposição."]];
    return '<div class="viz"><div class="ph rv" style="margin-bottom:0"><div class="eyebrow">Toque na alternativa para revelar</div><button class="btn btn--ghost btn--sm" id="revAll" type="button">Revelar todas</button></div><div class="pairs">' +
      p.map(function (x) { return '<div class="pair rv"><div class="ph-card ph-card--bad">' + I.x + "<div><small>Evitar</small>“" + x[0] + '”</div></div><button type="button" class="ph-card ph-card--good is-locked">' + I.ok + "<div><small>Preferir</small>“" + x[1] + '”</div><span class="ph-card__lock">Toque para ver a alternativa</span></button></div>'; }).join("") + "</div></div>" +
      '<div class="viz">' + callout("<b>Fotos e medidas só com motivo e consentimento.</b> Sofrimento importante com a imagem: encaminhar à Psicologia.", "callout--olive") + "</div>";
  };

  /* ---------- hooks pós-render ---------- */
  var INIT = {};
  INIT[1] = function (r) {
    var f = $("#flip1", r); if (!f) return;
    f.addEventListener("click", function () { var on = f.classList.toggle("is-flipped"); f.setAttribute("aria-pressed", String(on)); });
  };
  INIT[2] = function (r) {
    var names = ["Falha concêntrica", "Muito exigente", "Exigente", "Moderado", "Margem confortável"];
    var s = $("#rirS", r); if (!s) return;
    function upd() {
      var v = +s.value; $("#rirN", r).textContent = v; $("#rirL", r).textContent = names[v];
      $("#rirReps", r).innerHTML = repsHTML(8, v);
      $("#rirTxt", r).innerHTML = v === 0 ? "<b>Nenhuma repetição sobra:</b> é a falha concêntrica." : "Ainda sobram <b>" + v + "</b> repetição" + (v > 1 ? "ões" : "") + " (blocos tracejados).";
      $$(".lvl", r).forEach(function (l) { l.classList.toggle("is-hot", (l.dataset.r || "").split(",").indexOf(String(v)) > -1); });
      var pct = (v / 4) * 100; s.style.setProperty("--p", pct + "%");
    }
    s.addEventListener("input", upd); upd();
  };
  INIT[7] = function (r) {
    var n = 0, out = $("#ckN", r);
    $$(".ckc", r).forEach(function (b) {
      b.addEventListener("click", function () { var on = b.classList.toggle("is-on"); b.setAttribute("aria-pressed", String(on)); n += on ? 1 : -1; out.textContent = n; if (n === 6) BF.toast("Anamnese completa: os 6 eixos conferidos!", "ok"); });
    });
    var rp = $("#dpReplay", r), dc = $("#dpCard", r);
    rp.addEventListener("click", function () { dc.classList.remove("is-in"); void dc.offsetWidth; setTimeout(function () { dc.classList.add("is-in"); }, 60); });
  };
  INIT[10] = function (r) {
    function unlock(b) { b.classList.remove("is-locked"); }
    $$(".ph-card--good", r).forEach(function (b) { b.addEventListener("click", function () { unlock(b); }); });
    $("#revAll", r).addEventListener("click", function () { $$(".ph-card--good", r).forEach(unlock); });
  };

  /* ---------- vídeo ---------- */
  function videoSlot(m) {
    if (!m.videoSrc) return "";
    var nn = pad(m.n);
    return '<div class="vslot rv" hidden data-src="' + esc(m.videoSrc) + '"><span class="badge badge--gold vslot__tag">' + I.play + " Vídeo · Módulo " + nn + '</span><video controls preload="none" playsinline poster="/aprender/img/poster-' + nn + '.jpg" aria-label="Vídeo do módulo ' + m.n + '"></video></div>';
  }
  function probeVideos(root) {
    $$(".vslot[data-src]", root).forEach(function (slot) {
      if (slot.dataset.probed) return; slot.dataset.probed = "1";
      var src = slot.dataset.src, v = $("video", slot);
      var hide = function () { slot.hidden = true; };
      v.addEventListener("error", hide, true);
      fetch(src, { method: "HEAD" }).then(function (r) {
        var ct = r.headers.get("content-type") || "";
        if (!r.ok || /text\/html/i.test(ct)) { hide(); return; }
        v.src = src; slot.hidden = false;
      }).catch(hide);
    });
  }

  /* ---------- lições ---------- */
  function lessonModule(m) {
    var i = m.n - 1;
    return '<section class="lesson" id="L-m' + m.n + '" data-key="m' + m.n + '" aria-labelledby="t-m' + m.n + '">' +
      '<header class="lh"><span class="lh__n" aria-hidden="true">' + pad(m.n) + '</span><div class="eyebrow">Módulo ' + pad(m.n) + " · " + esc(m.eixo) + '</div><h2 class="h2" id="t-m' + m.n + '">' + esc(m.titulo) + "</h2></header>" +
      videoSlot(m) + VIZ[m.n]() +
      '<div class="card key rv"><h3><span class="badge badge--gold">Pontos-chave</span> Para levar deste módulo</h3><ul>' + m.pontos.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>" +
      (m.fontes ? '<p class="src">Fontes: ' + esc(m.fontes) + "</p>" : "") +
      '<div class="lnav"><button class="btn btn--ghost" data-prev type="button">← Anterior</button><button class="btn btn--gold" data-next type="button"></button></div></section>';
  }
  function lessonInicio() {
    return '<section class="lesson" id="L-inicio" data-key="inicio" aria-labelledby="t-inicio">' +
      '<div class="hero-l rv"><div class="eyebrow">' + esc(C.evento) + '</div><h1 class="h1" id="t-inicio" style="margin:.8rem 0">Da ciência à <span class="gold">prescrição individualizada</span></h1><p class="lead">' + esc(C.subtitulo) + '.</p><p class="small muted" style="margin-top:.8rem">' + esc(C.autor) + '</p><div style="margin-top:1.3rem"><button class="btn btn--gold" data-start type="button">Começar o curso →</button></div></div>' +
      '<div class="sec-t"><span class="eyebrow">Por que estamos aqui</span></div><h2 class="h2 rv" style="margin-bottom:1rem;max-width:22ch">Conhecimento só tem valor quando é <span class="gold">compartilhado</span></h2>' +
      '<div class="three">' + [["01", "Conferência", "8 páginas de anotações"], ["02", "Time BFit", "Linguagem e método comuns"], ["03", "Alunos", "Treino melhor e mais seguro"]].map(function (x, i) { return '<div class="card rv" style="--d:' + i + '"><b>' + x[0] + "</b><h3>" + x[1] + "</h3><p>" + x[2] + "</p></div>"; }).join("") + "</div>" +
      '<div class="sec-t"><span class="eyebrow">Panorama do conteúdo</span></div>' +
      '<div class="kpis">' + [[8, "páginas de anotações na conferência"], [10, "módulos técnicos aprofundados"], [12, "referências científicas de apoio"], [30, "dias de protocolo de aplicação"]].map(function (x, i) { return '<div class="card kpi rv" style="--d:' + i + '"><b data-count="' + x[0] + '">0</b><span>' + x[1] + "</span></div>"; }).join("") + "</div>" +
      '<div class="viz"><div class="card rv draw"><div class="ph"><h3>Módulos por eixo temático</h3></div>' + [["Variáveis do treino", 4], ["Treino feminino e prescrição", 3], ["Imagem corporal", 2], ["Biomecânica", 1]].map(function (x, i) { return '<div class="hbar"><span>' + x[0] + '</span><div class="hbar__t"><i style="--v:' + x[1] + ";--i:" + i + '"></i></div><b>' + x[1] + "</b></div>"; }).join("") + '<p class="cap">Fonte: ' + esc(C.fonteBase) + ".</p></div></div>" +
      '<div class="sec-t"><span class="eyebrow">Os 10 módulos</span></div><div class="modgrid">' + C.modulos.map(function (m) { return '<button type="button" class="mg rv" data-go="m' + m.n + '"><span class="mg__n">' + pad(m.n) + '</span><span><b>' + esc(m.nome) + "</b><small>" + esc(m.eixo) + "</small></span></button>"; }).join("") + "</div></section>";
  }
  function lessonAplic() {
    return '<section class="lesson" id="L-aplicacao" data-key="aplicacao" aria-labelledby="t-aplicacao">' +
      '<header class="lh"><div class="eyebrow">Aplicação na BFit</div><h2 class="h2" id="t-aplicacao">Protocolo de <span class="gold">30 dias</span></h2></header>' +
      '<div class="card rv draw"><div class="ph"><h3>Linha do tempo · 4 semanas</h3></div><div class="tl__rail" aria-hidden="true"><i></i></div><div class="tl">' +
      C.protocolo30.map(function (w, i) { return '<div class="card tl__w" style="--i:' + i + '"><span class="tl__d">' + w.sem + "</span><small>Semana " + w.sem + "</small><h4>" + w.nome + "</h4><p>" + w.txt + "</p></div>"; }).join("") + "</div></div>" +
      '<div class="sec-t"><h3>Dashboard de acompanhamento</h3><span class="badge badge--warn">A preencher com dados da BFit</span></div><p class="muted rv" style="margin-bottom:1rem">Como vamos medir a evolução. Os campos abaixo são os indicadores do material; ainda não há valores.</p>' +
      '<div class="ind">' + C.indicadores.map(function (x, i) { return '<div class="ind__c shimmer rv" style="--d:' + i + '"><h4>' + esc(x.nome) + '</h4><div class="ind__v">' + esc(x.valor) + "</div>" + (x.meta ? "<small>" + esc(x.meta) + "</small>" : "") + (x.un ? "<small>" + esc(x.un) + "</small>" : "") + '<span class="ind__tag">a preencher com dados da BFit</span></div>'; }).join("") + "</div>" +
      '<p class="cap">Preencher com os dados da BFit (Tecnofit e fichas) no início e no fim dos 30 dias.</p>' +
      '<div class="sec-t"><h3>Perguntas para debater em equipe</h3></div><div class="acc" id="acc">' +
      C.debate.map(function (q, i) { return '<div class="acc__i rv" style="--d:' + (i % 4) + '"><button class="acc__b" type="button" aria-expanded="false" aria-controls="ap' + i + '"><em>' + (i + 1) + "</em><span>" + esc(q) + '</span></button><div class="acc__p" id="ap' + i + '" role="region"><div><p>Discutam em equipe, com exemplos reais do dia a dia da BFit. Voltem ao módulo relacionado e aos pontos-chave para embasar a conversa.</p></div></div></div>'; }).join("") + "</div>" +
      '<div class="lnav"><button class="btn btn--ghost" data-prev type="button">← Anterior</button><button class="btn btn--gold" data-next type="button"></button></div></section>';
  }
  function lessonRefs() {
    return '<section class="lesson" id="L-referencias" data-key="referencias" aria-labelledby="t-referencias">' +
      '<header class="lh"><div class="eyebrow">Para estudar mais</div><h2 class="h2" id="t-referencias">Referências para estudo</h2></header>' +
      '<ol class="refs">' + C.referencias.map(function (r, i) { return '<li class="rv" style="--d:' + (i % 6) + '">' + esc(r) + "</li>"; }).join("") + "</ol>" +
      '<div class="callout rv" style="margin-top:1.2rem">' + I.info + '<p class="disc">' + esc(C.disclaimer) + "</p></div>" +
      '<div class="closer rv" style="margin-top:1.6rem"><div class="eyebrow" style="justify-content:center">Do caderno para o salão</div><h2 style="margin:.8rem 0">Na BFit a gente <span class="gold">não para de aprender</span></h2><p>O resultado de cada aluno é o nosso compromisso.</p><p class="small" style="margin-top:.8rem;color:var(--dim)">Izaque Braga · CREF 14400-G/ES · @izaque.braga</p><div style="margin-top:1.4rem"><a class="btn btn--gold" id="refQuiz" href="quiz.html">Ir para a avaliação →</a><p class="lock-note" id="refLock"></p></div></div>' +
      '<div class="lnav"><button class="btn btn--ghost" data-prev type="button">← Anterior</button><a class="btn btn--ghost" href="quiz.html">Avaliação</a></div></section>';
  }

  /* ---------- UI de estado ---------- */
  var isDone = function (n) { return state.done.indexOf(n) > -1; };
  var approved = function () { return state.attempts.some(function (a) { return a.aprovado; }); };
  function titleOf(k) {
    if (k === "inicio") return "Início · Panorama";
    if (k === "aplicacao") return "Aplicação na BFit";
    if (k === "referencias") return "Referências";
    var m = C.modulos[+k.slice(1) - 1]; return "Módulo " + pad(m.n) + " · " + m.nome;
  }
  function renderSide() {
    var me = state.session.user, pct = Math.round(state.done.length / TOTAL * 100);
    $("#sideMe").innerHTML = BF.ring(54, 5, pct, pct + "%", "") + "<div><b>" + esc(me.nome.split(" ")[0]) + "</b><small>" + state.done.length + " de " + TOTAL + " módulos</small></div>";
    BF.setRing($("#sideMe"), pct);
    var h = '<div class="mlist__h">Boas-vindas</div>' + item("inicio", "·", "Início e panorama") + '<div class="mlist__h">Módulos</div>' +
      C.modulos.map(function (m) { return item("m" + m.n, pad(m.n), m.nome, isDone(m.n)); }).join("") +
      '<div class="mlist__h">Para fechar</div>' + item("aplicacao", "30", "Aplicação na BFit") + item("referencias", "↗", "Referências");
    $("#mlist").innerHTML = h;
    $$(".mi", $("#mlist")).forEach(function (b) { b.addEventListener("click", function () { go(b.dataset.k); closeSide(); }); });
    var all = state.done.length >= TOTAL || me.role === "admin";
    var q = $("#sideQuiz"); q.classList.toggle("is-disabled", !all); q.setAttribute("aria-disabled", String(!all)); q.tabIndex = all ? 0 : -1;
    $("#sideLock").textContent = all ? "" : "Conclua os 10 módulos para liberar a avaliação.";
    var rq = $("#refQuiz"); if (rq) { rq.classList.toggle("is-disabled", !all); $("#refLock").textContent = all ? "" : "Conclua os 10 módulos para liberar a avaliação."; }
    $("#crumbBar").style.width = pct + "%";
    markCurrent();
  }
  function item(k, n, t, done) { return '<button type="button" class="mi' + (done ? " is-done" : "") + '" data-k="' + k + '"><span class="mi__n">' + (done ? I.check : n) + '</span><span class="mi__t">' + esc(t) + "</span></button>"; }
  function markCurrent() { $$(".mi", $("#mlist")).forEach(function (b) { var c = b.dataset.k === state.cur; b.classList.toggle("is-cur", c); if (c) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); }); }

  function renderDash() {
    var pct = Math.round(state.done.length / TOTAL * 100), used = state.attempts.length;
    var best = used ? Math.max.apply(null, state.attempts.map(function (a) { return a.acertos; })) : null;
    var ok = approved(), all = state.done.length >= TOTAL || state.session.user.role === "admin";
    var cta = ok ? '<a class="btn btn--ok btn--sm" href="certificado.html">Ver certificado</a>' : '<a class="btn btn--gold btn--sm' + (all ? "" : " is-disabled") + '" href="quiz.html" ' + (all ? "" : 'aria-disabled="true" tabindex="-1"') + ">Fazer avaliação</a>";
    $("#dash").innerHTML = '<div class="card dash__main rv is-in">' + BF.ring(112, 10, pct, '<span id="dashPct">0</span>%', "concluído") +
      '<div style="min-width:0"><div class="eyebrow">Painel do aluno</div><h1 style="margin-top:.4rem">Olá, ' + esc(state.session.user.nome.split(" ")[0]) + "!</h1><p>" +
      (state.done.length >= TOTAL ? "Curso concluído. " + (ok ? "Você foi aprovado(a)." : "A avaliação está liberada.") : "Continue o curso: faltam " + (TOTAL - state.done.length) + " módulo" + (TOTAL - state.done.length > 1 ? "s" : "") + " para liberar a avaliação.") +
      '</p><div class="pips" aria-hidden="true">' + C.modulos.map(function (m) { return '<i class="' + (isDone(m.n) ? "on" : "") + '"></i>'; }).join("") + '</div><div style="margin-top:.9rem">' + cta + "</div></div></div>" +
      '<div class="dash__stats">' +
      '<div class="card stat rv is-in"><b data-count="' + state.done.length + '">0</b><small>de ' + TOTAL + " módulos concluídos</small></div>" +
      '<div class="card stat rv is-in"><b>' + used + "/" + MAX + "</b><small>tentativas usadas" + (ok ? "" : " · restam " + Math.max(0, MAX - used)) + "</small></div>" +
      '<div class="card stat rv is-in"><b>' + (best == null ? "—" : best + "/10") + "</b><small>" + (ok ? "melhor nota · aprovado ✓" : "melhor nota · mínimo " + MIN) + "</small></div></div>";
    BF.setRing($("#dash"), pct);
    BF.countUp($("#dashPct"), pct, { dur: 1200 });
    BF.armCounters($("#dash"));
  }
  function nextLabel(k) {
    if (k.charAt(0) === "m") { var n = +k.slice(1); return isDone(n) ? (n === TOTAL ? "Próximo: Aplicação na BFit →" : "Próximo módulo →") : (n === TOTAL ? "Marcar como concluído e continuar →" : "Marcar como concluído e continuar →"); }
    if (k === "aplicacao") return "Próximo: Referências →";
    return "";
  }
  function updNav() {
    $$(".lesson [data-next]").forEach(function (b) { var k = b.closest(".lesson").dataset.key; b.textContent = nextLabel(k); });
  }

  /* ---------- navegação ---------- */
  function go(k, opt) {
    if (KEYS.indexOf(k) < 0) k = "inicio";
    opt = opt || {};
    var prev = state.cur; state.cur = k;
    $$(".lesson").forEach(function (l) { l.classList.remove("is-active"); });
    var el = $("#L-" + k); el.classList.add("is-active");
    $("#crumbT").innerHTML = "<b>" + esc(titleOf(k)) + "</b>";
    if (opt.hash !== false && location.hash !== "#" + k) history.replaceState(null, "", "#" + k);
    markCurrent();
    /* reinicia as animações a cada visita */
    $$(".is-in,.is-armed,.is-counted", el).forEach(function (n) { n.classList.remove("is-in", "is-armed", "is-counted"); });
    $$("[data-count]", el).forEach(function (n) { n.textContent = "0"; });
    el.classList.remove("is-in");
    if (prev && prev !== k) {
      var top = $("#lessons").getBoundingClientRect().top + window.scrollY - 110;
      if (BF._lenis) BF._lenis.scrollTo(Math.max(0, top), { immediate: true }); else window.scrollTo(0, Math.max(0, top));
      if (!BF.reduced && window.gsap) gsap.fromTo(el, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: .75, ease: "power3.out", clearProps: "all" });
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { BF.arm(el); probeVideos(el); }); });
  }
  function step(k, d) { var i = KEYS.indexOf(k) + d; return KEYS[Math.max(0, Math.min(KEYS.length - 1, i))]; }
  function complete(n) {
    var btn = $('#L-m' + n + " [data-next]"); if (btn) btn.disabled = true;
    return api.setModuleDone(n).then(function (r) {
      var was = state.done.length; state.done = r.modulosConcluidos;
      renderSide(); renderDash(); updNav();
      if (was < TOTAL && state.done.length >= TOTAL) BF.toast("Curso concluído! A avaliação está liberada.", "ok");
      else BF.toast("Módulo " + n + " concluído ✓", "ok");
    }).catch(function (e) { BF.toast(e.message, "err"); throw e; }).then(function (x) { if (btn) btn.disabled = false; return x; }, function (e) { if (btn) btn.disabled = false; throw e; });
  }
  function bind() {
    $("#lessons").addEventListener("click", function (e) {
      var t = e.target.closest("button,a"); if (!t) return;
      var l = t.closest(".lesson"); var k = l && l.dataset.key;
      if (t.hasAttribute("data-prev")) go(step(k, -1));
      else if (t.hasAttribute("data-next")) {
        var nxt = step(k, 1);
        if (k.charAt(0) === "m" && !isDone(+k.slice(1))) complete(+k.slice(1)).then(function () { go(nxt); }).catch(function () {});
        else go(nxt);
      } else if (t.hasAttribute("data-start")) go("m1");
      else if (t.dataset.go) go(t.dataset.go);
      else if (t.classList.contains("acc__b")) { var it = t.parentNode, open = it.classList.toggle("is-open"); t.setAttribute("aria-expanded", String(open)); }
    });
    $("#sideQuiz").addEventListener("click", function (e) { if ($("#sideQuiz").classList.contains("is-disabled")) e.preventDefault(); });
    $("#dash").addEventListener("click", function (e) { var a = e.target.closest("a.is-disabled"); if (a) e.preventDefault(); });
    $("#lessons").addEventListener("click", function (e) { var a = e.target.closest("a.is-disabled"); if (a) e.preventDefault(); });
    window.addEventListener("hashchange", function () { var k = location.hash.slice(1); if (k !== state.cur) go(k, { hash: false }); });
    var mb = $("#menuBtn"); mb.addEventListener("click", function () { var o = !$("#side").classList.contains("is-open"); o ? openSide() : closeSide(); });
    $("#sideBd").addEventListener("click", closeSide);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSide(); });
  }
  function openSide() { $("#side").classList.add("is-open"); $("#sideBd").classList.add("is-open"); $("#menuBtn").setAttribute("aria-expanded", "true"); }
  function closeSide() { $("#side").classList.remove("is-open"); $("#sideBd").classList.remove("is-open"); $("#menuBtn").setAttribute("aria-expanded", "false"); }

  /* ---------- start ---------- */
  BF.boot({ active: "course", require: "auth" }).then(function (s) {
    state.session = s;
    return Promise.all([api.getProgress(), api.getMyAttempts()]);
  }).then(function (r) {
    state.done = r[0].modulosConcluidos; state.attempts = r[1];
    var html = lessonInicio() + C.modulos.map(lessonModule).join("") + lessonAplic() + lessonRefs();
    $("#lessons").innerHTML = html;
    C.modulos.forEach(function (m) { if (INIT[m.n]) INIT[m.n]($("#L-m" + m.n)); });
    bind(); renderSide(); renderDash(); updNav();
    BF.lenis();
    var start = location.hash.slice(1);
    if (KEYS.indexOf(start) < 0) { var first = C.modulos.filter(function (m) { return !isDone(m.n); })[0]; start = !state.done.length ? "inicio" : (first ? "m" + first.n : "aplicacao"); }
    go(start, { hash: true });
    BF.arm($("#dash"));
  }).catch(function (e) { if (e && e.code !== undefined) console.warn(e); });
})();
