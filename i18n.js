// PageDrop site i18n
// - Auto-detects browser language on first visit
// - Persists choice in localStorage
// - URL ?lang=en/?lang=pt forces a language
// - Toggle buttons with [data-lang="pt|en"] switch instantly
// - Elements with [data-i18n="key"] get textContent replaced
// - Elements with [data-i18n-html="key"] get innerHTML replaced (for <br>, <span>)
// - Elements with [data-i18n-attr="content" data-i18n="key"] update an attribute

(function () {
  const STORAGE_KEY = "pagedrop_site_lang";
  const SUPPORTED = ["pt", "en"];
  const DEFAULT_LANG = "pt";

  function saveLanguage(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  function detectLanguage() {
    // 1. URL query string ?lang=en (also persists for next pages)
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang && SUPPORTED.includes(urlLang)) {
      saveLanguage(urlLang);
      return urlLang;
    }

    // 2. Saved preference in localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (e) { /* localStorage may be blocked */ }

    // 3. Browser language
    const navLang = (navigator.language || navigator.userLanguage || DEFAULT_LANG).toLowerCase();
    if (navLang.startsWith("pt")) return "pt";
    if (navLang.startsWith("en")) return "en";

    return DEFAULT_LANG;
  }

  function applyTranslations(translations) {
    const lang = detectLanguage();
    const dict = translations[lang] || translations[DEFAULT_LANG];

    // Update <html lang="...">
    document.documentElement.setAttribute("lang", lang === "pt" ? "pt-BR" : "en");

    // Plain text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!dict[key]) return;
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) {
        el.setAttribute(attr, dict[key]);
      } else if (el.hasAttribute("data-i18n-html") || el.getAttribute("data-i18n-html") === key) {
        el.innerHTML = dict[key];
      } else {
        el.textContent = dict[key];
      }
    });

    // HTML content (allows <br>, <span>, etc.)
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (dict[key]) el.innerHTML = dict[key];
    });

    // Sync language toggle buttons
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      const btnLang = btn.getAttribute("data-lang");
      btn.classList.toggle("active", btnLang === lang);
      btn.addEventListener("click", () => {
        saveLanguage(btnLang);
        // Reload to apply new language cleanly (also re-translates page links)
        const url = new URL(window.location.href);
        url.searchParams.delete("lang");
        window.location.href = url.toString();
      }, { once: true });
    });
  }

  // Expose globally so per-page translations can call it
  window.applyTranslations = applyTranslations;
})();
