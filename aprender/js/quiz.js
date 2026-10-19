(function () {
  "use strict";
  var $ = BF.$, $$ = BF.$$, esc = BF.esc, api = window.BFitAPI;
  var MAX = BF.cfg.MAX_TENTATIVAS || 3, MIN = BF.cfg.NOTA_MINIMA || 7, TOTAL = BF.cfg.TOTAL_MODULOS || 10;
  var app = $("#app");
  var S = { session: null, qs: [], ans: {}, i: 0, attempts: [], done: [], result: null, qsNote: null };
  var L = ["A", "B", "C", "D"];
  var dkey = function () { return "bfit_quiz_draft_" + S.session.user.id; };
  var rkey = function () { return "bfit_quiz_last_" + S.session.user.id; };
  function saveDraft() { try { sessionStorage.setItem(dkey(), JSON.stringify(S.ans)); } catch (e) {} }
  function swap(html, dir) {
    var old = app.firstElementChild;
    var el = BF.el('<div class="qview">' + html + "</div>");
    app.innerHTML = ""; app.appendChild(el);
    if (!BF.reduced && window.gsap) gsap.fromTo(el, { opacity: 0, x: (dir || 0) * 40, y: dir ? 0 : 18 }, { opacity: 1, x: 0, y: 0, duration: .55, ease: "power3.out", clearProps: "all" });
    window.scrollTo(0, 0);
    return el;
  }
  var best = function () { return S.attempts.length ? Math.max.apply(null, S.attempts.map(function (a) { return a.acertos; })) : null; };
  var passed = function () { return S.attempts.some(function (a) { return a.aprovado; }); };
  var left = function () { return Math.max(0, MAX - S.attempts.length); };

  /* ---------- gate ---------- */
  function viewGate() {
    var el = swap('<div class="card qcard"><span class="eyebrow">Avaliação bloqueada</span><h1 class="h2" style="margin:.8rem 0">Conclua o curso para liberar a avaliação</h1><p class="lead">Você concluiu <b style="color:#fff">' + S.done.length + " de " + TOTAL + '</b> módulos. A prova é liberada quando os 10 módulos estiverem marcados como concluídos.</p>' +
      '<div class="pips" style="display:flex;gap:4px;margin:1.2rem 0">' + Array.apply(null, Array(TOTAL)).map(function (_, i) { return '<i style="flex:1;height:6px;border-radius:4px;background:' + (S.done.indexOf(i + 1) > -1 ? "var(--gold)" : "rgba(255,255,255,.1)") + '"></i>'; }).join("") + '</div><a class="btn btn--gold" href="course.html">Voltar ao curso</a></div>');
  }
  /* ---------- intro ---------- */
  function viewIntro() {
    var ok = passed(), out = !ok && left() === 0;
    var att = Array.apply(null, Array(MAX)).map(function (_, i) { var a = S.attempts[i]; return '<i class="' + (a ? (a.aprovado ? "pass" : "used") : "") + '"></i>'; }).join("");
    var hist = S.attempts.length ? '<ul class="hist" aria-label="Tentativas anteriores">' + S.attempts.map(function (a) { return "<li><span><b>Tentativa " + a.tentativa + "</b> · " + BF.fmtDate(a.created_at, true) + '</span><span><b>' + a.acertos + '/10</b> ' + (a.aprovado ? '<span class="badge badge--ok">Aprovado</span>' : '<span class="badge badge--bad">Não aprovado</span>') + "</span></li>"; }).join("") + "</ul>" : "";
    var last = null; try { last = JSON.parse(sessionStorage.getItem(rkey())); } catch (e) {}
    var head, cta;
    if (ok) {
      head = '<span class="eyebrow">Avaliação final</span><h1 class="h2" style="margin:.8rem 0">Você foi <span class="gold">aprovado(a)</span>! 🎉</h1><p class="lead">Melhor nota: <b style="color:#fff">' + best() + '/10</b>. Seu certificado de conclusão interno está disponível.</p>';
      cta = '<a class="btn btn--gold" href="certificado.html">Ver certificado</a><a class="btn btn--ghost" href="course.html">Voltar ao curso</a>';
    } else if (out) {
      head = '<span class="eyebrow">Avaliação final</span><h1 class="h2" style="margin:.8rem 0">Tentativas esgotadas</h1><p class="lead">Você usou as ' + MAX + " tentativas e não atingiu a nota mínima de " + MIN + ' acertos. Fale com o administrador para combinar uma nova oportunidade e revise o curso enquanto isso.</p>';
      cta = '<a class="btn btn--gold" href="course.html">Revisar o curso</a>';
    } else {
      head = '<span class="eyebrow">Avaliação final</span><h1 class="h2" style="margin:.8rem 0">Mostre o que você aprendeu</h1><p class="lead">10 perguntas simples sobre o conteúdo do curso, de múltipla escolha (A, B, C e D). Uma pergunta por tela.</p>';
      cta = '<button class="btn btn--gold" id="go" type="button">' + (S.attempts.length ? "Fazer a tentativa " + (S.attempts.length + 1) : "Começar avaliação") + ' →</button><a class="btn btn--ghost" href="course.html">Revisar o curso</a>';
    }
    var el = swap('<div class="card qcard">' + head +
      '<div class="rules"><div class="rule"><b>10</b><span>perguntas, uma por módulo</span></div><div class="rule"><b>≥ ' + MIN + '</b><span>acertos para ser aprovado(a)</span></div><div class="rule"><b>' + MAX + '</b><span>tentativas por pessoa</span></div></div>' +
      '<div class="att" aria-label="Tentativas"><span class="small muted">Tentativas:</span>' + att + '<span class="small">' + (ok ? "aprovado(a)" : left() + " restante" + (left() === 1 ? "" : "s")) + "</span></div>" + hist +
      (last && !ok ? '<button class="btn btn--ghost btn--sm" id="seeLast" type="button" style="margin-bottom:1rem">Ver o gabarito da última tentativa</button>' : "") +
      '<div class="acts" style="justify-content:flex-start">' + cta + "</div></div>");
    var g = $("#go", el); if (g) g.addEventListener("click", function () { S.i = 0; viewQ(0); });
    var sl = $("#seeLast", el); if (sl) sl.addEventListener("click", function () { S.result = last; viewResult(true); });
  }
  /* ---------- pergunta ---------- */
  function viewQ(dir) {
    var q = S.qs[S.i], n = S.qs.length, sel = S.ans[q.id];
    var dots = S.qs.map(function (x, k) { return '<button type="button" data-k="' + k + '" class="' + (S.ans[x.id] ? "is-ans " : "") + (k === S.i ? "is-cur" : "") + '" aria-label="Ir para a pergunta ' + (k + 1) + '">' + (k + 1) + "</button>"; }).join("");
    var el = swap('<div class="card qcard"><div class="qhead"><span class="eyebrow">Avaliação · tentativa ' + (S.attempts.length + 1) + " de " + MAX + '</span><span class="badge">' + Object.keys(S.ans).length + "/" + n + ' respondidas</span></div><div class="qprog" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + (S.i + 1) + '"><i style="width:' + (S.i / n * 100) + '%"></i></div>' +
      '<div class="qdots">' + dots + '</div><div class="qstage"><div class="q__n">Pergunta ' + (S.i + 1) + " de " + n + '</div><h2 class="q__t" id="qt">' + esc(q.enunciado) + '</h2>' +
      '<div class="opts" role="radiogroup" aria-labelledby="qt">' + L.map(function (l) { var t = q[l.toLowerCase()]; return '<button type="button" role="radio" aria-checked="' + (sel === l) + '" class="opt' + (sel === l ? " is-sel" : "") + '" data-l="' + l + '"><span class="opt__l">' + l + '</span><span class="opt__t">' + esc(t) + "</span></button>"; }).join("") + "</div></div>" +
      '<div class="qnav"><button class="btn btn--ghost" id="prev" type="button"' + (S.i === 0 ? " disabled" : "") + '>← Anterior</button><button class="btn btn--gold" id="next" type="button">' + (S.i === n - 1 ? "Revisar respostas →" : "Próxima →") + '</button></div><p class="qkeys">Atalhos: <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd> escolhem a alternativa · <kbd>Enter</kbd> avança.</p></div>', dir);
    requestAnimationFrame(function () { $(".qprog i", el).style.width = ((S.i + 1) / n * 100) + "%"; });
    $$(".opt", el).forEach(function (b) { b.addEventListener("click", function () { pick(b.dataset.l); }); });
    $$(".qdots button", el).forEach(function (b) { b.addEventListener("click", function () { S.i = +b.dataset.k; viewQ(S.i > 0 ? 1 : -1); }); });
    $("#prev", el).addEventListener("click", function () { if (S.i > 0) { S.i--; viewQ(-1); } });
    $("#next", el).addEventListener("click", function () { if (S.i < n - 1) { S.i++; viewQ(1); } else viewReview(); });
  }
  function pick(l) {
    var q = S.qs[S.i]; S.ans[q.id] = l; saveDraft();
    $$(".opt").forEach(function (b) { var on = b.dataset.l === l; b.classList.toggle("is-sel", on); b.setAttribute("aria-checked", String(on)); });
    var dot = $$(".qdots button")[S.i]; if (dot) dot.classList.add("is-ans");
    var bd = $(".qhead .badge"); if (bd) bd.textContent = Object.keys(S.ans).length + "/" + S.qs.length + " respondidas";
  }
  /* ---------- revisão ---------- */
  function viewReview() {
    var miss = S.qs.filter(function (q) { return !S.ans[q.id]; });
    var el = swap('<div class="card qcard"><span class="eyebrow">Revisão final</span><h2 class="h2" style="margin:.8rem 0">Confira suas respostas</h2><p class="muted">Toque em uma pergunta para alterar. Depois de enviar, <b style="color:#fff">não dá para mudar</b> e a tentativa ' + (S.attempts.length + 1) + " de " + MAX + " será registrada.</p>" +
      '<div class="rev">' + S.qs.map(function (q, k) { var a = S.ans[q.id]; return '<button type="button" data-k="' + k + '"><span class="rev__n">' + (k + 1) + '</span><span class="rev__q">' + esc(q.enunciado) + '</span><span class="rev__a">' + (a ? '<span class="badge badge--gold">' + a + "</span>" : '<span class="badge badge--bad">Sem resposta</span>') + "</span></button>"; }).join("") + "</div>" +
      (miss.length ? '<div class="msg msg--err">Faltam ' + miss.length + " pergunta" + (miss.length > 1 ? "s" : "") + " sem resposta.</div>" : "") +
      '<div id="err"></div><div class="qnav"><button class="btn btn--ghost" id="back" type="button">← Voltar às perguntas</button><button class="btn btn--gold" id="send" type="button"' + (miss.length ? " disabled" : "") + ">Enviar respostas</button></div></div>", 1);
    $$(".rev button", el).forEach(function (b) { b.addEventListener("click", function () { S.i = +b.dataset.k; viewQ(-1); }); });
    $("#back", el).addEventListener("click", function () { S.i = S.qs.length - 1; viewQ(-1); });
    $("#send", el).addEventListener("click", function () {
      var b = this; b.disabled = true; b.textContent = "Enviando…";
      api.submitAttempt(S.ans).then(function (r) {
        S.result = r; try { sessionStorage.removeItem(dkey()); sessionStorage.setItem(rkey(), JSON.stringify(r)); } catch (e) {}
        S.ans = {};
        return api.getMyAttempts();
      }).then(function (a) { S.attempts = a; viewResult(false); })
        .catch(function (e) { b.disabled = false; b.textContent = "Enviar respostas"; $("#err", el).innerHTML = '<div class="msg msg--err">' + esc(e.message) + "</div>"; });
    });
  }
  /* ---------- resultado ---------- */
  function confetti() {
    if (BF.reduced) return;
    var box = BF.el('<div class="confetti" aria-hidden="true"></div>'), cols = ["#DFA624", "#f6d27a", "#8BA480", "#FAF9F5"];
    for (var i = 0; i < 56; i++) { var p = document.createElement("i"); p.style.cssText = "left:" + Math.random() * 100 + "%;background:" + cols[i % 4] + ";--x:" + (Math.random() * 160 - 80) + "px;--r:" + (Math.random() * 720 - 360) + "deg;animation-delay:" + Math.random() * .6 + "s;animation-duration:" + (2 + Math.random() * 1.6) + "s"; box.appendChild(p); }
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 4800);
  }
  function viewResult(fromStore) {
    var r = S.result, ok = r.aprovado, showKey = ok || BF.cfg.MOSTRAR_GABARITO_SE_REPROVADO !== false || r.tentativasRestantes === 0;
    var qm = {}; S.qs.forEach(function (q) { qm[q.id] = q; });
    var fb = r.gabarito.map(function (g, k) {
      var q = qm[g.id] || { enunciado: "Pergunta " + g.id }, right = g.marcada === g.correta;
      var txt = function (l) { return q[l.toLowerCase()] ? esc(q[l.toLowerCase()]) : ""; };
      return '<div class="fbi ' + (right ? "fbi--ok" : "fbi--bad") + '"><div class="fbi__h"><span class="fbi__ic" aria-hidden="true">' + (right ? "✓" : "✕") + "</span><span>" + (k + 1) + ". " + esc(q.enunciado) + "</span></div>" +
        '<div class="fbi__r"><span class="sr">' + (right ? "Acertou" : "Errou") + ".</span>" +
        '<span>Sua resposta: <b>' + g.marcada + "</b> · " + txt(g.marcada) + "</span>" + (showKey && !right ? '<span style="color:#a8ebc3">Correta: <b>' + g.correta + "</b> · " + txt(g.correta) + "</span>" : "") + "</div>" +
        (showKey ? '<p class="fbi__e">' + esc(g.explicacao) + "</p>" : "") + "</div>";
    }).join("");
    var resTxt = ok ? "Aprovado(a)! Parabéns!" : "Não foi dessa vez";
    var sub = ok ? "Você atingiu a nota mínima de " + MIN + " acertos." : (r.tentativasRestantes > 0 ? "Você precisa de " + MIN + " acertos. Revise o curso e tente de novo: restam " + r.tentativasRestantes + " tentativa" + (r.tentativasRestantes > 1 ? "s" : "") + "." : "Você precisa de " + MIN + " acertos e as " + MAX + " tentativas acabaram. Fale com o administrador.");
    var el = swap('<div class="card qcard"><div class="res ' + (ok ? "res--ok" : "res--bad") + '">' + BF.ring(168, 12, r.acertos * 10, '<span id="sc">0</span>/10', "acertos") +
      '<div><span class="badge ' + (ok ? "badge--ok" : "badge--bad") + '">Tentativa ' + r.tentativa + " de " + MAX + '</span><h1 class="h2" style="margin:.7rem 0 .4rem">' + resTxt + '</h1><p class="muted">' + sub + "</p></div>" +
      '<div class="acts">' + (ok ? '<a class="btn btn--gold" href="certificado.html">Ver certificado</a>' : (r.tentativasRestantes > 0 ? '<button class="btn btn--gold" id="again" type="button">Tentar novamente</button>' : "")) + '<a class="btn btn--ghost" href="course.html">' + (ok ? "Voltar ao curso" : "Revisar o curso") + "</a></div></div>" +
      '<div class="eyebrow" style="margin:.4rem 0 .2rem">Gabarito comentado</div><div class="fb">' + fb + "</div>" +
      (!showKey ? '<div class="msg msg--info" style="margin-top:1rem">O gabarito detalhado fica disponível ao final das tentativas ou na aprovação.</div>' : "") + "</div>");
    BF.setRing(el, r.acertos * 10); BF.countUp($("#sc", el), r.acertos, { dur: 1300 });
    if (ok && !fromStore) confetti();
    var ag = $("#again", el); if (ag) ag.addEventListener("click", function () { S.ans = {}; S.i = 0; try { sessionStorage.removeItem(rkey()); } catch (e) {} viewQ(0); });
  }

  document.addEventListener("keydown", function (e) {
    if (!$("#next") || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toUpperCase();
    if (/^[ABCD]$/.test(k) && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) pick(k);
    else if (e.key === "Enter" && document.activeElement.tagName !== "BUTTON") $("#next").click();
  });

  BF.boot({ active: "quiz", require: "auth" }).then(function (s) {
    S.session = s;
    return Promise.all([api.getProgress(), api.getMyAttempts(), api.getQuestions()]);
  }).then(function (r) {
    S.done = r[0].modulosConcluidos; S.attempts = r[1]; S.qs = r[2];
    try { S.ans = JSON.parse(sessionStorage.getItem(dkey())) || {}; } catch (e) { S.ans = {}; }
    var unlocked = S.done.length >= TOTAL || S.session.user.role === "admin";
    if (!unlocked && !passed()) viewGate(); else viewIntro();
  }).catch(function (e) { console.warn(e); });
})();
