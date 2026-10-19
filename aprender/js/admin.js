(function () {
  "use strict";
  var $ = BF.$, $$ = BF.$$, esc = BF.esc, api = window.BFitAPI;
  var MAX = BF.cfg.MAX_TENTATIVAS || 3, TOTAL = BF.cfg.TOTAL_MODULOS || 10;
  var ST = { nao: { l: "Não iniciou", c: "#6b6b6b", b: "badge--off" }, and: { l: "Em andamento", c: "#DFA624", b: "badge--gold" }, rep: { l: "Reprovado", c: "#ff6b5e", b: "badge--bad" }, apr: { l: "Aprovado", c: "#5fcf8a", b: "badge--ok" } };
  var COLS = [["nome", "Nome"], ["email", "E-mail"], ["modulosConcluidos", "Módulos"], ["tentativas", "Tentativas"], ["melhorNota", "Melhor nota"], ["_st", "Status"], ["ultimaTentativa", "Última tentativa"]];
  var S = { rows: [], sort: { k: "nome", d: 1 }, q: "", fs: "", mode: "donut", opener: null };

  function status(r) { if (r.aprovado) return "apr"; if (r.tentativas >= MAX) return "rep"; if (r.modulosConcluidos > 0 || r.tentativas > 0) return "and"; return "nao"; }
  var cmp = function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };
  function view() {
    var q = S.q.trim().toLowerCase();
    var rows = S.rows.filter(function (r) { return (!q || (r.nome + " " + r.email).toLowerCase().indexOf(q) > -1) && (!S.fs || r._st === S.fs); });
    var k = S.sort.k, d = S.sort.d, order = { nao: 0, and: 1, rep: 2, apr: 3 };
    rows.sort(function (a, b) {
      var x = a[k], y = b[k];
      if (k === "_st") { x = order[a._st]; y = order[b._st]; }
      if (k === "nome" || k === "email") { return d * String(x).localeCompare(String(y), "pt-BR", { sensitivity: "base" }); }
      if (x == null) x = -1; if (y == null) y = -1;
      if (k === "ultimaTentativa") { x = x === -1 ? 0 : +new Date(x); y = y === -1 ? 0 : +new Date(y); }
      return d * cmp(x, y) || String(a.nome).localeCompare(String(b.nome), "pt-BR");
    });
    return rows;
  }
  function renderKpis() {
    var n = S.rows.length, done = S.rows.filter(function (r) { return r.modulosConcluidos >= TOTAL; }).length, ap = S.rows.filter(function (r) { return r.aprovado; }).length;
    var grades = S.rows.filter(function (r) { return r.melhorNota != null; }).map(function (r) { return r.melhorNota; });
    var avg = grades.length ? grades.reduce(function (a, b) { return a + b; }, 0) / grades.length : null;
    $("#kpis").innerHTML = [["Membros cadastrados", n, "", 0, "na equipe"], ["Concluíram o curso", done, "", 0, n ? Math.round(done / n * 100) + "% dos membros" : "—"], ["Aprovados", ap, "", 0, n ? Math.round(ap / n * 100) + "% dos membros" : "—"], ["Média das notas", avg, "/10", 1, grades.length ? "melhor nota de " + grades.length + " pessoa" + (grades.length > 1 ? "s" : "") : "ninguém fez a prova ainda"]]
      .map(function (k, i) { return '<div class="card ak rv" style="--d:' + i + '"><small>' + k[0] + '</small><b ' + (k[1] == null ? ">—" : 'data-count="' + k[1] + '" data-dec="' + k[3] + '" data-suffix="' + k[2] + '">0') + "</b><span>" + k[4] + "</span></div>"; }).join("");
    BF.arm($("#kpis"));
  }
  function counts() { var c = { nao: 0, and: 0, rep: 0, apr: 0 }; S.rows.forEach(function (r) { c[r._st]++; }); return c; }
  function renderChart() {
    var c = counts(), n = S.rows.length || 1, keys = ["nao", "and", "rep", "apr"], h;
    if (S.mode === "donut") {
      var R = 70, C2 = 2 * Math.PI * R, off = 0, segs = "";
      keys.forEach(function (k) { var len = c[k] / n * C2; segs += '<circle class="donut__seg" data-len="' + len + '" data-off="' + off + '" cx="95" cy="95" r="' + R + '" stroke="' + ST[k].c + '" stroke-dasharray="0 ' + C2 + '" stroke-dashoffset="' + (-off) + '"/>'; off += len; });
      h = '<div class="donut"><div class="donut__svg"><svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label="Status da equipe"><circle cx="95" cy="95" r="' + R + '" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="26"/>' + segs + '</svg><div class="donut__c"><b>' + S.rows.length + "</b><small>membros</small></div></div>" +
        '<ul class="leg">' + keys.map(function (k) { return '<li><i style="background:' + ST[k].c + '"></i>' + ST[k].l + "<b>" + c[k] + "</b></li>"; }).join("") + "</ul></div>";
      $("#chart").innerHTML = h;
      var segsEl = $$(".donut__seg", $("#chart")), C = C2;
      var go = function () { segsEl.forEach(function (s) { var len = parseFloat(s.dataset.len); s.style.strokeDasharray = Math.max(0, len - (len > 0 && S.rows.length > 1 ? 2 : 0)) + " " + C; }); };
      if (BF.reduced) go(); else requestAnimationFrame(function () { requestAnimationFrame(go); });
    } else {
      h = '<div class="sbars" id="sbars">' + keys.map(function (k) { return '<div class="sb"><span>' + ST[k].l + '</span><div class="sb__t"><i style="--p:' + (c[k] / n * 100) + ";background:" + ST[k].c + '"></i></div><b>' + c[k] + "</b></div>"; }).join("") + "</div>";
      $("#chart").innerHTML = h; var sb = $("#sbars");
      if (BF.reduced) sb.classList.add("chart-in"); else requestAnimationFrame(function () { requestAnimationFrame(function () { sb.classList.add("chart-in"); }); });
    }
  }
  function renderHead() {
    $("#tbl thead tr").innerHTML = COLS.map(function (c) { var s = S.sort.k === c[0] ? (S.sort.d > 0 ? "ascending" : "descending") : "none"; return '<th scope="col" aria-sort="' + s + '"><button type="button" data-k="' + c[0] + '">' + c[1] + "</button></th>"; }).join("");
  }
  function renderTable() {
    var rows = view();
    $("#count").textContent = rows.length + " de " + S.rows.length + " membro" + (S.rows.length === 1 ? "" : "s");
    var tb = $("#tbl tbody");
    if (!rows.length) { tb.innerHTML = '<tr><td colspan="7" class="empty">' + (S.rows.length ? "Nenhum membro encontrado com esse filtro." : "Ainda não há membros cadastrados.") + "</td></tr>"; return; }
    tb.innerHTML = rows.map(function (r) {
      return '<tr tabindex="0" data-id="' + esc(r.id) + '" aria-label="Ver tentativas de ' + esc(r.nome) + '"><td class="nm">' + esc(r.nome) + '</td><td class="em" title="' + esc(r.email) + '">' + esc(r.email) + "</td>" +
        '<td>' + r.modulosConcluidos + "/" + TOTAL + '<span class="mini"><i style="width:' + r.modulosConcluidos / TOTAL * 100 + '%"></i></span></td><td>' + r.tentativas + "/" + MAX + "</td><td>" + (r.melhorNota == null ? "—" : "<b>" + r.melhorNota + "/10</b>") + '</td><td><span class="badge ' + ST[r._st].b + '">' + ST[r._st].l + "</span></td><td>" + BF.fmtDate(r.ultimaTentativa, true) + "</td></tr>";
    }).join("");
  }
  /* ---------- drawer ---------- */
  function openDrawer(id, opener) {
    var r = S.rows.filter(function (x) { return String(x.id) === id; })[0]; if (!r) return;
    S.opener = opener;
    $("#drC").innerHTML = '<span class="eyebrow">Tentativas</span><h2 id="drT">' + esc(r.nome) + '</h2><p class="em">' + esc(r.email) + '</p><div class="dr__k"><div><b>' + r.modulosConcluidos + "/" + TOTAL + "</b><small>módulos</small></div><div><b>" + r.tentativas + "/" + MAX + "</b><small>tentativas</small></div><div><b>" + (r.melhorNota == null ? "—" : r.melhorNota + "/10") + '</b><small>melhor nota</small></div></div><span class="badge ' + ST[r._st].b + '">' + ST[r._st].l + '</span><ul class="att-l" id="attL" style="margin-top:1.1rem"><li class="muted small">Carregando…</li></ul>';
    $("#dr").classList.add("is-open"); $("#drBd").classList.add("is-open"); $("#dr").setAttribute("aria-hidden", "false"); $("#drX").focus();
    api.adminAttempts(r.id).then(function (a) {
      $("#attL").innerHTML = a.length ? a.map(function (t) {
        return '<li><div class="att-l__r"><b>Tentativa ' + t.tentativa + "</b><span>" + BF.fmtDate(t.created_at, true) + '</span><span><b>' + t.acertos + '/10</b> ' + (t.aprovado ? '<span class="badge badge--ok">Aprovado</span>' : '<span class="badge badge--bad">Não aprovado</span>') + '</span></div><div class="att-l__b"><i style="width:0;background:' + (t.aprovado ? "var(--ok)" : "var(--bad)") + '" data-w="' + t.acertos * 10 + '"></i></div></li>';
      }).join("") : '<li class="muted small">Nenhuma tentativa registrada.</li>';
      requestAnimationFrame(function () { requestAnimationFrame(function () { $$("#attL i[data-w]").forEach(function (i) { i.style.width = i.dataset.w + "%"; }); }); });
    }).catch(function (e) { $("#attL").innerHTML = '<li class="msg msg--err">' + esc(e.message) + "</li>"; });
  }
  function closeDrawer() { $("#dr").classList.remove("is-open"); $("#drBd").classList.remove("is-open"); $("#dr").setAttribute("aria-hidden", "true"); if (S.opener && S.opener.focus) S.opener.focus(); }
  /* ---------- CSV ---------- */
  function csvCell(v) { v = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
  function exportCsv() {
    var rows = view();
    var head = ["Nome", "E-mail", "Módulos concluídos", "Tentativas", "Melhor nota", "Status", "Última tentativa"];
    var lines = [head.map(csvCell).join(";")].concat(rows.map(function (r) { return [r.nome, r.email, r.modulosConcluidos + "/" + TOTAL, r.tentativas + "/" + MAX, r.melhorNota == null ? "" : r.melhorNota + "/10", ST[r._st].l, r.ultimaTentativa ? BF.fmtDate(r.ultimaTentativa, true) : ""].map(csvCell).join(";"); }));
    var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "bfit-equipe-" + new Date().toISOString().slice(0, 10) + ".csv"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    BF.toast("CSV exportado (" + rows.length + " linhas).", "ok");
  }
  function load() {
    $("#aerr").innerHTML = "";
    return api.adminOverview().then(function (rows) {
      S.rows = rows.map(function (r) { r._st = status(r); return r; });
      renderKpis(); renderChart(); renderHead(); renderTable();
    }).catch(function (e) { $("#aerr").innerHTML = '<div class="msg msg--err">' + esc(e.message) + "</div>"; });
  }
  function bind() {
    $("#q").addEventListener("input", function (e) { S.q = e.target.value; renderTable(); });
    $("#fs").addEventListener("change", function (e) { S.fs = e.target.value; renderTable(); });
    $("#tbl thead").addEventListener("click", function (e) { var b = e.target.closest("button[data-k]"); if (!b) return; var k = b.dataset.k; S.sort = { k: k, d: S.sort.k === k ? -S.sort.d : 1 }; renderHead(); renderTable(); });
    $("#tbl tbody").addEventListener("click", function (e) { var tr = e.target.closest("tr[data-id]"); if (tr) openDrawer(tr.dataset.id, tr); });
    $("#tbl tbody").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { var tr = e.target.closest("tr[data-id]"); if (tr) { e.preventDefault(); openDrawer(tr.dataset.id, tr); } } });
    $("#drX").addEventListener("click", closeDrawer); $("#drBd").addEventListener("click", closeDrawer);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("#dr").classList.contains("is-open")) closeDrawer(); });
    $("#csv").addEventListener("click", exportCsv);
    $("#reload").addEventListener("click", function () { load().then(function () { BF.toast("Dados atualizados."); }); });
    [["mDonut", "donut"], ["mBars", "bars"]].forEach(function (p) { $("#" + p[0]).addEventListener("click", function () { S.mode = p[1]; $("#mDonut").setAttribute("aria-pressed", String(p[1] === "donut")); $("#mBars").setAttribute("aria-pressed", String(p[1] === "bars")); renderChart(); }); });
  }
  BF.boot({ active: "admin", require: "admin" }).then(function () { bind(); return load(); }).catch(function (e) { console.warn(e); });
})();
