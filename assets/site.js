// One language at a time: #zh / #en in the link, then the last choice, then the browser's language.
// Without JavaScript both languages show, one after the other.
(function () {
  var root = document.documentElement;

  function pick() {
    var hash = location.hash.replace("#", "");
    if (hash === "zh" || hash === "en") return hash;
    try {
      var saved = localStorage.getItem("little-us-lang");
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) {}
    return (navigator.language || "").toLowerCase().indexOf("zh") === 0 ? "zh" : "en";
  }

  function set(lang, save) {
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
    if (save) {
      try { localStorage.setItem("little-us-lang", lang); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("little-us-lang", { detail: lang }));
  }

  set(pick(), false);
  document.addEventListener("DOMContentLoaded", function () { set(root.getAttribute("data-lang"), false); });
  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest("[data-set-lang]");
    if (button) set(button.getAttribute("data-set-lang"), true);
  });
})();
