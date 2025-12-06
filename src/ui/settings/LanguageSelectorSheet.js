/**
 * LanguageSelectorSheet.js - Sprach-Auswahl
 * Design inspiriert von WeatherMaster App
 */
(function (global) {
  const LANGUAGE_OPTIONS = [
    { value: "de", flag: "🇩🇪", title: "Deutsch" },
    { value: "en", flag: "🇬🇧", title: "English" },
  ];

  function renderLanguageSheet(appState) {
    const container = document.getElementById("settings-language-body");
    if (!container || !global.i18n) return;

    const current = global.i18n.getLanguage();

    container.innerHTML = `
      <div class="language-settings">
        ${LANGUAGE_OPTIONS.map((opt) =>
          renderLanguageOption(opt, current)
        ).join("")}
      </div>
    `;

    container.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        applyLanguage(appState, lang);
        renderLanguageSheet(appState);
        if (global.SettingsHome && global.SettingsHome.renderSettingsHome) {
          global.SettingsHome.renderSettingsHome(appState);
        }
      });
    });
  }

  function renderLanguageOption(option, current) {
    const isActive = current === option.value;
    const activeClass = isActive ? " language-option--active" : "";

    return `
      <button
        type="button"
        class="language-option${activeClass}"
        data-lang="${option.value}"
      >
        <span class="language-option__flag">${option.flag}</span>
        <span class="language-option__title">${option.title}</span>
        ${isActive ? '<span class="language-option__check">✓</span>' : ""}
      </button>
    `;
  }

  function applyLanguage(appState, lang) {
    if (!appState.settings) appState.settings = {};
    appState.settings.locale = lang;
    appState.locale = lang;
    try {
      localStorage.setItem("app-language", lang);
    } catch (e) {}
    global.i18n.setLanguage(lang);
  }

  global.LanguageSelectorSheet = { renderLanguageSheet };
})(window);
