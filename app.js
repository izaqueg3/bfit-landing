/* ============================================================
   Academia BFIT — Landing interactions
   ============================================================ */

(function () {
  "use strict";
  window.__bfitReady = true;

  /* ---------- CONFIG / PLACEHOLDERS (EDITME) ---------- */
  // Substitua pelos números reais no formato internacional sem + ou espaços.
  // Exemplo Brasil: 5511999999999
  const WHATSAPP = {
    geral: "5527999685202",       // Atendimento geral
    comercial: "5527999685202",   // Comercial / matrículas
    suporte: "5527999685202",     // Suporte
  };

  const EMAIL_MATRICULA = "contato@[SEU-DOMINIO].com.br"; // EDITME

  /* ---------- Helpers ---------- */
  function waUrl(number, text) {
    const msg = encodeURIComponent(text || "");
    return `https://wa.me/${number}?text=${msg}`;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Intro EKG animation ---------- */
  (function runIntro() {
    const intro = qs("#bfit-intro");
    if (!intro) { window.__bfitIntroDone = true; return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("bfit-intro-v7") === "1";
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      intro.classList.add("is-done");
      document.body.classList.remove("has-intro");
      sessionStorage.setItem("bfit-intro-v7", "1");
      window.__bfitIntroDone = true;
      document.dispatchEvent(new CustomEvent("bfit:intro-done"));
      setTimeout(() => intro.remove(), 750);
    };

    if (reduce || seen) {
      intro.remove();
      document.body.classList.remove("has-intro");
      window.__bfitIntroDone = true;
      return;
    }

    const skip = qs("#intro-skip");
    if (skip) skip.addEventListener("click", finish);

    // Accurate path length for dash animation
    const paths = intro.querySelectorAll(".intro__ekg-path, .intro__ekg-glow");
    paths.forEach((p) => {
      try {
        const len = p.getTotalLength();
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
      } catch (_) {}
    });

    // Sync mask sweep with EKG draw via rAF
    const SWEEP_MS = 2650;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    const wipePre = intro.querySelector("#logoWipe .wipe-pre");
    const wipeSolid = intro.querySelector("#logoWipe .wipe-solid");
    const wipeSoft = intro.querySelector("#logoWipe .wipe-soft");
    const wipeEnd = intro.querySelector("#logoWipe .wipe-end");
    const setWipe = (pct) => {
      // pct: -35..100 on an extended gradient (-320..1440) so the left
      // edge of the B never gets a hard vertical seam.
      const pre = Math.max(0, Math.min(100, pct - 28));
      const solid = Math.max(0, Math.min(100, pct - 6));
      const soft = Math.max(0, Math.min(100, pct + 8));
      const end = Math.max(0, Math.min(100, pct + 38));
      if (wipePre) wipePre.setAttribute("offset", pre + "%");
      if (wipeSolid) wipeSolid.setAttribute("offset", solid + "%");
      if (wipeSoft) wipeSoft.setAttribute("offset", soft + "%");
      if (wipeEnd) wipeEnd.setAttribute("offset", end + "%");
      intro.style.setProperty("--sweep", pct.toFixed(2) + "%");
    };

    const animateSweep = () => new Promise((resolve) => {
      const t0 = performance.now();
      const tick = (now) => {
        if (finished) return resolve();
        const t = Math.min(1, (now - t0) / SWEEP_MS);
        const e = 1 - Math.pow(1 - t, 3);
        const pct = -35 + e * 135;
        setWipe(pct);
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

    (async () => {
      setWipe(-35);
      intro.classList.add("is-hold");
      await wait(700); // anticipation with ghost logo
      if (finished) return;
      intro.classList.remove("is-hold");
      intro.classList.add("is-sweep");
      await animateSweep();
      if (finished) return;
      intro.classList.add("is-flare");
      await wait(520);
      if (finished) return;
      intro.classList.add("is-implode");
      await wait(480);
      if (finished) return;
      intro.classList.remove("is-sweep", "is-flare", "is-implode");
      setWipe(100);
      if (wipePre) { wipePre.setAttribute("offset", "100%"); }
      if (wipeSolid) { wipeSolid.setAttribute("offset", "100%"); }
      if (wipeSoft) { wipeSoft.setAttribute("offset", "100%"); }
      if (wipeEnd) { wipeEnd.setAttribute("offset", "100%"); }
      const lit = intro.querySelector(".intro__logo--lit");
      if (lit) lit.removeAttribute("mask");
      intro.classList.add("is-reveal");
      await wait(1100);
      finish();
    })();
  })();

  /* ---------- Sticky header shadow ---------- */
  const header = qs(".site-header");
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile nav ---------- */
  const toggle = qs(".nav-toggle");
  const mobileNav = qs("#mobile-nav");
  const mobileLinks = qsa(".mobile-nav__link");

  function setMenuOpen(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    mobileNav.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setMenuOpen(open);
    });
  }

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenuOpen(false);
  });

  /* ---------- Active nav on scroll ---------- */
  const sections = qsa("section[id]");
  const navLinks = qsa(".nav__link, .mobile-nav__link");

  function updateActiveNav() {
    const y = window.scrollY + 100;
    let current = "";
    sections.forEach((sec) => {
      if (sec.offsetTop <= y) current = sec.id;
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const id = href.replace("#", "");
      link.classList.toggle("is-active", id === current);
    });
  }
  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  /* ---------- Cultura tabs (accessible + crossfade) ---------- */
  const tablist = qs('[role="tablist"]');
  if (tablist) {
    const tabs = qsa('[role="tab"]', tablist);
    const panels = qsa('[role="tabpanel"]');

    function activateTab(tab) {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((p) => {
        const match = p.id === tab.getAttribute("aria-controls");
        p.classList.remove("is-enter");
        p.classList.toggle("is-active", match);
        p.hidden = !match;
        if (match && !reduceMotion) {
          // retrigger enter animation
          void p.offsetWidth;
          p.classList.add("is-enter");
        }
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (e) => {
        const i = tabs.indexOf(tab);
        let next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          next.focus();
          activateTab(next);
        }
      });
    });

    // init
    const selected = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
    if (selected) activateTab(selected);
  }

  /* ---------- Wire WhatsApp links ---------- */
  function applyWaLinks() {
    qsa("[data-wa]").forEach((el) => {
      const key = el.getAttribute("data-wa");
      const number = WHATSAPP[key] || WHATSAPP.geral;
      const preset = el.getAttribute("data-wa-text") || "Olá! Vim pelo site da Academia BFIT.";
      el.setAttribute("href", waUrl(number, preset));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });
  }
  applyWaLinks();

  /* ---------- Enrollment form → WhatsApp / mailto ---------- */
  const form = qs("#matricula-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = (qs("#nome", form)?.value || "").trim();
      const telefone = (qs("#telefone", form)?.value || "").trim();
      const objetivo = qs("#objetivo", form)?.value || "";
      const horario = qs("#horario", form)?.value || "";
      const tipo = qs("#tipo-interesse", form)?.value || "Pré-matrícula";

      if (!nome || !telefone) {
        alert("Preencha pelo menos nome e telefone.");
        return;
      }

      const text =
        `Olá! Quero fazer *${tipo}* na Academia BFIT.\n\n` +
        `*Nome:* ${nome}\n` +
        `*Telefone:* ${telefone}\n` +
        `*Objetivo:* ${objetivo || "—"}\n` +
        `*Melhor horário:* ${horario || "—"}`;

      const action = e.submitter?.dataset?.action || "whatsapp";

      if (action === "email") {
        const subject = encodeURIComponent(`${tipo} — Academia BFIT (${nome})`);
        const body = encodeURIComponent(text.replace(/\*/g, ""));
        window.location.href = `mailto:${EMAIL_MATRICULA}?subject=${subject}&body=${body}`;
      } else {
        window.open(waUrl(WHATSAPP.comercial, text), "_blank", "noopener,noreferrer");
      }
    });
  }

  /* ---------- Reveal on scroll (variants + stagger) ---------- */

  // Gold trail ghost text content
  qsa(".fx-gold").forEach((el) => {
    if (!el.getAttribute("data-text")) {
      el.setAttribute("data-text", el.textContent.trim());
    }
  });

  // Assign --i on stagger children
  qsa(".reveal-stagger").forEach((group) => {
    const kids = qsa(":scope > .reveal, :scope > .timeline__item.reveal", group);
    const items = kids.length ? kids : qsa(".reveal", group);
    items.forEach((el, i) => {
      if (!el.style.getPropertyValue("--i")) {
        el.style.setProperty("--i", String(i));
      }
    });
  });

  const reveals = qsa(".reveal");

  function revealEl(el) {
    el.classList.add("is-visible");
    if (el.classList.contains("reveal--snap")) {
      el.classList.add("fx-snap");
    }
    const timeline = el.closest('.timeline[data-fx="timeline"]');
    if (timeline) timeline.classList.add("is-drawn");
  }

  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add("is-visible"));
    qsa('.timeline[data-fx="timeline"]').forEach((t) => t.classList.add("is-drawn"));
    qsa(".section--ambient").forEach((s) => s.classList.add("is-lit"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealEl(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));

    // Ambient gold sweep on section enter
    const ambientIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-lit", entry.isIntersecting);
        });
      },
      { threshold: 0.18 }
    );
    qsa(".section--ambient").forEach((s) => ambientIO.observe(s));
  } else {
    reveals.forEach((el) => revealEl(el));
    qsa(".section--ambient").forEach((s) => s.classList.add("is-lit"));
  }

  /* ---------- Soft gold particle dust (canvas, lightweight) ---------- */
  (function initDust() {
    if (reduceMotion) return;
    const canvases = qsa("[data-fx-dust]");
    if (!canvases.length) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    function makeDust(canvas) {
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return null;
      let w = 0, h = 0, running = false, raf = 0;
      const particles = [];
      const COUNT = 18;

      function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        w = Math.max(1, Math.floor(rect.width));
        h = Math.max(1, Math.floor(rect.height));
        canvas.width = Math.floor(w * DPR);
        canvas.height = Math.floor(h * DPR);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }

      function seed() {
        particles.length = 0;
        for (let i = 0; i < COUNT; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 0.6 + Math.random() * 1.6,
            vx: -0.12 + Math.random() * 0.24,
            vy: -0.18 - Math.random() * 0.22,
            a: 0.12 + Math.random() * 0.28,
            tw: Math.random() * Math.PI * 2,
          });
        }
      }

      function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.tw += 0.02;
          if (p.y < -8) { p.y = h + 6; p.x = Math.random() * w; }
          if (p.x < -8) p.x = w + 6;
          if (p.x > w + 8) p.x = -6;
          const alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
          ctx.beginPath();
          ctx.fillStyle = `rgba(223,166,36,${alpha.toFixed(3)})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      }

      function start() {
        if (running) return;
        running = true;
        raf = requestAnimationFrame(frame);
      }
      function stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        ctx.clearRect(0, 0, w, h);
      }

      resize();
      seed();

      const ro = typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => { resize(); })
        : null;
      if (ro) ro.observe(canvas.parentElement);

      const vis = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0.05 }
      );
      vis.observe(canvas.parentElement);

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
      });

      return { start, stop };
    }

    canvases.forEach(makeDust);
  })();

  /* ---------- Year in footer ---------- */
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Background music ---------- */
  const audio = qs("#bfit-audio");
  const musicBtn = qs("#music-toggle");
  if (audio && musicBtn) {
    audio.volume = 0.32;
    const setPlaying = (on) => {
      musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
      musicBtn.setAttribute("aria-label", on ? "Pausar música de fundo" : "Tocar música de fundo");
      const label = musicBtn.querySelector(".music-toggle__label");
      if (label) label.textContent = on ? "Pausar" : "Música";
    };
    musicBtn.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
          setPlaying(true);
        } else {
          audio.pause();
          setPlaying(false);
        }
      } catch (err) {
        setPlaying(false);
      }
    });
    audio.addEventListener("ended", () => setPlaying(false));
    audio.addEventListener("pause", () => {
      if (!audio.ended) setPlaying(false);
    });
    document.addEventListener("visibilitychange", () => {
      // keep playing in background tabs if user started it; no auto-stop
    });
  }

})();

/* ============================================================
   B Fit v2 — cinematic layer (Lenis + GSAP ScrollTrigger)
   Everything degrades gracefully: without the libs or with
   prefers-reduced-motion the page is fully static & visible.
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const FX = root.classList.contains("fx") && !reduce;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const nf = (n, d) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- 1. Split hero headline ---------- */
  $$(".hx__title [data-split]").forEach((line, li) => {
    const words = line.textContent.trim().split(/\s+/);
    line.textContent = "";
    line.setAttribute("aria-hidden", "true");
    let ci = 0;
    words.forEach((w, wi) => {
      const ws = document.createElement("span");
      ws.className = "hx__w";
      [...w].forEach((ch) => {
        const c = document.createElement("span");
        c.className = "hx__c";
        c.textContent = ch;
        c.style.setProperty("--ci", ci++);
        c.style.setProperty("--li", li);
        ws.appendChild(c);
      });
      line.appendChild(ws);
      if (wi < words.length - 1) line.appendChild(document.createTextNode(" "));
    });
  });
  $$("[data-hx]").forEach((el) => el.style.setProperty("--hx", el.getAttribute("data-hx")));

  const hero = $(".hx");
  const heroIn = () => { if (hero) hero.classList.add("is-hero-in"); };
  if (window.__bfitIntroDone) requestAnimationFrame(() => requestAnimationFrame(heroIn));
  else {
    document.addEventListener("bfit:intro-done", () => setTimeout(heroIn, 150), { once: true });
    setTimeout(heroIn, 8000); // safety
  }

  /* ---------- 2. Reveal [data-rv] with auto stagger ---------- */
  const rvEls = $$("[data-rv]");
  const groups = new Map();
  rvEls.forEach((el) => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    el.style.setProperty("--d", Math.min(i, 8) * 90);
  });

  /* ---------- 3. Counters ---------- */
  function runCounter(el) {
    if (el.__done) return; el.__done = true;
    const time = el.getAttribute("data-count-time");
    const dur = 1600;
    if (time) {
      const [H, M] = time.split(":").map(Number);
      const total = H * 60 + M;
      if (!FX) { el.textContent = time; return; }
      const t0 = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 4);
        const v = Math.round(total * e);
        el.textContent = String(Math.floor(v / 60)).padStart(2, "0") + ":" + String(v % 60).padStart(2, "0");
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return;
    }
    const target = parseFloat(el.getAttribute("data-count"));
    const dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (!FX) { el.textContent = nf(target, dec); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 4);
      el.textContent = nf(target * e, dec);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const counters = $$("[data-count], [data-count-time]");
  if (FX) counters.forEach((el) => {
    el.textContent = el.hasAttribute("data-count-time") ? "00:00" : nf(0, parseInt(el.getAttribute("data-decimals") || "0", 10));
  });

  /* ---------- 4. Dashboard builders ---------- */
  (function buildLine() {
    const host = $("[data-linechart]");
    if (!host) return;
    const A = host.dataset.a.split(",").map(Number);
    const B = host.dataset.b.split(",").map(Number);
    const W = 340, H = 150, pl = 6, pr = 6, pt = 12, pb = 22;
    const norm = (arr) => { const mn = Math.min(...arr), mx = Math.max(...arr); return arr.map((v) => (v - mn) / ((mx - mn) || 1)); };
    const xs = (i, n) => pl + (i * (W - pl - pr)) / (n - 1);
    const pts = (arr, lo, hi) => norm(arr).map((v, i) => [xs(i, arr.length), pt + (1 - (lo + v * (hi - lo))) * (H - pt - pb)]);
    const pa = pts(A, 0.12, 0.92), pb2 = pts(B, 0.05, 0.75);
    const smooth = (p) => p.reduce((d, [x, y], i, a) => {
      if (!i) return `M${x},${y}`;
      const [px, py] = a[i - 1]; const cx = (px + x) / 2;
      return d + ` C${cx},${py} ${cx},${y} ${x},${y}`;
    }, "");
    const dA = smooth(pa), dB = smooth(pb2);
    const grid = [0, 1, 2, 3].map((i) => { const y = pt + (i * (H - pt - pb)) / 3; return `<line x1="0" x2="${W}" y1="${y}" y2="${y}"/>`; }).join("");
    const xl = A.map((_, i) => `<text class="xl" x="${xs(i, A.length)}" y="${H - 6}" text-anchor="middle">Av.${i + 1}</text>`).join("");
    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <defs><linearGradient id="lgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DFA624" stop-opacity=".35"/><stop offset="1" stop-color="#DFA624" stop-opacity="0"/></linearGradient></defs>
      <g class="grid">${grid}</g>
      <path class="area" d="${dA} L${pa[pa.length - 1][0]},${H - pb} L${pa[0][0]},${H - pb} Z" fill="url(#lgA)"/>
      <path class="ln ln--b" d="${dB}"/>
      <path class="ln ln--a" d="${dA}"/>
      ${pa.map(([x, y]) => `<circle class="pt" cx="${x}" cy="${y}" r="3.4" fill="#DFA624"/>`).join("")}
      ${pb2.map(([x, y]) => `<circle class="pt" cx="${x}" cy="${y}" r="3" fill="#8BA480"/>`).join("")}
      ${xl}</svg>`;
    $$(".ln", host).forEach((p) => { try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch (_) {} });
  })();

  (function buildHeat() {
    const host = $("[data-heatmap]");
    if (!host) return;
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const weeks = window.innerWidth < 420 ? 13 : 16;
    let html = "";
    for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
      const k = w * 7 + d;
      let lvl = 0;
      if (d < 6) { const r = rnd() + w / weeks * 0.35; lvl = r > 1.05 ? 3 : r > 0.8 ? 2 : r > 0.55 ? 1 : 0; }
      if (w === weeks - 1 || (w === weeks - 2 && d > 2)) lvl = d < 6 ? 3 : 0;
      html += `<i class="l${lvl}" style="--k:${k}"></i>`;
    }
    host.innerHTML = html;
  })();

  (function days() {
    const host = $("[data-days]");
    if (!host) return;
    const map = [-1, 0, 1, 2, 3, 4, 5]; // Sun..Sat -> Seg(0)..Sáb(5)
    const idx = map[new Date().getDay()];
    const kids = host.children;
    (kids[idx] || kids[0]).classList.add("is-today");
  })();

  $$("[data-checkin]").forEach((b) => {
    b.addEventListener("click", () => {
      b.classList.toggle("is-done");
      b.textContent = b.classList.contains("is-done") ? "Feito ✓" : "Check-in";
    });
  });
  // Auto "check-in" animation on the dance class once dashboard is live
  const dash = $("[data-dash]");

  /* ---------- 5. Observers (reveal, counters, dashboard live) ---------- */
  if ("IntersectionObserver" in window && FX) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    rvEls.forEach((el) => io.observe(el));

    const cio = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (!e.isIntersecting) return;
        if (dash && dash.contains(e.target) && !dash.classList.contains("is-live")) return;
        runCounter(e.target); cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));

    if (dash) {
      const dio = new IntersectionObserver((ents) => {
        ents.forEach((e) => {
          if (!e.isIntersecting) return;
          dash.classList.add("is-live");
          $$("[data-count]", dash).forEach(runCounter);
          const first = $("[data-checkin]", dash);
          setTimeout(() => { if (first && !first.classList.contains("is-done")) first.click(); }, 2200);
          dio.disconnect();
        });
      }, { threshold: 0.3 });
      dio.observe(dash);
    }
  } else {
    rvEls.forEach((el) => el.classList.add("is-in"));
    if (dash) dash.classList.add("is-live");
    counters.forEach(runCounter);
  }

  /* ---------- 6. Marquee (rAF, velocity-reactive) ---------- */
  const mqRows = $$("[data-mq]").map((row) => {
    const track = $(".mq__track", row);
    const clone = track.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    row.appendChild(clone);
    if (window.innerWidth > 1400) { const c2 = track.cloneNode(true); c2.setAttribute("aria-hidden", "true"); row.appendChild(c2); }
    return { row, tracks: $$(".mq__track", row), dir: parseFloat(row.getAttribute("data-mq")), x: 0 };
  });
  let mqVel = 0, mqVisible = true;
  if (mqRows.length && FX) {
    const mqEl = $(".mq");
    if ("IntersectionObserver" in window) new IntersectionObserver((e) => { mqVisible = e[0].isIntersecting; }).observe(mqEl);
    const step = () => {
      if (mqVisible) mqRows.forEach((r) => {
        const w = r.tracks[0].offsetWidth || 1;
        r.x -= (0.55 + Math.min(Math.abs(mqVel) * 0.12, 6)) * r.dir;
        if (r.x <= -w) r.x += w; if (r.x > 0) r.x -= w;
        const skew = Math.max(-8, Math.min(8, mqVel * 0.35));
        r.tracks.forEach((t) => { t.style.transform = `translate3d(${r.x}px,0,0) skewX(${-skew}deg)`; });
      });
      mqVel *= 0.92;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    let lastY = window.scrollY;
    window.addEventListener("scroll", () => { const y = window.scrollY; mqVel = y - lastY; lastY = y; }, { passive: true });
  }

  /* ---------- 7. Manifesto word scrub ---------- */
  const mf = $("[data-words]");
  if (mf) {
    const wrap = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
            const s = document.createElement("span"); s.className = "mw"; s.textContent = t; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(mf);
    const words = $$(".mw", mf);
    if (FX) {
      let ticking = false;
      const upd = () => {
        ticking = false;
        const r = mf.getBoundingClientRect(), vh = window.innerHeight;
        const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const n = words.length;
        words.forEach((w, i) => {
          const o = Math.max(0, Math.min(1, p * (n + 4) - i));
          w.style.setProperty("--o", (0.14 + o * 0.86).toFixed(3));
        });
      };
      window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
      window.addEventListener("resize", upd);
      upd();
    }
  }

  /* ---------- 8. Scroll progress + section indicator ---------- */
  const prog = $("[data-progress]");
  const onProg = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (prog) prog.style.setProperty("--sp", h > 0 ? (window.scrollY / h).toFixed(4) : 0);
  };
  window.addEventListener("scroll", onProg, { passive: true }); onProg();

  const sxLinks = $$(".sx a");
  if (sxLinks.length) {
    const ids = sxLinks.map((a) => a.dataset.sx);
    const secs = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const updSx = () => {
      const y = window.innerHeight * 0.4;
      let cur = ids[0];
      secs.forEach((s) => { if (s.getBoundingClientRect().top <= y) cur = s.id; });
      sxLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.sx === cur));
    };
    window.addEventListener("scroll", updSx, { passive: true }); updSx();
  }

  /* ---------- 9. Pointer FX: spotlight, tilt, magnetic, hero depth, cursor ---------- */
  if (fine && FX) {
    $$("[data-spotlight]").forEach((grid) => {
      const cards = $$(".vcard, .tile", grid);
      grid.addEventListener("pointermove", (e) => {
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          c.style.setProperty("--mx", e.clientX - r.left + "px");
          c.style.setProperty("--my", e.clientY - r.top + "px");
        });
      });
    });

    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        if (!el.classList.contains("is-in")) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        const k = r.width > 500 ? 3 : 6;
        el.style.transition = "transform .15s ease-out, border-color .4s";
        el.style.transform = `perspective(900px) rotateX(${(-py * k).toFixed(2)}deg) rotateY(${(px * k).toFixed(2)}deg) translateZ(0)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .7s cubic-bezier(.16,1,.3,1), border-color .4s";
        el.style.transform = "";
      });
    });

    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        el.style.transition = "transform .2s ease-out, background .25s, box-shadow .25s, color .25s, border-color .25s";
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1), background .25s, box-shadow .25s, color .25s, border-color .25s";
        el.style.transform = "";
      });
    });

    // Hero depth parallax
    const hv = $(".hx__visual");
    if (hero && hv) {
      const frame = $("[data-tilt-hero]", hv);
      const layers = $$("[data-depth]", hv);
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      const loop = () => {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        if (frame) frame.style.transform = `perspective(1100px) rotateY(${cx * 7}deg) rotateX(${-cy * 6}deg)`;
        layers.forEach((l) => { const d = parseFloat(l.dataset.depth); l.style.transform = `translate3d(${cx * 22 * d}px, ${cy * 18 * d}px, 0)`; });
        raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(loop) : 0;
      };
      hero.addEventListener("pointermove", (e) => {
        tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
    }

    // Dashboard floating chips follow pointer lightly
    const stage = $("[data-dash-stage]");
    if (stage) {
      const fl = $$("[data-depth]", stage);
      stage.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        fl.forEach((l) => { const d = parseFloat(l.dataset.depth); l.style.transform = `translate3d(${px * 30 * d}px, ${py * 24 * d}px, 0)`; });
      });
    }

    // Cursor
    const dot = $(".cursor-dot"), glow = $(".cursor-glow");
    if (dot && glow) {
      let mx = -100, my = -100, gx = -100, gy = -100, dx = -100, dy = -100, on = false;
      window.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        mx = e.clientX; my = e.clientY;
        if (!on) { on = true; root.classList.add("has-cursor"); gx = dx = mx; gy = dy = my; }
      }, { passive: true });
      document.addEventListener("pointerleave", () => { on = false; root.classList.remove("has-cursor"); });
      document.addEventListener("pointerover", (e) => {
        dot.classList.toggle("is-hover", !!e.target.closest("a, button, summary, [role=tab], .cls__btn, select, input"));
      });
      const loop = () => {
        dx += (mx - dx) * 0.35; dy += (my - dy) * 0.35;
        gx += (mx - gx) * 0.1; gy += (my - gy) * 0.1;
        dot.style.transform = `translate3d(${dx}px,${dy}px,0)`;
        glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- 10. Hero EKG canvas ---------- */
  (function heroEkg() {
    const cv = $("[data-hero-ekg]");
    if (!cv || !FX) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, head = 0, run = true;
    const P = 420;
    const f = (x) => {
      const t = ((x % P) + P) % P;
      if (t < 250) return 0;
      const u = t - 250;
      if (u < 14) return -6 * Math.sin((u / 14) * Math.PI);
      if (u < 24) return (u - 14) * 2.2;
      if (u < 34) return 22 - (u - 24) * 8.6;
      if (u < 46) return -64 + (u - 34) * 7.4;
      if (u < 58) return 25 - (u - 46) * 2.1;
      if (u < 90) return -10 * Math.sin(((u - 58) / 32) * Math.PI);
      return 0;
    };
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize(); window.addEventListener("resize", resize);
    const mid = () => h * 0.6;
    const frame = () => {
      if (!run) return;
      ctx.clearRect(0, 0, w, h);
      const y0 = mid();
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(223,166,36,0.10)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) { const y = y0 + f(x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      const tail = Math.min(520, w * 0.5);
      const g = ctx.createLinearGradient(head - tail, 0, head, 0);
      g.addColorStop(0, "rgba(223,166,36,0)"); g.addColorStop(0.7, "rgba(223,166,36,0.55)"); g.addColorStop(1, "rgba(255,240,200,1)");
      ctx.lineWidth = 2.4; ctx.strokeStyle = g; ctx.shadowColor = "rgba(223,166,36,0.9)"; ctx.shadowBlur = 14;
      ctx.beginPath();
      for (let x = Math.max(0, head - tail); x <= head; x += 2) { const y = y0 + f(x); x === Math.max(0, head - tail) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.shadowBlur = 24; ctx.fillStyle = "#fff6d8";
      ctx.beginPath(); ctx.arc(head, y0 + f(head), 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      head += 3.2; if (head > w + tail) head = 0;
      requestAnimationFrame(frame);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((e) => { const v = e[0].isIntersecting; if (v && !run) { run = true; requestAnimationFrame(frame); } else if (!v) run = false; }).observe(cv);
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- 11. Lenis + GSAP scenes ---------- */
  if (!FX || !hasGSAP) return;
  const gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    window.__lenis = lenis;
    lenis.on("scroll", ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    if (document.body.classList.contains("has-intro")) {
      lenis.stop();
      document.addEventListener("bfit:intro-done", () => lenis.start(), { once: true });
    }
    // Anchor links via Lenis
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: id === "#inicio" ? 0 : -76, duration: 1.4 });
      history.replaceState(null, "", id);
    });
  }

  const mm = gsap.matchMedia();

  // Hero scroll-out depth
  gsap.to(".hx__photo", { yPercent: 10, scale: 1.18, ease: "none", scrollTrigger: { trigger: ".hx", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hx__copy", { y: -60, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ".hx", start: "center top+=30%", end: "bottom top", scrub: true } });
  $$(".hx [data-speed]").forEach((el) => {
    gsap.to(el, { y: () => window.innerHeight * parseFloat(el.dataset.speed), ease: "none", scrollTrigger: { trigger: ".hx", start: "top top", end: "bottom top", scrub: true } });
  });

  // Dashboard: 3D tilt that flattens as it enters
  const dStage = $("[data-dash-stage]");
  if (dStage && dash) {
    mm.add("(min-width: 700px)", () => {
      gsap.fromTo(dash, { rotateX: 26, scale: 0.86, y: 60, opacity: 0.4 }, {
        rotateX: 0, scale: 1, y: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: dStage, start: "top 95%", end: "top 30%", scrub: 0.6 },
      });
    });
    mm.add("(max-width: 699px)", () => {
      gsap.fromTo(dash, { rotateX: 14, scale: 0.94, opacity: 0.5 }, {
        rotateX: 0, scale: 1, opacity: 1, ease: "none",
        scrollTrigger: { trigger: dStage, start: "top 100%", end: "top 45%", scrub: 0.5 },
      });
    });
  }

  // Energia: outline word drift + image parallax
  const word = $("[data-drift]");
  if (word) gsap.fromTo(word, { xPercent: 0 }, { xPercent: -28, ease: "none", scrollTrigger: { trigger: ".ex", start: "top bottom", end: "bottom top", scrub: true } });
  $$("[data-parallax-img]").forEach((el) => {
    gsap.fromTo(el, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$(".founder__shot img, .campaign__shot img").forEach((img, i) => {
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });
  // Footer wordmark rise
  gsap.fromTo(".footer__mega span", { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "top 40%", scrub: true } });

  // História — horizontal pinned scroll on desktop
  const hs = $(".hs"), track = $("[data-hs-track]"), pin = $("[data-hs-pin]"), bar = $("[data-hs-bar]");
  if (hs && track && pin) {
    mm.add("(min-width: 980px)", () => {
      hs.classList.add("is-horizontal");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: pin, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8,
          invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => { if (bar) bar.parentElement.style.setProperty("--hp", self.progress.toFixed(4)); },
        },
      });
      $$(".hs__num", track).forEach((n) => {
        gsap.fromTo(n, { xPercent: 30 }, { xPercent: -10, ease: "none", scrollTrigger: { trigger: n.parentElement, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
      return () => { hs.classList.remove("is-horizontal"); };
    });
  }

  const refresh = () => ST.refresh();
  window.addEventListener("load", refresh);
  document.addEventListener("bfit:intro-done", () => setTimeout(refresh, 300));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
})();
