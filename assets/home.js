// The home page's four interactions (DESIGN.md "Signature interactions"). Drawings are the app's; this file only
// moves them, swaps them (a cut with a squash and pop, never a crossfade) and plays the app's own stickers.
(function () {
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var lang = function () { return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "zh"; };
  var raf = window.requestAnimationFrame.bind(window);
  // Only warm pictures in the language on screen (the other language's copies stay unloaded).
  var inLanguage = function (img) { var l = img.getAttribute("data-l"); return !l || l === lang(); };
  // Story pictures carry data-src until their chapter is near, so they never compete with the first screen.
  var load = function (img) {
    if (!img.hasAttribute("data-src") || !inLanguage(img)) return;
    img.srcset = img.getAttribute("data-srcset");
    img.src = img.getAttribute("data-src");
    img.removeAttribute("data-src");
  };

  // ------------------------------------------------------------------ 1. hero: the two of them meet
  function hero() {
    var stage = document.querySelector(".stage");
    if (!stage) return;
    var mates = stage.querySelectorAll(".mate");
    var hero = document.querySelector(".hero");
    var t = 0, forced = false, together = false, ticking = false;

    function pose(hug) {
      if (hug === together) return;
      together = hug;
      stage.classList.toggle("together", hug);
      Array.prototype.forEach.call(mates, function (mate) {
        var img = mate.querySelector("img");
        var next = hug ? mate.getAttribute("data-hug") : mate.getAttribute("data-wave");
        mate.style.setProperty("--iw", hug ? mate.getAttribute("data-hug-w") : mate.getAttribute("data-wave-w"));
        img.src = next;
        img.classList.remove("pop");
        if (!still.matches) { void img.offsetWidth; img.classList.add("pop"); }
      });
    }

    function render() {
      ticking = false;
      stage.style.setProperty("--t", t.toFixed(3));
      if (t >= 0.98) pose(true);
      else if (t < 0.9) pose(false);
    }

    function fromScroll() {
      if (forced) {
        if (window.scrollY < 4) return;
        forced = false;
      }
      var reach = Math.max(1, hero.offsetHeight * 0.32);
      t = Math.min(1, Math.max(0, window.scrollY / reach));
      // ease in-out so they set off gently and arrive gently
      t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (!ticking) { ticking = true; raf(render); }
    }

    function runTogether() {
      if (together) return;
      forced = true;
      var from = t, start = performance.now();
      (function step(now) {
        var k = Math.min(1, (now - start) / 900);
        t = from + (1 - from) * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
        render();
        if (k < 1) raf(step);
      })(start);
    }

    if (still.matches) { t = 1; render(); return; }
    window.addEventListener("scroll", fromScroll, { passive: true });
    fromScroll();
    Array.prototype.forEach.call(mates, function (mate) {
      mate.addEventListener("click", function () {
        if (!together) { runTogether(); return; }
        var img = mate.querySelector("img");
        img.classList.remove("pop");
        if (!img.classList.contains("hop")) img.classList.add("hop");
      });
    });

    // They lean toward the pointer: a curious tilt of at most 4°.
    if (window.matchMedia("(pointer: fine)").matches) {
      var pending = null;
      window.addEventListener("pointermove", function (event) {
        pending = event;
        raf(function () {
          if (!pending) return;
          var e = pending; pending = null;
          var box = stage.getBoundingClientRect();
          if (box.bottom < 0) return;
          Array.prototype.forEach.call(mates, function (mate) {
            var m = mate.getBoundingClientRect();
            var dx = (e.clientX - (m.left + m.width / 2)) / (window.innerWidth / 2);
            mate.style.setProperty("--lean", (Math.max(-1, Math.min(1, dx)) * 4).toFixed(2) + "deg");
          });
        });
      }, { passive: true });
    }
  }

  // ------------------------------------------------------------------ 2. one day of you two
  function day() {
    var section = document.querySelector(".day");
    if (!section) return;
    var steps = section.querySelectorAll(".step");
    var rail = section.querySelectorAll(".rail button");
    var current = -1, z = 1;

    function show(n) {
      if (n === current) return;
      current = n;
      section.style.setProperty("--tint", "var(--" + steps[n].getAttribute("data-tint") + ")");
      Array.prototype.forEach.call(steps, function (s, i) { s.classList.toggle("active", i === n); });
      Array.prototype.forEach.call(rail, function (b, i) {
        if (i === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      var shots = section.querySelectorAll(".screens img[data-step='" + n + "']");
      Array.prototype.forEach.call(shots, function (img) {
        load(img);
        z += 1;
        img.style.zIndex = z;
        if (still.matches) { img.classList.add("first"); return; }
        img.classList.remove("shown", "first");
        void img.offsetWidth;
        img.classList.add("shown");
      });
    }

    var watch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) show(Number(entry.target.getAttribute("data-n")));
      });
    }, { rootMargin: window.innerWidth <= 760 ? "-84% 0px -15% 0px" : "-45% 0px -45% 0px" });
    Array.prototype.forEach.call(steps, function (s, i) { s.setAttribute("data-n", i); watch.observe(s); });
    current = 0;
    section.style.setProperty("--tint", "var(--sky)");
    steps[0].classList.add("active");
    rail[0].setAttribute("aria-current", "step");

    // Warm the next screens once the chapter is near, so the wipes never show an empty frame.
    var near = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      near.disconnect();
      Array.prototype.forEach.call(section.querySelectorAll(".screens img"), load);
    }, { rootMargin: "25% 0px" });
    document.addEventListener("little-us-lang", function () {
      Array.prototype.forEach.call(section.querySelectorAll(".screens img[data-step='" + current + "']"), load);
    });
    near.observe(section);

    Array.prototype.forEach.call(rail, function (b, i) {
      b.addEventListener("click", function () {
        var box = steps[i].getBoundingClientRect();
        var target = window.scrollY + box.top - (window.innerWidth <= 760 ? window.innerHeight * 0.8 : window.innerHeight / 2 - box.height / 2);
        window.scrollTo({ top: target, behavior: still.matches ? "auto" : "smooth" });
      });
    });
  }

  // ------------------------------------------------------------------ 3. send a hug
  var STICKER_MS = { hug: 1500, love: 1667, missyou: 1667, night: 2000 };
  var REPLIES = {
    zh: { hug: "收到了！我也抱抱你", love: "愛你愛你", missyou: "我也好想你，週末見", night: "晚安，明天見" },
    en: { hug: "Got it! Hugging you back", love: "Love you more", missyou: "Miss you too. See you Saturday", night: "Goodnight, see you tomorrow" },
  };
  function hug() {
    var form = document.querySelector(".hug-controls");
    if (!form) return;
    var thread = document.querySelector(".thread");
    var count = document.querySelector(".sent-count");
    var thumbs = form.querySelectorAll("[data-sticker-thumb]");
    var sent = 0, replyTimer = null;

    function kind() { return form.querySelector("input[name=critter]:checked").value; }
    function sticker() { return form.querySelector("input[name=sticker]:checked").value; }
    function paintThumbs() {
      Array.prototype.forEach.call(thumbs, function (img) {
        img.src = "assets/stickers/" + kind() + "-" + img.getAttribute("data-sticker-thumb") + "-still.webp";
      });
    }
    form.addEventListener("change", function (event) { if (event.target.name === "critter") paintThumbs(); });

    function add(node) {
      thread.appendChild(node);
      while (thread.children.length > 9) thread.removeChild(thread.firstElementChild);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var k = kind(), s = sticker(), base = "assets/stickers/" + k + "-" + s;
      var bubble = document.createElement("div");
      bubble.className = "msg mine live";
      var img = new Image(132, 132);
      img.alt = form.querySelector("input[name=sticker]:checked + span").textContent.trim();
      img.decoding = "async";
      if (still.matches) {
        img.src = base + "-still.webp";
      } else {
        // A fresh fragment makes the browser start the animation from its first frame for this bubble.
        sent += 1;
        img.src = base + ".webp#" + sent + "-" + Date.now();
        // The app plays a sticker three times, then rests on its last frame.
        var rest = function () { img.src = base + "-end.webp"; };
        img.addEventListener("load", function once() { img.removeEventListener("load", once); setTimeout(rest, STICKER_MS[s] * 3); });
      }
      bubble.appendChild(img);
      var old = thread.querySelector(".receipt");
      if (old) old.remove();
      add(bubble);
      var receipt = document.createElement("div");
      receipt.className = "receipt";
      receipt.textContent = lang() === "zh" ? "已送出" : "Sent";
      add(receipt);
      if (still.matches) sent += 1;
      count.textContent = lang() === "zh" ? "今天送出了 " + sent + " 個" : sent + " sent today";

      clearTimeout(replyTimer);
      replyTimer = setTimeout(function () {
        receipt.textContent = lang() === "zh" ? "已讀" : "Read";
        var reply = document.createElement("div");
        reply.className = "msg theirs";
        reply.textContent = REPLIES[lang()][s];
        add(reply);
      }, 1600);
    });

    // Warm the chosen critter's stickers once the demo is near.
    var near = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      near.disconnect();
      paintThumbs();
      if (!still.matches) new Image().src = "assets/stickers/" + kind() + "-hug.webp";
    }, { rootMargin: "50% 0px" });
    near.observe(form);
  }

  // ------------------------------------------------------------------ 4. days together
  var KEY = "little-us-day";
  function parse(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
  }
  function todayUTC() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); }
  var DAY = 86400000;
  // RelationshipMath.swift: the first day is day 1; milestones every 100 to 1,000, every 500 after, plus 520 and 1314.
  function nextOccasion(start, days) {
    var best = null;
    var milestones = [520, 1314];
    for (var m = 100; m <= 1000; m += 100) milestones.push(m);
    for (var n = 1500; n <= days + 1000; n += 500) milestones.push(n);
    milestones.forEach(function (d) {
      if (d > days && (!best || d - days < best.away)) best = { kind: "day", n: d, away: d - days, at: start + (d - 1) * DAY };
    });
    var s = new Date(start);
    for (var y = 1; y < 80; y++) {
      var at = Date.UTC(s.getUTCFullYear() + y, s.getUTCMonth(), s.getUTCDate());
      var away = Math.round((at - todayUTC()) / DAY);
      if (away > 0) { if (!best || away < best.away) best = { kind: "year", n: y, away: away, at: at }; break; }
    }
    return best;
  }
  function fmt(ms, l) {
    var d = new Date(ms);
    return l === "zh" ? d.getUTCFullYear() + " 年 " + (d.getUTCMonth() + 1) + " 月 " + d.getUTCDate() + " 日"
      : d.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  }

  function days() {
    var input = document.getElementById("since");
    if (!input) return;
    var odo = document.querySelector(".odometer");
    var since = document.querySelector(".since");
    var next = document.querySelector(".next");
    var cheer = document.querySelectorAll(".days-wrap .cheerer");
    var shown = -1;
    try { var saved = localStorage.getItem(KEY); if (saved && !isNaN(parse(saved))) input.value = saved; } catch (e) {}
    input.max = new Date(todayUTC()).toISOString().slice(0, 10);

    function digits(n) {
      var text = String(n);
      while (odo.children.length < text.length) {
        var d = document.createElement("span");
        d.className = "digit";
        var col = document.createElement("span");
        for (var i = 0; i < 10; i++) { var c = document.createElement("span"); c.textContent = i; col.appendChild(c); }
        d.appendChild(col);
        odo.appendChild(d);
      }
      while (odo.children.length > text.length) odo.removeChild(odo.firstElementChild);
      Array.prototype.forEach.call(odo.children, function (d, i) {
        d.firstElementChild.style.setProperty("--d", (i * 0.08) + "s");
        d.firstElementChild.style.setProperty("--n", text[i]);
      });
      odo.setAttribute("aria-label", text);
    }

    function update(save) {
      var start = parse(input.value);
      if (isNaN(start)) return;
      var n = Math.max(0, Math.round((todayUTC() - start) / DAY) + 1);
      var l = lang();
      if (n !== shown) {
        if (shown >= 0 && !still.matches) {
          Array.prototype.forEach.call(cheer, function (c, i) {
            setTimeout(function () { c.classList.remove("hop"); void c.offsetWidth; c.classList.add("hop"); }, i * 120);
          });
        }
        shown = n;
        digits(n);
      }
      since.textContent = l === "zh" ? "從 " + fmt(start, l) + " 開始" : "Since " + fmt(start, l);
      var o = nextOccasion(start, n);
      if (o) {
        var what = o.kind === "day"
          ? (l === "zh" ? "第 " + o.n.toLocaleString("en") + " 天" : "day " + o.n.toLocaleString("en"))
          : (l === "zh" ? o.n + " 週年" : (o.n === 1 ? "your first anniversary" : "your " + o.n + "-year anniversary"));
        next.innerHTML = l === "zh"
          ? "再 <b>" + o.away + "</b> 天就是" + what + "（" + fmt(o.at, l) + "）"
          : "<b>" + o.away + "</b> " + (o.away === 1 ? "day" : "days") + " until " + what + " (" + fmt(o.at, l) + ")";
      }
      if (save) { try { localStorage.setItem(KEY, input.value); } catch (e) {} }
    }
    input.addEventListener("change", function () { update(true); });
    input.addEventListener("input", function () { update(true); });
    document.addEventListener("little-us-lang", function () { update(false); });

    // Count up from zero the first time the card comes into view.
    digits(0);
    var near = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      near.disconnect();
      update(false);
    }, { threshold: 0.4 });
    near.observe(odo);
  }

  function start() { hero(); day(); hug(); days(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
