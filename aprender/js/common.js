/* BFit · Área de Aprendizado — utilitários compartilhados (window.BF) */
(function () {
  "use strict";
  var d = document.documentElement;
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  d.classList.add("js"); if (!reduced) d.classList.add("fx");
  setTimeout(function () { if (!window.__bfBooted) { d.classList.add("fx-failsafe"); var b = document.querySelector(".boot"); if (b) b.classList.add("is-off"); } }, 8000);

  var CFG = window.BFIT_CONFIG || {};
  var BF = window.BF = { reduced: reduced, cfg: CFG };

  BF.$ = function (s, r) { return (r || document).querySelector(s); };
  BF.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  BF.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  BF.el = function (html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  BF.fmtDate = function (iso, withTime) {
    if (!iso) return "—";
    var dt = new Date(iso), o = { day: "2-digit", month: "2-digit", year: "numeric" };
    if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return dt.toLocaleString("pt-BR", Object.assign({ timeZone: "America/Sao_Paulo" }, o));
  };
  BF.fmtLong = function (iso) { return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric" }); };
  BF.initials = function (n) { var p = String(n || "?").replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/); return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase(); };

  BF.toast = function (msg, kind) {
    var box = BF.$(".toasts"); if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    var t = BF.el('<div class="toast' + (kind ? " toast--" + kind : "") + '">' + BF.esc(msg) + "</div>"); box.appendChild(t);
    setTimeout(function () { t.style.transition = "opacity .4s"; t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 450); }, 3600);
  };

  /* contador animado; respeita reduced-motion */
  BF.countUp = function (el, to, opt) {
    opt = opt || {}; var dec = opt.dec || 0, suf = opt.suffix || "", pre = opt.prefix || "";
    var fmt = function (v) { return pre + v.toFixed(dec).replace(".", ",") + suf; };
    if (reduced || to === 0) { el.textContent = fmt(to); return; }
    var t0 = null, dur = opt.dur || 1400, from = opt.from || 0;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  };

  /* dispara cb uma vez quando o elemento entra na viewport */
  BF.onEnter = function (el, cb, thr) {
    if (!("IntersectionObserver" in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }); }, { threshold: thr == null ? 0.18 : thr, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
  };
  /* ativa .rv e [data-count] dentro de um escopo */
  BF.armReveals = function (scope) {
    BF.$$(".rv:not(.is-armed)", scope).forEach(function (el) { el.classList.add("is-armed"); BF.onEnter(el, function () { el.classList.add("is-in"); }, 0.08); });
  };
  BF.armCounters = function (scope) {
    BF.$$("[data-count]:not(.is-counted)", scope).forEach(function (el) {
      el.classList.add("is-counted");
      BF.onEnter(el, function () { BF.countUp(el, parseFloat(el.dataset.count), { dec: +(el.dataset.dec || 0), suffix: el.dataset.suffix || "", prefix: el.dataset.prefix || "" }); }, 0.3);
    });
  };
  BF.armDraw = function (scope) { /* adiciona .is-in em .draw (gráficos CSS/SVG) */
    BF.$$(".draw:not(.is-armed)", scope).forEach(function (el) { el.classList.add("is-armed"); BF.onEnter(el, function () { el.classList.add("is-in"); }, 0.25); });
  };
  BF.arm = function (scope) { BF.armReveals(scope); BF.armCounters(scope); BF.armDraw(scope); };

  /* SVG de gradiente reutilizável para anéis */
  BF.gradDefs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d27a"/><stop offset=".55" stop-color="#DFA624"/><stop offset="1" stop-color="#8BA480"/></linearGradient></defs></svg>';
  BF.ring = function (size, stroke, pct, label, sub) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return '<div class="ring" style="width:' + size + "px;height:" + size + 'px"><svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true">' +
      '<circle class="ring__bg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '"/>' +
      '<circle class="ring__fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke-width="' + stroke + '" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" data-pct="' + pct + '" data-c="' + c + '"/></svg>' +
      '<div class="ring__lbl"><b>' + label + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div></div>";
  };
  BF.setRing = function (root, pct) {
    var fg = BF.$(".ring__fg", root); if (!fg) return; var c = parseFloat(fg.dataset.c);
    requestAnimationFrame(function () { requestAnimationFrame(function () { fg.style.strokeDashoffset = c * (1 - Math.max(0, Math.min(100, pct)) / 100); }); });
  };

  /* ---------- boot de página ---------- */
  var LOGO = '<img src="/logo.png" alt="BFit Academias" width="96" height="30" />';
  BF.topbar = function (active, session) {
    var u = session && session.user, nav = "";
    if (u) {
      var links = [["course", "course.html", "Curso"], ["quiz", "quiz.html", "Avaliação"]];
      if (u.role === "admin") links.push(["admin", "admin.html", "Painel do admin"]);
      nav = '<nav class="topbar__nav" aria-label="Principal">' + links.map(function (l) { return '<a href="' + l[1] + '"' + (active === l[0] ? ' aria-current="page"' : "") + ">" + l[2] + "</a>"; }).join("") + "</nav>";
    }
    var user = u ? '<div class="topbar__user"><span class="chip-user" title="' + BF.esc(u.email) + '"><i>' + BF.esc(BF.initials(u.nome)) + "</i><b>" + BF.esc(u.nome.split(" ")[0]) + '</b></span><button class="btn-sair" id="btnSair" type="button">Sair</button></div>' : "";
    return '<header class="topbar"><a class="topbar__logo" href="/aprender/" aria-label="Início da Área de Aprendizado">' + LOGO + '<span class="topbar__tag">Área de<br>Aprendizado</span></a>' + nav + user + "</header>" +
      (u ? '<nav class="mnav" aria-label="Principal (celular)">' + [["course", "course.html", "Curso"], ["quiz", "quiz.html", "Avaliação"]].concat(u.role === "admin" ? [["admin", "admin.html", "Admin"]] : []).map(function (l) { return '<a href="' + l[1] + '"' + (active === l[0] ? ' aria-current="page"' : "") + ">" + l[2] + "</a>"; }).join("") + "</nav>" : "");
  };

  /* BF.boot({active:'course', require:'auth'|'admin'|null}) -> Promise<session|null> */
  BF.boot = function (o) {
    o = o || {};
    var api = window.BFitAPI;
    var noidx = document.querySelector('meta[name=robots]'); if (!noidx) { var m = document.createElement("meta"); m.name = "robots"; m.content = "noindex, nofollow"; document.head.appendChild(m); }
    var loader = BF.el('<div class="boot" aria-hidden="true"><div class="boot__bar"><i></i></div></div>'); document.body.appendChild(loader);
    document.body.insertAdjacentHTML("afterbegin", BF.gradDefs);
    if (api.mode === "mock") {
      var rb = BF.el('<div class="ribbon" role="note">Modo demonstração<span>os dados ficam só neste navegador</span></div>');
      document.body.insertBefore(rb, document.body.firstChild);
      d.style.setProperty("--ribbon", rb.offsetHeight + "px");
    }
    return api.ready().then(function () { return api.getSession(); }).then(function (s) {
      var next = encodeURIComponent(location.pathname.split("/").pop() + location.hash);
      if (o.require && !s) { location.replace("index.html?next=" + next); return new Promise(function () {}); }
      if (o.require === "admin" && s.user.role !== "admin") { location.replace("course.html"); return new Promise(function () {}); }
      var mount = BF.$("#topbar"); if (mount) mount.outerHTML = BF.topbar(o.active, s);
      var out = BF.$("#btnSair"); if (out) out.addEventListener("click", function () { api.signOut().then(function () { location.href = "index.html"; }); });
      window.__bfBooted = true; loader.classList.add("is-off"); setTimeout(function () { loader.remove(); }, 600);
      return s;
    }).catch(function (e) {
      window.__bfBooted = true; loader.remove();
      var mount = BF.$("#topbar"); if (mount) mount.outerHTML = BF.topbar(o.active, null);
      var host = BF.$("main") || document.body;
      host.insertAdjacentHTML("afterbegin", '<div class="wrap" style="padding-top:2rem"><div class="msg msg--err">' + BF.esc(e.message || "Erro ao carregar.") + "</div></div>");
      throw e;
    });
  };

  /* Lenis opcional (rolagem suave), nunca com reduced-motion */
  BF.lenis = function () {
    if (reduced || !window.Lenis) return null;
    try {
      var l = new Lenis({ duration: 1.05, smoothWheel: true });
      function raf(t) { l.raf(t); requestAnimationFrame(raf); } requestAnimationFrame(raf);
      BF._lenis = l; return l;
    } catch (e) { return null; }
  };
})();
