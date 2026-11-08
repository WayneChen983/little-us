// Every page: language, the top bar, reveals, critter hops, store buttons, magnetic buttons. No trackers.
// Without JavaScript both languages show, one after the other, and everything is visible.
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var still = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  // --- One language at a time: #zh / #en in the link, then the last choice, then the browser's language.
  function pick() {
    var hash = location.hash.replace("#", "");
    if (hash === "zh" || hash === "en") return hash;
    try {
      var saved = localStorage.getItem("little-us-lang");
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) {}
    return (navigator.language || "").toLowerCase().indexOf("zh") === 0 ? "zh" : "en";
  }

  function apply(lang) {
    root.setAttribute("data-lang", lang);
    root.lang = lang === "zh" ? "zh-Hant" : "en";
    var buttons = document.querySelectorAll("[data-set-lang]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-set-lang") === lang));
    }
    var texts = document.querySelectorAll("[data-zh]");
    for (var j = 0; j < texts.length; j++) {
      texts[j].textContent = texts[j].getAttribute("data-" + lang);
    }
    var labels = document.querySelectorAll("[data-aria-zh]");
    for (var k = 0; k < labels.length; k++) {
      labels[k].setAttribute("aria-label", labels[k].getAttribute("data-aria-" + lang));
    }
    document.dispatchEvent(new CustomEvent("little-us-lang", { detail: lang }));
  }

  function set(lang, save) {
    if (save) {
      try { localStorage.setItem("little-us-lang", lang); } catch (e) {}
    }
    if (save && document.startViewTransition && !still.matches && root.getAttribute("data-lang") !== lang) {
      document.startViewTransition(function () { apply(lang); });
    } else {
      apply(lang);
    }
  }

  // A page in one language (data-fixed-lang, e.g. /couple-app/) keeps its own lang and shows everything.
  if (!root.hasAttribute("data-fixed-lang")) {
    set(pick(), false);
    document.addEventListener("DOMContentLoaded", function () { apply(root.getAttribute("data-lang")); });
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest("[data-set-lang]");
    if (button) set(button.getAttribute("data-set-lang"), true);
  });

  // --- Critters hop when you point at them or tap them (once per hop, never under Reduce Motion).
  function hop(event) {
    var critter = event.target.closest && event.target.closest(".critter");
    if (!critter || critter.classList.contains("hop") || critter.closest(".mate") || still.matches) return;
    critter.classList.add("hop");
  }
  document.addEventListener("mouseover", hop);
  document.addEventListener("click", hop);
  document.addEventListener("animationend", function (event) {
    if (event.animationName === "hop" || event.animationName === "pop") event.target.classList.remove(event.animationName);
  });

  // --- The second half of the font (characters below the first screens) arrives after the page has loaded.
  window.addEventListener("load", function () {
    var script = document.querySelector("script[src$='site.js']");
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = script.src.replace(/site\.js.*$/, "fonts/rest.css");
    document.head.appendChild(link);
  });

  document.addEventListener("DOMContentLoaded", function () {
    // --- The top bar is clear over the top of the page and gets its hairline once you scroll.
    var top = document.querySelector(".top");
    if (top) {
      var onScroll = function () { top.classList.toggle("at-top", window.scrollY < 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // --- Reveal: each .reveal rises in once when it comes into view.
    var reveals = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !still.matches) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("in"); seen.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      for (var i = 0; i < reveals.length; i++) seen.observe(reveals[i]);
    } else {
      for (var j = 0; j < reveals.length; j++) reveals[j].classList.add("in");
    }

    // --- Store buttons: your phone's store first (and primary); the other stays soft.
    if (/android/i.test(navigator.userAgent)) {
      var groups = document.querySelectorAll(".actions.stores");
      for (var g = 0; g < groups.length; g++) {
        var apple = groups[g].querySelector("[data-store=apple]");
        var play = groups[g].querySelector("[data-store=play]");
        if (apple && play) {
          apple.classList.replace("primary", "soft");
          play.classList.replace("soft", "primary");
          groups[g].insertBefore(play, apple);
        }
      }
    }

    // --- Magnetic buttons: a fine pointer pulls them up to 6 px; they settle back when it leaves.
    if (window.matchMedia && window.matchMedia("(pointer: fine)").matches && !still.matches) {
      var magnets = document.querySelectorAll(".btn.magnet");
      Array.prototype.forEach.call(magnets, function (button) {
        button.addEventListener("pointermove", function (event) {
          var box = button.getBoundingClientRect();
          var dx = (event.clientX - box.left - box.width / 2) / (box.width / 2);
          var dy = (event.clientY - box.top - box.height / 2) / (box.height / 2);
          button.style.setProperty("--mx", (dx * 6).toFixed(1) + "px");
          button.style.setProperty("--my", (dy * 4).toFixed(1) + "px");
        });
        button.addEventListener("pointerleave", function () {
          button.style.removeProperty("--mx");
          button.style.removeProperty("--my");
        });
      });
    }
  });
})();
