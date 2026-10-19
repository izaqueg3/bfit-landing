/* ============================================================================
 * BFit · Área de Aprendizado — CAMADA DE DADOS ÚNICA
 * Todo acesso a dados passa por window.BFitAPI (contrato assíncrono abaixo).
 *
 *  signUp({nome,email,password,codigoEquipe})   -> {ok:true, needsConfirmation:boolean}
 *  signIn({email,password})                     -> {user:{id,email,nome,role}}
 *  signOut()                                    -> void
 *  getSession()                                 -> {user:{id,email,nome,role}} | null
 *  getProgress()                                -> {modulosConcluidos:[1,3,...]}
 *  setModuleDone(n)                             -> {modulosConcluidos:[...]}
 *  getQuestions()                               -> [{id,ordem,enunciado,a,b,c,d}]   (sem gabarito)
 *  submitAttempt(answers:{[questionId]:'A'..})  -> {tentativa,acertos,aprovado,tentativasRestantes,
 *                                                   gabarito:[{id,correta,marcada,explicacao}]}
 *  getMyAttempts()                              -> [{tentativa,acertos,aprovado,created_at}]
 *  adminOverview()                              -> [{id,nome,email,modulosConcluidos(n),tentativas(n),
 *                                                    melhorNota,aprovado,ultimaTentativa}]   (id é extra)
 *  adminAttempts(userId)                        -> [{tentativa,acertos,aprovado,created_at}]
 *
 * Modo: window.BFIT_MOCK (definido em config.js). true => localStorage; false => Supabase.
 * ========================================================================== */
(function () {
  "use strict";
  var CFG = window.BFIT_CONFIG || {};
  var MAX = CFG.MAX_TENTATIVAS || 3;
  var MIN = CFG.NOTA_MINIMA || 7;
  var TOTAL = CFG.TOTAL_MODULOS || 10;
  var BASE = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^/]*$/, "") : "/aprender/js/";
  })();

  function fail(msg, code) { var e = new Error(msg); e.code = code || "erro"; return e; }
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error("Falha ao carregar " + src)); };
      document.head.appendChild(s);
    });
  }
  function uniqSorted(a) { return Array.from(new Set(a.map(Number))).filter(function (n) { return n >= 1 && n <= TOTAL; }).sort(function (x, y) { return x - y; }); }

  /* ======================================================================
   * 1) IMPLEMENTAÇÃO MOCK (localStorage) — somente demonstração/testes
   * ==================================================================== */
  var Mock = (function () {
    var LS = window.localStorage;
    var K = { users: "bfit_mock_users", session: "bfit_mock_session", progress: "bfit_mock_progress", attempts: "bfit_mock_attempts", seeded: "bfit_mock_seeded_v1" };
    var secret = null;

    function read(k, d) { try { return JSON.parse(LS.getItem(k)) || d; } catch (e) { return d; } }
    function write(k, v) { LS.setItem(k, JSON.stringify(v)); }
    function uid() { return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
    function hash(s) { return btoa(unescape(encodeURIComponent("bfit|" + s))); }
    function delay() { return new Promise(function (r) { setTimeout(r, 120); }); }

    function ensureSecret() {
      if (secret) return Promise.resolve(secret);
      if (window.BFIT_MOCK_KEY) { secret = window.BFIT_MOCK_KEY; return Promise.resolve(secret); }
      return loadScript(BASE + "mock-key.js").then(function () {
        secret = window.BFIT_MOCK_KEY; seed(); return secret;
      }).catch(function () {
        throw fail("O modo demonstração não está disponível neste ambiente (arquivo local mock-key.js ausente).", "mock-indisponivel");
      });
    }
    function seed() {
      if (LS.getItem(K.seeded) || !secret) return;
      var users = read(K.users, []), prog = read(K.progress, {}), att = read(K.attempts, {});
      var key = {}; secret.key.forEach(function (q) { key[q.id] = q.correta; });
      secret.users.forEach(function (u) {
        if (users.some(function (x) { return x.email === u.email; })) return;
        var id = uid();
        users.push({ id: id, nome: u.nome, email: u.email, pwd: hash(u.senha), role: u.role, created_at: new Date(Date.now() - 20 * 864e5).toISOString() });
        prog[id] = u.modulos.slice();
        att[id] = u.tentativas.map(function (t, i) {
          return { tentativa: i + 1, acertos: t[0], aprovado: t[0] >= MIN, created_at: new Date(Date.now() - t[1] * 864e5).toISOString(), answers: {} };
        });
      });
      write(K.users, users); write(K.progress, prog); write(K.attempts, att); LS.setItem(K.seeded, "1");
    }
    function me() {
      var id = LS.getItem(K.session); if (!id) return null;
      return read(K.users, []).find(function (u) { return u.id === id; }) || null;
    }
    function pub(u) { return { id: u.id, email: u.email, nome: u.nome, role: u.role }; }
    function need() { var u = me(); if (!u) throw fail("Sessão expirada. Entre novamente.", "nao-autenticado"); return u; }
    function needAdmin() { var u = need(); if (u.role !== "admin") throw fail("Acesso restrito ao administrador.", "proibido"); return u; }
    function clean(a) { return { tentativa: a.tentativa, acertos: a.acertos, aprovado: a.aprovado, created_at: a.created_at }; }

    return {
      ready: function () { return ensureSecret().then(seed); },
      signUp: function (p) {
        return ensureSecret().then(delay).then(function () {
          var nome = (p.nome || "").trim(), email = (p.email || "").trim().toLowerCase(), code = (p.codigoEquipe || "").trim().toUpperCase();
          if (nome.length < 3) throw fail("Informe seu nome completo.");
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw fail("Informe um e-mail válido.");
          if ((p.password || "").length < 8) throw fail("A senha precisa ter pelo menos 8 caracteres.");
          var role = secret.codes[code];
          if (!role) throw fail("Código da equipe inválido. Peça o código ao administrador.");
          var users = read(K.users, []);
          if (users.some(function (u) { return u.email === email; })) throw fail("Este e-mail já está cadastrado. Use “Entrar”.");
          var u = { id: uid(), nome: nome, email: email, pwd: hash(p.password), role: role, created_at: new Date().toISOString() };
          users.push(u); write(K.users, users); LS.setItem(K.session, u.id);
          return { ok: true, needsConfirmation: false };
        });
      },
      signIn: function (p) {
        return ensureSecret().then(delay).then(function () {
          var email = (p.email || "").trim().toLowerCase();
          var u = read(K.users, []).find(function (x) { return x.email === email && x.pwd === hash(p.password || ""); });
          if (!u) throw fail("E-mail ou senha incorretos.");
          LS.setItem(K.session, u.id); return { user: pub(u) };
        });
      },
      signOut: function () { LS.removeItem(K.session); return Promise.resolve(); },
      getSession: function () { return ensureSecret().then(function () { var u = me(); return u ? { user: pub(u) } : null; }); },
      getProgress: function () { return Promise.resolve().then(function () { var u = need(); return { modulosConcluidos: uniqSorted(read(K.progress, {})[u.id] || []) }; }); },
      setModuleDone: function (n) {
        return Promise.resolve().then(function () {
          var u = need(); n = Number(n);
          if (!(n >= 1 && n <= TOTAL)) throw fail("Módulo inválido.");
          var p = read(K.progress, {}); p[u.id] = uniqSorted((p[u.id] || []).concat(n)); write(K.progress, p);
          return { modulosConcluidos: p[u.id] };
        });
      },
      getQuestions: function () {
        return Promise.resolve().then(function () {
          need();
          return (window.BFIT_QUIZ || []).map(function (q) { return { id: q.id, ordem: q.ordem, enunciado: q.enunciado, a: q.a, b: q.b, c: q.c, d: q.d }; })
            .sort(function (a, b) { return a.ordem - b.ordem; });
        });
      },
      submitAttempt: function (answers) {
        return ensureSecret().then(delay).then(function () {
          var u = need(), all = read(K.attempts, {}), mine = all[u.id] || [];
          if (mine.some(function (a) { return a.aprovado; })) throw fail("Você já foi aprovado(a) nesta avaliação.", "ja-aprovado");
          if (mine.length >= MAX) throw fail("Você já usou as " + MAX + " tentativas.", "sem-tentativas");
          var qs = secret.key, acertos = 0;
          qs.forEach(function (q) { if (!answers || !/^[ABCD]$/.test(answers[q.id] || "")) throw fail("Responda todas as 10 perguntas antes de enviar."); });
          var gab = qs.map(function (q) {
            var m = answers[q.id]; if (m === q.correta) acertos++;
            return { id: q.id, correta: q.correta, marcada: m, explicacao: q.explicacao };
          });
          var att = { tentativa: mine.length + 1, acertos: acertos, aprovado: acertos >= MIN, created_at: new Date().toISOString(), answers: answers };
          mine.push(att); all[u.id] = mine; write(K.attempts, all);
          return { tentativa: att.tentativa, acertos: acertos, aprovado: att.aprovado, tentativasRestantes: att.aprovado ? 0 : MAX - mine.length, gabarito: gab };
        });
      },
      getMyAttempts: function () { return Promise.resolve().then(function () { var u = need(); return (read(K.attempts, {})[u.id] || []).map(clean); }); },
      adminOverview: function () {
        return Promise.resolve().then(function () {
          needAdmin();
          var prog = read(K.progress, {}), att = read(K.attempts, {});
          return read(K.users, []).filter(function (u) { return u.role !== "admin"; }).map(function (u) {
            var a = att[u.id] || [];
            return {
              id: u.id, nome: u.nome, email: u.email,
              modulosConcluidos: uniqSorted(prog[u.id] || []).length, tentativas: a.length,
              melhorNota: a.length ? Math.max.apply(null, a.map(function (x) { return x.acertos; })) : null,
              aprovado: a.some(function (x) { return x.aprovado; }),
              ultimaTentativa: a.length ? a[a.length - 1].created_at : null
            };
          });
        });
      },
      adminAttempts: function (userId) { return Promise.resolve().then(function () { needAdmin(); return (read(K.attempts, {})[userId] || []).map(clean); }); },
      /* utilitário de teste */
      _reset: function () { Object.keys(K).forEach(function (k) { LS.removeItem(K[k]); }); }
    };
  })();

  /* ======================================================================
   * 2) IMPLEMENTAÇÃO SUPABASE  —  ▼▼▼ PRODUÇÃO ▼▼▼
   *    Mesmo contrato, usando supabase.auth + RPCs:
   *    submit_attempt(p_answers jsonb) · get_questions() · set_module_done(p_modulo int)
   *    get_progress() · my_attempts() · admin_overview() · admin_attempts(p_user uuid)
   *    Tabela esperada: profiles(id uuid pk, nome text, role text 'staff'|'admin').
   *    Veja /workspace/aprender-private/supabase-schema.sql (rascunho).
   * ==================================================================== */
  var Supa = (function () {
    var client = null, booting = null;
    function ready() {
      if (client) return Promise.resolve(client);
      if (booting) return booting;
      booting = (window.supabase && window.supabase.createClient ? Promise.resolve() : loadScript("/aprender/vendor/supabase.js")).then(function () {
        client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        return client;
      });
      return booting;
    }
    function ptErr(err) {
      var m = (err && (err.message || err.error_description)) || "Erro inesperado.";
      var map = [
        [/invalid login credentials/i, "E-mail ou senha incorretos."],
        [/user already registered|already been registered/i, "Este e-mail já está cadastrado. Use “Entrar”."],
        [/email not confirmed/i, "Confirme seu e-mail pelo link que enviamos antes de entrar."],
        [/password should be at least|weak password/i, "A senha precisa ter pelo menos 8 caracteres."],
        [/invalid.*email|unable to validate email/i, "Informe um e-mail válido."],
        [/codigo|código/i, "Código da equipe inválido. Peça o código ao administrador."],
        [/ja foi aprovado|já foi aprovado/i, "Você já foi aprovado(a) nesta avaliação."],
        [/limite|tentativas/i, "Limite de tentativas atingido."],
        [/rate limit|too many/i, "Muitas tentativas. Aguarde um instante e tente de novo."],
        [/jwt|not authenticated|nao autenticado|não autenticado/i, "Sessão expirada. Entre novamente."],
        [/permission|forbidden|apenas admin|restrito|acesso negado/i, "Acesso restrito ao administrador."]
      ];
      for (var i = 0; i < map.length; i++) if (map[i][0].test(m)) return fail(map[i][1], err && err.code);
      return fail(m, err && err.code);
    }
    function rpc(name, args) {
      return ready().then(function (sb) { return sb.rpc(name, args || {}); }).then(function (r) { if (r.error) throw ptErr(r.error); return r.data; });
    }
    function pick(o, a, b) { return o == null ? undefined : (o[a] !== undefined ? o[a] : o[b]); }
    function normAttempt(a) { return { tentativa: a.tentativa, acertos: a.acertos, aprovado: !!a.aprovado, created_at: a.created_at }; }
    function modsOf(d) {
      if (Array.isArray(d)) d = d.length && typeof d[0] === "object" ? (d[0].modulos_concluidos || d.map(function (x) { return x.modulo; })) : d;
      else if (d && typeof d === "object") d = pick(d, "modulos_concluidos", "modulosConcluidos");
      return uniqSorted(d || []);
    }
    return {
      ready: function () { return ready(); },
      signUp: function (p) {
        var body = { action: "signup", nome: (p.nome || "").trim(), email: (p.email || "").trim().toLowerCase(), password: p.password || "", codigoEquipe: (p.codigoEquipe || "").trim().toUpperCase() };
        if (body.nome.length < 3) return Promise.reject(fail("Informe seu nome completo."));
        if (body.password.length < 8) return Promise.reject(fail("A senha precisa ter pelo menos 8 caracteres."));
        return fetch(CFG.SUPABASE_URL + "/functions/v1/equipe", {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: CFG.SUPABASE_ANON_KEY, Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY },
          body: JSON.stringify(body)
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) {
            if (!r.ok || !d.ok) throw fail(d.error || "Não foi possível criar a conta. Tente novamente.", "signup-" + r.status);
          });
        }, function () { throw fail("Sem conexão com o servidor. Verifique a internet e tente de novo."); })
          .then(function () { return Supa.signIn({ email: body.email, password: body.password }); })
          .then(function () { return { ok: true, needsConfirmation: false }; });
      },
      signIn: function (p) {
        return ready().then(function (sb) { return sb.auth.signInWithPassword({ email: (p.email || "").trim().toLowerCase(), password: p.password }); })
          .then(function (r) { if (r.error) throw ptErr(r.error); return Supa.getSession(); })
          .then(function (s) { return { user: s.user }; });
      },
      signOut: function () { return ready().then(function (sb) { return sb.auth.signOut(); }).then(function () {}); },
      getSession: function () {
        return ready().then(function (sb) {
          return sb.auth.getSession().then(function (r) {
            var s = r.data && r.data.session; if (!s) return null;
            var u = s.user, md = u.user_metadata || {}, am = u.app_metadata || {};
            return sb.from("profiles").select("nome,role").eq("id", u.id).maybeSingle().then(function (pr) {
              var p = (pr && pr.data) || {};
              return { user: { id: u.id, email: u.email, nome: p.nome || md.nome || u.email, role: p.role || am.role || "membro" } };
            });
          });
        });
      },
      getProgress: function () { return rpc("get_progress").then(function (d) { return { modulosConcluidos: modsOf(d) }; }); },
      setModuleDone: function (n) { return rpc("set_module_done", { p_modulo: Number(n) }).then(function () { return Supa.getProgress(); }); },
      getQuestions: function () {
        return rpc("get_questions").then(function (d) {
          return (d || []).map(function (q) { return { id: q.id, ordem: q.ordem, enunciado: q.enunciado, a: q.a, b: q.b, c: q.c, d: q.d }; })
            .sort(function (x, y) { return x.ordem - y.ordem; });
        });
      },
      submitAttempt: function (answers) {
        return rpc("submit_attempt", { p_answers: answers }).then(function (d) {
          if (Array.isArray(d)) d = d[0];
          return {
            tentativa: d.tentativa, acertos: d.acertos, aprovado: !!d.aprovado,
            tentativasRestantes: pick(d, "tentativas_restantes", "tentativasRestantes"),
            gabarito: (d.gabarito || []).map(function (g) { return { id: g.id, correta: g.correta, marcada: g.marcada, explicacao: g.explicacao }; })
          };
        });
      },
      getMyAttempts: function () { return rpc("my_attempts").then(function (d) { return (d || []).map(normAttempt); }); },
      adminOverview: function () {
        return rpc("admin_overview").then(function (d) {
          return (d || []).filter(function (r) { return r.role !== "admin"; }).map(function (r) {
            return {
              id: r.id || r.user_id, nome: r.nome, email: r.email,
              modulosConcluidos: uniqSorted(pick(r, "modulos_concluidos", "modulosConcluidos") || []).length,
              role: r.role,
              tentativas: Number(r.tentativas || 0),
              melhorNota: pick(r, "melhor_nota", "melhorNota") == null ? null : Number(pick(r, "melhor_nota", "melhorNota")),
              aprovado: !!r.aprovado, ultimaTentativa: pick(r, "ultima_tentativa", "ultimaTentativa") || null
            };
          });
        });
      },
      adminAttempts: function (userId) { return rpc("admin_attempts", { p_user: userId }).then(function (d) { return (d || []).map(normAttempt); }); }
    };
  })();
  /* ▲▲▲ fim da seção Supabase ▲▲▲ */

  var impl = window.BFIT_MOCK ? Mock : Supa;
  window.BFitAPI = {
    mode: window.BFIT_MOCK ? "mock" : "supabase",
    ready: function () { return impl.ready(); },
    signUp: function (p) { return impl.signUp(p); },
    signIn: function (p) { return impl.signIn(p); },
    signOut: function () { return impl.signOut(); },
    getSession: function () { return impl.getSession(); },
    getProgress: function () { return impl.getProgress(); },
    setModuleDone: function (n) { return impl.setModuleDone(n); },
    getQuestions: function () { return impl.getQuestions(); },
    submitAttempt: function (a) { return impl.submitAttempt(a); },
    getMyAttempts: function () { return impl.getMyAttempts(); },
    adminOverview: function () { return impl.adminOverview(); },
    adminAttempts: function (id) { return impl.adminAttempts(id); },
    _mock: window.BFIT_MOCK ? Mock : null
  };
})();
