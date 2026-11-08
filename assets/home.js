// The home page's four interactions (DESIGN.md "Signature interactions"). Drawings are the app's; this file only
// moves them, swaps them (a cut with a squash and pop, never a crossfade) and plays the app's own stickers.
(function () {
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var lang = function () { return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "zh"; };
  var raf = window.requestAnimationFrame.bind(window);
  // Only warm pictures in the language on screen (the other language's copies stay unloaded).
  var inLanguage = function (img) { var l = img.getAttribute("data-l"); return !l || l === lang(); };
  // Story pictures carry data-src until their chapter is near, so they never compete with the first screen.
  var load = function (scr) {
    if (!inLanguage(scr)) return;
    Array.prototype.forEach.call(scr.querySelectorAll("[data-srcset]"), function (el) {
      el.srcset = el.getAttribute("data-srcset");
      el.removeAttribute("data-srcset");
      if (el.hasAttribute("data-src")) { el.src = el.getAttribute("data-src"); el.removeAttribute("data-src"); }
    });
  };


  // ------------------------------------------------------------------ 0. the wordmark: parallax, and a hop on tap
  function mark() {
    var el = document.querySelector(".mark");
    if (!el) return;
    if (/[?&]wm=upper/.test(location.search)) el.classList.add("upper");
    el.addEventListener("click", function (event) {
      var b = event.target.closest(".sit");
      if (!b || still.matches) return;
      var img = b.querySelector("img");
      img.classList.remove("hop"); void img.offsetWidth; img.classList.add("hop");
    });
    if (still.matches) return;
    var ticking = false;
    function paint() {
      ticking = false;
      var y = Math.min(window.scrollY, window.innerHeight);
      el.style.setProperty("--px", (y * 0.28).toFixed(1) + "px");
      el.style.setProperty("--cx", (y * -0.06).toFixed(1) + "px");
      el.style.setProperty("--cy", (y * 0.05).toFixed(1) + "px");
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; raf(paint); } }, { passive: true });
  }


  // ------------------------------------------------------------------ 0b. the bear in the U
  // DESIGN.md "Bear in the U". Three concepts behind ?bear=a|b|c; one gesture each, done carefully.
  var BEAR_DEFAULT = "c";
  var SPRITE = { neutral: 232, blink: 232, wave: 264, happy: 234, hug: 281 };  // drawn widths, px
  function bear() {
    var mark = document.querySelector(".mark"), hit = document.querySelector(".mark .u-hit");
    if (!hit) return;
    var q = /[?&]bear=([abc])/.exec(location.search);
    var concept = q ? q[1] : BEAR_DEFAULT;
    mark.setAttribute("data-bear", concept);
    var u = document.querySelector(".mark .u");
    var stage = u.querySelector(".u-stage");
    var chains = [stage.querySelector(".b-pos")];
    if (concept === "b") chains.push(u.querySelector(".u-paws .b-pos"));
    var tilts = chains.map(function (c) { return c.querySelector(".b-tilt"); });
    var fxs = chains.map(function (c) { return c.querySelector(".b-fx"); });
    var pawR = u.querySelector(".paw.r");
    var pa = stage.querySelector(".pa"), pb = stage.querySelector(".pb");
    var REST = { a: 0.02, b: 0, c: 0.0 }[concept];
    var y = REST, pose = null, busy = false, queued = false, inside = false, leaveTimer = null, started = 0;
    var rest = concept === "b" ? "hug" : "neutral";
    var poses = concept === "b" ? ["hug"] : concept === "a" ? ["neutral", "blink", "wave", "happy"] : ["neutral", "blink", "happy"];
    poses.forEach(function (n) { new Image().src = "assets/mark/bear-" + n + ".webp"; });
    new Image().src = "assets/art/heart-particle.webp";
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var ty = function (v, px) { return "0 calc(" + (-v).toFixed(3) + "em" + (px ? " + " + px + "px" : "") + ")"; };
    var all = function (els, frames, opts) { return Promise.all(els.map(function (el) { return el.animate(frames, opts).finished; })); };

    function setPose(name) {
      if (name === pose) return;
      var first = pose === null;
      pose = name;
      var src = "assets/mark/bear-" + name + ".webp";
      if (still.matches && !first) {
        pb.src = pa.src; pb.style.setProperty("--pw", pa.style.getPropertyValue("--pw")); pb.style.setProperty("--dx", pa.style.getPropertyValue("--dx") || 0); pb.style.opacity = 1;
        pb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
      }
      pa.src = src; pa.style.setProperty("--pw", SPRITE[name]);
      // the wave drawing is wider on the paw's side: keep its body (head centre at 108 of 264 px) in the middle
      pa.style.setProperty("--dx", name === "wave" ? 24 : 0);
    }
    setPose(rest);
    chains.forEach(function (c) { c.style.translate = ty(REST); });

    function move(to, ms, easing, dip, over) {
      var from = y; y = to;
      if (still.matches) { chains.forEach(function (c) { c.style.translate = ty(to); }); return Promise.resolve(); }
      var frames;
      if (dip) {
        var d = dip / (dip + ms);
        frames = [{ translate: ty(from) }, { translate: ty(from, 3), offset: d, easing: "cubic-bezier(.3,.9,.4,1)" },
                  { translate: ty(to + (over || 0)), offset: d + (1 - d) * 0.66, easing: "cubic-bezier(.45,0,.55,1)" }, { translate: ty(to) }];
      } else frames = [{ translate: ty(from), easing: easing }, { translate: ty(to) }];
      return all(chains, frames, { duration: ms + (dip || 0), fill: "forwards" }).then(function () {
        chains.forEach(function (c) { c.style.translate = ty(to); c.getAnimations().forEach(function (a) { a.cancel(); }); });
      });
    }
    function blinkOnce() {
      if (pose !== "neutral") return Promise.resolve();
      setPose("blink");
      return wait(120).then(function () { if (pose === "blink") setPose("neutral"); });
    }
    (function scheduleBlink() {
      setTimeout(function () { if (!busy && concept !== "b") blinkOnce(); scheduleBlink(); }, 3000 + Math.random() * 3000);
    })();
    function heart(x, yb) {
      if (still.matches) return;
      var h = new Image();
      h.src = "assets/art/heart-particle.webp"; h.alt = ""; h.className = "b-heart";
      h.style.left = x + "em"; h.style.top = (0.75 - yb) + "em";
      u.appendChild(h);
      h.animate([{ opacity: 0, translate: "-50% 0", scale: .6 }, { opacity: 1, translate: "-50% -.05em", scale: 1, offset: .25 },
                 { opacity: 0, translate: "-50% -.24em", scale: .9 }], { duration: 950, easing: "cubic-bezier(.2,.7,.3,1)" })
        .finished.then(function () { h.remove(); });
    }
    function squash(amount, ms) {
      return all(fxs, [{ scale: "1 1" }, { scale: (1 + amount / 2) + " " + (1 - amount), offset: .35 }, { scale: (1 - amount / 4) + " " + (1 + amount / 3), offset: .7 }, { scale: "1 1" }],
                 { duration: ms, easing: "ease-out" });
    }

    // ---- the three hellos
    var HELLO = {
      // a: cup wave — perk up ≤ 12 % of its height, wave over the rim, happy beat, settle
      a: function () {
        squash(0.04, 360);
        all(fxs, [{ rotate: "0deg" }, { rotate: "0deg", offset: .25 }, { rotate: "-2deg", offset: .62 }, { rotate: ".6deg", offset: .82 }, { rotate: "0deg" }], { duration: 520, easing: "ease-out" });
        setTimeout(function () { setPose("wave"); }, 250);
        return move(0.074, 280, null, 80, 0.012).then(function () {
          return all(fxs, [{ rotate: "0deg" }, { rotate: "5deg", offset: .25 }, { rotate: "-1deg", offset: .5 }, { rotate: "3deg", offset: .75 }, { rotate: "0deg" }],
                     { duration: 520, easing: "ease-in-out" });
        }).then(function () {
          setPose("happy"); heart(0.315, 0.074 + 0.47); squash(0.03, 260);
          return wait(400);
        }).then(function () {
          if (inside) return;
          return move(REST, 240, "cubic-bezier(.4,0,.2,1)").then(function () { setPose("neutral"); return wait(60); }).then(blinkOnce);
        });
      },
      // b: hug — lean toward its right a little, the right paw (in front of the stroke) waves twice
      b: function () {
        all(tilts.map(function (t) { return t; }), [{ rotate: "0deg" }, { rotate: "-1.2deg", offset: .25 }, { rotate: "3deg", offset: .7 }, { rotate: "2.4deg" }],
            { duration: 360, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "forwards" });
        return wait(200).then(function () {
          return pawR.animate([{ rotate: "0deg" }, { rotate: "-24deg", offset: .22, easing: "ease-in-out" }, { rotate: "-6deg", offset: .5, easing: "ease-in-out" },
                               { rotate: "-18deg", offset: .74, easing: "ease-in-out" }, { rotate: "0deg" }], { duration: 760 }).finished;
        }).then(function () {
          heart(0.53, 0.33);
          return wait(380);
        }).then(function () {
          if (inside) return;
          return all(tilts, [{ rotate: "2.4deg" }, { rotate: "-.6deg", offset: .6 }, { rotate: "0deg" }], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)" })
            .then(function () { tilts.forEach(function (t) { t.getAnimations().forEach(function (a) { a.cancel(); }); }); });
        });
      },
      // c: nod — a happy squint caught on the first dip, two little nods, one tiny heart
      c: function () {
        var nod = function (depth, ms) {
          return Promise.all([
            all(chains, [{ translate: ty(REST) }, { translate: ty(REST, depth), offset: .4, easing: "cubic-bezier(.3,0,.3,1)" }, { translate: ty(REST, -1), offset: .78 }, { translate: ty(REST) }], { duration: ms }),
            all(fxs, [{ rotate: "0deg", scale: "1 1" }, { rotate: "2.5deg", scale: "1.02 .97", offset: .4 }, { rotate: "-.5deg", scale: "1 1.01", offset: .78 }, { rotate: "0deg", scale: "1 1" }], { duration: ms })
          ]);
        };
        setTimeout(function () { setPose("happy"); }, 110);    // on the first dip's lowest point
        return nod(5, 300).then(function () { return nod(3.5, 280); }).then(function () {
          heart(0.315, REST + 0.47);
          return wait(520);
        }).then(function () {
          if (inside) return;
          setPose("neutral"); return wait(90).then(blinkOnce);
        });
      }
    };
    var STILL = {
      a: function () { setPose("wave"); return wait(700).then(function () { setPose("happy"); return wait(400); }).then(function () { if (!inside) setPose("neutral"); }); },
      b: function () { return wait(10); },
      c: function () { setPose("happy"); return wait(900).then(function () { if (!inside) setPose("neutral"); }); }
    };

    function hello(e) {
      if (e && e.type === "click" && busy && Date.now() - started < 700) return;
      if (busy) { queued = true; return; }
      busy = true; started = Date.now(); clearTimeout(leaveTimer);
      (still.matches ? STILL[concept]() : HELLO[concept]()).then(function () {
        busy = false;
        if (queued) { queued = false; hello(); }
      });
    }
    function settleAfterLeave() {
      if (busy) return;
      busy = true;
      tilts.forEach(function (t) { t.style.rotate = "0deg"; });
      var done;
      if (concept === "a") done = move(REST, 240, "cubic-bezier(.4,0,.2,1)").then(function () { setPose("neutral"); return wait(60); }).then(blinkOnce);
      else if (concept === "b") done = all(tilts, [{ rotate: "2.4deg" }, { rotate: "0deg" }], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)" })
        .then(function () { tilts.forEach(function (t) { t.getAnimations().forEach(function (a) { a.cancel(); }); }); });
      else { setPose("neutral"); done = wait(90).then(blinkOnce); }
      done.then(function () { busy = false; });
    }

    hit.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      inside = true; clearTimeout(leaveTimer);
      if (!busy) hello();
    });
    hit.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || still.matches || busy || concept === "b") return;
      var r = hit.getBoundingClientRect();
      var dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5)));
      tilts.forEach(function (t) { t.style.rotate = (dx * 6).toFixed(1) + "deg"; });
    });
    hit.addEventListener("pointerleave", function (e) {
      if (e.pointerType !== "mouse") return;
      inside = false;
      if (concept !== "b") tilts.forEach(function (t) { t.style.rotate = "0deg"; });
      leaveTimer = setTimeout(settleAfterLeave, 1500);
    });
    hit.addEventListener("click", hello);

    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        setTimeout(hello, 1200);
      }, { threshold: 0.6 });
      seen.observe(hit);
    }
  }

  // ------------------------------------------------------------------ 5. goodnight: the page turns to night
  function night() {
    var section = document.querySelector(".night");
    if (!section || !section.querySelector(".night-pin")) return;
    var imgs = section.querySelectorAll(".bed img");
    var asleep = false;
    function sleep(on) {
      if (on === asleep) return;
      asleep = on;
      section.classList.toggle("asleep", on);
      Array.prototype.forEach.call(imgs, function (img) {
        var v = img.getAttribute(on ? "data-asleep" : "data-awake").split(" ");
        img.src = v[0];
        img.style.setProperty("--w", v[1]);
        img.classList.remove("pop");
        if (!still.matches) { void img.offsetWidth; img.classList.add("pop"); }
      });
    }
    function set(p) {
      section.style.setProperty("--p", p.toFixed(3));
      section.classList.toggle("dark", p > 0.42);
      document.documentElement.classList.toggle("is-night", p > 0.42 && section.getBoundingClientRect().top < 64);
      sleep(p > 0.78);
    }
    if (still.matches) { set(1); return; }
    var ticking = false;
    function paint() {
      ticking = false;
      var box = section.getBoundingClientRect();
      var run = section.offsetHeight - window.innerHeight;
      set(Math.min(1, Math.max(0, -box.top / Math.max(1, run * 0.8))));
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; raf(paint); } }, { passive: true });
    paint();
  }

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
    var device = section.querySelector(".device");
    // the camera pushes in as the chapter arrives
    if (device && !still.matches) {
      var pushTick = false;
      var push = function () {
        pushTick = false;
        var box = section.getBoundingClientRect();
        var k = Math.min(1, Math.max(0, 1 - box.top / window.innerHeight));
        device.style.setProperty("--push", (0.86 + 0.14 * k).toFixed(3));
      };
      window.addEventListener("scroll", function () { if (!pushTick) { pushTick = true; raf(push); } }, { passive: true });
      push();
    }

    function show(n) {
      if (n === current) return;
      current = n;
      section.style.setProperty("--tint", "var(--" + steps[n].getAttribute("data-tint") + ")");
      var turn = [[-12, 4], [10, -3], [-8, 2], [9, 3], [-10, -2], [0, 0]][n] || [0, 0];
      if (device && !still.matches) {
        device.style.setProperty("--ry", turn[0] + "deg");
        device.style.setProperty("--rx", turn[1] + "deg");
      }
      Array.prototype.forEach.call(steps, function (s, i) { s.classList.toggle("active", i === n); });
      Array.prototype.forEach.call(rail, function (b, i) {
        if (i === n) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      var shots = section.querySelectorAll(".glass .scr[data-step='" + n + "']");
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
      Array.prototype.forEach.call(section.querySelectorAll(".glass .scr"), load);
    }, { rootMargin: "25% 0px" });
    document.addEventListener("little-us-lang", function () {
      Array.prototype.forEach.call(section.querySelectorAll(".glass .scr[data-step='" + current + "']"), load);
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

      // On a phone the chat sits under the form: bring it into view so you see your sticker arrive.
      var phone = thread.closest(".phone"), box = phone.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) {
        phone.scrollIntoView({ block: "center", behavior: still.matches ? "auto" : "smooth" });
      }

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

  function start() { mark(); bear(); hero(); day(); hug(); days(); night(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
