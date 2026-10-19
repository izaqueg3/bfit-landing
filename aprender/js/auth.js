(function () {
  "use strict";
  var $ = BF.$, api = window.BFitAPI;
  var params = new URLSearchParams(location.search);
  var next = params.get("next") || "course.html";
  if (!/^[a-z]+\.html(#[\w-]*)?$/i.test(next)) next = "course.html";

  function show(kind, text) { $("#msg").innerHTML = text ? '<div class="msg msg--' + kind + '" role="alert">' + BF.esc(text) + "</div>" : ""; }
  function tab(which) {
    var up = which === "up";
    $("#tabIn").setAttribute("aria-selected", String(!up)); $("#tabUp").setAttribute("aria-selected", String(up));
    $("#formIn").hidden = up; $("#formUp").hidden = !up; show(null, "");
  }
  $("#tabIn").addEventListener("click", function () { tab("in"); });
  $("#tabUp").addEventListener("click", function () { tab("up"); });
  BF.$$("[data-toggle]").forEach(function (b) {
    b.addEventListener("click", function () { var i = $("#" + b.dataset.toggle); var h = i.type === "password"; i.type = h ? "text" : "password"; b.textContent = h ? "Ocultar" : "Mostrar"; });
  });
  function busy(btn, on, label) { btn.disabled = on; btn.textContent = on ? "Aguarde…" : label; }

  $("#formIn").addEventListener("submit", function (e) {
    e.preventDefault(); var b = $("#btnIn"); show(null, "");
    var email = $("#inEmail").value, pw = $("#inPass").value;
    if (!email || !pw) { show("err", "Preencha e-mail e senha."); return; }
    busy(b, true, "Entrar");
    api.signIn({ email: email, password: pw }).then(function () { location.href = next; })
      .catch(function (err) { show("err", err.message); busy(b, false, "Entrar"); });
  });
  $("#formUp").addEventListener("submit", function (e) {
    e.preventDefault(); var b = $("#btnUp"); show(null, "");
    var p = { nome: $("#upNome").value, email: $("#upEmail").value, password: $("#upPass").value, codigoEquipe: $("#upCode").value };
    if (!p.nome || !p.email || !p.password || !p.codigoEquipe) { show("err", "Preencha todos os campos."); return; }
    busy(b, true, "Criar conta");
    api.signUp(p).then(function (r) {
      if (r && r.needsConfirmation) { show("ok", "Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois use “Entrar”."); tab("in"); $("#inEmail").value = p.email; busy(b, false, "Criar conta"); show("ok", "Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois use “Entrar”."); return; }
      location.href = next;
    }).catch(function (err) { show("err", err.message); busy(b, false, "Criar conta"); });
  });

  BF.boot({ active: "home", require: null }).then(function (s) {
    if (api.mode === "mock") $("#demoHint").hidden = false;
    if (s) {
      $("#viewAuth").hidden = true; $("#viewHello").hidden = false;
      $("#helloChip").innerHTML = "<i>" + BF.esc(BF.initials(s.user.nome)) + "</i><b>" + BF.esc(s.user.nome) + "</b>";
      $("#helloSub").textContent = s.user.email;
      if (s.user.role === "admin") $("#helloAdmin").hidden = false;
      $("#helloOut").addEventListener("click", function () { api.signOut().then(function () { location.reload(); }); });
    }
  }).catch(function () {});
})();
